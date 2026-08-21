#!/usr/bin/env node
/**
 * baixar-imagens-ideale.js
 * Baixa todas as imagens dos produtos Ideale, redimensiona para 600x600
 * com fundo neutro (produto centralizado, sem corte) e salva em imagens/ideale/
 *
 * Uso: node baixar-imagens-ideale.js
 * Requer: sharp (já instalado)
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');
const sharp = require('sharp');

const FORNECEDOR_API = 'https://idealeestofados.com.br/wp-json/wc/store/v1/products';
const OUT_DIR        = path.join(__dirname, 'imagens', 'ideale');
const SIZE           = 600;
const BG             = { r: 242, g: 237, b: 232, alpha: 1 }; // #f2ede8

const TARGET_SLUGS = [
  'shoulder', 'tesla', 'mallorca', 'toledo', 'ludwing',
  'poltrona-ondine', 'sofa-pier', 'poltrona-mariah',
  'poltrona-mia', 'poltrona-soft', 'otto-2', 'poltrona-e-puff-amorosa',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'csm-importer/1.0' } }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function downloadBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Muitos redirecionamentos'));
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'csm-importer/1.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function processImage(buffer, outPath) {
  await sharp(buffer)
    .resize(SIZE, SIZE, {
      fit: 'contain',
      position: 'centre',
      background: BG,
    })
    .jpeg({ quality: 88 })
    .toFile(outPath);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('\n🔍 Buscando produtos da Ideale...\n');
  const products = await fetchJSON(`${FORNECEDOR_API}?per_page=100`);
  const selected = TARGET_SLUGS.map(s => products.find(p => p.slug === s)).filter(Boolean);
  console.log(`✅ ${selected.length} produtos encontrados\n`);

  const localMap = {};

  for (const p of selected) {
    const images = p.images || [];
    if (!images.length) { console.log(`  ⚠️  ${p.name}: sem imagens\n`); continue; }

    console.log(`📷 ${p.name} (${images.length} imagens)`);
    const localImgs = [];

    for (let i = 0; i < images.length; i++) {
      const srcUrl  = images[i].src;
      const fname   = `${p.slug}-${i + 1}.jpg`;
      const outPath = path.join(OUT_DIR, fname);

      process.stdout.write(`   [${i + 1}/${images.length}] ${fname}... `);
      try {
        const buf = await downloadBuffer(srcUrl);
        await processImage(buf, outPath);
        localImgs.push(`imagens/ideale/${fname}`);
        console.log('✔');
      } catch (e) {
        console.log(`✗ ${e.message}`);
      }
    }

    if (localImgs.length) localMap[p.slug] = localImgs;
    console.log('');
  }

  fs.writeFileSync(
    path.join(__dirname, 'ideale-imagens-locais.json'),
    JSON.stringify(localMap, null, 2), 'utf8'
  );

  console.log(`📦 Imagens salvas em: imagens/ideale/`);
  console.log(`📄 Mapa salvo em:     ideale-imagens-locais.json`);
  console.log(`\nAgora rode: node importar-ideale.js\n`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
