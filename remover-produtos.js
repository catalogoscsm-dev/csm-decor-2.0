// remover-produtos.js
// Remove cards de produto específicos do produtos.html
// Uso: node remover-produtos.js

const fs = require('fs');
const path = require('path');

const PRODUTO_HTML = path.join(__dirname, 'produtos.html');

function decodeEntities(str) {
  return str
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .trim();
}

const NAMES_TO_REMOVE = new Set([
  'Sofá Chesterfield I',
  'Sofá Ibiza',
  'Sofá Oreon',
  'Sofá Portland',
  'Sofá Premium',
  'Sofá Seul',
  'Sofá California',
  'Sofá Como',
  'Sofá Chesterfield X',
  'Poltrona reclinável Bela',
  'Poltrona reclinável Luna',
  'Sofá Boreal',
  'Sofá Aura',
  'Sofá Klimt',
  'Sofá Abruzi',
  'Puffs Linha Shape',
  'Puff Puffon',
  'Puffs Puff',
  'Puff Levoo',
  'Linha Slider para Escritórios',
  'Mesas Linha Pix',
  'Mesa Talk',
  'Mesa Bistrô',
  'Poltronas Linha Pix',
  'Sofá cama Planno',
]);

const ARTICLE_START = '<article class="cat-card"';
const ARTICLE_END   = '</article>';
const H2_START      = '<h2 class="cat-card__name">';
const H2_END        = '</h2>';

let html = fs.readFileSync(PRODUTO_HTML, 'utf8');
let result = '';
let i = 0;
let removed = 0;
let notFound = new Set(NAMES_TO_REMOVE);

while (i < html.length) {
  const artStart = html.indexOf(ARTICLE_START, i);
  if (artStart === -1) { result += html.slice(i); break; }

  // Copia tudo até o início do article (preservando indentação da linha anterior)
  const before = html.slice(i, artStart);
  const artEnd = html.indexOf(ARTICLE_END, artStart);
  if (artEnd === -1) { result += html.slice(artStart); break; }

  const block = html.slice(artStart, artEnd + ARTICLE_END.length);

  // Extrai nome
  const h2i = block.indexOf(H2_START);
  const h2e = h2i !== -1 ? block.indexOf(H2_END, h2i + H2_START.length) : -1;
  const name = (h2i !== -1 && h2e !== -1)
    ? decodeEntities(block.slice(h2i + H2_START.length, h2e))
    : '';

  if (NAMES_TO_REMOVE.has(name)) {
    // Remove o article e a linha em branco/indentação que o precede
    result += before.replace(/[ \t]*\n?$/, '');
    removed++;
    notFound.delete(name);
    console.log(`  ✗ Removido: ${name}`);
  } else {
    result += before + block;
  }

  i = artEnd + ARTICLE_END.length;
}

fs.writeFileSync(PRODUTO_HTML, result, 'utf8');

console.log(`\n✓ Total removido: ${removed} produtos`);
if (notFound.size) {
  console.log(`\n⚠ Não encontrados no HTML (${notFound.size}):`);
  notFound.forEach(n => console.log('  -', n));
}
