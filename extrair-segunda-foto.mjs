import { pdf } from 'pdf-to-img';
import { writeFileSync, unlinkSync } from 'fs';
import sharp from 'sharp';

// Página de specs de cada produto — foto lateral fica na metade inferior
const PAGINAS = [
  { pagina: 9,  nome: 'arraia-lateral' },   // specs da Arraia poltrona (pág.8)
  { pagina: 13, nome: 'eloah-lateral' },
  { pagina: 17, nome: 'generosa-lateral' },
  { pagina: 37, nome: 'oca-lateral' },
];

const desejadas = new Set(PAGINAS.map(p => p.pagina));
const mapa = {};
for (const p of PAGINAS) mapa[p.pagina] = p.nome;

console.log('Extraindo páginas do PDF...');
const doc = await pdf('Cat.pdf', { scale: 3 }); // scale alto para recorte nítido

let i = 0;
for await (const page of doc) {
  i++;
  if (!desejadas.has(i)) continue;

  const nome = mapa[i];
  const png  = `imagens/artecouro/${nome}-full.png`;
  writeFileSync(png, page);

  // Descobre dimensões reais da página renderizada
  const meta = await sharp(png).metadata();
  const W = meta.width;
  const H = meta.height;

  // Recorta só a foto do produto (ignora texto de specs no topo e dimensões no rodapé)
  const top    = Math.round(H * 0.40);
  const height = Math.round(H * 0.42);

  await sharp(png)
    .extract({ left: 0, top, width: W, height })
    .resize(600, 600, {
      fit: 'contain',
      position: 'centre',
      background: { r: 242, g: 237, b: 232, alpha: 1 },
    })
    .jpeg({ quality: 88 })
    .toFile(`imagens/artecouro/${nome}-600.jpg`);

  unlinkSync(png);
  console.log(`  Pág ${i} → ${nome}-600.jpg (recorte ${top}px–${top+height}px de ${H}px)`);
}

console.log('\nConcluído!');
