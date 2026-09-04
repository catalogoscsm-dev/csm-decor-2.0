#!/usr/bin/env node
/**
 * baixar-imagens-mesas.js
 * Baixa e normaliza imagens de mesas de jantar de fornecedores sem API:
 * Prime Bravus, Tecnoarte, Essenza, Bonte.
 * Salva em imagens/mesas/ (600×600, fundo #f2ede8).
 *
 * Uso: node baixar-imagens-mesas.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');
const sharp = require('sharp');

const OUT_DIR = path.join(__dirname, 'imagens', 'mesas');
const SIZE    = 600;
const BG      = { r: 242, g: 237, b: 232, alpha: 1 };

const PRODUCTS = [
  // ── Prime Bravus ──────────────────────────────────────────────────────────
  {
    slug: 'primebravus-bromelia',
    urls: [
      'https://primebravus.com.br/assets/img/produtos/bromelia.webp',
      'https://primebravus.com.br/assets/img/produtos/bromelia-2.webp',
      'https://primebravus.com.br/assets/img/produtos/bromelia-3.webp',
    ],
  },
  {
    slug: 'primebravus-avocado',
    urls: [
      'https://primebravus.com.br/assets/img/produtos/avocado.webp',
      'https://primebravus.com.br/assets/img/produtos/avocado-2.webp',
    ],
  },
  {
    slug: 'primebravus-caliman',
    urls: [
      'https://primebravus.com.br/assets/img/produtos/caliman.webp',
      'https://primebravus.com.br/assets/img/produtos/caliman-2.webp',
      'https://primebravus.com.br/assets/img/produtos/caliman-3.webp',
      'https://primebravus.com.br/assets/img/produtos/caliman-4.webp',
      'https://primebravus.com.br/assets/img/produtos/caliman-5.webp',
    ],
  },

  // ── Tecnoarte Móveis ──────────────────────────────────────────────────────
  {
    slug: 'tecnoarte-coimbra',
    urls: [
      'https://www.tecnoartemoveis.com.br/images/moveis/1756991137_COIMBRA%202.jpg',
      'https://www.tecnoartemoveis.com.br/images/moveis/extras/1756991137_MESA%20AMBIENTADA.jpeg',
      'https://www.tecnoartemoveis.com.br/images/moveis/extras/1756991198_MESA%20COIMBRA%20CADEIRA%20NOBRE.jpeg',
      'https://www.tecnoartemoveis.com.br/images/moveis/extras/1756991278_COIMBRA%20TAMPO%20LAMINA%20INVERTIDA.jpeg',
      'https://www.tecnoartemoveis.com.br/images/moveis/extras/1756991291_COIMBRA.jpeg',
      'https://www.tecnoartemoveis.com.br/images/moveis/extras/1756991309_MESA%20COIMBRA%20CADEIRA%20NORUEGA.jpeg',
      'https://www.tecnoartemoveis.com.br/images/moveis/extras/1756991352_CONGRETO%20COIMBRA.jpeg',
      'https://www.tecnoartemoveis.com.br/images/moveis/extras/1756991400_COIMBRA.jpg',
    ],
  },
  {
    slug: 'tecnoarte-ricci',
    urls: [
      'https://www.tecnoartemoveis.com.br/images/moveis/DSC_4489%20copy.jpg',
      'https://www.tecnoartemoveis.com.br/images/moveis/extras/1756835102_RICCI%20(2).jpg',
      'https://www.tecnoartemoveis.com.br/images/moveis/extras/1756835155_RICCI.jpg',
    ],
  },

  // ── Essenza Móveis ────────────────────────────────────────────────────────
  {
    slug: 'essenza-infinity',
    urls: [
      'https://www.essenzamoveis.com.br/upload/jantar-infinity-jpg_20230705142818.jpg',
    ],
  },
  {
    slug: 'essenza-flow',
    urls: [
      'https://www.essenzamoveis.com.br/upload/mesa-de-jantar-flow-2-jpg_20250224092155.jpg',
      'https://www.essenzamoveis.com.br/upload/Mesa-de-Jantar-Flow-3-1740401478.jpg',
      'https://www.essenzamoveis.com.br/upload/HO%20-%20Essenza%20-%20Abimad%20-%2090-1740397983.jpg',
      'https://www.essenzamoveis.com.br/upload/Mesa%20de%20Jantar%20Flow%20(3)-1740397969.jpg',
    ],
  },
  {
    slug: 'essenza-sun',
    urls: [
      'https://www.essenzamoveis.com.br/upload/mesa-de-jantar-sun-5-jpg_20240726145929.jpg',
      'https://www.essenzamoveis.com.br/upload/DAVR9335%20copiar-1722016610.jpg',
      'https://www.essenzamoveis.com.br/upload/DAVR9340%20copiar-1722016610.jpg',
      'https://www.essenzamoveis.com.br/upload/Mesa%20de%20Jantar%20Sun%20(4)-1722016640.jpg',
      'https://www.essenzamoveis.com.br/upload/Mesa%20de%20Jantar%20Sun-1722016670.jpg',
    ],
  },
  {
    slug: 'essenza-miami',
    urls: [
      'https://www.essenzamoveis.com.br/upload/mesa-de-jantar-miami-jpg_20230705143753.jpg',
      'https://www.essenzamoveis.com.br/upload/MESA%20JANTAR%20MIAMI%20(2)-1690909251.jpg',
      'https://www.essenzamoveis.com.br/upload/MESA%20JANTAR%20MIAMI%20(3)-1690909254.jpg',
    ],
  },

  // ── Bonté Móveis ──────────────────────────────────────────────────────────
  {
    slug: 'bonte-trois',
    urls: [
      'https://www.bonte.com.br/upload/mesa%20jantar%20trois-1695903735.jpg',
    ],
  },
  {
    slug: 'bonte-talon',
    urls: [
      'https://www.bonte.com.br/upload/Per%202107-1741286504_750x565_f.jpg',
      'https://www.bonte.com.br/upload/pessoa-1-jpg_20230524202348_265x350_f.jpg',
    ],
  },
  {
    slug: 'bonte-calice',
    urls: [
      'https://www.bonte.com.br/upload/Bonte_Mesa_Calice%2002-1788289059.png',
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
  console.log('\n📦 Baixando imagens de mesas de jantar...\n');

  let totalOk = 0, totalFail = 0;

  for (const p of PRODUCTS) {
    console.log(`📷 ${p.slug} (${p.urls.length} imagens)`);

    for (let i = 0; i < p.urls.length; i++) {
      const fname   = `${p.slug}-${i + 1}.jpg`;
      const outPath = path.join(OUT_DIR, fname);

      if (fs.existsSync(outPath)) {
        console.log(`   [${i + 1}/${p.urls.length}] ${fname} — já existe, pulando`);
        totalOk++;
        continue;
      }

      process.stdout.write(`   [${i + 1}/${p.urls.length}] ${fname}... `);
      try {
        const buf = await downloadBuffer(p.urls[i]);
        await processImage(buf, outPath);
        console.log('✔');
        totalOk++;
      } catch (e) {
        console.log(`✗ ${e.message}`);
        totalFail++;
      }
    }
    console.log('');
  }

  console.log(`✅ Concluído: ${totalOk} OK, ${totalFail} falhas`);
  console.log(`📁 Imagens em: imagens/mesas/`);
  console.log(`\nAgora rode: node importar-mesas.js\n`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
