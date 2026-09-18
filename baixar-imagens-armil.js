#!/usr/bin/env node
/**
 * baixar-imagens-armil.js
 * Baixa imagens dos produtos Móveis Armil, normaliza para 600x600
 * com fundo neutro e salva em imagens/armil/
 *
 * Uso: node baixar-imagens-armil.js
 * Requer: sharp (já instalado)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const http = require('http');
const sharp = require('sharp');

const BASE    = 'http://www.moveisarmil.com.br/uploads/product_image/image';
const OUT_DIR = path.join(__dirname, 'imagens', 'armil');
const SIZE    = 600;
const BG      = { r: 242, g: 237, b: 232, alpha: 1 }; // #f2ede8

const IMAGES = [
  { slug: 'aconna',    file: '1053/cama-aconna.jpg' },
  { slug: 'medellin',  file: '436/cama-dormitorio-medellin.jpg' },
  { slug: 'palha',     file: '446/cama-dormitorio-armil-com-palha.jpg' },
  { slug: 'tess',      file: '987/cama-tess.jpg' },
  { slug: 'brisa-1',   file: '753/comoda-brisa.jpg' },
  { slug: 'brisa-2',   file: '754/normal_comoda-brisa.jpg' },
  { slug: 'ayla',      file: '930/luminaria-ayla.jpg' },
  { slug: 'recamier-ballet-1', file: '893/recamier-ballet.jpg' },
  { slug: 'recamier-ballet-2', file: '894/recamier-ballet.jpg' },
  { slug: 'recamier-ballet-3', file: '895/recamier-ballet.jpg' },
];

function downloadBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Muitos redirecionamentos'));
    const mod = url.startsWith('https') ? require('https') : http;
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
  console.log('\n📷 Baixando imagens Móveis Armil...\n');

  const localMap = {};

  for (const img of IMAGES) {
    const url     = `${BASE}/${img.file}`;
    const fname   = `${img.slug}.jpg`;
    const outPath = path.join(OUT_DIR, fname);

    if (fs.existsSync(outPath)) {
      console.log(`   ⏭  ${fname} (já existe)`);
      localMap[img.slug] = `imagens/armil/${fname}`;
      continue;
    }

    process.stdout.write(`   ⬇  ${fname}... `);
    try {
      const buf = await downloadBuffer(url);
      await processImage(buf, outPath);
      localMap[img.slug] = `imagens/armil/${fname}`;
      console.log('✔');
    } catch (e) {
      console.log(`✗ ${e.message}`);
    }
  }

  fs.writeFileSync(
    path.join(__dirname, 'armil-imagens-locais.json'),
    JSON.stringify(localMap, null, 2), 'utf8'
  );

  console.log('\n📦 Imagens salvas em: imagens/armil/');
  console.log('📄 Mapa salvo em:     armil-imagens-locais.json');
  console.log('\nAgora rode: node importar-armil.js\n');
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
