# Barra de Navegação Mobile (Pill Nav)

Barra flutuante em formato de pílula, visível apenas em mobile (≤640px).
Posicionada 16px acima do rodapé, centralizada, com 44px de margem lateral.

## Opções atuais

| # | Item | Ação |
|---|---|---|
| 1 | Início | Vai para `index.html` |
| 2 | Produtos | Vai para `produtos.html` |
| 3 | Favoritos | Vai para `moodboard.html` — mostra badge com a contagem de favoritos salvos |
| 4 | Entrar / Conta | Deslogado: abre modal de login. Logado: vai para `perfil.html` com avatar + pronome + nome |

O badge de Favoritos lê `localStorage['csm-moodboard']` e se atualiza:
- ao carregar a página;
- ao salvar/remover um favorito (via `window.updatePillFavBadge`, chamado pelo `updateBadge` do moodboard em `produtos.html`);
- entre abas, via evento `storage`.

## FAB (botão flutuante)

Alterna automaticamente entre **WhatsApp** e **Instagram** a cada 2,5s.
- WhatsApp = estado inicial (fundo verde `#25D366`, classe `.is-whatsapp`), abre `wa.me`.
- Instagram = fundo gradiente padrão, abre o perfil.
Clique longo abre mini-menu com os dois botões.

Definido em `index.html` e `produtos.html` (HTML do menu + JS do array `plataformas`).
Estilos em `style.css`: `.contato-fab-unico.is-whatsapp`, `.fab-menu-item.whatsapp`.
