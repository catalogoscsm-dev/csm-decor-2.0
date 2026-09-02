import { pdf } from 'pdf-to-img';
import { writeFileSync } from 'fs';
import sharp from 'sharp';

// Renderiza páginas-chave em miniatura para identificar produtos
// Foco nas páginas de foto (sem texto) que precedem as páginas de specs
const PAGINAS = [1,2,3,4,5,6,8,9,10,12,13,14,15,16,17,18,19,20,22,23,24,25,26,27,28,30,31,32,33,34,36,37,38,39,40,41,42,43,44,45,46,48,49,50,51,52,53,54,56,58,59,60,61,62,63,64,66,67,68,70,71,72,74,76,78,79,80,81,82,84,85,86,87,88,90,92,93,94];
const desejadas = new Set(PAGINAS);

console.log('Renderizando páginas...');
const doc = await pdf('Cat (1).pdf', { scale: 0.5 });

let i = 0;
for await (const page of doc) {
  i++;
  if (!desejadas.has(i)) continue;
  const out = `preview/pag-${String(i).padStart(2,'0')}.jpg`;
  await sharp(page).resize(300).jpeg({ quality: 70 }).toFile(out);
  process.stdout.write(`${i} `);
}
console.log('\n✅ Miniaturas salvas em preview/');
