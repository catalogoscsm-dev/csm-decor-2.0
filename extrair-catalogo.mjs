import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, writeFileSync } from 'fs';

const buf = readFileSync('Cat.pdf');
const doc = await getDocument({ data: new Uint8Array(buf) }).promise;
console.log('Total de páginas:', doc.numPages);

let textoTotal = '';
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  const texto = content.items.map(item => item.str).join(' ');
  textoTotal += `\n=== PÁGINA ${i} ===\n${texto}\n`;
}

writeFileSync('cat-texto.txt', textoTotal, 'utf8');
console.log('Texto salvo em cat-texto.txt (' + textoTotal.length + ' chars)');
console.log('\n--- PRIMEIROS 3000 chars ---\n');
console.log(textoTotal.substring(0, 3000));
