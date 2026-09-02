#!/usr/bin/env node
/**
 * baixar-imagens-novos.js
 * Baixa e normaliza imagens dos fornecedores manuais para 600x600.
 * Salva em imagens/novos/
 *
 * Uso: node baixar-imagens-novos.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');
const http  = require('http');
const sharp = require('sharp');

const OUT_DIR = path.join(__dirname, 'imagens', 'novos');
const SIZE    = 600;
const BG      = { r: 242, g: 237, b: 232, alpha: 1 }; // #f2ede8

// ─── Catálogo de imagens por produto ──────────────────────────────────────────
const PRODUCTS = [
  {
    slug: 'carmem',
    urls: [
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/carmen-2.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/carmen-2-1.jpg',
    ],
  },
  {
    slug: 'jow',
    urls: [
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/jow-6.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/jow-5.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/jow-2.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/jow-3.jpg',
    ],
  },
  {
    slug: 'roy',
    urls: [
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/roy-1-1.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/roy-1-1-1.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/roy-1-1-2.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/roy-2.jpg',
    ],
  },
  {
    slug: 'ankur',
    urls: [
      'https://karams.com.br/wp-content/uploads/2025/06/Ankur-sombra-diagonal-scaled.jpg',
      'https://karams.com.br/wp-content/uploads/2025/06/Ankur-sombra-diagonal-2-scaled.jpg',
    ],
  },
  {
    slug: 'bea',
    urls: [
      'https://karams.com.br/wp-content/uploads/2024/04/bea-4.jpg',
      'https://karams.com.br/wp-content/uploads/2024/04/bea-3.jpg',
      'https://karams.com.br/wp-content/uploads/2024/04/bea-2.jpg',
      'https://karams.com.br/wp-content/uploads/2024/04/bea-1.jpg',
    ],
  },
  {
    slug: 'aloha',
    urls: [
      'https://karams.com.br/wp-content/uploads/2025/08/aloha-frontal.jpg',
      'https://karams.com.br/wp-content/uploads/2025/08/aloha-diagonal.jpg',
    ],
  },
  {
    slug: 'venus',
    urls: [
      'https://serragauchaestofados.com.br/wp-content/uploads/2025/12/PRODUTOS-Living98-1920x1080.jpg',
      'https://serragauchaestofados.com.br/wp-content/uploads/2025/12/Venus-Puff-1920x1080.jpg',
    ],
  },
  {
    slug: 'marajo',
    urls: [
      'https://goldlinehome.com.br/wp-content/uploads/2025/05/marajo-1.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/05/marajo-2.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/05/marajo-3.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/05/marajo-4.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/05/marajo-5.jpg',
    ],
  },
  {
    slug: 'planura',
    urls: [
      'https://goldlinehome.com.br/wp-content/uploads/2025/04/planura-1.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/04/planura-2.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/04/planura-3.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/04/planura-4.jpg',
    ],
  },
  {
    slug: 'bel132',
    urls: [
      'https://www.artbelestofados.com.br/sistema/produtos_ban_img/5ad7c6d46fd83063e7b2423da024d194.jpg',
      'https://www.artbelestofados.com.br/sistema/produtos_ban_img/96805ead2cb8a67c58b031c55d17cf81.jpg',
      'https://www.artbelestofados.com.br/sistema/produtos_ban_img/37f1727120cc634ff35c642a6bc2950c.jpg',
      'https://www.artbelestofados.com.br/sistema/produtos_ban_img/8a49c7d479013a2f6cdf1eb5c5245e85.jpg',
      'https://www.artbelestofados.com.br/sistema/produtos_ban_img/c0bac4cbfbf5e5c0e777fbf7e39a600c.jpg',
    ],
  },
  {
    slug: 'poltrona028',
    urls: [
      'https://www.artbelestofados.com.br/sistema/produtos_ban_img/607e62797285c12f9418855785439979.jpg',
      'https://www.artbelestofados.com.br/sistema/produtos_ban_img/bf13e623d8937130d148929ae275dc94.jpg',
      'https://www.artbelestofados.com.br/sistema/produtos_ban_img/e1dbf4b4b7d89fcac3dfd2595d718e23.jpg',
      'https://www.artbelestofados.com.br/sistema/produtos_ban_img/e0cafdce6f9c19d78610b65bb959e3c6.jpg',
      'https://www.artbelestofados.com.br/sistema/produtos_ban_img/aef39eb35852bc2b16c83518fffbc0c9.jpg',
    ],
  },
  {
    slug: 'carmin',
    urls: [
      'https://www.ferguile.com.br/img/Produtos/Esp/Carmin%20Giratoria/poltrona%20carmin%20giratoria%20fundo%20infinito.jpg',
    ],
  },
  {
    slug: 'dolphin',
    urls: [
      'https://static.wixstatic.com/media/02d567_76c9251197de4784aa82f47216149b94~mv2.png',
    ],
  },
  {
    slug: 'venus2',
    urls: [
      'https://serragauchaestofados.com.br/wp-content/uploads/2025/12/PRODUTOS-Living11-1920x1080.jpg',
      'https://serragauchaestofados.com.br/wp-content/uploads/2025/12/PRODUTOS-Living12-1920x1080.jpg',
      'https://serragauchaestofados.com.br/wp-content/uploads/2025/12/PRODUTOS-Living10-1920x1080.jpg',
    ],
  },
  {
    slug: 's147',
    urls: [
      'https://estofadossuprema.com.br/wp-content/uploads/2025/10/render_1-1.webp',
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('\n📦 Baixando imagens de fornecedores manuais...\n');

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
  console.log(`📁 Imagens em: imagens/novos/`);
  console.log(`\nAgora rode: node importar-novos-manual.js\n`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
