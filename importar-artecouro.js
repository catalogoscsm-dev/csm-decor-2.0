'use strict';

const fs   = require('fs');
const path = require('path');

const PRODUTOS_HTML  = path.join(__dirname, 'produtos.html');
const PRODUTOS_JSON  = path.join(__dirname, 'artecouro-produtos.json');
const WPP_NR         = '5519990034068';

const TIPO_LABEL = {
  'sofa': 'Sofá', 'poltrona': 'Poltrona', 'complemento': 'Complemento',
};

// ─── Geração do card HTML ────────────────────────────────────────────────────
function buildCard(p) {
  const tipo  = p.categoria || 'poltrona';
  const name  = p.nome.replace(/'/g, '&#39;');
  const badge = TIPO_LABEL[tipo] || tipo;

  const wppMsg = encodeURIComponent(`Tenho interesse no produto ${p.nome}. Pode me enviar mais informações?`);
  const wpp    = `https://wa.me/${WPP_NR}?text=${wppMsg}`;

  const imgSrc  = p.imagem  || '';
  const imgSrc2 = p.imagem2 || '';
  const imgs    = imgSrc2 ? [imgSrc, imgSrc2] : [imgSrc];

  const imgTag = imgSrc
    ? `<img src="${imgSrc}" alt="${name} — CSM Decor" loading="lazy" />`
    : `<div class="cat-card__no-img" aria-hidden="true"></div>`;

  const specs = Object.entries(p.composicao || {}).map(([key, val]) => ({
    key: key.charAt(0).toUpperCase() + key.slice(1),
    val,
  }));
  const specsJson = JSON.stringify(specs).replace(/'/g, '&#39;').replace(/"/g, '&quot;');

  // data-description vazio: info ja esta na tabela de specs, sem duplicacao
  const tagline = `${badge} · Alto padrão · Sob encomenda`;

  return `
          <article class="cat-card" data-tipo="${tipo}" data-id="artecouro-${p.slug}" data-fornecedor="artecouro"
            data-imgs='${JSON.stringify(imgs)}'
            data-wpp="${wpp}"
            data-specs="${specsJson}"
            data-description="">
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
  let content = fs.readFileSync(PRODUTOS_HTML, 'utf8');

  // Remove bloco anterior para evitar duplicatas em execucoes repetidas
  content = content.replace(
    /\n\s*<!-- INICIO ARTECOURO -->[\s\S]*?<!-- FIM ARTECOURO -->/g, ''
  );

  const CAT_EMPTY  = '        <div class="cat-empty" id="cat-empty"';
  const emptyIdx   = content.indexOf(CAT_EMPTY);
  if (emptyIdx === -1) throw new Error('Marcador cat-empty não encontrado em produtos.html');

  const GRID_CLOSE   = '        </div>';
  const gridCloseIdx = content.lastIndexOf(GRID_CLOSE, emptyIdx);
  if (gridCloseIdx === -1) throw new Error('Fechamento do catalogo__grid não encontrado');

  const block = `\n          <!-- INICIO ARTECOURO -->${cards}\n          <!-- FIM ARTECOURO -->\n`;
  return content.slice(0, gridCloseIdx) + block + content.slice(gridCloseIdx);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const produtos = JSON.parse(fs.readFileSync(PRODUTOS_JSON, 'utf8'));
  console.log(`\nImportando ${produtos.length} produtos Artecouro Concept...\n`);

  const cards = produtos.map(p => {
    const card = buildCard(p);
    const imgs2 = p.imagem2 ? '2 fotos' : '1 foto';
    console.log(`  ✔ ${p.nome.padEnd(25)} → ${TIPO_LABEL[p.categoria] || p.categoria} (${imgs2})`);
    return card;
  }).join('');

  const updated = injectIntoHtml(cards);
  fs.writeFileSync(PRODUTOS_HTML, updated, 'utf8');

  console.log(`\n✅ produtos.html atualizado com ${produtos.length} produtos da Artecouro Concept!\n`);
}

main();
