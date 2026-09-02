# CSM Decor Luxury — README

## Pendências de Fornecedores

### ⚠️ Treviso — aguardando seleção de produtos

O fornecedor Treviso enviou apenas **links de categoria** (não de produtos específicos).
Não foi possível importar sem saber quais modelos a Silvana quer.

**O que fazer:**
1. Silvana acessa o site da Treviso e seleciona os produtos específicos desejados
2. Envia os links de **produto individual** (não de categoria)
3. Verificar se há API WooCommerce disponível: `https://[dominio]/wp-json/wc/store/v1/products`
4. Criar script `baixar-imagens-treviso.js` + `importar-treviso.js` seguindo o padrão dos outros fornecedores

---

### ⚠️ Daf — site Wix sem dados de produto acessíveis

O site da Daf é construído em **Wix**, que não expõe API pública nem permite scraping
eficiente das páginas de produto.

**O que fazer:**
1. Coletar imagens e dados (nome, dimensões, specs) manualmente pelo site ou pelo catálogo da Daf
2. Adicionar os produtos ao arquivo `importar-novos-manual.js` na lista `PRODUCTS`
3. Adicionar imagens ao script `baixar-imagens-novos.js`
4. Rodar os dois scripts na ordem usual

---

### ⚠️ Suprema S-147 — produto não encontrado no site

Durante a importação (agosto 2025), o produto **S-147** não estava listado no site
`estofadossuprema.com.br`. O modelo mais alto encontrado foi S-124.

**O que fazer:**
1. Verificar com a Silvana se o código S-147 está correto
2. Pode ser um lançamento ainda não publicado no site — verificar novamente em outra data
3. Quando disponível, adicionar ao `importar-novos-manual.js`

---

## Scripts de importação

| Script | Descrição | Quando rodar |
|---|---|---|
| `baixar-imagens-novos.js` | Baixa e normaliza imagens dos fornecedores manuais | Ao adicionar novos fornecedores manuais |
| `importar-novos-manual.js` | Injeta cards manuais no produtos.html | Após baixar imagens |
| `baixar-imagens-ilhabelamoveis.js` | Baixa imagens via API Ilhabelamoveis | Ao adicionar produtos Ilhabelamoveis |
| `importar-ilhabelamoveis.js` | Injeta cards Ilhabelamoveis | Após baixar imagens |
| `baixar-imagens-buriti.js` | Baixa imagens via API Buriti | Ao adicionar produtos Buriti |
| `importar-buriti.js` | Injeta cards Buriti | Após baixar imagens |
| `gerar-catalogo.js` | Gera produtos CSM a partir da API | Ao adicionar produtos CSM |
| `baixar-imagens-ideale.js` | Baixa imagens via API Ideale | Ao adicionar produtos Ideale |
| `importar-ideale.js` | Injeta cards Ideale | Após baixar imagens |

## Estratégia Google — onde paramos (01/09/2026)

### Contexto
O site não trabalha com preços fixos — opera por **orçamento**. Por isso, **Google Shopping não serve** (exige preço numérico obrigatório).

### Estratégia decidida: Rich Snippets + Google Business Profile

**1. Rich Snippets (Google Search)**
- Adicionar marcação Schema.org (JSON-LD) nas páginas de produto
- Produtos aparecem na busca normal com foto, nome e descrição em destaque
- Não exige preço — funciona perfeitamente com modelo de orçamento
- Atrai cliente que já está pesquisando o produto específico

**2. Google Business Profile**
- Cadastrar/atualizar a loja com fotos dos produtos
- Aparece no Google Maps e na busca local ("loja de sofás perto de mim")
- Gratuito, sem exigência de preço

### Próximos passos
- [ ] Implementar Schema.org nos cards de produto do `produtos.html`
- [ ] Criar script que gera o JSON-LD automaticamente para cada produto
- [ ] Atualizar Google Business Profile com fotos atuais da loja

### Por que não Google Shopping?
O WooCommerce (`csmdecor.com.br/wsite`) está muito desatualizado em relação ao site estático — muitos produtos foram removidos, muitos adicionados, e ainda há mais a publicar. Gerar feed a partir do WooCommerce seria impreciso. Gerar feed a partir do `produtos.html` é viável, mas sem preço o Google rejeita os produtos no Shopping.

---

## Badge "Novo"

Todos os produtos importados nesta rodada (agosto 2025) têm o badge verde **"Novo"**
no canto superior direito do card. Isso permite identificar visualmente quais chegaram.

Para remover o badge após conferência, editar os cards correspondentes em `produtos.html`
e deletar a linha `<span class="cat-card__novo">Novo</span>` de cada um.
