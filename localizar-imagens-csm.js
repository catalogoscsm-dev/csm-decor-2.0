const fs = require('fs');
const path = require('path');

let html = fs.readFileSync('produtos.html', 'utf8');
const DIR = 'imagens/csm';

const urls = [...new Set(
  [...html.matchAll(/https:\/\/wsite\.csmdecor\.com\.br\/wsite\/wp-content\/uploads\/[^\s"']+/g)]
    .map(m => m[0])
)];

let substituidas = 0, naoEncontradas = 0;

for (const url of urls) {
  const filename = path.basename(url);
  const localPath = `${DIR}/${filename}`;
  if (fs.existsSync(localPath)) {
    html = html.replaceAll(url, localPath);
    substituidas++;
  } else {
    naoEncontradas++;
    console.warn(`Não encontrado localmente: ${filename}`);
  }
}

fs.writeFileSync('produtos.html', html);
console.log(`\nSubstituídas: ${substituidas} | Não encontradas: ${naoEncontradas}`);
