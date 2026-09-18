#!/usr/bin/env node
/**
 * importar-armil.js
 * Injeta produtos da Móveis Armil no produtos.html do CSM Decor.
 * Dados extraídos manualmente do site moveisarmil.com.br.
 *
 * Uso: node importar-armil.js
 * Pré-requisito: node baixar-imagens-armil.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const PRODUTOS_HTML   = path.join(__dirname, 'produtos.html');
const LOCAL_IMGS_FILE = path.join(__dirname, 'armil-imagens-locais.json');
const WPP_NR          = '5519990034068';

const LOCAL_IMGS = fs.existsSync(LOCAL_IMGS_FILE)
  ? JSON.parse(fs.readFileSync(LOCAL_IMGS_FILE, 'utf8'))
  : {};

const TIPO_LABEL = {
  sofa: 'Sofá', poltrona: 'Poltrona', complemento: 'Complemento',
  'sala-jantar': 'Sala de Jantar', quarto: 'Quarto',
};

// ─── Catálogo Armil ───────────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id:         'armil-aconna',
    name:       'Cama Aconna',
    tipo:       'quarto',
    fornecedor: 'armil',
    tagline:    'Madeira maciça jequitibá · Queen e King · Acabamentos exclusivos Armil',
    description: 'A Cama Aconna é confeccionada inteiramente em madeira maciça jequitibá, reunindo solidez e beleza natural em cada detalhe. Disponível nos tamanhos King (214×114×222 cm) e Queen (179×114×217 cm), adapta-se ao quarto com elegância atemporal. Fabricada em Gramado (RS) pela Móveis Armil.',
    specs: [
      { key: 'Material',   val: 'Madeira maciça jequitibá' },
      { key: 'King',       val: '214 × 114 × 222 cm (ref. 193000)' },
      { key: 'Queen',      val: '179 × 114 × 217 cm (ref. 193001)' },
      { key: 'Acabamentos', val: 'In Natura, Nogueira, Castanho, Ebanizado, Amazônia' },
    ],
    keywords: 'cama aconna quarto dormitório jequitibá madeira maciça king queen armil gramado',
    imgs: ['aconna'],
  },
  {
    id:         'armil-medellin',
    name:       'Cama Dormitório Medellin',
    tipo:       'quarto',
    fornecedor: 'armil',
    tagline:    'Design clássico com requinte contemporâneo · 12+ acabamentos · King e Queen',
    description: 'A Cama Dormitório Medellin combina linhas clássicas com acabamento refinado, disponível em mais de 12 opções de cor — de In Natura a Laca Preta. Disponível nos tamanhos King (233×146×213 cm) e Queen (198×146×208 cm). Uma peça de referência para dormitórios de alto padrão.',
    specs: [
      { key: 'King',        val: '233 × 146 × 213 cm (ref. 126001)' },
      { key: 'Queen',       val: '198 × 146 × 208 cm (ref. 126003)' },
      { key: 'Acabamentos', val: 'In Natura, Nogueira, Laca Branca, Off White, Laca Preta, Fendi, Eucalipto, Ebanizado, Amazônia e outros' },
    ],
    keywords: 'cama dormitório medellin quarto king queen laca madeira armil gramado clássico',
    imgs: ['medellin'],
  },
  {
    id:         'armil-palha',
    name:       'Cama Dormitório com Palha',
    tipo:       'quarto',
    fornecedor: 'armil',
    tagline:    'Palha natural na cabeceira · Toque orgânico e artesanal · Múltiplos tamanhos',
    description: 'A Cama Dormitório com Palha traz um detalhe artesanal marcante: a cabeceira em palha natural, que adiciona textura e calor ao quarto. Disponível em múltiplas configurações de tamanho — King, Queen e Casal — com peseira alta ou baixa. Uma peça que une tradição e estilo contemporâneo.',
    specs: [
      { key: 'King',        val: '207 × 128 × 240 cm (ref. 18077)' },
      { key: 'Queen',       val: '172 × 128 × 235 cm (ref. 18080)' },
      { key: 'Casal',       val: '152 × 128 × 225 cm (ref. 18083)' },
      { key: 'Detalhe',     val: 'Cabeceira em palha natural' },
    ],
    keywords: 'cama dormitório palha rattan quarto king queen casal orgânico artesanal armil gramado',
    imgs: ['palha'],
  },
  {
    id:         'armil-tess',
    name:       'Cama Tess',
    tipo:       'quarto',
    fornecedor: 'armil',
    tagline:    'Linhas contemporâneas · Cabeceira imponente · King e Queen',
    description: 'A Cama Tess impressiona pela cabeceira de proporções generosas e design contemporâneo. Disponível nos tamanhos King (230×94×237 cm) e Queen (195×94×232 cm), é a peça central ideal para dormitórios que buscam presença e sofisticação.',
    specs: [
      { key: 'King',        val: '230 × 94 × 237 cm (ref. 185000)' },
      { key: 'Queen',       val: '195 × 94 × 232 cm (ref. 185001)' },
      { key: 'Acabamentos', val: 'In Natura, Nogueira, Laca Branca, Off White, Laca Preta, Fendi, Eucalipto, Ebanizado, Amazônia' },
    ],
    keywords: 'cama tess quarto dormitório king queen cabeceira contemporâneo armil gramado',
    imgs: ['tess'],
  },
  {
    id:         'armil-brisa',
    name:       'Cômoda Brisa',
    tipo:       'quarto',
    fornecedor: 'armil',
    tagline:    'Gaveteiro elegante para o quarto · 110 × 89 × 47 cm · Acabamentos naturais',
    description: 'A Cômoda Brisa alia funcionalidade e beleza ao dormitório. Com dimensões de 110×89×47 cm, oferece espaço de armazenamento com estilo refinado. Disponível nos acabamentos In Natura, Nogueira e Castanho Envelhecido.',
    specs: [
      { key: 'Dimensões',   val: '110 × 89 × 47 cm (ref. 161009)' },
      { key: 'Acabamentos', val: 'In Natura, Nogueira, Castanho Envelhecido' },
    ],
    keywords: 'cômoda comoda brisa quarto gaveta armazenamento armil gramado madeira natural',
    imgs: ['brisa-1', 'brisa-2'],
  },
  {
    id:         'armil-recamier-ballet',
    name:       'Recâmier Ballet',
    tipo:       'complemento',
    fornecedor: 'armil',
    tagline:    'Design refinado · 155 × 50 × 43 cm · Acabamentos naturais e ebanizado',
    description: 'O Recâmier Ballet da Móveis Armil é uma peça sofisticada para quarto ou sala, com design elegante e proporções refinadas. Suas dimensões de 155×50×43 cm garantem presença discreta e funcional em qualquer ambiente. Disponível em acabamentos naturais e ebanizado.',
    specs: [
      { key: 'Dimensões',   val: '155 × 50 × 43 cm (ref. 100506)' },
      { key: 'Acabamentos', val: 'In Natura, Nogueira, Castanho Envelhecido, Eucalipto Naturalle, Eucalipto Marrone, Ebanizado' },
    ],
    keywords: 'recâmier ballet quarto sala complemento madeira armil gramado elegante',
    imgs: ['recamier-ballet-1', 'recamier-ballet-2', 'recamier-ballet-3'],
  },
  {
    id:         'armil-ayla',
    name:       'Luminária Ayla',
    tipo:       'complemento',
    fornecedor: 'armil',
    tagline:    'Luminária de piso · 50 × 193 × 53 cm · Acabamentos madeira',
    description: 'A Luminária Ayla é uma peça de iluminação de piso com design esguio e elegante. Com 193 cm de altura e base de 50×53 cm, ilumina e decora ambientes com presença sutil. Disponível nos acabamentos Eucalipto Naturalle, Eucalipto Marrone, Ebanizado e Amazônia.',
    specs: [
      { key: 'Dimensões',   val: '50 × 193 × 53 cm (ref. 100537)' },
      { key: 'Acabamentos', val: 'Eucalipto Naturalle, Eucalipto Marrone, Ebanizado, Amazônia' },
    ],
    keywords: 'luminária ayla piso iluminação sala quarto madeira eucalipto armil gramado',
    imgs: ['ayla'],
  },
];

// ─── Geração do card HTML ─────────────────────────────────────────────────────
function buildCard(p) {
  const badge     = TIPO_LABEL[p.tipo] || p.tipo;
  const name      = p.name.replace(/'/g, '&#39;');
  const tagline   = p.tagline.replace(/'/g, '&#39;');
  const desc      = (p.description || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const wppMsg    = encodeURIComponent(`Tenho interesse no produto ${p.name}. Pode me enviar mais informações?`);
  const wpp       = `https://wa.me/${WPP_NR}?text=${wppMsg}`;
  const specsJson = JSON.stringify(p.specs).replace(/'/g, '&#39;').replace(/"/g, '&quot;');

  const localImgPaths = p.imgs.map(slug => LOCAL_IMGS[slug]).filter(Boolean);
  const img1 = localImgPaths[0] || '';
  const imgsJson = JSON.stringify(localImgPaths);

  const imgTag = img1
    ? `<img src="${img1}" alt="${name} — CSM Decor" loading="lazy" />`
    : `<div class="cat-card__no-img" aria-hidden="true"></div>`;

  return `
          <article class="cat-card" data-tipo="${p.tipo}" data-id="${p.id}" data-fornecedor="${p.fornecedor}"
            data-imgs='${imgsJson}'
            data-wpp="${wpp}"
            data-specs="${specsJson}"
            data-description="${desc}"
            data-keywords="${p.keywords}">
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

  content = content.replace(
    /\n\s*<!-- INICIO ARMIL -->[\s\S]*?<!-- FIM ARMIL -->/g, ''
  );

  const CAT_EMPTY = '        <div class="cat-empty" id="cat-empty"';
  const emptyIdx  = content.indexOf(CAT_EMPTY);
  if (emptyIdx === -1) throw new Error('Marcador cat-empty não encontrado em produtos.html');

  const GRID_CLOSE   = '        </div>';
  const gridCloseIdx = content.lastIndexOf(GRID_CLOSE, emptyIdx);
  if (gridCloseIdx === -1) throw new Error('Fechamento do catalogo__grid não encontrado');

  const block = `\n          <!-- INICIO ARMIL -->${cards}\n          <!-- FIM ARMIL -->\n`;
  return content.slice(0, gridCloseIdx) + block + content.slice(gridCloseIdx);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  console.log('\n🛏️  Injetando produtos Móveis Armil no produtos.html...\n');

  const cards = PRODUCTS.map(p => {
    const card = buildCard(p);
    console.log(`   ✔ ${p.name.padEnd(30)} → ${TIPO_LABEL[p.tipo]}`);
    return card;
  }).join('');

  const updated = injectIntoHtml(cards);
  fs.writeFileSync(PRODUTOS_HTML, updated, 'utf8');

  console.log(`\n🎉 produtos.html atualizado com ${PRODUCTS.length} produtos da Móveis Armil!\n`);
}

main();
