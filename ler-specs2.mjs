import { pdf } from 'pdf-to-img';
import { writeFileSync } from 'fs';
import sharp from 'sharp';

// Renderiza só a área de specs (top 52%) de cada página em alta resolução
const PAGINAS = [9, 41, 49, 51, 67, 91];
const desejadas = new Set(PAGINAS);

const doc = await pdf('Cat (1).pdf', { scale: 2.5 });
let i = 0;
for await (const page of doc) {
  i++;
  if (!desejadas.has(i)) continue;

  const meta = await sharp(page).metadata();
  const crop = Math.round(meta.height * 0.56);

  await sharp(page)
    .extract({ left: 0, top: 0, width: meta.width, height: crop })
    .resize(900)
    .jpeg({ quality: 90 })
    .toFile(`preview/specs-${i}.jpg`);

  console.log(`Pág ${i} → preview/specs-${i}.jpg`);
}
console.log('Concluído!');
