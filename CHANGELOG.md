# CSM Decor — Histórico de Atualizações

## 2026-09-24 — Migração para domínio oficial + Mobile completo

### Domínio e SSL
- Site migrado de `catalogoscsm-dev.github.io` para `csmdecor.com.br`
- HTTPS ativado via GitHub Pages (Let's Encrypt automático)
- CNAME configurado no repositório

### Imagens dos produtos CSM
- 406 imagens do WordPress (servidor Oryonti) baixadas e commitadas em `imagens/csm/`
- `produtos.html` atualizado para servir todas as imagens localmente
- Site agora é 100% independente do servidor externo

### Adaptações Mobile
- **Bottom Navigation Bar** — barra fixa no rodapé com Início, Produtos, WhatsApp e Contato (≤640px)
- **Modal de produto fullscreen** — abre como bottom sheet ocupando 95% da tela no mobile
- **Filtro de categorias scroll horizontal** — pills em linha única rolável no mobile (produtos.html)
- **FAB compacto no mobile** — botões flutuantes viram ícones sem texto ao abrir
- **FAB ajustado** — apenas Instagram e Facebook no botão flutuante; WhatsApp e Produtos no bottom nav
- **FAB posicionado** acima do bottom nav para não sobrepor
- **Áreas de toque mínimas** de 44px em botões e links
- **touch-action: manipulation** em todos os elementos interativos
- **Stats em 2 colunas** no mobile com destaque ocupando linha inteira
- **Títulos fluidos** com `clamp()` em telas pequenas
- **overflow-x: hidden** nas seções para evitar scroll horizontal

### Performance
- **Preload de fontes** Google adicionado no `index.html`
- **Lazy loading** confirmado em 278/283 imagens de `produtos.html`
- **Vídeo hero** visível em todos os dispositivos (desktop e mobile)

### Infraestrutura
- GitHub Desktop configurado para push com conta `catalogoscsm-dev`
- Scripts de download e localização de imagens criados (`baixar-imagens-csm.js`, `localizar-imagens-csm.js`)
