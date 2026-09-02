const fs = require('fs');

const SOFA_CAMA_IDS = ['3696', '3683', '3682', '3681', '3680', '3679', '3646'];

const html = fs.readFileSync('produtos.html', 'utf8');

// Extract each sofa-cama article block and remove from original position
let result = html;
const extractedBlocks = [];

for (const id of SOFA_CAMA_IDS) {
  // Match from the opening <article ... data-id="ID" to its closing </article>
  const startPattern = new RegExp(`([ \\t]*)<article[^>]*data-id="${id}"[\\s\\S]*?</article>\\s*\n`);
  const match = result.match(startPattern);
  if (!match) {
    console.error(`Não encontrado: ${id}`);
    continue;
  }
  extractedBlocks.push(match[0].trimEnd()); // keep the block, trim trailing newline
  result = result.replace(match[0], '');
  console.log(`Extraído: [${id}]`);
}

// Insert all sofa-cama blocks before <!-- FIM ARTECOURO2 -->
const insertMarker = '          <!-- FIM ARTECOURO2 -->';
if (!result.includes(insertMarker)) {
  console.error('Marcador de inserção não encontrado!');
  process.exit(1);
}

const insertContent = '\n' + extractedBlocks.join('\n') + '\n          ';
result = result.replace(insertMarker, insertContent + insertMarker);

fs.writeFileSync('produtos.html', result, 'utf8');
console.log(`\nPronto! ${extractedBlocks.length} sofás-cama movidos para o final.`);
