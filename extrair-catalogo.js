const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');

async function main() {
  const buf = fs.readFileSync('Cat.pdf');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  console.log('Total de páginas:', doc.numPages);

  let textoTotal = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const texto = content.items.map(item => item.str).join(' ');
    textoTotal += `\n=== PÁGINA ${i} ===\n${texto}\n`;
  }

  fs.writeFileSync('cat-texto.txt', textoTotal, 'utf8');
  console.log('Texto salvo em cat-texto.txt');
  console.log('\n--- PRIMEIROS 3000 chars ---\n');
  console.log(textoTotal.substring(0, 3000));
}

main().catch(e => console.error(e.message || e));
