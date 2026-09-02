// adicionar-keywords.js
// Adiciona data-keywords a cada card de produto em produtos.html
// para alimentar o motor de busca (CSB).
// Uso: node adicionar-keywords.js

const fs = require('fs');
const path = require('path');

const PRODUTO_HTML = path.join(__dirname, 'produtos.html');

function decodeEntities(str) {
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

const KEYWORD_MAP = {
  // ── Sofás ────────────────────────────────────────────────────────────────
  'Sofá Portland':       'retrátil reclinável 3 lugares sala estar moderno estofado',
  'Sofá Oreon':          '3 lugares sala contemporâneo linhas retas estofado',
  'Sofá Chesterfield I': 'chesterfield capitonê clássico inglês luxo botões couro estofado',
  'Sofá Premium':        'premium luxo sala estar elegante confortável estofado',
  'Sofá Ibiza':          '2 lugares 3 lugares sala moderno casual estofado',
  'Sofá Seul':           'sala contemporâneo moderno estofado',
  'Sofá Rubi':           '2 lugares 3 lugares sala elegante estofado',
  'Sofá Chesterfield II':'chesterfield capitonê clássico inglês luxo botões couro',
  'Sofá Apgar':          'sala moderno confortável estofado',
  'Sofá California':     'californiano retrátil reclinável modular casual sala',
  'Sofá Como':           'italiano contemporâneo sala estofado',
  'Sofá Chesterfield X': 'chesterfield capitonê clássico botões luxo inglês couro',
  'Sofá Aura':           'orgânico formas naturais design moderno sala estofado',
  'Sofá Boreal':         'luxo sala retrátil conforto elegante estofado',
  'Sofá Klimt':          'design arte art deco luxo capitonê artístico estofado',
  'Sofá Greco':          'clássico greco romano luxo sala estofado',
  'Sofá Abruzi':         'italiano luxo elegante sala alto padrão abruzzo',
  'Sofá Vip':            'home theater cinema retrátil reclinável luxo vip',
  'Sofá Danúbio':        'modular sala moderno elegante danubio',
  'Sofá V':              'moderno design arrojado sala estofado',
  'Sofá Cannes':         'contemporâneo qualidade material francês',
  'Sofá Eros':           'retrátil reclinável home theater cinema 2.70 largo',
  'Sofá ADA':            'design moderno sala estofado',
  'Sofá VERSALES':       'versalhes versalles clássico francês luxo',
  'Sofá TOULOUSE':       'toulouse francês moderno sala',
  'Sofá ORLEANS':        'orleans francês moderno sala',
  'Sofá LOMA':           'sala moderno estofado',
  'Sofá NANTES':         'home theater sala tv moderno',
  'Sofá Fine':           'assento baixo linho ecológico bege fixo moderno',
  'Sofá FINE':           'fixo sala tv linho bege',
  'Sofá Lux':            'luxo eucalipto estrutura madeira sala tv',
  'Sofá 4203 fixo':      'fixo eucalipto percinta elástica espuma soft revestimento',
  'Sofá 4209 fixo':      'fixo eucalipto percinta elástica espuma revestimento',
  'Sofá Cairo':          'sala moderno elegante estofado',
  'Sofá ARGOS':          'off white caramelo couro cores',
  'Sofá Fixo HAERO':     'fixo moderno sala',
  'Sofá 8040':           'sala tv moderno estofado',
  'Sofá CANNES':         'sala tv retrátil reclinável',
  'Sofá DOMUS':          'sala tv estofado',
  'Sofá IBIZA':          'sala tv retrátil reclinável',
  'Sofá BORA':           'sala tv moderno',
  // Ideale
  'Shoulder':            'shoulder contemporâneo estofado ideale sala',
  'Tesla':               'tesla moderno elegante ideale sala',
  'Mallorca':            'mallorca sala ideale modular',
  'Toledo':              'toledo retrátil ideale sala',
  'Ludwing':             'ludwing luxo alto padrão ideale sala',
  'Sofá Pier':           'pier moderno ideale sala',
  'Otto':                'otto design contemporâneo ideale sala',
  // Sofás-cama
  'Sofá cama Planno':    'sofá cama 2 em 1 quarto hóspede retrátil planno',
  'Sofá Cama Fit':       'sofá cama 2 em 1 quarto hóspede retrátil',
  'Sofá cama Orlando':   'sofá cama 2 em 1 quarto hóspede',
  'Sofá cama Daybed':    'sofá cama daybed chaise quarto hóspede',
  'Sofá-Cama MH 1456':   'sofá cama quarto hóspede retrátil',
  'Sofá cama MH 1606':   'sofá cama quarto hóspede retrátil',
  'Sofá cama MH 1605':   'sofá cama quarto hóspede retrátil',
  'Sofá-Cama MH 1174':   'sofá cama quarto hóspede retrátil',

  // ── Sala de TV ────────────────────────────────────────────────────────────
  'Poltrona reclinável Bela': 'poltrona reclinável sala tv cinema relaxamento relax',
  'Poltrona reclinável Luna': 'poltrona reclinável sala tv cinema relaxamento relax',
  'Poltrona reclinável Eva':  'poltrona reclinável sala tv cinema relaxamento relax',
  'Poltrona reclinável Nina': 'poltrona reclinável sala tv cinema relaxamento relax',
  'Poltrona reclinável Lily': 'poltrona reclinável sala tv cinema relaxamento relax',
  'Poltrona reclinável Ava':  'poltrona reclinável sala tv cinema relaxamento relax',
  'Poltrona reclinável 3601': 'poltrona reclinável sala tv cinema relaxamento',
  'Poltrona reclinável 3792': 'poltrona reclinável sala tv cinema várias cores',
  'Home HEITOR':              'home rack painel tv sala madeira moderno',
  'Home ZARA':                'home rack painel tv sala moderno',
  'Rack LAIS':                'rack painel tv sala madeira',
  'Home ELEGANCE':            'home rack painel tv sala elegante',
  'Home RENOVARE':            'home rack painel tv sala moderno',

  // ── Poltronas ─────────────────────────────────────────────────────────────
  'Poltrona Allure':          'giratória decoração sala estilo sofisticação',
  'Poltrona Aura':            'design linhas fluidas orgânica decoração sala',
  'Poltrona ADA':             'moderna sala design estofada',
  'Poltrona NAZCA':           'sala decoração estofada',
  'Poltrona ATENA':           'sala design athena estofada',
  'Poltrona SHELL':           'concha shell design estofada',
  'Poltrona DONCELLA':        'mola espiral espuma resiliência soft manta silicone',
  'Poltrona CIRCUS':          'colorida design estofada',
  'Poltrona MALLORCA':        'mallorca sala estofada',
  'Poltrona LIBRE':           'design assinada samuca gerber estofada',
  'Poltrona BLAUSEE':         'design assinada samuca gerber lago suíço estofada',
  'Poltrona VOLPI':           'moderna sala estofada',
  'Poltrona Bia':             'decoração sala estofada',
  'Poltrona Vivara':          'moderna decoração estofada',
  'Poltrona MABEL':           'moderna sala estofada',
  'Poltrona Ondine':          'elegante ideale estofada',
  'Poltrona Mariah':          'ideale estofada',
  'Poltrona Mia':             'giratória mdf espuma percinta ideale',
  'Poltrona Soft':            'soft confortável espuma ideale',
  'Poltrona e Puff Amorosa':  'puff conjunto ideale',

  // ── Sala de Jantar ────────────────────────────────────────────────────────
  'Mesa Kaiko':               'jantar design elegante moderna',
  'Cadeira Kaiko':            'cadeira jantar contemporânea design',
  'Cadeira Minah':            'cadeira jantar elegante conforto',
  'Mesa de Jantar Trapézio':  'jantar trapézio moderna inovadora formato especial',
  'Mesa de Jantar Grega':     'jantar clássica greco romana beleza',
  'Mesa de Jantar Fiori':     'jantar elegante flor italiana',
  'Mesa ZAKI':                'jantar moderna',
  'Mesa de Jantar SOLE':      'jantar sol design',
  'Mesa de Jantar GAVEA':     'jantar paulo sartori design',
  'Mesa de Jantar CAPA':      'jantar moderna',
  'Mesa de Jantar CANNES':    'jantar paulo sartori francesa',
  'Mesa de Jantar BOWL':      'jantar bowl tigela redonda paulo sartori',
  'Mesa de Jantar MERIDIAN':  'jantar retangular',
  'Cadeira GODAN':            'cadeira jantar',
  'Cadeira BEBEL':            'cadeira jantar elegante',
  'Mesa de Jantar retangular EMMA': 'jantar retangular design',
  'Mesa retangular Bolero':   'jantar futurista curvas design paulo sartori',
  'Cadeira SÉFORA':           'cadeira jantar elegante sefora',
  'Mesa de Jantar INFINITY':  'jantar infinity infinito design',
  'Cadeira JULY':             'cadeira jantar',
  'Mesa de Jantar AGAVE':     'jantar agave design',

  // ── Quarto ────────────────────────────────────────────────────────────────
  'Mesa de Cabeceira Oregon':   'criado mudo lateral dormitório cabeceira',
  'Mesa de Cabeceira Marche':   'criado mudo lateral dormitório cabeceira',
  'Mesa de Cabeceira Malta':    'criado mudo lateral dormitório cabeceira',
  'Mesa de Cabeceira Lille':    'criado mudo lateral dormitório cabeceira',
  'Mesa de Cabeceira Ideale':   'criado mudo lateral dormitório cabeceira',
  'Mesa de Cabeceira Eros':     'criado mudo lateral dormitório cabeceira',
  'Mesa de Cabeceira Brisa':    'criado mudo lateral dormitório cabeceira',
  'Mesa de Cabeceira Atlante':  'criado mudo lateral dormitório cabeceira',
  'Mesa de Cabeceira Vigo':     'criado mudo lateral dormitório cabeceira',
  'Mesa de Cabeceira Sparta':   'criado mudo lateral dormitório cabeceira sparta esparta',
  'Mesa de Cabeceira Roma':     'criado mudo lateral dormitório cabeceira',
  'Cama Malta':                 'casal queen king dormitório estofada',
  'Cama Estofada Lille':        'casal queen king dormitório estofada',
  'Cama Afrodite (Tecido)':     'casal queen dormitório estofada tecido',
  'Cama Afrodite (Tela)':       'casal queen dormitório estofada tela',
  'Cômoda Roma':                'gaveta dormitório cômoda quarto',
  'Cômoda Lille':               'gaveta dormitório cômoda quarto',
  'Cômoda Eros':                'gaveta dormitório cômoda quarto',
  'Cômoda MICHIGAN':            'gaveta dormitório cômoda paulo sartori',
  'Mesa de Cabeceira MICHIGAN': 'criado mudo lateral dormitório cabeceira paulo sartori',
  'Mesa de Cabeceira KANSAS':   'criado mudo lateral dormitório cabeceira paulo sartori',
  'Cômoda KANSAS':              'gaveta dormitório cômoda paulo sartori',
  'Mesa de cabeceira BRERA':    'criado mudo lateral dormitório cabeceira paulo sartori',
  'Mesa cabeceira FUTURE':      'criado mudo lateral dormitório cabeceira futuro',
  'Mesa de cabeceira VEGAS':    'criado mudo lateral dormitório cabeceira',
  'Cômoda SAVANA':              'gaveta dormitório cômoda',
  'Mesa de cabeceira SAVANA':   'criado mudo lateral dormitório cabeceira',
  'Mesa de cabeceira CANOA':    'criado mudo lateral dormitório cabeceira jonathan mendes',
  'Mesa de Cabeceira PALHA':    'criado mudo lateral dormitório cabeceira palha rattan natural',
  'Cômoda KIEV':                'gaveta dormitório cômoda',
  'Cama Palha':                 'casal queen dormitório palha rattan natural',
  'Cama Munique':               'casal queen dormitório',
  'Cama DALLAS':                'casal queen dormitório paulo sartori',
  'Cama BOSTON':                'casal queen dormitório paulo sartori',
  'Cama DAKOTA':                'casal queen dormitório paulo sartori',
  'Cabeceira MH 2694':          'cabeceira cama quarto dormitório',
  'Cabeceira MH 2651':          'cabeceira cama quarto dormitório',
  'Cabeceira MH 2695':          'cabeceira cama quarto dormitório',
  'Penteadeira Lisboa':         'penteadeira quarto bancada espelho',

  // ── Complementos ──────────────────────────────────────────────────────────
  'Mesa Alma':               'mesa centro sala design sofisticado elegante',
  'Mesa Centro/Lateral MANU':'mesa centro lateral sala design',
  'Mesa de Centro VENUS':    'mesa centro sala decoração',
  'Puff CLAN':               'puff pouf banco sala decoração',
  'Puff GALES':              'puff pouf banco sala decoração',
  'Puff ITALIA':             'puff pouf banco italiano sala decoração',
  'Moldura espelho TOSCANA': 'espelho moldura decoração parede',
  'Carrinho bar AMSTERDAM':  'carrinho bar home bar bebida vinho holanda',
  'Carrinho bar RENÊ':       'carrinho bar home bar bebida vinho',
  'Aparador CHEVRON':        'aparador sala entrada decoração',
  'Aparador DUO':            'aparador sala entrada decoração',
  'Aparador FINN':           'aparador sala entrada decoração',
  'Espelho BOLD':            'espelho decoração sala quarto grande parede',
  'Espelho JABUTI':          'espelho jabuti tartaruga decoração parede',
  'Espelho URCA':            'espelho decoração paulo sartori parede',
  'Mesa lateral BISCOTTO':   'mesa lateral sala sofá',
  'Mesa lateral CRIQUET':    'mesa lateral sala sofá',
  'Mesa centro LISSE':       'mesa centro sala',
  'Mesa de Centro CRIQUET':  'mesa centro sala',
  'Mesa de Centro COMPASS':  'mesa centro bússola paulo sartori sala',
  'Banco ARTEMIS':           'banco sala decoração entrada',
  'Recamier Sofia':          'recamier chaise longue sala quarto',
  'Bufett CARLTON':          'bufê buffet armário sala jantar decoração',
  'Bufett MARROCOS':         'bufê buffet armário sala jantar decoração',

  // ── Corporativo ───────────────────────────────────────────────────────────
  'Puffs Linha Shape':       'puff modular escritório colaborativo ilha coletivo coworking',
  'Puff Puffon':             'puff escritório colaborativo inovação',
  'Puffs Puff':              'puff modular escritório colaborativo coworking',
  'Puff Levoo':              'puff multifuncional banco porta objetos escritório leve',
  'Linha Slider para Escritórios': 'sala reunião escritório moderno colaborativo',
  'Mesas Linha Pix':         'mesa escritório home office modular',
  'Mesa Talk':               'mesa escritório ergonômica reunião conversa',
  'Mesa Piano':              'mesa escritório inspiração',
  'Mesa Note':               'mesa escritório home office complemento',
  'Mesa Noa':                'mesa escritório corporativo showroom',
  'Mesas Linha Flow':        'mesa escritório home office versátil',
  'Mesa Bistrô':             'mesa bistrô escritório cafeteria coworking bar alto boteco',
  'Estantes Linha Pix Modular': 'estante escritório modular adaptável',
  'Estantes Linha Pix':      'estante escritório modular',
  'Sofás Linha Pix':         'sofá escritório colaborativo modular',
  'Sofás Linha Noa':         'sofá modular orgânico escritório',
  'Linha Multifuncional UP': 'multifuncional dinâmico jovial escritório',
  'Linha Multifuncional Satz': 'multifuncional colorido escritório corporativo',
  'Linha Multifuncional New Iso': 'cadeira plástica cores escritório',
  'Linha Multifuncional Luna': 'assento arredondado rotatividade elegante escritório',
  'Linha Multifuncional Longarina Leaf': 'longarina banco espera escritório aeroporto',
  'Linha Multifuncional Leaf': 'cadeira versátil clássico moderno escritório',
  'Linha Multifuncional Connect': 'cadeira versátil escritório conexão',
  'Linha Multifuncional Bit': 'cadeira clássica irreverente escritório',
  'Poltronas Linha Pix':     'poltrona escritório compacta versátil',
  'Poltronas Linha Neo':     'poltrona escritório colaborativa',
  'Cadeiras linha Secretária': 'cadeira secretária escritório giratória operativa',
  'Cadeiras linha Presidente': 'cadeira presidente escritório executiva giratória luxo',
  'Cadeiras linha Executiva': 'cadeira executiva escritório giratória',
  'Cadeiras linha Diretor':  'cadeira diretor executiva escritório gerência',
  'Cadeiras Linha Nexus':    'cadeira escritório minimalista',
  'Cadeiras Linha Liss':     'cadeira tela polipropileno adaptável versátil escritório',
  'Cadeiras Linha Job':      'cadeira operativa escritório',
  'Cadeiras Linha Goah':     'cadeira leve descomplicada escritório',
  'Cadeiras Linha Alles':    'cadeira home office escritório inovadora',
  'Cadeiras Linha Agile':    'cadeira minimalista sofisticada tela escritório ágil',
  'Cadeiras Linha Addit':    'cadeira operativa tela escritório',
  'Cadeiras Linha Acto':     'cadeira operativa conforto moderno escritório',
  'Estante VERMONT':         'estante corporativa escritório',
  'Linha Moblie':            'linha móveis corporativos escritório',
  'Linha Moblie 01':         'linha móveis corporativos escritório',

  // ── Área Gourmet ──────────────────────────────────────────────────────────
  'Sofá TAJ':                'área gourmet externo varanda churrasqueira',
  'Sofá DNA':                'área gourmet externo varanda',
  'Puff HAIFAS':             'puff área gourmet externo',
  'Poltrona TAJ':            'área gourmet externo varanda',
  'Poltrona DNA':            'área gourmet externo varanda',
  'Mesa jantar CONE':        'jantar gourmet externo redonda',
  'Chaise SELIMA':           'chaise lounge área gourmet externo',
  'Cadeira IVYS':            'cadeira gourmet externo',
  'Cadeira ALEPO':           'cadeira gourmet externo',
  'Metade de Barril 4001-P E 4001-G': 'barril metade decoração pub bar gourmet',
  'Quadro TAMPA DE BARRIL':  'quadro tampa barril decoração pub bar parede',
  'Pufe SOMMELIER 1051':     'puff sommelier vinho bar gourmet',
  'Mocho CANOA 4122':        'mocho banco alto canoa bar pub gourmet',
  'Mocho BOLICHE 2115':      'mocho banco alto boliche bar pub gourmet',
  'Mocho BISTRO 1689':       'mocho banco alto bistro bar café gourmet',
  'Mocho GAIOLA 4117':       'mocho banco alto gaiola bar pub gourmet',
  'Mocho PUB 2113':          'mocho banco alto pub bar gourmet',
  'Mesa de bar boteco 1597': 'mesa bar boteco pub restaurante bistrô café alta',
  'Mesa de bar boteco 1597-E': 'mesa bar boteco pub restaurante externo alta',
  'Mesa de bar boteco 1597-AE': 'mesa bar boteco pub restaurante externo alta',
  'Mesa de bar boteco QUADRADA 2119-AE': 'mesa bar boteco quadrada pub restaurante',
  'Mesa de bar boteco 1597-A': 'mesa bar boteco pub restaurante alta',
  'Mesa de bar BISTRO 1699': 'mesa bar bistrô café restaurante alta',
  'Mesa de bar 116 – 1571':  'mesa bar pub restaurante alta',
  'Banqueta boteco 05 – 1593': 'banqueta alta bar pub boteco restaurante',
  'Banqueta EMPORIO C/ ENCOSTO 4007': 'banqueta alta bar pub empório com encosto',
  'Banqueta EMPORIO GIRATÓRIA 4006': 'banqueta alta bar pub empório giratória',
  'Banqueta INDIA 4107':     'banqueta alta bar pub',
  'Banqueta PUB 2 – 4111':   'banqueta alta bar pub',
  'Banqueta ANATOMICA C/ ENCOSTO 4140': 'banqueta anatômica alta bar pub com encosto',
  'Banqueta NINFA 1592':     'banqueta alta bar pub',
  'Banco ANATOMICO ARAMADO 4112': 'banco anatômico aramado bar pub gourmet',
  'Banco CANOA 4121':        'banco canoa bar pub gourmet',
  'Banco BOLICHE 2114':      'banco boliche bar pub gourmet',
  'Banco BISTRO 1688':       'banco bistrô bar café gourmet',
  'Banco PUB ARAMADO 4138':  'banco pub aramado bar gourmet',
  'Banco PUB COM ENCOSTO 2112': 'banco pub com encosto bar gourmet',
  'Banco PUB 2001':          'banco pub bar gourmet',
  'Adega PÉ PALITO 2062':    'adega vinho garrafas decoração pé palito',
  'Adega MODULAR 6 GARRAFAS 1650': 'adega modular 6 garrafas vinho decoração',
  'Adega MODULAR 12 GARRAFAS 1651': 'adega modular 12 garrafas vinho decoração',
};

// Fallback por categoria
const TIPO_FALLBACK = {
  'sofa':        'sofá estofado sala estar confortável',
  'poltrona':    'poltrona estofada sala decoração',
  'sala-tv':     'sala tv home theater cinema estofado',
  'sala-jantar': 'sala jantar mesa cadeira refeição',
  'quarto':      'quarto dormitório cama descanso',
  'complemento': 'complemento decoração acessório',
  'corporativo': 'corporativo escritório office home office',
  'area-gourmet':'área gourmet churrasqueira varanda externo',
};

// ── Processar HTML ─────────────────────────────────────────────────────────

let html = fs.readFileSync(PRODUTO_HTML, 'utf8');
let result = '';
let i = 0;
let count = 0;
let skipped = 0;
const warnings = [];

const ARTICLE_START = '<article class="cat-card"';
const H2_START = '<h2 class="cat-card__name">';
const H2_END = '</h2>';

while (i < html.length) {
  const artIdx = html.indexOf(ARTICLE_START, i);
  if (artIdx === -1) {
    result += html.slice(i);
    break;
  }

  result += html.slice(i, artIdx);

  // Fim da tag de abertura do article
  let tagEnd = artIdx + ARTICLE_START.length;
  let inStr = false;
  let strChar = '';
  while (tagEnd < html.length) {
    const c = html[tagEnd];
    if (!inStr && (c === '"' || c === "'")) { inStr = true; strChar = c; }
    else if (inStr && c === strChar)        { inStr = false; }
    else if (!inStr && c === '>')           { break; }
    tagEnd++;
  }
  const articleTag = html.slice(artIdx, tagEnd + 1);

  if (articleTag.includes('data-keywords')) {
    result += articleTag;
    i = tagEnd + 1;
    skipped++;
    continue;
  }

  const nameFrom = tagEnd + 1;
  const h2Idx = html.indexOf(H2_START, nameFrom);
  const nextArt = html.indexOf(ARTICLE_START, nameFrom);
  const nameEndIdx = h2Idx !== -1 ? html.indexOf(H2_END, h2Idx + H2_START.length) : -1;

  if (h2Idx === -1 || nameEndIdx === -1 || (nextArt !== -1 && h2Idx > nextArt)) {
    result += articleTag;
    i = tagEnd + 1;
    continue;
  }

  const rawName = html.slice(h2Idx + H2_START.length, nameEndIdx);
  const name = decodeEntities(rawName);

  const tipoMatch = articleTag.match(/data-tipo="([^"]+)"/);
  const tipo = tipoMatch ? tipoMatch[1] : '';

  const keywords = KEYWORD_MAP[name] || TIPO_FALLBACK[tipo] || '';

  if (keywords) {
    result += articleTag.slice(0, -1) + `\n            data-keywords="${keywords}">`;
    count++;
  } else {
    result += articleTag;
    warnings.push(`"${name}" (tipo: ${tipo})`);
  }

  i = tagEnd + 1;
}

fs.writeFileSync(PRODUTO_HTML, result, 'utf8');

console.log(`\n✓ Keywords adicionadas: ${count} produtos`);
if (skipped) console.log(`  (${skipped} já tinham data-keywords)`);
if (warnings.length) {
  console.log(`\n⚠ Sem mapeamento para ${warnings.length} produto(s):`);
  warnings.forEach(w => console.log('  -', w));
}
