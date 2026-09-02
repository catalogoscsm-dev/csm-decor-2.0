import sharp from 'sharp';

const BG = { r: 242, g: 237, b: 232, alpha: 1 };

// Principal: remove o texto "Madson" do topo (~20%) e bordas pretas laterais (~5px)
const meta1 = await sharp('imagens/madson.PNG').metadata();
const top1   = Math.round(meta1.height * 0.20);
const trim   = 15;
await sharp('imagens/madson.PNG')
  .extract({ left: trim, top: top1, width: meta1.width - trim * 2, height: meta1.height - top1 })
  .resize(600, 600, { fit: 'contain', position: 'centre', background: BG })
  .jpeg({ quality: 88 })
  .toFile('imagens/artecouro2/madson-600.jpg');
console.log('✅ madson-600.jpg');

// Lateral: imagem limpa, normalizar direto
await sharp('imagens/madson 2.PNG')
  .resize(600, 600, { fit: 'contain', position: 'centre', background: BG })
  .jpeg({ quality: 88 })
  .toFile('imagens/artecouro2/madson-lateral-600.jpg');
console.log('✅ madson-lateral-600.jpg');
