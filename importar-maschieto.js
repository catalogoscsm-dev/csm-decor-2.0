#!/usr/bin/env node
/**
 * importar-maschieto.js
 * Busca produtos selecionados da Maschieto Móveis via WooCommerce Store API
 * e os injeta diretamente no produtos.html do CSM Decor.
 *
 * Uso: node importar-maschieto.js
 * Pré-requisito: rode baixar-imagens-maschieto.js antes
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const FORNECEDOR_API  = 'https://maschietomoveis.com.br/wp-json/wc/store/v1/products';
const WPP_NR          = '5519990034068';
const PRODUTOS_HTML   = path.join(__dirname, 'produtos.html');
const LOCAL_IMGS_FILE = path.join(__dirname, 'maschieto-imagens-locais.json');

const LOCAL_IMGS = fs.existsSync(LOCAL_IMGS_FILE)
  ? JSON.parse(fs.readFileSync(LOCAL_IMGS_FILE, 'utf8'))
  : {};

const TARGET_SLUGS = [
  'mesa-petra',
  'mesa-agnes',
];

const CAT_TO_TIPO = {
  'mesas': 'sala-jantar', 'mesa': 'sala-jantar',
  'mesas-de-jantar': 'sala-jantar', 'mesa-de-jantar': 'sala-jantar',
  'mesa-jantar': 'sala-jantar', 'jantar': 'sala-jantar',
};

const TIPO_LABEL = {
  'sofa': 'Sofá', 'poltrona': 'Poltrona', 'sala-jantar': 'Sala de Jantar',
  'quarto': 'Quarto', 'complemento': 'Complemento',
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'csm-catalog-importer/1.0' } }, res => {
      if (res.statusCode !== 200)
        return reject(new Error(`HTTP ${res.statusCode} em ${url}`));
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error(`JSON inválido: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${FORNECEDOR_API}?per_page=100&page=${page}`;
    process.stdout.write(`  Página ${page}... `);
    const data = await fetchJSON(url);
    if (!Array.isArray(data) || data.length === 0) { console.log('fim.'); break; }
    all.push(...data);
    console.log(`${data.length} produtos`);
    if (data.length < 100) break;
    page++;
  }
  return all;
}

function stripHtml(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#8220;|&#8221;/g, '"').replace(/&#[0-9]+;/g, '')
    .replace(/&[a-z]+;/g, '').replace(/\s+/g, ' ').trim();
}

function getTipo(product) {
  for (const cat of (product.categories || [])) {
    const slug = (cat.slug || '').toLowerCase().trim();
    if (CAT_TO_TIPO[slug]) return CAT_TO_TIPO[slug];
    const name = (cat.name || '').toLowerCase();
    if (name.includes('mesa')) return 'sala-jantar';
    if (name.includes('jantar')) return 'sala-jantar';
  }
  return 'sala-jantar';
}

function buildCard(p) {
  const tipo  = getTipo(p);
  const name  = (p.name || 'Produto').replace(/'/g, '&#39;');
  const badge = TIPO_LABEL[tipo] || tipo;

  const wppMsg = encodeURIComponent(`Tenho interesse no produto ${p.name}. Pode me enviar mais informações?`);
  const wpp    = `https://wa.me/${WPP_NR}?text=${wppMsg}`;

  const localImgs  = LOCAL_IMGS[p.slug] || [];
  const remoteImgs = (p.images || []).map(i => i.src).filter(Boolean);
  const allImgs    = localImgs.length ? localImgs : remoteImgs;
  const img1       = allImgs[0] || '';

  let tagline = stripHtml(p.short_description || '');
  if (!tagline || tagline.length < 6) tagline = `${badge} · Design exclusivo · Alto padrão`;
  tagline = tagline.replace(/'/g, '&#39;').substring(0, 110);

  const desc    = stripHtml(p.short_description || '').substring(0, 500);
  const descEsc = desc.replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const specsJson = JSON.stringify([]).replace(/'/g, '&#39;').replace(/"/g, '&quot;');

  const imgTag = img1
    ? `<img src="${img1}" alt="${name} — CSM Decor" loading="lazy" />`
    : `<div class="cat-card__no-img" aria-hidden="true"></div>`;

  return `
          <article class="cat-card" data-tipo="${tipo}" data-id="maschieto-${p.id}" data-fornecedor="maschieto"
            data-imgs='${JSON.stringify(allImgs)}'
            data-wpp="${wpp}"
            data-specs="${specsJson}"
            data-description="${descEsc}">
            <figure class="cat-card__fig" data-nome="${name}">
              ${imgTag}
              <span class="cat-card__badge">${badge}</span>
            </figure>
            <div class="cat-card__body">
              <h2 class="cat-card__name">${name}</h2>
              <p class="cat-card__tagline">${tagline}</p>
              <button type="button" class="btn btn--primary btn--sm cat-card__cta"
                onclick="navigateToProduct(this.closest('.cat-card'))">
                Ver Produto
              </button>
            </div>
          </article>`;
}

function injectIntoHtml(cards) {
  let content = fs.readFileSync(PRODUTOS_HTML, 'utf8');

  content = content.replace(
    /\n\s*<!-- INICIO MASCHIETO -->[\s\S]*?<!-- FIM MASCHIETO -->/g, ''
  );

  const CAT_EMPTY    = '        <div class="cat-empty" id="cat-empty"';
  const emptyIdx     = content.indexOf(CAT_EMPTY);
  if (emptyIdx === -1) throw new Error('Marcador cat-empty não encontrado em produtos.html');

  const GRID_CLOSE   = '        </div>';
  const gridCloseIdx = content.lastIndexOf(GRID_CLOSE, emptyIdx);
  if (gridCloseIdx === -1) throw new Error('Fechamento do catalogo__grid não encontrado');

  const block = `\n          <!-- INICIO MASCHIETO -->${cards}\n          <!-- FIM MASCHIETO -->\n`;
  return content.slice(0, gridCloseIdx) + block + content.slice(gridCloseIdx);
}

async function main() {
  console.log('\n🔍 Buscando produtos da Maschieto Móveis...\n');
  const all = await fetchAllProducts();

  const selected = TARGET_SLUGS.map(slug => {
    const found = all.find(p => p.slug === slug);
    if (!found) console.warn(`  ⚠️  Slug não encontrado na API: ${slug}`);
    return found;
  }).filter(Boolean);

  console.log(`\n✅ ${selected.length}/${TARGET_SLUGS.length} produtos encontrados`);

  const cards = selected.map(p => {
    const card = buildCard(p);
    const tipo = getTipo(p);
    console.log(`   ✔ ${p.name.padEnd(30)} → ${TIPO_LABEL[tipo] || tipo}`);
    return card;
  }).join('');

  const updated = injectIntoHtml(cards);
  fs.writeFileSync(PRODUTOS_HTML, updated, 'utf8');

  console.log(`\n🎉 produtos.html atualizado com ${selected.length} produtos da Maschieto!\n`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
