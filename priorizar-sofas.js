const fs = require('fs');

// IDs na ordem desejada para o início
const PRIORITY_IDS = [
  'ideale-7381',       // Shoulder
  'ideale-7285',       // Tesla
  'ideale-7112',       // Mallorca
  'ideale-7067',       // Sofá Pier
  'ideale-4321',       // Toledo
  'ideale-7388',       // Ludwing
  'ilhabelamoveis-13067', // Sofá Cosmopolitan Soft
  'novos-ankur',       // Sofá Ânkur
  'novos-venus2',      // Sofá Vênus
  'artecouro-bora',    // Sofá Bora
  'artecouro-haero',   // Sofá Haero
  'artecouro-urbi',    // Sofá Urbi
  '4646',              // Sofá Vip
];

let html = fs.readFileSync('produtos.html', 'utf8');
const extractedBlocks = [];

for (const id of PRIORITY_IDS) {
  const pattern = new RegExp(`([ \\t]*)<article[^>]*data-id="${id}"[\\s\\S]*?</article>[ \\t]*\n`);
  const match = html.match(pattern);
  if (!match) {
    console.error(`Não encontrado: ${id}`);
    continue;
  }
  extractedBlocks.push(match[0].trimEnd());
  html = html.replace(match[0], '');
  console.log(`Extraído: [${id}]`);
}

// Inserir antes do primeiro card de sofá (Sofá Rubi, id 4765)
const firstSofaPattern = /([ \t]*<article[^>]*data-tipo="sofa" data-id="4765")/;
if (!firstSofaPattern.test(html)) {
  console.error('Marcador do primeiro sofá não encontrado!');
  process.exit(1);
}

const insertContent = extractedBlocks.join('\n') + '\n          ';
html = html.replace(firstSofaPattern, insertContent + '$1');

fs.writeFileSync('produtos.html', html, 'utf8');
console.log(`\nPronto! ${extractedBlocks.length} sofás movidos para o início.`);
