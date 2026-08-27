import { pdf } from 'pdf-to-img';
import { writeFileSync, unlinkSync } from 'fs';
import sharp from 'sharp';

const PDF = 'Cat (1).pdf';
const OUT = 'imagens/artecouro2';

// Páginas de foto principal de cada produto
// topPct: corta cabeçalho (nome + logo), cropBottom: remove rodapé com branding
const FOTOS_PRINCIPAIS = [
  { pagina: 8,  nome: 'bora',    topPct: 0.27, cropBottom: 1.00 },
  { pagina: 40, nome: 'haero',   topPct: 0.27, cropBottom: 1.00 },
  { pagina: 48, nome: 'madri',   topPct: 0.27, cropBottom: 1.00 },
  { pagina: 50, nome: 'madson',  topPct: 0.27, cropBottom: 1.00 },
  { pagina: 56, nome: 'mood',    topPct: 0.18, cropBottom: 0.82 }, // "MOOD" centralizado + artecouro rodapé
  { pagina: 66, nome: 'poli',    topPct: 0.27, cropBottom: 1.00 },
  { pagina: 90, nome: 'urbi',    topPct: 0.22, cropBottom: 0.82 }, // artecouro rodapé
];

// Páginas de specs — foto do produto fica entre os labels de Braços/Pés e os desenhos de dimensão
const FOTOS_LATERAIS = [
  { pagina: 9,  nome: 'bora-lateral',   topPct: 0.52, hPct: 0.21 },
  { pagina: 41, nome: 'haero-lateral',  topPct: 0.52, hPct: 0.21 },
  { pagina: 49, nome: 'madri-lateral',  topPct: 0.52, hPct: 0.21 },
  { pagina: 51, nome: 'madson-lateral', topPct: 0.52, hPct: 0.21 },
  { pagina: 57, nome: 'mood-lateral',   topPct: 0.50, hPct: 0.30 }, // mood ok, manter
  { pagina: 67, nome: 'poli-lateral',   topPct: 0.52, hPct: 0.21 },
  { pagina: 91, nome: 'urbi-lateral',   topPct: 0.52, hPct: 0.21 },
];

const desejadas = new Set([
  ...FOTOS_PRINCIPAIS.map(p => p.pagina),
  ...FOTOS_LATERAIS.map(p => p.pagina),
]);
const mapaP  = Object.fromEntries(FOTOS_PRINCIPAIS.map(p => [p.pagina, p]));
const mapaL  = Object.fromEntries(FOTOS_LATERAIS.map(p => [p.pagina, p]));

const BG = { r: 242, g: 237, b: 232, alpha: 1 }; // #f2ede8

console.log('Extraindo imagens do Cat (1).pdf...\n');
const doc = await pdf(PDF, { scale: 3 });

let i = 0;
for await (const page of doc) {
  i++;
  if (!desejadas.has(i)) continue;

  const tmp = `${OUT}/tmp-${i}.png`;
  writeFileSync(tmp, page);
  const { width: W, height: H } = await sharp(tmp).metadata();

  if (mapaP[i]) {
    const cfg = mapaP[i];
    const top    = Math.round(H * cfg.topPct);
    const height = Math.round(H * cfg.cropBottom) - top;
    await sharp(tmp)
      .extract({ left: 0, top, width: W, height })
      .resize(600, 600, { fit: 'contain', position: 'centre', background: BG })
      .jpeg({ quality: 88 })
      .toFile(`${OUT}/${cfg.nome}-600.jpg`);
    console.log(`  ✔ ${cfg.nome}-600.jpg`);
  }

  if (mapaL[i]) {
    const cfg = mapaL[i];
    const top    = Math.round(H * cfg.topPct);
    const height = Math.round(H * cfg.hPct);
    await sharp(tmp)
      .extract({ left: 0, top, width: W, height })
      .resize(600, 600, { fit: 'contain', position: 'centre', background: BG })
      .jpeg({ quality: 88 })
      .toFile(`${OUT}/${cfg.nome}-600.jpg`);
    console.log(`  ✔ ${cfg.nome}-lateral-600.jpg`);
  }

  unlinkSync(tmp);
}

console.log('\n✅ Concluído!');
