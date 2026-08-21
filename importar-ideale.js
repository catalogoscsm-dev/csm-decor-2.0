#!/usr/bin/env node
/**
 * importar-ideale.js
 * Busca produtos selecionados da Ideale Estofados via WooCommerce Store API
 * e os injeta diretamente no produtos.html do CSM Decor.
 *
 * Uso: node importar-ideale.js
 */

'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const FORNECEDOR_API  = 'https://idealeestofados.com.br/wp-json/wc/store/v1/products';
const WPP_NR          = '5519990034068';
const PRODUTOS_HTML   = path.join(__dirname, 'produtos.html');
const LOCAL_IMGS_FILE = path.join(__dirname, 'ideale-imagens-locais.json');

// Usa imagens locais (baixadas e normalizadas) quando disponíveis
const LOCAL_IMGS = fs.existsSync(LOCAL_IMGS_FILE)
  ? JSON.parse(fs.readFileSync(LOCAL_IMGS_FILE, 'utf8'))
  : {};

// Slugs dos 12 produtos aprovados pela supervisora
const TARGET_SLUGS = [
  'shoulder',
  'tesla',
  'mallorca',
  'toledo',
  'ludwing',
  'poltrona-ondine',
  'sofa-pier',
  'poltrona-mariah',
  'poltrona-mia',
  'poltrona-soft',
  'otto-2',
  'poltrona-e-puff-amorosa',
];

// ─── Mapeamento categorias Ideale → tipos internos CSM ────────────────────────
const CAT_TO_TIPO = {
  'sofa': 'sofa', 'sofas': 'sofa', 'estofados': 'sofa',
  'poltronas': 'poltrona', 'poltrona': 'poltrona',
  'chaise': 'sofa', 'chaises': 'sofa',
  'banco': 'complemento', 'bancos': 'complemento',
  'puff': 'complemento', 'puffs': 'complemento', 'puf': 'complemento',
  'cama': 'quarto', 'camas': 'quarto',
  'cadeira': 'sala-jantar', 'cadeiras': 'sala-jantar',
};

const TIPO_LABEL = {
  'sofa': 'Sofá', 'poltrona': 'Poltrona', 'sala-jantar': 'Sala de Jantar',
  'quarto': 'Quarto', 'area-gourmet': 'Área Gourmet',
  'corporativo': 'Corporativo', 'complemento': 'Complemento',
};

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'csm-catalog-importer/1.0' } }, res => {
      if (res.statusCode !== 200)
        return reject(new Error(`HTTP ${res.statusCode} em ${url}`));
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ data: JSON.parse(raw), headers: res.headers }); }
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
    const { data } = await fetchJSON(url);
    if (!Array.isArray(data) || data.length === 0) { console.log('fim.'); break; }
    all.push(...data);
    console.log(`${data.length} produtos`);
    if (data.length < 100) break;
    page++;
  }
  return all;
}

// ─── Parse de specs do HTML de descrição ─────────────────────────────────────
const SPEC_FIELDS = [
  'Estrutura', 'Suporte', 'Assento', 'Encosto', 'Pés', 'Base',
  'Braços', 'Mecanismo', 'Revestimento', 'Material', 'Acabamento',
  'Almofadas', 'Almofada', 'Assentos', 'Molas',
  'Sistema de conforto', 'Sistema',
  'Largura', 'Profundidade', 'Altura', 'Medidas', 'Dimensões',
];

function parseSpecs(descHtml) {
  if (!descHtml) return [];
  let text = descHtml
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#8220;|&#8221;/g, '"').replace(/&#8216;|&#8217;/g, "'")
    .replace(/&#[0-9]+;/g, '').replace(/&[a-z]+;/g, '');

  const specs = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.length < 3) continue;
    let found = false;
    for (const field of SPEC_FIELDS) {
      if (line.toLowerCase().startsWith(field.toLowerCase())) {
        const val = line.slice(field.length).replace(/^[:\s–\-]+/, '').trim();
        if (val) { specs.push({ key: field, val }); found = true; }
        break;
      }
    }
    if (!found && line.includes(':') && !line.startsWith('http')) {
      const ci  = line.indexOf(':');
      const key = line.slice(0, ci).trim();
      const val = line.slice(ci + 1).trim();
      if (key.length >= 2 && key.length <= 30 && val.length >= 2 && !/^\[|^\d+$/.test(key))
        specs.push({ key, val });
    }
  }
  return specs;
}

function stripHtml(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#8220;|&#8221;/g, '"').replace(/&#[0-9]+;/g, '')
    .replace(/&[a-z]+;/g, '').replace(/\s+/g, ' ').trim();
}

// ─── Mapeamento de categoria ──────────────────────────────────────────────────
function getTipo(product) {
  for (const cat of (product.categories || [])) {
    const slug = (cat.slug || '').toLowerCase().trim();
    if (CAT_TO_TIPO[slug]) return CAT_TO_TIPO[slug];
    const name = (cat.name || '').toLowerCase();
    if (name.includes('sofa') || name.includes('sofá')) return 'sofa';
    if (name.includes('poltrona')) return 'poltrona';
    if (name.includes('chaise')) return 'sofa';
    if (name.includes('puff') || name.includes('puf')) return 'complemento';
  }
  const slug = (product.slug || '').toLowerCase();
  if (slug.includes('poltrona')) return 'poltrona';
  if (slug.includes('sofa') || slug.includes('sofá')) return 'sofa';
  return 'sofa'; // fallback: estofado genérico
}

// ─── Geração do card HTML (formato idêntico ao gerar-catalogo.js) ─────────────
function buildCard(p) {
  const tipo  = getTipo(p);
  const name  = (p.name || 'Produto').replace(/'/g, '&#39;');
  const badge = TIPO_LABEL[tipo] || tipo;

  const wppMsg  = encodeURIComponent(`Tenho interesse no produto ${p.name}. Pode me enviar mais informações?`);
  const wpp     = `https://wa.me/${WPP_NR}?text=${wppMsg}`;

  const localImgs = LOCAL_IMGS[p.slug] || [];
  const remoteImgs = (p.images || []).map(i => i.src).filter(Boolean);
  const allImgs = localImgs.length ? localImgs : remoteImgs;
  const img600  = allImgs[0] || '';

  let tagline = stripHtml(p.short_description || '');
  if (!tagline || tagline.length < 6) tagline = `${badge} · Design exclusivo · Alto padrão`;
  tagline = tagline.replace(/'/g, '&#39;').substring(0, 110);

  const specs     = parseSpecs(p.description || '');
  const specsJson = JSON.stringify(specs).replace(/'/g, '&#39;').replace(/"/g, '&quot;');

  const imgTag = img600
    ? `<img src="${img600}" alt="${name} — CSM Decor" loading="lazy" />`
    : `<div class="cat-card__no-img" aria-hidden="true"></div>`;

  return `
          <article class="cat-card" data-tipo="${tipo}" data-id="ideale-${p.id}" data-fornecedor="ideale"
            data-imgs='${JSON.stringify(allImgs)}'
            data-wpp="${wpp}"
            data-specs="${specsJson}">
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

// ─── Injeção no produtos.html ─────────────────────────────────────────────────
function injectIntoHtml(cards) {
  const content = fs.readFileSync(PRODUTOS_HTML, 'utf8');

  // Marca para não inserir duplicatas em execuções repetidas
  if (content.includes('data-id="ideale-')) {
    // Remove bloco anterior de produtos Ideale para reinserir atualizado
    const cleaned = content.replace(
      /\n\s*<!-- INICIO IDEALE -->[\s\S]*?<!-- FIM IDEALE -->/g, ''
    );
    return inject(cleaned, cards);
  }
  return inject(content, cards);
}

function inject(content, cards) {
  // Encontra o fechamento do catalogo__grid (</div> imediatamente antes do cat-empty)
  const CAT_EMPTY = '        <div class="cat-empty" id="cat-empty"';
  const emptyIdx = content.indexOf(CAT_EMPTY);
  if (emptyIdx === -1) throw new Error('Marcador cat-empty não encontrado em produtos.html');

  // Busca o </div> mais próximo ANTES do cat-empty (fecha o catalogo__grid)
  const GRID_CLOSE = '        </div>';
  const gridCloseIdx = content.lastIndexOf(GRID_CLOSE, emptyIdx);
  if (gridCloseIdx === -1) throw new Error('Fechamento do catalogo__grid não encontrado');

  const block = `\n          <!-- INICIO IDEALE -->${cards}\n          <!-- FIM IDEALE -->\n`;
  return content.slice(0, gridCloseIdx) + block + content.slice(gridCloseIdx);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔍 Buscando produtos da Ideale Estofados...\n');
  const all = await fetchAllProducts();

  // Filtra pelos slugs selecionados
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

  console.log(`\n🎉 produtos.html atualizado com ${selected.length} produtos da Ideale!\n`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
