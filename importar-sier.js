#!/usr/bin/env node
/**
 * importar-sier.js
 * Injeta produtos da Sier Móveis no produtos.html do CSM Decor.
 * Como a Sier usa Framer (sem API), os dados são mapeados manualmente.
 *
 * Uso: node importar-sier.js
 * Pré-requisito: rode baixar-imagens-sier.js antes
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const WPP_NR          = '5519990034068';
const PRODUTOS_HTML   = path.join(__dirname, 'produtos.html');
const LOCAL_IMGS_FILE = path.join(__dirname, 'sier-imagens-locais.json');

const LOCAL_IMGS = fs.existsSync(LOCAL_IMGS_FILE)
  ? JSON.parse(fs.readFileSync(LOCAL_IMGS_FILE, 'utf8'))
  : {};

const TIPO_LABEL = {
  'sofa': 'Sofá', 'poltrona': 'Poltrona', 'sala-jantar': 'Sala de Jantar',
  'quarto': 'Quarto', 'complemento': 'Complemento',
};

const PRODUTOS = [
  {
    slug: 'spock-mj',
    nome: 'Mesa Spock',
    tipo: 'sala-jantar',
    tagline: 'Sala de Jantar · Design exclusivo · Alto padrão',
    descricao: 'Mesa de jantar Spock, design moderno e sofisticado da Sier Móveis.',
  },
];

function buildCard(p) {
  const badge = TIPO_LABEL[p.tipo] || p.tipo;
  const name  = p.nome.replace(/'/g, '&#39;');

  const wppMsg = encodeURIComponent(`Tenho interesse no produto ${p.nome}. Pode me enviar mais informações?`);
  const wpp    = `https://wa.me/${WPP_NR}?text=${wppMsg}`;

  const allImgs = LOCAL_IMGS[p.slug] || [];
  const img1    = allImgs[0] || '';

  const tagline  = (p.tagline || `${badge} · Design exclusivo · Alto padrão`).replace(/'/g, '&#39;').substring(0, 110);
  const descEsc  = (p.descricao || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const specsJson = JSON.stringify([]).replace(/'/g, '&#39;').replace(/"/g, '&quot;');

  const imgTag = img1
    ? `<img src="${img1}" alt="${name} — CSM Decor" loading="lazy" />`
    : `<div class="cat-card__no-img" aria-hidden="true"></div>`;

  return `
          <article class="cat-card" data-tipo="${p.tipo}" data-id="sier-${p.slug}" data-fornecedor="sier"
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
    /\n\s*<!-- INICIO SIER -->[\s\S]*?<!-- FIM SIER -->/g, ''
  );

  const CAT_EMPTY    = '        <div class="cat-empty" id="cat-empty"';
  const emptyIdx     = content.indexOf(CAT_EMPTY);
  if (emptyIdx === -1) throw new Error('Marcador cat-empty não encontrado em produtos.html');

  const GRID_CLOSE   = '        </div>';
  const gridCloseIdx = content.lastIndexOf(GRID_CLOSE, emptyIdx);
  if (gridCloseIdx === -1) throw new Error('Fechamento do catalogo__grid não encontrado');

  const block = `\n          <!-- INICIO SIER -->${cards}\n          <!-- FIM SIER -->\n`;
  return content.slice(0, gridCloseIdx) + block + content.slice(gridCloseIdx);
}

async function main() {
  console.log('\n🔍 Importando produtos da Sier Móveis...\n');

  const cards = PRODUTOS.map(p => {
    const card = buildCard(p);
    console.log(`   ✔ ${p.nome.padEnd(30)} → ${TIPO_LABEL[p.tipo] || p.tipo}`);
    return card;
  }).join('');

  const updated = injectIntoHtml(cards);
  fs.writeFileSync(PRODUTOS_HTML, updated, 'utf8');

  console.log(`\n🎉 produtos.html atualizado com ${PRODUTOS.length} produto(s) da Sier!\n`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
