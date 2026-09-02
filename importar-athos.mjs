import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BASE   = process.cwd();
const HTML   = path.join(BASE, 'produtos.html');
const BG     = { r: 242, g: 237, b: 232, alpha: 1 };
const DEST   = path.join(BASE, 'imagens/salva');
const MANUAL = path.join(BASE, 'imagens/manuais/Athos');
const WPP    = 'https://wa.me/5519990034068?text=Tenho%20interesse%20no%20produto%20';

const IMAGENS = [
  { src: 'produto-38.png',      dest: 'athos-1.jpg' },
  { src: 'prancheta-2-48.png',  dest: 'athos-2.jpg' },
  { src: 'prancheta-3-45.png',  dest: 'athos-3.jpg' },
  { src: 'athos-1.jpg',         dest: 'athos-4.jpg' },
  { src: 'athos-2.jpg',         dest: 'athos-5.jpg' },
];

const PRODUTO = {
  id:        'salva-athos',
  nome:      'Sofá Athos',
  tipo:      'sofa',
  badge:     'Sofá',
  fornecedor:'salva',
  tagline:   'Softspring · Fibra · Módulos de 185 a 280 cm',
  descricao: 'Sofá de linhas contemporâneas com assento em espuma fixa e sistema Softspring, e encosto em fibra solta com percinta. Disponível em quatro módulos de largura (185, 228, 260 e 280 cm), adapta-se a diferentes composições de sala. Carregador USB opcional.',
  specs: [
    { key: 'Assento',           val: 'Espuma / Fixo / Softspring' },
    { key: 'Encosto',           val: 'Fibra / Solta / Percinta' },
    { key: 'Altura total',      val: '80 cm' },
    { key: 'Altura do assento', val: '42 cm' },
    { key: 'Profundidade',      val: '93 cm' },
    { key: 'Módulos',           val: '185 | 228 | 260 | 280 cm' },
    { key: 'USB',               val: 'Opcional' },
  ],
};

function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function gerarCard(imgsPaths) {
  const specsJson = JSON.stringify(PRODUTO.specs).replace(/'/g, '&#39;');
  const imgsJson  = JSON.stringify(imgsPaths);
  const descEsc   = escAttr(PRODUTO.descricao);
  const wpp       = WPP + encodeURIComponent(PRODUTO.nome) + '.%20Pode%20me%20enviar%20mais%20informa%C3%A7%C3%B5es%3F';
  return `          <article class="cat-card" data-tipo="${PRODUTO.tipo}" data-id="${PRODUTO.id}" data-fornecedor="${PRODUTO.fornecedor}"
            data-imgs='${imgsJson}'
            data-wpp="${wpp}"
            data-specs='${specsJson}'
            data-description="${descEsc}">
            <figure class="cat-card__fig" data-nome="${PRODUTO.nome}">
              <img src="${imgsPaths[0]}" alt="${PRODUTO.nome} — CSM Decor" loading="lazy" />
              <span class="cat-card__badge">${PRODUTO.badge}</span>
            </figure>
            <div class="cat-card__body">
              <h2 class="cat-card__name">${PRODUTO.nome}</h2>
              <p class="cat-card__tagline">${PRODUTO.tagline}</p>
              <button type="button" class="btn btn--primary btn--sm cat-card__cta"
                onclick="navigateToProduct(this.closest('.cat-card'))">
                Ver Produto
              </button>
            </div>
          </article>`;
}

async function main() {
  if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

  let html = fs.readFileSync(HTML, 'utf8');

  if (html.includes(`data-id="${PRODUTO.id}"`)) {
    console.log('Sofá Athos já existe na loja.');
    return;
  }

  const imgsSalvas = [];
  for (const img of IMAGENS) {
    const srcAbs  = path.join(MANUAL, img.src);
    const destAbs = path.join(DEST, img.dest);
    const destRel = `imagens/salva/${img.dest}`;
    process.stdout.write(`  ${img.dest} ... `);
    try {
      const buf = fs.readFileSync(srcAbs);
      await sharp(buf)
        .resize(600, 600, { fit: 'contain', position: 'centre', background: BG })
        .jpeg({ quality: 88 })
        .toFile(destAbs);
      imgsSalvas.push(destRel);
      console.log('✓');
    } catch (e) {
      console.log(`✗ (${e.message})`);
    }
  }

  if (imgsSalvas.length === 0) {
    console.error('Nenhuma imagem processada.');
    return;
  }

  const marker = '        </div>\r\n\r\n        <div class="cat-empty"';
  const idx = html.lastIndexOf(marker);
  if (idx === -1) { console.error('Marcador de injeção não encontrado!'); return; }

  const card = '\r\n' + gerarCard(imgsSalvas) + '\r\n';
  html = html.slice(0, idx) + card + html.slice(idx);
  fs.writeFileSync(HTML, html, 'utf8');

  console.log(`\n✅ Sofá Athos injetado com ${imgsSalvas.length} fotos.`);
}

main().catch(console.error);
