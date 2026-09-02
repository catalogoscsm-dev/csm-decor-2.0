import { pdf } from 'pdf-to-img';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

// Páginas de capa (foto principal) de cada produto
const PRODUTOS = [
  { nome: 'arraia',    pagina: 6 },
  { nome: 'arraia-2',  pagina: 8 },
  { nome: 'eloah',    pagina: 12 },
  { nome: 'generosa', pagina: 16 },
  { nome: 'oca',      pagina: 36 },
];

mkdirSync('imagens/artecouro', { recursive: true });

const paginasDesejadas = new Set(PRODUTOS.map(p => p.pagina));
const mapaPageProduto = {};
for (const p of PRODUTOS) mapaPageProduto[p.pagina] = p.nome;

console.log('Iniciando renderização do PDF...');
const doc = await pdf('Cat.pdf', { scale: 2 });

let paginaAtual = 0;
for await (const page of doc) {
  paginaAtual++;
  if (!paginasDesejadas.has(paginaAtual)) continue;

  const nome = mapaPageProduto[paginaAtual];
  const outPath = `imagens/artecouro/${nome}.png`;
  writeFileSync(outPath, page);
  console.log(`Página ${paginaAtual} → ${outPath} (${Math.round(page.length / 1024)}KB)`);
}

console.log('\nConcluído!');
