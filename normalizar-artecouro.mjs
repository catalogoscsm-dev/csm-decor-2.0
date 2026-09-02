import sharp from 'sharp';
import { readdirSync } from 'fs';

const arquivos = readdirSync('imagens/artecouro').filter(f => f.endsWith('.png'));

for (const arquivo of arquivos) {
  const entrada = `imagens/artecouro/${arquivo}`;
  const saida = entrada.replace('.png', '-600.jpg');

  await sharp(entrada)
    .resize(600, 600, {
      fit: 'contain',
      position: 'centre',
      background: { r: 242, g: 237, b: 232, alpha: 1 }, // #f2ede8
    })
    .jpeg({ quality: 88 })
    .toFile(saida);

  console.log(`${arquivo} → ${saida.split('/').pop()}`);
}

console.log('Normalização concluída!');
