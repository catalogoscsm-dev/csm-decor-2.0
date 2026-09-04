#!/usr/bin/env node
/**
 * importar-mesas.js
 * Injeta cards de mesas de jantar (Prime Bravus, Tecnoarte, Essenza, Bonté)
 * no produtos.html do CSM Decor.
 *
 * Uso: node importar-mesas.js
 * Pré-requisito: rode baixar-imagens-mesas.js antes
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const PRODUTOS_HTML = path.join(__dirname, 'produtos.html');
const WPP_NR        = '5519990034068';

const TIPO_LABEL = {
  'sala-jantar': 'Sala de Jantar',
  sofa: 'Sofá', poltrona: 'Poltrona', complemento: 'Complemento', quarto: 'Quarto',
};

const PRODUCTS = [
  // ── Prime Bravus ──────────────────────────────────────────────────────────
  {
    id:          'primebravus-bromelia',
    name:        'Mesa de Jantar Bromélia',
    tipo:        'sala-jantar',
    fornecedor:  'primebravus',
    tagline:     'Mármore Tecnológico · Base em Aço Carbono · 15 configurações de tamanho',
    description: 'A Mesa Bromélia da Prime Bravus combina beleza e resistência com tampo em Mármore Tecnológico e base em Aço Carbono com acabamento em pintura eletrostática. Disponível em 15 configurações de tamanho e múltiplas opções de acabamento em mármore e cores de base.',
    specs: [
      { key: 'Tampo',  val: 'Mármore Tecnológico' },
      { key: 'Base',   val: 'Aço Carbono com pintura eletrostática' },
      { key: 'Tamanhos', val: '15 configurações disponíveis' },
    ],
    imgs: [
      'imagens/mesas/primebravus-bromelia-1.jpg',
      'imagens/mesas/primebravus-bromelia-2.jpg',
      'imagens/mesas/primebravus-bromelia-3.jpg',
    ],
  },
  {
    id:          'primebravus-avocado',
    name:        'Mesa de Jantar Avocado',
    tipo:        'sala-jantar',
    fornecedor:  'primebravus',
    tagline:     'Mármore Tecnológico · Base em Aço Carbono · 9 tamanhos disponíveis',
    description: 'A Mesa Avocado da Prime Bravus combina sofisticação e durabilidade com tampo em Mármore Tecnológico e base em Aço Carbono com pintura eletrostática. Disponível em 9 configurações de tamanho, de 1,60 m a 3,00 m.',
    specs: [
      { key: 'Tampo',    val: 'Mármore Tecnológico' },
      { key: 'Base',     val: 'Aço Carbono com pintura eletrostática' },
      { key: 'Tamanhos', val: '9 configurações — de 1,60m a 3,00m' },
    ],
    imgs: [
      'imagens/mesas/primebravus-avocado-1.jpg',
      'imagens/mesas/primebravus-avocado-2.jpg',
    ],
  },
  {
    id:          'primebravus-caliman',
    name:        'Mesa de Jantar Caliman',
    tipo:        'sala-jantar',
    fornecedor:  'primebravus',
    tagline:     'Mármore Tecnológico · Base em Aço Carbono · Múltiplos acabamentos',
    description: 'A Mesa Caliman da Prime Bravus alia design contemporâneo e durabilidade com tampo em Mármore Tecnológico e base em Aço Carbono com pintura eletrostática. Com múltiplas opções de acabamento em mármore e 12 cores de base.',
    specs: [
      { key: 'Tampo',      val: 'Mármore Tecnológico' },
      { key: 'Base',       val: 'Aço Carbono com pintura eletrostática' },
      { key: 'Acabamentos', val: '13 opções de mármore · 12 cores de base' },
    ],
    imgs: [
      'imagens/mesas/primebravus-caliman-1.jpg',
      'imagens/mesas/primebravus-caliman-2.jpg',
      'imagens/mesas/primebravus-caliman-3.jpg',
      'imagens/mesas/primebravus-caliman-4.jpg',
      'imagens/mesas/primebravus-caliman-5.jpg',
    ],
  },

  // ── Tecnoarte Móveis ──────────────────────────────────────────────────────
  {
    id:          'tecnoarte-coimbra',
    name:        'Mesa Coimbra',
    tipo:        'sala-jantar',
    fornecedor:  'tecnoarte',
    tagline:     'Tampo oval em lâmina de cinamomo · Base cônica efeito concreto · 3,00 m',
    description: 'A Mesa Coimbra da Tecnoarte apresenta tampo oval em lâmina de cinamomo com borda chanfrada e base cônica com acabamento efeito concreto. Design moderno e robusto para salas de jantar de alto padrão. Medidas: 3,00 m × 1,30 m × 0,77 m.',
    specs: [
      { key: 'Tampo',      val: 'Lâmina de cinamomo, forma oval com borda chanfrada' },
      { key: 'Base',       val: 'Formato cônico, acabamento efeito concreto' },
      { key: 'Dimensões',  val: '3,00m × 1,30m × 0,77m' },
    ],
    imgs: [
      'imagens/mesas/tecnoarte-coimbra-1.jpg',
      'imagens/mesas/tecnoarte-coimbra-2.jpg',
      'imagens/mesas/tecnoarte-coimbra-3.jpg',
      'imagens/mesas/tecnoarte-coimbra-4.jpg',
      'imagens/mesas/tecnoarte-coimbra-5.jpg',
      'imagens/mesas/tecnoarte-coimbra-6.jpg',
      'imagens/mesas/tecnoarte-coimbra-7.jpg',
      'imagens/mesas/tecnoarte-coimbra-8.jpg',
    ],
  },
  {
    id:          'tecnoarte-ricci',
    name:        'Mesa Ricci',
    tipo:        'sala-jantar',
    fornecedor:  'tecnoarte',
    tagline:     'Tampo orgânico em nogueira natural · Base efeito concreto · 2,70 m',
    description: 'A Mesa Ricci da Tecnoarte combina o calor da madeira com o design contemporâneo. Tampo de forma orgânica em lâmina de nogueira natural com detalhe de borda chanfrada e base com acabamento efeito concreto. Medidas: 2,70 m × 1,30 m × 0,77 m.',
    specs: [
      { key: 'Tampo',     val: 'Lâmina de nogueira natural, forma orgânica' },
      { key: 'Base',      val: 'Acabamento efeito concreto' },
      { key: 'Dimensões', val: '2,70m × 1,30m × 0,77m' },
    ],
    imgs: [
      'imagens/mesas/tecnoarte-ricci-1.jpg',
      'imagens/mesas/tecnoarte-ricci-2.jpg',
      'imagens/mesas/tecnoarte-ricci-3.jpg',
    ],
  },

  // ── Essenza Móveis ────────────────────────────────────────────────────────
  {
    id:          'essenza-infinity',
    name:        'Mesa de Jantar Infinity',
    tipo:        'sala-jantar',
    fornecedor:  'essenza',
    tagline:     'Base símbolo do infinito · Linhas fluidas · Design Paulo Sartori',
    description: 'A Mesa Infinity da Essenza Móveis, assinada pelo designer Paulo Sartori, encapsula o conceito de eternidade com sua icônica base em formato de símbolo do infinito. Linhas fluidas e forma marcante que promovem continuidade e harmonia. Disponível em 5 tamanhos, de 2,00 m a 2,98 m.',
    specs: [
      { key: 'Design',    val: 'Paulo Sartori' },
      { key: 'Base',      val: 'Símbolo do infinito' },
      { key: 'Dimensões', val: 'De 2000×1000 a 2980×1200 × 760mm' },
    ],
    imgs: [
      'imagens/mesas/essenza-infinity-1.jpg',
    ],
  },
  {
    id:          'essenza-flow',
    name:        'Mesa de Jantar Flow',
    tipo:        'sala-jantar',
    fornecedor:  'essenza',
    tagline:     'Fusão Infinity + Eva · Elemento central suspenso · Design Paulo Sartori',
    description: 'A Mesa Flow da Essenza Móveis, criada por Paulo Sartori, representa a fusão dos modelos Infinity e Eva. Incorpora um elemento central suspenso que parece flutuar sob diferentes ângulos. Disponível em 5 tamanhos, de 2,00 m a 2,98 m.',
    specs: [
      { key: 'Design',    val: 'Paulo Sartori' },
      { key: 'Destaque',  val: 'Elemento central suspenso' },
      { key: 'Dimensões', val: 'De 2000×1000 a 2980×1200 × 760mm' },
    ],
    imgs: [
      'imagens/mesas/essenza-flow-1.jpg',
      'imagens/mesas/essenza-flow-2.jpg',
      'imagens/mesas/essenza-flow-3.jpg',
      'imagens/mesas/essenza-flow-4.jpg',
    ],
  },
  {
    id:          'essenza-sun',
    name:        'Mesa de Jantar Sun',
    tipo:        'sala-jantar',
    fornecedor:  'essenza',
    tagline:     'Tampo bipartido · Porcelana e madeira · Bases orgânicas · Design Studio Esse',
    description: 'A Mesa Sun da Essenza, criada pelo Studio Esse, foi desenvolvida para salas de jantar amplas. Combina porcelana e madeira com tampo bipartido e bases de contornos orgânicos que transmitem leveza e fluidez. Disponível em tamanhos de 2,70 m a 3,50 m.',
    specs: [
      { key: 'Design',    val: 'Studio Esse' },
      { key: 'Tampo',     val: 'Bipartido — porcelana e madeira' },
      { key: 'Dimensões', val: 'De 2700×1190 a 3500×1190 × 760mm' },
    ],
    imgs: [
      'imagens/mesas/essenza-sun-1.jpg',
      'imagens/mesas/essenza-sun-2.jpg',
      'imagens/mesas/essenza-sun-3.jpg',
      'imagens/mesas/essenza-sun-4.jpg',
      'imagens/mesas/essenza-sun-5.jpg',
    ],
  },
  {
    id:          'essenza-miami',
    name:        'Mesa de Jantar Miami',
    tipo:        'sala-jantar',
    fornecedor:  'essenza',
    tagline:     'Formato redondo sofisticado · Múltiplos acabamentos · Design Paulo Sartori',
    description: 'A Mesa Miami da Essenza Móveis, assinada por Paulo Sartori, é uma mesa redonda sofisticada com múltiplas opções de laminados de madeira, lacas e pedra técnica. Disponível em três diâmetros: 1,50 m, 1,60 m e 1,80 m.',
    specs: [
      { key: 'Design',    val: 'Paulo Sartori' },
      { key: 'Forma',     val: 'Redonda' },
      { key: 'Dimensões', val: 'Ø 1500, 1600 ou 1800 × 760mm' },
    ],
    imgs: [
      'imagens/mesas/essenza-miami-1.jpg',
      'imagens/mesas/essenza-miami-2.jpg',
      'imagens/mesas/essenza-miami-3.jpg',
    ],
  },

  // ── Bonté Móveis ──────────────────────────────────────────────────────────
  {
    id:          'bonte-trois',
    name:        'Mesa Trois Orgânica',
    tipo:        'sala-jantar',
    fornecedor:  'bonte',
    tagline:     'Design Ampezzan Maciel · Peça escultural · Alto padrão',
    description: 'A Mesa Trois Orgânica da Bonté, da coleção Designers assinada por Ampezzan Maciel Arquitetos, é uma peça escultural de alto padrão para salas de jantar exclusivas. Medidas: 1,49 m × 1,51 m × 0,76 m.',
    specs: [
      { key: 'Design',    val: 'Ampezzan Maciel arquitetos' },
      { key: 'Dimensões', val: '760mm × 1490mm × 1505mm' },
    ],
    imgs: [
      'imagens/mesas/bonte-trois-1.jpg',
    ],
  },
  {
    id:          'bonte-talon',
    name:        'Mesa Talon',
    tipo:        'sala-jantar',
    fornecedor:  'bonte',
    tagline:     'Design Ampezzan Maciel · Até 3,00 m · 4 configurações',
    description: 'A Mesa Talon da Bonté, assinada por Ampezzan Maciel Arquitetos, combina elegância e grandiosidade. Disponível em 4 tamanhos, de 2,20 m a 3,00 m de comprimento, para grandes salas de jantar de alto padrão.',
    specs: [
      { key: 'Design',    val: 'Ampezzan Maciel arquitetos' },
      { key: 'Dimensões', val: 'De 2200 a 3000mm de comprimento, 760mm altura' },
    ],
    imgs: [
      'imagens/mesas/bonte-talon-1.jpg',
      'imagens/mesas/bonte-talon-2.jpg',
    ],
  },
  {
    id:          'bonte-calice',
    name:        'Mesa Cálice',
    tipo:        'sala-jantar',
    fornecedor:  'bonte',
    tagline:     'Formato circular · Design autoral · Diâmetros de 1,18 a 1,60 m',
    description: 'A Mesa Cálice da Bonté é uma peça circular de design autoral para salas de jantar elegantes. Disponível em 4 diâmetros, de 1,18 m a 1,60 m, adaptando-se a diferentes composições de ambiente.',
    specs: [
      { key: 'Forma',     val: 'Circular' },
      { key: 'Dimensões', val: 'Ø 1180, 1400, 1500 ou 1600 × 760mm' },
    ],
    imgs: [
      'imagens/mesas/bonte-calice-1.jpg',
    ],
  },
];

function buildCard(p) {
  const badge     = TIPO_LABEL[p.tipo] || p.tipo;
  const name      = p.name.replace(/'/g, '&#39;');
  const tagline   = p.tagline.replace(/'/g, '&#39;');
  const desc      = (p.description || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const wppMsg    = encodeURIComponent(`Tenho interesse no produto ${p.name}. Pode me enviar mais informações?`);
  const wpp       = `https://wa.me/${WPP_NR}?text=${wppMsg}`;
  const specsJson = JSON.stringify(p.specs).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const imgsJson  = JSON.stringify(p.imgs);
  const img1      = p.imgs.find(f => fs.existsSync(path.join(__dirname, f))) || p.imgs[0] || '';

  const imgTag = img1
    ? `<img src="${img1}" alt="${name} — CSM Decor" loading="lazy" />`
    : `<div class="cat-card__no-img" aria-hidden="true"></div>`;

  return `
          <article class="cat-card" data-tipo="${p.tipo}" data-id="${p.id}" data-fornecedor="${p.fornecedor}"
            data-imgs='${imgsJson}'
            data-wpp="${wpp}"
            data-specs="${specsJson}"
            data-description="${desc}">
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
    /\n\s*<!-- INICIO MESAS -->[\s\S]*?<!-- FIM MESAS -->/g, ''
  );

  const CAT_EMPTY   = '        <div class="cat-empty" id="cat-empty"';
  const emptyIdx    = content.indexOf(CAT_EMPTY);
  if (emptyIdx === -1) throw new Error('Marcador cat-empty não encontrado em produtos.html');

  const GRID_CLOSE   = '        </div>';
  const gridCloseIdx = content.lastIndexOf(GRID_CLOSE, emptyIdx);
  if (gridCloseIdx === -1) throw new Error('Fechamento do catalogo__grid não encontrado');

  const block = `\n          <!-- INICIO MESAS -->${cards}\n          <!-- FIM MESAS -->\n`;
  return content.slice(0, gridCloseIdx) + block + content.slice(gridCloseIdx);
}

function main() {
  console.log('\n🍽️  Injetando mesas de jantar no produtos.html...\n');

  const cards = PRODUCTS.map(p => {
    const card = buildCard(p);
    console.log(`   ✔ ${p.name.padEnd(35)} → ${TIPO_LABEL[p.tipo]}`);
    return card;
  }).join('');

  const updated = injectIntoHtml(cards);
  fs.writeFileSync(PRODUTOS_HTML, updated, 'utf8');

  console.log(`\n🎉 produtos.html atualizado com ${PRODUCTS.length} mesas de jantar!\n`);
}

main();
