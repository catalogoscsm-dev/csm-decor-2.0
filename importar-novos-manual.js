#!/usr/bin/env node
/**
 * importar-novos-manual.js
 * Injeta cards de produtos de fornecedores manuais no produtos.html.
 * Todos os cards recebem badge "Novo" para conferência.
 *
 * Uso: node importar-novos-manual.js
 * Pré-requisito: rode baixar-imagens-novos.js antes
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const PRODUTOS_HTML = path.join(__dirname, 'produtos.html');
const WPP_NR        = '5519990034068';

const TIPO_LABEL = {
  sofa: 'Sofá', poltrona: 'Poltrona', complemento: 'Complemento',
  'sala-jantar': 'Sala de Jantar', quarto: 'Quarto',
};

// ─── Catálogo manual de produtos ──────────────────────────────────────────────
const PRODUCTS = [
  {
    id:          'novos-carmem',
    name:        'Poltrona Carmem',
    tipo:        'poltrona',
    fornecedor:  'klassic',
    tagline:     'Elegância e conforto · Estrutura eucalipto · Plumante sintético no encosto',
    description: 'A Poltrona Carmem oferece elegância e conforto com sua estrutura em eucalipto e assento composto por espumas de alta densidade e manta de fibra. Seu encosto de plumante sintético proporciona um toque macio e acolhedor. Disponível com duas opções de base giratória, de 4 ou 5 pontas, a Carmem é a escolha perfeita para quem busca estilo e versatilidade em um móvel moderno e sofisticado.',
    specs: [
      { key: 'Estrutura', val: 'Madeira de eucalipto' },
      { key: 'Espuma',    val: 'D28 alta densidade' },
      { key: 'Encosto',   val: 'Plumante sintético' },
      { key: 'Base',      val: 'Giratória 4 ou 5 pontas' },
    ],
    keywords:    'poltrona carmem giratória sala eucalipto espuma conforto',
    imgs: ['imagens/novos/carmem-1.jpg', 'imagens/novos/carmem-2.jpg'],
  },
  {
    id:          'novos-jow',
    name:        'Poltrona Jow',
    tipo:        'poltrona',
    fornecedor:  'klassic',
    tagline:     'Design compacto e versátil · Base giratória ou balanço · 14 opções de acabamento',
    description: 'A Poltrona Jow combina conforto e estilo em um design compacto e versátil. Com estrutura em eucalipto e espuma de alta densidade, garante durabilidade e maciez. Disponível com base giratória ou de balanço e 14 opções de acabamento, a Jow se adapta a qualquer ambiente com personalidade e elegância.',
    specs: [
      { key: 'Estrutura', val: 'Madeira de eucalipto' },
      { key: 'Espuma',    val: 'D28 alta densidade' },
      { key: 'Base',      val: 'Giratória ou balanço' },
      { key: 'Acabamento', val: '14 opções de cor' },
    ],
    keywords:    'poltrona jow sala eucalipto espuma conforto design',
    imgs: [
      'imagens/novos/jow-1.jpg', 'imagens/novos/jow-2.jpg',
      'imagens/novos/jow-3.jpg', 'imagens/novos/jow-4.jpg',
    ],
  },
  {
    id:          'novos-roy',
    name:        'Poltrona Roy',
    tipo:        'poltrona',
    fornecedor:  'klassic',
    tagline:     'Elegância compacta · Almofadas e encosto em plumante sintético · Estrutura eucalipto',
    description: 'A Poltrona Roy combina elegância e conforto em um design compacto e requintado. Sua estrutura em eucalipto, espuma de alta densidade e manta de fibra garantem durabilidade e maciez. O encosto e as almofadas decorativas em plumante sintético completam a experiência de conforto e sofisticação.',
    specs: [
      { key: 'Estrutura',  val: 'Madeira de eucalipto' },
      { key: 'Espuma',     val: 'D28 alta densidade' },
      { key: 'Encosto',    val: 'Plumante sintético' },
      { key: 'Almofadas',  val: 'Decorativas inclusas' },
    ],
    keywords:    'poltrona roy sala eucalipto almofadas luxo design contemporâneo',
    imgs: [
      'imagens/novos/roy-1.jpg', 'imagens/novos/roy-2.jpg',
      'imagens/novos/roy-3.jpg', 'imagens/novos/roy-4.jpg',
    ],
  },
  {
    id:          'novos-ankur',
    name:        'Sofá Ânkur',
    tipo:        'sofa',
    fornecedor:  'karams',
    tagline:     'Formas orgânicas inspiradas no crescimento natural · Volumes acolhedores · 1,80 a 2,40 m',
    description: 'O Sofá Ânkur nasce como uma verdadeira expressão de conforto, acolhimento e leveza. Assim como um broto que rompe a terra em direção à luz, o Ânkur traz linhas que remetem ao crescimento orgânico, com formas suaves, volumetrias acolhedoras e uma estética que combina natureza, leveza, elegância e funcionalidade. Cada curva e detalhe foi pensado para transmitir a sensação de abraço.',
    specs: [
      { key: 'Altura',          val: '0,86 m' },
      { key: 'Profundidade',    val: '1,08 m' },
      { key: 'Alt. do assento', val: '0,45 m' },
      { key: 'Largura',         val: '1,80 m a 2,40 m' },
      { key: 'Pés',             val: 'Metálicos' },
    ],
    keywords:    'sofá ankur sala living design autoral contemporâneo conforto',
    imgs: ['imagens/novos/ankur-1.jpg', 'imagens/novos/ankur-2.jpg'],
  },
  {
    id:          'novos-bea',
    name:        'Poltrona Beá',
    tipo:        'poltrona',
    fornecedor:  'karams',
    tagline:     'Design informal e lúdico · Encosto pousado que dá leveza ao volume · Base giratória',
    description: 'A Poltrona Beá encanta com um design informal e quase lúdico: o encosto simplesmente pousado sobre o assento traz leveza visual aos volumes generosos. Com espuma de alta resiliência, tecido italiano e base giratória metálica, a Beá une estética contemporânea ao mais alto conforto.',
    specs: [
      { key: 'Altura',       val: '0,79 m' },
      { key: 'Profundidade', val: '0,84 m' },
      { key: 'Largura',      val: '0,90 m' },
      { key: 'Base',         val: 'Giratória metálica' },
      { key: 'Espuma',       val: 'Alta resiliência' },
    ],
    keywords:    'poltrona beá bea sala giratória design contemporâneo conforto',
    imgs: [
      'imagens/novos/bea-1.jpg', 'imagens/novos/bea-2.jpg',
      'imagens/novos/bea-3.jpg', 'imagens/novos/bea-4.jpg',
    ],
  },
  {
    id:          'novos-aloha',
    name:        'Sofá Aloha',
    tipo:        'sofa',
    fornecedor:  'karams',
    tagline:     'Inspirado no espírito Aloha · Proporções generosas · Refúgio de paz e bem-estar',
    description: 'Cada detalhe do Sofá Aloha é pensado para transformar o dia a dia em um refúgio de paz e afeto. Inspirado na palavra havaiana que significa amor, tranquilidade e conexão, o Aloha traz proporções generosas e estofamento macio que abraçam o corpo e elevam a experiência de estar em casa.',
    specs: [
      { key: 'Altura',       val: '0,82 m' },
      { key: 'Profundidade', val: '1,00 m' },
      { key: 'Largura',      val: '1,20 m a 1,50 m' },
    ],
    keywords:    'sofá aloha sala living linhas suaves conforto minimalista',
    imgs: ['imagens/novos/aloha-1.jpg', 'imagens/novos/aloha-2.jpg'],
  },
  {
    id:          'novos-venus',
    name:        'Puff Vênus',
    tipo:        'complemento',
    fornecedor:  'serragaucha',
    tagline:     'Puff fixo · Espuma D28 soft · Fibra manta',
    description: 'O Puff Vênus é uma peça de design orgânico e elegante, com enchimento em espuma D28 soft e fibra manta. Versátil e sofisticado, complementa qualquer composição de sala com leveza e personalidade.',
    specs: [
      { key: 'Tipo',       val: 'Puff fixo' },
      { key: 'Espuma',     val: 'D28 soft' },
      { key: 'Enchimento', val: 'Fibra manta' },
    ],
    keywords:    'puff venus complemento sala estar design orgânico redondo',
    imgs: ['imagens/novos/venus-1.jpg', 'imagens/novos/venus-2.jpg'],
  },
  {
    id:          'novos-marajo',
    name:        'Sofá Marajó',
    tipo:        'sofa',
    fornecedor:  'goldline',
    tagline:     'Inspirado na fluidez das paisagens naturais · Design escultural · Personalidade marcante',
    description: 'Inspirado na fluidez das paisagens naturais e na elegância das formas orgânicas, o Sofá Marajó combina design escultural e conforto em uma peça de personalidade marcante. Suas linhas fluidas criam uma presença única em qualquer ambiente, disponível em larguras de 1,80 a 3,00 m.',
    specs: [
      { key: 'Largura', val: '1,80 m a 3,00 m' },
      { key: 'Estilo',  val: 'Orgânico modulável' },
    ],
    keywords:    'sofá marajó orgânico modular sala living curvas naturais luxo',
    imgs: [
      'imagens/novos/marajo-1.jpg', 'imagens/novos/marajo-2.jpg',
      'imagens/novos/marajo-3.jpg', 'imagens/novos/marajo-4.jpg',
      'imagens/novos/marajo-5.jpg',
    ],
  },
  {
    id:          'novos-planura',
    name:        'Banco Planura',
    tipo:        'complemento',
    fornecedor:  'goldline',
    tagline:     'Design Estúdio Dentro · Banco contemporâneo · Diversas metragens de 65 a 200 cm',
    description: 'O Banco Planura, assinado pelo Estúdio Dentro, une design contemporâneo e funcionalidade refinada. Disponível em diversas metragens — de 65 a 200 cm — adapta-se com versatilidade a hall de entrada, quartos e salas de estar.',
    specs: [
      { key: 'Largura',      val: '65 cm a 200 cm' },
      { key: 'Profundidade', val: '50 cm' },
      { key: 'Altura',       val: '46 cm' },
      { key: 'Design',       val: 'Estúdio Dentro (2025)' },
    ],
    keywords:    'banco planura complemento madeira couro hall quarto sala design minimalista',
    imgs: [
      'imagens/novos/planura-1.jpg', 'imagens/novos/planura-2.jpg',
      'imagens/novos/planura-3.jpg', 'imagens/novos/planura-4.jpg',
    ],
  },
  {
    id:          'novos-bel132',
    name:        'Sofá BEL 132',
    tipo:        'sofa',
    fornecedor:  'artbel',
    tagline:     'Estrutura Lyptus reflorestado · Almofada solta com silicone virgem · Espuma D26 + molas',
    description: 'O Sofá BEL 132 combina sofisticação e durabilidade com estrutura interna em Lyptus, madeira de reflorestamento sustentável. O assento fixo com espuma D26 e suporte de molas Bonell oferece conforto consistente, enquanto as almofadas soltas com silicone virgem garantem um toque macio e aconchegante.',
    specs: [
      { key: 'Profundidade', val: '0,95 m' },
      { key: 'Altura',       val: '0,85 m' },
      { key: 'Estrutura',    val: 'Madeira Lyptus (reflorestamento)' },
      { key: 'Assento',      val: 'Espuma D26 + molas Bonell' },
      { key: 'Encosto',      val: 'Almofada solta silicone virgem' },
      { key: 'Pés',          val: 'Lyptus tom marrom' },
    ],
    keywords:    'sofá bel 132 sala living lyptus molas bonell espuma conforto',
    imgs: [
      'imagens/novos/bel132-1.jpg', 'imagens/novos/bel132-2.jpg',
      'imagens/novos/bel132-3.jpg', 'imagens/novos/bel132-4.jpg',
      'imagens/novos/bel132-5.jpg',
    ],
  },
  {
    id:          'novos-poltrona028',
    name:        'Poltrona 028',
    tipo:        'poltrona',
    fornecedor:  'artbel',
    tagline:     'Base giratória 360° com memória · Espuma D30 soft · Estrutura Lyptus sustentável',
    description: 'A Poltrona 028 é uma peça de design contemporâneo e conforto superior. Estrutura em Lyptus sustentável, assento em espuma D30 soft com manta de poliéster e base giratória 360° com memória em madeira maciça de Cinamomo. Um objeto de desejo para qualquer ambiente de alto padrão.',
    specs: [
      { key: 'Altura',       val: '0,85 m' },
      { key: 'Profundidade', val: '0,80 m' },
      { key: 'Largura',      val: '0,80 m' },
      { key: 'Estrutura',    val: 'Madeira Lyptus sustentável' },
      { key: 'Espuma',       val: 'D30 soft' },
      { key: 'Base',         val: 'Giratória 360° com memória (Cinamomo)' },
    ],
    keywords:    'poltrona 028 giratória sala espuma d30 design contemporâneo conforto',
    imgs: [
      'imagens/novos/poltrona028-1.jpg', 'imagens/novos/poltrona028-2.jpg',
      'imagens/novos/poltrona028-3.jpg', 'imagens/novos/poltrona028-4.jpg',
      'imagens/novos/poltrona028-5.jpg',
    ],
  },
  {
    id:          'novos-carmin',
    name:        'Poltrona Carmin',
    tipo:        'poltrona',
    fornecedor:  'ferguile',
    tagline:     'Giratória · Molas espirais · Estrutura eucalipto',
    description: 'A Poltrona Carmin Giratória une beleza e funcionalidade com estrutura em eucalipto e sistema de molas espirais com espuma D26. A base giratória proporciona mobilidade e praticidade, tornando-a a escolha ideal para escritórios e salas de estar contemporâneos.',
    specs: [
      { key: 'Estrutura', val: 'Madeira de eucalipto' },
      { key: 'Sistema',   val: 'Espuma D26 + molas espirais' },
      { key: 'Base',      val: 'Giratória' },
    ],
    keywords:    'poltrona carmin giratória molas espirais eucalipto sala conforto luxo',
    imgs: ['imagens/novos/carmin-1.jpg'],
  },
  {
    id:          'novos-dolphin',
    name:        'Poltrona Dolphin',
    tipo:        'poltrona',
    fornecedor:  'daf',
    tagline:     'Design acessível · Peça versátil e cheia de estilo · Acabamentos variados',
    description: 'A Poltrona Dolphin integra a linha Openbox2, proposta de design acessível e sofisticado. Peça versátil e cheia de estilo, combina com diferentes ambientes e projetos de interiores.',
    specs: [],
    keywords:    'poltrona dolphin sala design contemporâneo versátil estilo daf',
    imgs: ['imagens/novos/dolphin-1.jpg'],
  },
  {
    id:          'novos-venus2',
    name:        'Sofá Vênus',
    tipo:        'sofa',
    fornecedor:  'serragaucha',
    tagline:     'Assento fixo com mola bonnel · Espuma D26 Soft · Almofadas soltas de fibra siliconada',
    description: 'O Sofá Vênus une conforto e elegância em um design atemporal para a sala de estar. Assento fixo com sistema de mola bonnel, espuma D26 Soft e manta de fibra. Encosto fixo com almofadas soltas preenchidas com fibra siliconada. Pés em madeira.',
    specs: [
      { key: 'Assento',   val: 'Fixo com mola bonnel, espuma D26 Soft e fibra manta' },
      { key: 'Encosto',   val: 'Fixo com almofadas soltas de fibra siliconada' },
      { key: 'Pés',       val: 'Madeira' },
    ],
    keywords:    'sofa venus sala estar mola bonnel espuma fibra madeira living conforto',
    imgs: [
      'imagens/novos/venus2-1.jpg',
      'imagens/novos/venus2-2.jpg',
      'imagens/novos/venus2-3.jpg',
    ],
  },
  {
    id:          'novos-s147',
    name:        'Sofá S-147',
    tipo:        'sofa',
    fornecedor:  'suprema',
    tagline:     'Modular configurável · Espuma D28 Soft · Mola espiral · Estrutura eucalipto',
    description: 'O Sofá S-147 é um sistema modular de alto padrão com design orgânico e braços arredondados. Assento com espuma D-28 Soft e mola espiral, encosto com manta de fibra siliconada e estrutura em madeira maciça de eucalipto reflorestado. Disponível em diversas configurações de módulos, cantos e ilhas.',
    specs: [
      { key: 'Assento',    val: 'Espuma D28 Soft com mola espiral' },
      { key: 'Encosto',    val: 'Manta de fibra siliconada' },
      { key: 'Estrutura',  val: 'Madeira eucalipto reflorestado' },
      { key: 'Braços',     val: 'Design orgânico arredondado (0,25m)' },
      { key: 'Altura',     val: '0,95m' },
      { key: 'Largura',    val: 'De 0,80m a 1,80m por módulo' },
      { key: 'Profundidade', val: '1,10m' },
    ],
    keywords:    'sofa s147 modular espuma mola espiral eucalipto sala living configurável suprema',
    imgs: ['imagens/novos/s147-1.jpg'],
  },
];

// ─── Geração do card HTML ─────────────────────────────────────────────────────
function buildCard(p) {
  const badge      = TIPO_LABEL[p.tipo] || p.tipo;
  const name       = p.name.replace(/'/g, '&#39;');
  const tagline    = p.tagline.replace(/'/g, '&#39;');
  const desc       = (p.description || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const wppMsg     = encodeURIComponent(`Tenho interesse no produto ${p.name}. Pode me enviar mais informações?`);
  const wpp        = `https://wa.me/${WPP_NR}?text=${wppMsg}`;
  const specsJson  = JSON.stringify(p.specs).replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const imgsJson   = JSON.stringify(p.imgs);
  const img1       = p.imgs.find(f => fs.existsSync(path.join(__dirname, f))) || p.imgs[0] || '';

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
              <span class="cat-card__novo">Novo</span>
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

  // Remove bloco anterior se existir
  content = content.replace(
    /\n\s*<!-- INICIO NOVOS MANUAIS -->[\s\S]*?<!-- FIM NOVOS MANUAIS -->/g, ''
  );

  const CAT_EMPTY = '        <div class="cat-empty" id="cat-empty"';
  const emptyIdx  = content.indexOf(CAT_EMPTY);
  if (emptyIdx === -1) throw new Error('Marcador cat-empty não encontrado em produtos.html');

  const GRID_CLOSE    = '        </div>';
  const gridCloseIdx  = content.lastIndexOf(GRID_CLOSE, emptyIdx);
  if (gridCloseIdx === -1) throw new Error('Fechamento do catalogo__grid não encontrado');

  const block = `\n          <!-- INICIO NOVOS MANUAIS -->${cards}\n          <!-- FIM NOVOS MANUAIS -->\n`;
  return content.slice(0, gridCloseIdx) + block + content.slice(gridCloseIdx);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function main() {
  console.log('\n🛋️  Injetando produtos manuais no produtos.html...\n');

  const cards = PRODUCTS.map(p => {
    const card = buildCard(p);
    console.log(`   ✔ ${p.name.padEnd(28)} → ${TIPO_LABEL[p.tipo]}`);
    return card;
  }).join('');

  const updated = injectIntoHtml(cards);
  fs.writeFileSync(PRODUTOS_HTML, updated, 'utf8');

  console.log(`\n🎉 produtos.html atualizado com ${PRODUCTS.length} produtos manuais!\n`);
}

main();
