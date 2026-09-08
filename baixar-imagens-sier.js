#!/usr/bin/env node
/**
 * baixar-imagens-sier.js
 * Baixa imagens da Sier Móveis (site Framer, sem API),
 * normaliza para 600×600 com fundo neutro e salva em imagens/sier/
 *
 * Uso: node baixar-imagens-sier.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');
const sharp = require('sharp');

const OUT_DIR = path.join(__dirname, 'imagens', 'sier');
const SIZE    = 600;
const BG      = { r: 242, g: 237, b: 232, alpha: 1 };

// Como a Sier usa Framer (sem API), as imagens são mapeadas manualmente.
const PRODUTOS = [
  {
    slug: 'spock-mj',
    nome: 'Mesa Spock',
    tipo: 'sala-jantar',
    imagens: [
      'https://framerusercontent.com/images/Fp8R8JD9R1HBvxnK6hEFUBnxbU.jpg',
      'https://framerusercontent.com/images/lk0SdCYRPBE9GKa5B4M4nzhnZrM.jpg',
      'https://framerusercontent.com/images/rCyVphlBNyfv944oEE5PZa58tuE.jpg',
      'https://framerusercontent.com/images/GgU45cuKWhx8tNiWPn3wvIfI3sk.jpg',
    ],
  },
];

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

  console.log('\n🔍 Baixando imagens da Sier Móveis...\n');

  const localMap = {};

  for (const produto of PRODUTOS) {
    console.log(`📷 ${produto.nome} (${produto.imagens.length} imagens)`);
    const localImgs = [];

    for (let i = 0; i < produto.imagens.length; i++) {
      const srcUrl  = produto.imagens[i];
      const fname   = `${produto.slug}-${i + 1}.jpg`;
      const outPath = path.join(OUT_DIR, fname);

      if (fs.existsSync(outPath)) {
        console.log(`   [${i + 1}/${produto.imagens.length}] ${fname} — já existe, pulando`);
        localImgs.push(`imagens/sier/${fname}`);
        continue;
      }

      process.stdout.write(`   [${i + 1}/${produto.imagens.length}] ${fname}... `);
      try {
        const buf = await downloadBuffer(srcUrl);
        await processImage(buf, outPath);
        localImgs.push(`imagens/sier/${fname}`);
        console.log('✔');
      } catch (e) {
        console.log(`✗ ${e.message}`);
      }
    }

    if (localImgs.length) localMap[produto.slug] = localImgs;
    console.log('');
  }

  fs.writeFileSync(
    path.join(__dirname, 'sier-imagens-locais.json'),
    JSON.stringify(localMap, null, 2), 'utf8'
  );

  console.log(`📦 Imagens salvas em: imagens/sier/`);
  console.log(`📄 Mapa salvo em:     sier-imagens-locais.json`);
  console.log(`\nAgora rode: node importar-sier.js\n`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
