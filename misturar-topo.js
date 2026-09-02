const fs = require('fs');

// Nova ordem do topo (12 itens) — swaps aplicados:
// Shoulder <-> Estantes Linha Pix (4370)
// Sofá Pier <-> Sofás Linha Pix (4334)
// Cosmopolitan <-> Linha Multifuncional Luna (4269)
const NOVA_ORDEM_TOPO = [
  '4661',                  // Poltrona Aura
  'novos-venus2',          // Sofá Vênus
  '4378',                  // Estantes Linha Pix Modular
  'ideale-7381',           // Shoulder  (era posição 5, vai para 4)
  '4370',                  // Estantes Linha Pix (era posição 4, vai para 5)
  'ideale-7067',           // Sofá Pier (era posição 7, vai para 6)
  '4334',                  // Sofás Linha Pix (era posição 6, vai para 7)
  'ilhabelamoveis-13067',  // Sofá Cosmopolitan (era posição 10, vai para 8)
  '2335',                  // Mocho BISTRO
  '4269',                  // Linha Multifuncional Luna (era posição 8, vai para 10)
  '2316',                  // Mesa de bar BISTRO
  '2287',                  // Banco BISTRO
];

let html = fs.readFileSync('produtos.html', 'utf8').replace(/\r\n/g, '\n');

function extractBlock(id) {
  const pattern = new RegExp(`([ \\t]*<article[^>]*data-id="${id}"[\\s\\S]*?</article>[ \\t]*\n)`);
  const match = html.match(pattern);
  if (!match) { console.error('Não encontrado:', id); return null; }
  html = html.replace(match[1], '');
  return match[1];
}

const blocos = {};
for (const id of NOVA_ORDEM_TOPO) {
  const bloco = extractBlock(id);
  if (bloco) { blocos[id] = bloco; console.log('Extraído:', id); }
}

const topoNovo = NOVA_ORDEM_TOPO.map(id => blocos[id]).filter(Boolean).join('');

const firstArticle = html.indexOf('          <article');
html = html.slice(0, firstArticle) + topoNovo + html.slice(firstArticle);

fs.writeFileSync('produtos.html', html.replace(/\n/g, '\r\n'), 'utf8');
console.log('\nPronto!');
