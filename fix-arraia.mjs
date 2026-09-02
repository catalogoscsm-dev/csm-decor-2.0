import { pdf } from 'pdf-to-img';
import { writeFileSync, rmSync } from 'fs';
import sharp from 'sharp';

const doc = await pdf('Cat.pdf', { scale: 2 });
let i = 0;
for await (const page of doc) {
  i++;
  if (i === 8) {
    writeFileSync('imagens/artecouro/arraia-poltrona.png', page);
    console.log('Página 8 extraída');
    break;
  }
}

await sharp('imagens/artecouro/arraia-poltrona.png')
  .resize(600, 600, { fit: 'contain', position: 'centre', background: { r: 242, g: 237, b: 232, alpha: 1 } })
  .jpeg({ quality: 88 })
  .toFile('imagens/artecouro/arraia-600-novo.jpg');

rmSync('imagens/artecouro/arraia-600.jpg');
rmSync('imagens/artecouro/arraia-poltrona.png');
rmSync('imagens/artecouro/arraia.png', { force: true });

import { renameSync } from 'fs';
renameSync('imagens/artecouro/arraia-600-novo.jpg', 'imagens/artecouro/arraia-600.jpg');

console.log('arraia-600.jpg substituído pela poltrona (página 8)');
