#!/usr/bin/env node
'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const BASE         = 'https://www.csmdecor.com.br/wsite';
const WPP_NR       = '5519990034068';
const PRODUTOS_HTML = path.join(__dirname, 'produtos.html');

const RESTORE_IDS = [4762, 4661, 4370, 4378, 4334, 4269, 3265, 2335, 2316, 2287];

const CAT_TO_TIPO = {
  living: 'sofa', 'living-sofas': 'sofa', 'living-tecido': 'sofa',
  'living-couro': 'sofa', 'sofas-em-couro': 'sofa', 'living-modulo': 'sofa',
  'home-theater-tecido': 'sofa', 'home-theater-couro': 'sofa',
  hometheater: 'sofa', 'outlet-sofas': 'sofa', 'sofas-retrateis-eletricos': 'sofa',
  'poltronas-para-living': 'poltrona', 'em-couro-poltronas-para-living': 'poltrona',
  'em-tecido-poltronas-para-living': 'poltrona', 'poltronas-reclinaveis': 'poltrona',
  'em-couro': 'poltrona', 'em-tecido': 'poltrona', poltronas: 'poltrona', 'outlet-poltronas': 'poltrona',
  'salas-de-jantar': 'sala-jantar', 'mesas-de-jantar': 'sala-jantar', 'cadeiras-mesa-de-jantar': 'sala-jantar',
  'quartos-e-colchoes': 'quarto', camas: 'quarto', 'cabeceiras-e-paineis': 'quarto', 'sofa-cama': 'quarto',
  'area-gourmet': 'area-gourmet', 'area-gourmet-acessorios': 'area-gourmet',
  'area-gourmet-adegas': 'area-gourmet', 'sommelier-bancos': 'area-gourmet',
  'area-gourmet-banquetas': 'area-gourmet', 'area-gourmet-mesas': 'area-gourmet',
  'area-gourmet-mochos': 'area-gourmet', 'area-gourmet-pufe': 'area-gourmet',
  'sofas-area-gourmet': 'area-gourmet', 'poltronas-area-gourmet': 'area-gourmet',
  'cadeiras-area-gourmet': 'area-gourmet', 'chaises-area-gourmet': 'area-gourmet',
  corporativo: 'corporativo', 'cadeiras-office': 'corporativo', 'mesas-office': 'corporativo',
  'poltronas-office': 'corporativo', 'prateleiras-office': 'corporativo',
  'multifuncionais-office': 'corporativo', 'sofas-office': 'corporativo', 'puffs-office': 'corporativo',
  acessorios: 'complemento', aparadores: 'complemento', 'mesa-de-centro-e-lateral': 'complemento',
  bancos: 'complemento', espelhos: 'complemento', 'carrinho-bar': 'complemento',
  puffs: 'complemento', racks: 'complemento', complementos: 'complemento',
  banquetas: 'complemento', buffets: 'complemento',
};

const TIPO_LABEL = {
  sofa: 'Sofá', poltrona: 'Poltrona', 'sala-jantar': 'Sala de Jantar',
  quarto: 'Quarto', 'area-gourmet': 'Área Gourmet',
  corporativo: 'Corporativo', complemento: 'Complemento',
};

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'csm-catalog-restore/1.0' } }, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

async function fetchCategories() {
  const idToSlug = new Map();
  let page = 1;
  while (true) {
    const url = `${BASE}/?rest_route=%2Fwp%2Fv2%2Fproduct_cat&per_page=100&page=${page}&_fields=id,slug`;
    try {
      const data = await fetchJSON(url);
      if (!Array.isArray(data) || data.length === 0) break;
      data.forEach(c => idToSlug.set(c.id, c.slug));
      if (data.length < 100) break;
      page++;
    } catch(e) { break; }
  }
  return idToSlug;
}

function getProductTipo(p, idToSlug) {
  const catIds = p.product_cat || [];
  for (const id of catIds) {
    const slug = idToSlug ? idToSlug.get(id) : null;
    if (slug && CAT_TO_TIPO[slug]) return CAT_TO_TIPO[slug];
  }
  return 'complemento';
}

function stripHtml(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#8220;|&#8221;|&#8222;/g, '"').replace(/&#8216;|&#8217;/g, "'")
    .replace(/&#[0-9]+;/g, '').replace(/&[a-z]+;/g, '')
    .replace(/\s+/g, ' ').trim();
}

function parseSpecs(rawContent) {
  if (!rawContent) return [];
  let text = rawContent
    .replace(/\[vc_[^\]]*\]/gi, '').replace(/\[\/vc_[^\]]*\]/gi, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#8220;|&#8221;|&#8222;/g, '"').replace(/&#[0-9]+;/g, '').replace(/&[a-z]+;/g, '');
  const FIELDS = ['Encosto','Estrutura','Braços','Assento','Pés','Base','Mecanismo','Revestimento','Material','Acabamento','Almofadas','Almofada','Assentos','Molas','Largura','Profundidade','Altura','Medidas'];
  const specs = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.length < 2) continue;
    let found = false;
    for (const field of FIELDS) {
      if (line.startsWith(field)) {
        const val = line.slice(field.length).replace(/^[:\s–-]+/, '').trim();
        if (val) { specs.push({ key: field, val }); found = true; break; }
      }
    }
    if (!found && line.includes(':') && !line.startsWith('[')) {
      const ci = line.indexOf(':');
      const key = line.slice(0, ci).trim();
      const val = line.slice(ci + 1).trim();
      if (key.length > 1 && key.length <= 25 && val.length > 1 && !/^\[/.test(key))
        specs.push({ key, val });
    }
  }
  return specs;
}

function buildCard(p, idToSlug) {
  const tipo  = getProductTipo(p, idToSlug);
  const name  = (p.title?.rendered || 'Produto').replace(/'/g, '&#39;');
  const badge = TIPO_LABEL[tipo] || tipo;
  const wppMsg = encodeURIComponent(`Tenho interesse no produto ${name}. Pode me enviar mais informações?`);
  const wpp    = `https://wa.me/${WPP_NR}?text=${wppMsg}`;

  const mediaEmbed = p._embedded?.['wp:featuredmedia']?.[0];
  const imgFull    = mediaEmbed?.source_url || '';
  const img600     = mediaEmbed?.media_details?.sizes?.woocommerce_thumbnail?.source_url
                  || mediaEmbed?.media_details?.sizes?.medium_large?.source_url
                  || imgFull;

  let tagline = stripHtml(p.excerpt?.rendered || '');
  if (!tagline || tagline.length < 8 || /^ref\./i.test(tagline))
    tagline = `${badge} · Design exclusivo · Alto padrão`;
  tagline = tagline.replace(/'/g, '&#39;').substring(0, 110);

  const specs     = parseSpecs(p.content?.rendered || '');
  const specsJson = JSON.stringify(specs).replace(/'/g, '&#39;').replace(/"/g, '&quot;');

  const desc    = stripHtml(p.excerpt?.rendered || '').substring(0, 500);
  const descEsc = desc.replace(/'/g, '&#39;').replace(/"/g, '&quot;');

  const imgTag = img600
    ? `<img src="${img600}" alt="${name} — CSM Decor" loading="lazy" />`
    : `<div class="cat-card__no-img" aria-hidden="true"></div>`;

  return `
          <article class="cat-card" data-tipo="${tipo}" data-id="${p.id}"
            data-imgs='${JSON.stringify(imgFull ? [imgFull] : [])}'
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

async function main() {
  console.log('\n🔍 Buscando categorias...');
  const idToSlug = await fetchCategories();

  const ids = RESTORE_IDS.join(',');
  const url = `${BASE}/?rest_route=%2Fwp%2Fv2%2Fproduct&include=${ids}&per_page=100&_embed=true`;
  console.log(`\n🔍 Buscando ${RESTORE_IDS.length} produtos por ID...\n`);
  const products = await fetchJSON(url);

  const cards = products.map(p => {
    const tipo = getProductTipo(p, idToSlug);
    console.log(`   ✔ [${p.id}] ${(p.title?.rendered || '').padEnd(35)} → ${TIPO_LABEL[tipo] || tipo}`);
    return buildCard(p, idToSlug);
  }).join('');

  let content = fs.readFileSync(PRODUTOS_HTML, 'utf8');

  // Injeta no início do catalogo__grid (antes do primeiro <article>)
  const FIRST_ARTICLE = '\n          <article class="cat-card"';
  const idx = content.indexOf(FIRST_ARTICLE);
  if (idx === -1) throw new Error('Não encontrou o primeiro card no HTML');

  const block = `\n          <!-- INICIO RESTAURADOS -->${cards}\n          <!-- FIM RESTAURADOS -->`;
  content = content.slice(0, idx) + block + content.slice(idx);

  fs.writeFileSync(PRODUTOS_HTML, content, 'utf8');
  console.log(`\n✅ ${products.length} produtos restaurados em produtos.html!\n`);
}

main().catch(err => { console.error('\n❌ Erro:', err.message); process.exit(1); });
