const fs = require('fs');
const IDS = ['3264', '1311'];
let html = fs.readFileSync('produtos.html', 'utf8');
for (const id of IDS) {
  const pattern = new RegExp(`[ \\t]*<article[^>]*data-id="${id}"[\\s\\S]*?</article>[ \\t]*\n`);
  const match = html.match(pattern);
  if (!match) { console.error(`Não encontrado: ${id}`); continue; }
  html = html.replace(match[0], '');
  console.log(`Removido: [${id}]`);
}
fs.writeFileSync('produtos.html', html, 'utf8');
console.log('Pronto!');
