# CSM Decor Luxury — Instruções para Claude

## Stack
Site estático (HTML/CSS/JS) + WordPress/WooCommerce como CMS em `csmdecor.com.br/wsite`.
Sem framework frontend. Node.js só para scripts de geração/importação.

## Scripts principais

| Script | O que faz | Quando rodar |
|---|---|---|
| `gerar-catalogo.js` | Puxa produtos da API CSM e gera `produtos.html` | Ao adicionar produtos CSM |
| `baixar-imagens-ideale.js` | Baixa e normaliza imagens da Ideale para 600×600 | Antes de importar novos produtos Ideale |
| `importar-ideale.js` | Injeta produtos Ideale no `produtos.html` | Após baixar imagens |

**Ordem obrigatória para importar produtos Ideale:**
```
node baixar-imagens-ideale.js
node importar-ideale.js
```

## Padrão de importação de fornecedores

### Por que baixar e normalizar as imagens antes de importar?

Fotos de fornecedores têm proporções inconsistentes (portrait, landscape, etc).
O CSS do site usa `object-fit: cover` num container landscape (260px alto).
Imagens portrait ficam cortadas; imagens landscape ficam mal enquadradas.

**Solução consolidada:** sempre normalizar para **600×600 JPEG com `sharp`**:
```js
sharp(buffer).resize(600, 600, {
  fit: 'contain',      // produto inteiro, sem corte
  position: 'centre',  // centralizado
  background: { r: 242, g: 237, b: 232, alpha: 1 } // #f2ede8
}).jpeg({ quality: 88 })
```

Isso garante: produto inteiro + centralizado + margem de respiro embutida.
Com a imagem já quadrada e centrada, o `object-fit: cover` do CSS funciona corretamente.

### Cards de fornecedores externos

Todo card de fornecedor externo deve ter `data-fornecedor="nome"` no `<article>`.
O CSS em `style.css` já tem regra para `data-fornecedor="ideale"` com fundo #f2ede8.
Para novo fornecedor, adicionar regra similar.

### Ponto de injeção no produtos.html

Cards devem ser inseridos **dentro** do `<div class="catalogo__grid">`, antes do seu `</div>` de fechamento.
**Nunca** inserir depois do `</div>` do grid (fica fora do layout e quebra os cards).

O `importar-ideale.js` já faz isso corretamente via `lastIndexOf('        </div>', emptyIdx)`.

### Botão dos cards

Sempre usar `navigateToProduct()`, nunca `openProductModal()`:
```html
<button onclick="navigateToProduct(this.closest('.cat-card'))">Ver Produto</button>
```

## Fornecedores mapeados

### Ideale Estofados
- **API:** `https://idealeestofados.com.br/wp-json/wc/store/v1/products` (pública, sem auth)
- **Produtos ativos:** 12 slugs em `importar-ideale.js` → `TARGET_SLUGS`
- **Imagens locais:** `imagens/ideale/` + mapa em `ideale-imagens-locais.json`
- **Categorias:** Sofá → `sofa`, Poltronas → `poltrona`, Banco/Puff → `complemento`

## Para adicionar novos produtos da Ideale
1. Adicionar o slug do produto em `TARGET_SLUGS` no `importar-ideale.js`
2. Rodar `node baixar-imagens-ideale.js` (baixa só os novos)
3. Rodar `node importar-ideale.js`

## Para adicionar novo fornecedor
1. Verificar se o site tem API exposta (`/wp-json/wc/store/v1/products` para WooCommerce)
2. Criar `baixar-imagens-FORNECEDOR.js` seguindo o padrão do `baixar-imagens-ideale.js`
3. Criar `importar-FORNECEDOR.js` seguindo o padrão do `importar-ideale.js`
4. Adicionar CSS para `data-fornecedor="FORNECEDOR"` no `style.css`
