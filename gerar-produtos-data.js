// Gera produtos-data.js a partir dos cards de produtos.html
const fs = require('fs');
const html = fs.readFileSync('produtos.html', 'utf8');

const produtos = [];
const cardRegex = /<article\s+class="cat-card"([\s\S]*?)<\/article>/g;

let match;
while ((match = cardRegex.exec(html)) !== null) {
  const block = match[0];

  const id        = (block.match(/data-id="([^"]*)"/)        || [])[1] || '';
  const tipo      = (block.match(/data-tipo="([^"]*)"/)     || [])[1] || '';
  const keywords  = (block.match(/data-keywords="([^"]*)"/) || [])[1] || '';
  const nome      = (block.match(/data-nome="([^"]*)"/)     || [])[1] || '';
  const badge     = (block.match(/class="cat-card__badge">([^<]*)/) || [])[1] || '';
  const imgsRaw   = (block.match(/data-imgs='([^']*)'/)     || [])[1] || '[]';

  let imgs = [];
  try { imgs = JSON.parse(imgsRaw); } catch (_) {}

  // Prefere imagem 600x600 se existir (thumbnail da listagem)
  const rawSrc = (block.match(/<img\s+src="([^"]*)"/) || [])[1] || '';
  const img = rawSrc || (imgs[0] || '');

  if (!nome || !img) continue;

  produtos.push({ id, name: nome, tipo, badge, img, keywords });
}

const js = `// Gerado automaticamente por gerar-produtos-data.js — não editar manualmente
window.CSM_PRODUTOS = ${JSON.stringify(produtos, null, 2)};
`;

fs.writeFileSync('produtos-data.js', js, 'utf8');
console.log(`Gerados ${produtos.length} produtos em produtos-data.js`);
