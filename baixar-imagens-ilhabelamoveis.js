#!/usr/bin/env node
/**
 * baixar-imagens-ilhabelamoveis.js
 * Baixa imagens dos produtos Ilhabelamoveis via WooCommerce Store API,
 * normaliza para 600x600 e salva em imagens/ilhabelamoveis/
 *
 * Uso: node baixar-imagens-ilhabelamoveis.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');
const sharp = require('sharp');

const FORNECEDOR_API = 'https://ilhabelamoveis.com.br/wp-json/wc/store/v1/products';
const OUT_DIR        = path.join(__dirname, 'imagens', 'ilhabelamoveis');
const SIZE           = 600;
const BG             = { r: 242, g: 237, b: 232, alpha: 1 };

const TARGET_SLUGS = [
  'ib729-sofa-cosmopolitan-soft',
];

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
    .resize(SIZE, SIZE, { fit: 'contain', position: 'centre', background: BG })
    .jpeg({ quality: 88 })
    .toFile(outPath);
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('\n🔍 Buscando produtos da Ilhabelamoveis...\n');
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

      if (fs.existsSync(outPath)) {
        console.log(`   [${i + 1}/${images.length}] ${fname} — já existe`);
        localImgs.push(`imagens/ilhabelamoveis/${fname}`);
        continue;
      }

      process.stdout.write(`   [${i + 1}/${images.length}] ${fname}... `);
      try {
        const buf = await downloadBuffer(srcUrl);
        await processImage(buf, outPath);
        localImgs.push(`imagens/ilhabelamoveis/${fname}`);
        console.log('✔');
      } catch (e) {
        console.log(`✗ ${e.message}`);
      }
    }

    if (localImgs.length) localMap[p.slug] = localImgs;
    console.log('');
  }

  fs.writeFileSync(
    path.join(__dirname, 'ilhabelamoveis-imagens-locais.json'),
    JSON.stringify(localMap, null, 2), 'utf8'
  );

  console.log(`📦 Imagens salvas em: imagens/ilhabelamoveis/`);
  console.log(`📄 Mapa salvo em:     ilhabelamoveis-imagens-locais.json`);
  console.log(`\nAgora rode: node importar-ilhabelamoveis.js\n`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
