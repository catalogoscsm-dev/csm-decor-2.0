import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { readFileSync, writeFileSync } from 'fs';

const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

const data = new Uint8Array(readFileSync('Cat (1).pdf'));
const doc  = await pdfjsLib.getDocument({ data }).promise;

console.log(`Total de páginas: ${doc.numPages}\n`);

let output = '';
for (let i = 1; i <= doc.numPages; i++) {
  const page    = await doc.getPage(i);
  const content = await page.getTextContent();
  const text     = content.items.map(it => it.str).join(' ').trim();
  if (text.length > 2) {
    output += `\n=== Página ${i} ===\n${text}\n`;
    console.log(`Pág ${i}: ${text.slice(0, 120)}`);
  } else {
    console.log(`Pág ${i}: (sem texto)`);
  }
}

writeFileSync('cat2-texto.txt', output, 'utf8');
console.log('\n✅ Salvo em cat2-texto.txt');
