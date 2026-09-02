import sharp from 'sharp';

// rambb.PNG = 636x686 screenshot do card do produto
// Sofa começa após o label "Rembrandt" em cima e tem borda do card
// top=55 ficou quase certo (test-a), mas tinha linha fina de borda no topo
// top=60 evita a linha de borda mantendo o sofá inteiro

const src = 'imagens/rambb.PNG';
const out = 'imagens/artecouro/rembrandit-600.jpg';

// Remover só o título "Rembrandt" + linha do topo (~90px), manter escala natural do sofá
const crop = { left: 0, top: 90, width: 636, height: 596 };

await sharp(src)
  .extract(crop)
  .resize(600, 600, {
    fit: 'contain',
    position: 'centre',
    background: { r: 242, g: 237, b: 232, alpha: 1 },
  })
  .jpeg({ quality: 88 })
  .toFile(out);

console.log(`✅ ${out} gerado com crop ${JSON.stringify(crop)}`);
