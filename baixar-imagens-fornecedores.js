// Baixa imagens dos fornecedores, normaliza para 600x600 e atualiza produtos.html
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const BASE = process.cwd();
const HTML = path.join(BASE, 'produtos.html');
const BG = { r: 242, g: 237, b: 232, alpha: 1 }; // #f2ede8

const PRODUTOS = [
  {
    id: 'novos-carmem',
    prefix: 'carmem',
    pasta: 'imagens/novos',
    urls: [
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/carmen-2.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/carmen-2-1.jpg',
    ],
  },
  {
    id: 'novos-jow',
    prefix: 'jow',
    pasta: 'imagens/novos',
    // Tenta baixar jow-1 até jow-6 do servidor do fornecedor
    urls: [
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/jow-1.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/jow-2.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/jow-3.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/jow-4.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/jow-5.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/jow-6.jpg',
    ],
  },
  {
    id: 'novos-roy',
    prefix: 'roy',
    pasta: 'imagens/novos',
    urls: [
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/roy-1-1.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/roy-1-1-1.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/roy-1-1-2.jpg',
      'https://estofadosklassic.com.br/wp-content/uploads/2024/09/roy-2.jpg',
    ],
  },
  {
    id: 'novos-ankur',
    prefix: 'ankur',
    pasta: 'imagens/novos',
    urls: [
      'https://karams.com.br/wp-content/uploads/2025/06/Ankur-sombra-diagonal-scaled.jpg',
      'https://karams.com.br/wp-content/uploads/2025/06/Ankur-sombra-diagonal-2-scaled.jpg',
    ],
  },
  {
    id: 'novos-bea',
    prefix: 'bea',
    pasta: 'imagens/novos',
    urls: [
      'https://karams.com.br/wp-content/uploads/2024/04/bea-1.jpg',
      'https://karams.com.br/wp-content/uploads/2024/04/bea-2.jpg',
      'https://karams.com.br/wp-content/uploads/2024/04/bea-3.jpg',
      'https://karams.com.br/wp-content/uploads/2024/04/bea-4.jpg',
    ],
  },
  {
    id: 'novos-aloha',
    prefix: 'aloha',
    pasta: 'imagens/novos',
    urls: [
      'https://karams.com.br/wp-content/uploads/2025/08/aloha-frontal.jpg',
      'https://karams.com.br/wp-content/uploads/2025/08/aloha-diagonal.jpg',
    ],
  },
  {
    id: 'novos-marajo',
    prefix: 'marajo',
    pasta: 'imagens/novos',
    urls: [
      'https://goldlinehome.com.br/wp-content/uploads/2025/05/marajo-1.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/05/marajo-2.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/05/marajo-3.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/05/marajo-4.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/05/marajo-5.jpg',
    ],
  },
  {
    id: 'novos-planura',
    prefix: 'planura',
    pasta: 'imagens/novos',
    urls: [
      'https://goldlinehome.com.br/wp-content/uploads/2025/04/planura-1.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/04/planura-2.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/04/planura-3.jpg',
      'https://goldlinehome.com.br/wp-content/uploads/2025/04/planura-4.jpg',
    ],
  },
  {
    id: 'novos-venus2',
    prefix: 'venus2',
    pasta: 'imagens/novos',
    urls: [
      'https://serragauchaestofados.com.br/wp-content/uploads/2025/12/PRODUTOS-Living11-1920x1080.jpg',
      'https://serragauchaestofados.com.br/wp-content/uploads/2025/12/PRODUTOS-Living12-1920x1080.jpg',
      'https://serragauchaestofados.com.br/wp-content/uploads/2025/12/PRODUTOS-Living10-1920x1080.jpg',
      'https://serragauchaestofados.com.br/wp-content/uploads/2025/12/Venus-1920x1080.jpg',
    ],
  },
  {
    id: 'buriti-9130',
    prefix: 'sonata',
    pasta: 'imagens/buriti',
    urls: [
      'https://estofadosburiti.com.br/wp-content/uploads/2025/05/Sonata-356-Frente-scaled.jpg',
      'https://estofadosburiti.com.br/wp-content/uploads/2025/05/Sonata-356-Perspectiva-scaled.jpg',
      'https://estofadosburiti.com.br/wp-content/uploads/2025/05/Sonata-356-Posterior-scaled.jpg',
      'https://estofadosburiti.com.br/wp-content/uploads/2025/05/Sonata-356-Lateral-scaled.jpg',
      'https://estofadosburiti.com.br/wp-content/uploads/2025/05/Sonata-356-Det-scaled.jpg',
      'https://estofadosburiti.com.br/wp-content/uploads/2025/05/Ambiente-Sonata-356-Vista-02.jpg',
      'https://estofadosburiti.com.br/wp-content/uploads/2025/05/Ambiente-Sonata-356-Vista-01.jpg',
    ],
  },
  {
    id: 'ilhabelamoveis-13067',
    prefix: 'ib729-sofa-cosmopolitan-soft',
    pasta: 'imagens/ilhabelamoveis',
    urls: [
      'https://ilhabelamoveis.com.br/wp-content/uploads/2024/06/Ilha-bela4906-copiar.webp',
      'https://ilhabelamoveis.com.br/wp-content/uploads/2024/06/Ilha-bela4917-copiar.webp',
      'https://ilhabelamoveis.com.br/wp-content/uploads/2024/06/Ilha-bela4921-copiar.webp',
      'https://ilhabelamoveis.com.br/wp-content/uploads/2024/06/Ilha-bela4927-copiar.webp',
    ],
  },
];

async function baixarImagem(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function normalizar(buffer, destino) {
  await sharp(buffer)
    .resize(600, 600, { fit: 'contain', position: 'centre', background: BG })
    .jpeg({ quality: 88 })
    .toFile(destino);
}

function atualizarDataImgs(html, id, caminhos) {
  const novoAttr = `data-imgs='${JSON.stringify(caminhos)}'`;
  // Regex que encontra o data-imgs do article com o data-id correto
  const regex = new RegExp(
    `(<article[^>]*data-id="${id}"[^>]*?)data-imgs='[^']*'`,
    's'
  );
  if (!regex.test(html)) {
    // Tenta ordem inversa (data-id pode vir depois de outros atributos)
    const regex2 = new RegExp(
      `(data-id="${id}"[^>]*?)data-imgs='[^']*'`,
      's'
    );
    return html.replace(regex2, `$1${novoAttr}`);
  }
  return html.replace(regex, `$1${novoAttr}`);
}

async function main() {
  let html = fs.readFileSync(HTML, 'utf8');
  let totalBaixadas = 0;
  let totalErros = 0;

  for (const produto of PRODUTOS) {
    console.log(`\n── ${produto.id} ──`);
    const pastaAbs = path.join(BASE, produto.pasta);
    if (!fs.existsSync(pastaAbs)) fs.mkdirSync(pastaAbs, { recursive: true });

    const caminhosSalvos = [];

    for (let i = 0; i < produto.urls.length; i++) {
      const url = produto.urls[i];
      const destNome = `${produto.prefix}-${i + 1}.jpg`;
      const destAbs  = path.join(pastaAbs, destNome);
      const destRel  = `${produto.pasta}/${destNome}`;

      try {
        process.stdout.write(`  [${i + 1}/${produto.urls.length}] ${destNome} ... `);
        const buffer = await baixarImagem(url);
        await normalizar(buffer, destAbs);
        caminhosSalvos.push(destRel);
        totalBaixadas++;
        console.log('✓');
      } catch (e) {
        totalErros++;
        console.log(`✗ (${e.message})`);
      }
    }

    if (caminhosSalvos.length > 0) {
      html = atualizarDataImgs(html, produto.id, caminhosSalvos);
      console.log(`  → data-imgs atualizado: ${caminhosSalvos.length} fotos`);
    }
  }

  fs.writeFileSync(HTML, html, 'utf8');
  console.log(`\n✅ Concluído: ${totalBaixadas} fotos baixadas, ${totalErros} erros`);
  console.log('   produtos.html atualizado.');
}

main().catch(console.error);
