// Baixa, normaliza e injeta novos produtos (Buriti Lucy, Minuano, Salva)
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BASE = process.cwd();
const HTML = path.join(BASE, 'produtos.html');
const BG   = { r: 242, g: 237, b: 232, alpha: 1 };
const WPP  = 'https://wa.me/5519990034068?text=Tenho%20interesse%20no%20produto%20';

const NOVOS = [
  {
    id: 'buriti-lucy',
    nome: 'Poltrona Lucy',
    tipo: 'poltrona',
    badge: 'Poltrona',
    fornecedor: 'buriti',
    pasta: 'imagens/buriti',
    prefix: 'lucy',
    tagline: 'Curvas que acolhem, conforto que surpreende',
    descricao: 'Poltrona com design arredondado e contemporâneo, ideal para ambientes residenciais ou comerciais que buscam modernidade aliada ao conforto. Estrutura TechShield, espuma D-28 soft, base giratória em aço.',
    specs: [
      { key: 'Largura', val: '90 cm' },
      { key: 'Altura', val: '75 cm' },
      { key: 'Profundidade', val: '75 cm' },
      { key: 'Altura do assento', val: '45 cm' },
      { key: 'Suporte', val: 'até 130 kg' },
    ],
    urls: [
      'https://estofadosburiti.com.br/wp-content/uploads/2026/02/Lucy-428-Frente-scaled.jpg',
      'https://estofadosburiti.com.br/wp-content/uploads/2026/02/Lucy-428-Posterior-scaled.jpg',
      'https://estofadosburiti.com.br/wp-content/uploads/2026/02/Lucy-428-det-scaled.jpg',
    ],
  },
  {
    id: 'minuano-puerto-power',
    nome: 'Sofá Puerto Power',
    tipo: 'sofa',
    badge: 'Sofá',
    fornecedor: 'minuano',
    pasta: 'imagens/minuano',
    prefix: 'puerto-power',
    tagline: 'Zero Gravity · Reclinável · Couro Premium',
    descricao: 'Sofá reclinável com tecnologia Zero Gravity que alivia a pressão nas costas e articulações. Conta com Nanobionic® para maior bem-estar, sistema ComfortPlus e portas USB e USB-C integradas.',
    specs: [
      { key: 'Tecnologia', val: 'Zero Gravity + Nanobionic®' },
      { key: 'Portas', val: 'USB e USB-C' },
      { key: 'Revestimento', val: 'Couro Premium' },
    ],
    urls: [
      'https://www.minuanodecor.com.br/medias/products/67_produto-galeriaprancheta-1.png',
      'https://www.minuanodecor.com.br/medias/products/848_produto-galeriaprancheta-2.png',
      'https://www.minuanodecor.com.br/medias/products/975_produto-galeriaprancheta-3.png',
      'https://www.minuanodecor.com.br/medias/products/682_produto-galeriaprancheta-4.png',
      'https://www.minuanodecor.com.br/medias/products/897_produto-galeriaprancheta-5.png',
    ],
  },
  {
    id: 'minuano-alias',
    nome: 'Sofá Alias',
    tipo: 'sofa',
    badge: 'Sofá',
    fornecedor: 'minuano',
    pasta: 'imagens/minuano',
    prefix: 'alias',
    tagline: 'Softspring · Suporte lombar · Couro Premium',
    descricao: 'Máximo conforto com exclusivo sistema de molejo Softspring e suporte lombar. Acomoda toda a família com estilo e praticidade.',
    specs: [
      { key: '2 lugares', val: '1,58 m' },
      { key: '3 lugares', val: '2,11 m' },
      { key: 'Sistema', val: 'Softspring + ComfortPlus' },
    ],
    urls: [
      'https://www.minuanodecor.com.br/medias/products/584_produto-galeriaprancheta-9.png',
      'https://www.minuanodecor.com.br/medias/products/745_produto-galeriaprancheta-11.png',
      'https://www.minuanodecor.com.br/medias/products/663_produto-galeriaprancheta-12.png',
      'https://www.minuanodecor.com.br/medias/products/170_produto-galeriaprancheta-10.png',
      'https://www.minuanodecor.com.br/medias/products/339_produto-galeriaprancheta-13.png',
      'https://www.minuanodecor.com.br/medias/products/lrlpeksq0u8vwag.jpg',
    ],
  },
  {
    id: 'minuano-pietro',
    nome: 'Sofá Pietro',
    tipo: 'sofa',
    badge: 'Sofá',
    fornecedor: 'minuano',
    pasta: 'imagens/minuano',
    prefix: 'pietro',
    tagline: 'Assento retrátil · Reclinável · Suporte lombar',
    descricao: 'Robustez e elegância com assento retrátil e encosto reclinável para conforto excepcional. Suporte lombar e tecnologia ComfortPlus para o bem-estar de toda a família.',
    specs: [
      { key: 'Assento', val: 'Retrátil' },
      { key: 'Encosto', val: 'Reclinável' },
      { key: 'Sistema', val: 'SoftSpring + ComfortPlus' },
    ],
    urls: [
      'https://www.minuanodecor.com.br/medias/products/509_produto-galeriaprancheta-4.png',
      'https://www.minuanodecor.com.br/medias/products/908_produto-galeriaprancheta-3.png',
      'https://www.minuanodecor.com.br/medias/products/sofa-pietro-estonado-amarula-minuano-estofados-2.jpg',
      'https://www.minuanodecor.com.br/medias/products/sofa-pietro-estonado-amarula-minuano-estofados-1.jpg',
    ],
  },
  {
    id: 'salva-anis',
    nome: 'Sofá Anis',
    tipo: 'sofa',
    badge: 'Sofá',
    fornecedor: 'salva',
    pasta: 'imagens/salva',
    prefix: 'anis',
    tagline: 'Pés em metal · Design contemporâneo · Couro e tecido',
    descricao: 'Proporções bem definidas com estrutura de pés em metal. Linhas contemporâneas que unem metal e couro em uma peça sofisticada e única.',
    specs: [
      { key: 'Pés', val: 'Metal' },
      { key: 'Revestimento', val: 'Couro ou tecido' },
    ],
    urls: [
      'https://salvamobiliario.com.br/medias/products/ox285kem7vpcteg.jpg',
    ],
  },
  {
    id: 'salva-poente',
    nome: 'Sofá Poente',
    tipo: 'sofa',
    badge: 'Sofá',
    fornecedor: 'salva',
    pasta: 'imagens/salva',
    prefix: 'poente',
    tagline: 'Pés em madeira · Leveza visual · Design sereno',
    descricao: 'Design contemporâneo de linhas simples e elegância serena. Elevado do chão, ganha leveza visual enquanto os pés em madeira sustentam a forma com sofisticação discreta.',
    specs: [
      { key: 'Pés', val: 'Madeira' },
      { key: 'Revestimento', val: 'Couro ou tecido' },
    ],
    urls: [
      'https://salvamobiliario.com.br/medias/abouts/meko4lrt9nap0gq.jpg',
    ],
  },
];

function wppLink(nome) {
  return WPP + encodeURIComponent(nome) + '.%20Pode%20me%20enviar%20mais%20informa%C3%A7%C3%B5es%3F';
}

function escAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function gerarCard(p, imgsPaths) {
  const specsJson = JSON.stringify(p.specs).replace(/'/g, '&#39;');
  const imgsJson  = JSON.stringify(imgsPaths);
  const descEsc   = escAttr(p.descricao);
  const wpp       = wppLink(p.nome);
  return `          <article class="cat-card" data-tipo="${p.tipo}" data-id="${p.id}" data-fornecedor="${p.fornecedor}"
            data-imgs='${imgsJson}'
            data-wpp="${wpp}"
            data-specs='${specsJson}'
            data-description="${descEsc}">
            <figure class="cat-card__fig" data-nome="${p.nome}">
              <img src="${imgsPaths[0]}" alt="${p.nome} — CSM Decor" loading="lazy" />
              <span class="cat-card__badge">${p.badge}</span>
            </figure>
            <div class="cat-card__body">
              <h2 class="cat-card__name">${p.nome}</h2>
              <p class="cat-card__tagline">${p.tagline}</p>
              <button type="button" class="btn btn--primary btn--sm cat-card__cta"
                onclick="navigateToProduct(this.closest('.cat-card'))">
                Ver Produto
              </button>
            </div>
          </article>`;
}

async function baixar(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function normalizar(buf, dest) {
  await sharp(buf)
    .resize(600, 600, { fit: 'contain', position: 'centre', background: BG })
    .jpeg({ quality: 88 })
    .toFile(dest);
}

async function main() {
  let html = fs.readFileSync(HTML, 'utf8');
  const cardsNovos = [];

  for (const p of NOVOS) {
    console.log(`\n── ${p.nome} ──`);
    const pastaAbs = path.join(BASE, p.pasta);
    if (!fs.existsSync(pastaAbs)) fs.mkdirSync(pastaAbs, { recursive: true });

    // Verifica se já existe no HTML
    if (html.includes(`data-id="${p.id}"`)) {
      console.log('  → já existe na loja, pulando.');
      continue;
    }

    const imgsSalvas = [];
    for (let i = 0; i < p.urls.length; i++) {
      const destNome = `${p.prefix}-${i + 1}.jpg`;
      const destAbs  = path.join(pastaAbs, destNome);
      const destRel  = `${p.pasta}/${destNome}`;
      process.stdout.write(`  [${i + 1}/${p.urls.length}] ${destNome} ... `);
      try {
        const buf = await baixar(p.urls[i]);
        await normalizar(buf, destAbs);
        imgsSalvas.push(destRel);
        console.log('✓');
      } catch (e) {
        console.log(`✗ (${e.message})`);
      }
    }

    if (imgsSalvas.length === 0) {
      console.log('  → sem imagens, card não gerado.');
      continue;
    }

    cardsNovos.push(gerarCard(p, imgsSalvas));
    console.log(`  → card gerado com ${imgsSalvas.length} foto(s).`);
  }

  if (cardsNovos.length === 0) {
    console.log('\nNenhum card novo para injetar.');
    return;
  }

  // Injeta antes do fechamento do catalogo__grid (antes do cat-empty)
  const marker = '        </div>\r\n\r\n        <div class="cat-empty"';
  const idx = html.lastIndexOf(marker);
  if (idx === -1) { console.error('Marcador de injeção não encontrado!'); return; }

  const injecao = '\r\n          <!-- NOVOS FORNECEDORES -->\r\n' + cardsNovos.join('\r\n') + '\r\n                    <!-- FIM NOVOS FORNECEDORES -->\r\n';
  html = html.slice(0, idx) + injecao + html.slice(idx);
  fs.writeFileSync(HTML, html, 'utf8');

  console.log(`\n✅ ${cardsNovos.length} produto(s) injetado(s) em produtos.html`);
}

main().catch(console.error);
