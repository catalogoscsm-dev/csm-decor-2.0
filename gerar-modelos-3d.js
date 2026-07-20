'use strict';
/**
 * gerar-modelos-3d.js
 * Gera modelos 3D (.glb) para todos os produtos da CSM via Stable Fast 3D
 * (Stability AI · Hugging Face — gratuito)
 *
 * Uso:
 *   node gerar-modelos-3d.js                  — gera todos os 244 produtos
 *   node gerar-modelos-3d.js --limite 3        — testa com 3 produtos
 *   node gerar-modelos-3d.js --refazer         — ignora progresso salvo
 */

const fs   = require('fs');
const path = require('path');
const { Client } = require('@gradio/client');

// ── Configurações ─────────────────────────────────────────────────────────────
const BASE      = 'https://www.csmdecor.com.br/wsite';
const OUT_DIR   = path.join(__dirname, 'modelos-3d');
const PROG_FILE = path.join(__dirname, '.modelos-progress.json');
const MAP_FILE  = path.join(__dirname, 'modelos-3d-map.json');

const FOREGROUND   = 0.85;   // recorte do móvel no frame (0.5–1.0)
const TEXTURE_SIZE = 2048;   // resolução da textura (512/1024/2048)
const REMESH       = 'None';
const VERTEX_COUNT = -1;
const DELAY_OK     = 4000;   // pausa entre produtos (ms)
const DELAY_FAIL   = 8000;

// ── CLI args ──────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const LIMITE  = (() => { const i = args.indexOf('--limite'); return i >= 0 ? parseInt(args[i + 1]) : Infinity; })();
const REFAZER = args.includes('--refazer');

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
const bar   = '═'.repeat(46);

function loadProgress() {
  if (REFAZER) return {};
  try { return JSON.parse(fs.readFileSync(PROG_FILE, 'utf8')); } catch { return {}; }
}
function saveProgress(p) { fs.writeFileSync(PROG_FILE, JSON.stringify(p, null, 2)); }
function loadMapping()   {
  try { return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')); } catch { return {}; }
}
function saveMapping(m)  { fs.writeFileSync(MAP_FILE, JSON.stringify(m, null, 2)); }

function fmt(n)   { return n.toString().padStart(3); }
function kb(b)    { return `${(b / 1024).toFixed(0)} KB`; }

// ── WP API ────────────────────────────────────────────────────────────────────
async function fetchAllProducts() {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${BASE}/?rest_route=%2Fwp%2Fv2%2Fproduct&per_page=100&page=${page}&_embed=true`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) break;
    all.push(...data);
    const total = parseInt(res.headers.get('X-WP-TotalPages') || '1');
    if (page >= total) break;
    page++;
    await sleep(400);
  }
  return all;
}

// ── Download de imagem ────────────────────────────────────────────────────────
async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao baixar imagem (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Download do GLB gerado ────────────────────────────────────────────────────
async function downloadGlb(fileInfo, outPath) {
  // fileInfo pode ser { path, url } ou só uma string de URL
  let url = (typeof fileInfo === 'string') ? fileInfo
            : fileInfo?.url || fileInfo?.path;
  if (!url) throw new Error('GLB sem URL válida');

  // Remove /ca/ prefix que HF adiciona em algumas rotas de sessão
  url = url.replace(/\/ca\/file=/, '/file=');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download GLB falhou (${res.status}): ${url}`);
  const buf = await res.arrayBuffer();
  fs.writeFileSync(outPath, Buffer.from(buf));
  return buf.byteLength;
}

// ── Geração via @gradio/client ────────────────────────────────────────────────
async function generateGlb(imgBuffer) {
  const client = await Client.connect('stabilityai/stable-fast-3d');

  // Faz upload da imagem como arquivo primeiro
  const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
  const uploadedFile = await client.upload_files([new File([blob], 'product.jpg', { type: 'image/jpeg' })]);
  const fileRef = uploadedFile[0];

  // Parâmetros posicionais (array) — mais confiável que objeto com nomes
  // run_button: [input_image, foreground_ratio, remesh_option, vertex_count, texture_size]
  let errA;
  try {
    const result = await client.predict('/run_button', [
      fileRef,
      FOREGROUND,
      REMESH,
      VERTEX_COUNT,
      TEXTURE_SIZE,
    ]);
    const glbInfo = Array.isArray(result?.data) ? result.data[1] : result?.data;
    if (glbInfo && (glbInfo.url || glbInfo.path)) return glbInfo;
    throw new Error('run_button não retornou GLB (data: ' + JSON.stringify(result?.data) + ')');
  } catch (e) {
    errA = e;
    console.log(`\n   ⚠  run_button: ${e.message}`);
  }

  // Fallback: requires_bg_remove — [input_image, foreground_ratio]
  try {
    const result = await client.predict('/requires_bg_remove', [fileRef, FOREGROUND]);
    const glbInfo = Array.isArray(result?.data) ? result.data[1] : result?.data;
    if (glbInfo && (glbInfo.url || glbInfo.path)) return glbInfo;
    throw new Error('requires_bg_remove não retornou GLB (data: ' + JSON.stringify(result?.data) + ')');
  } catch (e) {
    throw new Error(`Ambos falharam. run_button: ${errA.message} | requires_bg_remove: ${e.message}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${bar}`);
  console.log('  CSM Decor — Gerador de Modelos 3D');
  console.log('  Powered by Stable Fast 3D · Hugging Face (grátis)');
  console.log(`${bar}\n`);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('📦 Buscando produtos na API WordPress...');
  const products = await fetchAllProducts();
  if (!products.length) { console.log('❌ Nenhum produto encontrado.'); return; }

  const limited = LIMITE < Infinity ? products.slice(0, LIMITE) : products;
  console.log(`✅ ${products.length} produtos encontrados${LIMITE < Infinity ? ` (testando ${LIMITE})` : ''}\n`);

  const progress = loadProgress();
  const mapping  = loadMapping();
  let done = 0, skipped = 0, failed = 0;

  for (let i = 0; i < limited.length; i++) {
    const p      = limited[i];
    const id     = String(p.id);
    const name   = (p.title?.rendered || `produto-${id}`).replace(/<[^>]+>/g, '').trim();
    const slug   = (p.slug || id).replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 60);
    const sizes  = p._embedded?.['wp:featuredmedia']?.[0]?.media_details?.sizes;
    const imgUrl = sizes?.medium_large?.source_url
                || sizes?.woocommerce_thumbnail?.source_url
                || sizes?.medium?.source_url
                || p._embedded?.['wp:featuredmedia']?.[0]?.source_url;

    const glbName = `${slug}.glb`;
    const glbPath = path.join(OUT_DIR, glbName);
    const relPath = `modelos-3d/${glbName}`;
    const prefix  = `[${fmt(i + 1)}/${fmt(limited.length)}]`;

    if (!imgUrl) {
      console.log(`${prefix} ⚠️  ${name} — sem imagem`);
      skipped++;
      continue;
    }

    if (!REFAZER && progress[id] === 'done' && fs.existsSync(glbPath)) {
      console.log(`${prefix} ✓  ${name}`);
      mapping[id] = { slug, path: relPath, name };
      done++;
      continue;
    }

    console.log(`\n${prefix} 🔄  ${name}`);

    try {
      process.stdout.write('   ▸ Baixando imagem... ');
      const imgBuf = await downloadImage(imgUrl);
      console.log(`✓ (${kb(imgBuf.length)})`);

      process.stdout.write('   ▸ Gerando 3D (Stable Fast 3D)... ');
      const glbInfo = await generateGlb(imgBuf);
      console.log('✓');

      process.stdout.write('   ▸ Salvando .glb... ');
      const bytes = await downloadGlb(glbInfo, glbPath);
      console.log(`✓ (${kb(bytes)})`);

      mapping[id]  = { slug, path: relPath, name };
      progress[id] = 'done';
      saveProgress(progress);
      saveMapping(mapping);
      done++;

      await sleep(DELAY_OK);

    } catch (err) {
      console.log(`\n   ❌ ${err.message}`);
      progress[id] = 'failed';
      saveProgress(progress);
      failed++;
      await sleep(DELAY_FAIL);
    }
  }

  console.log(`\n${bar}`);
  console.log(`  ✅ Gerados com sucesso : ${done}`);
  console.log(`  ❌ Falharam            : ${failed}`);
  console.log(`  ⚠️  Sem imagem          : ${skipped}`);
  console.log(`${bar}`);
  if (done > 0) {
    console.log(`\n📁 Modelos em : modelos-3d/`);
    console.log(`\n🚀 Próximo    : node aplicar-modelos-3d.js\n`);
  }
}

main().catch(err => { console.error(`\n💥 ${err.message}`); process.exit(1); });
