# Tracking — CSM Decor

## O que está instalado

| Ferramenta | ID | Onde fica |
|---|---|---|
| Google Tag Manager | `GTM-N3MFXFVX` | `tracking.js` + noscript em cada `<body>` |
| Google Analytics 4 | `G-B4GDQYVER5` | `tracking.js` |
| Meta Pixel | `1423896282913241` | `tracking.js` + noscript em cada `<body>` |

Todas as páginas principais carregam `/tracking.js` no `<head>`:
`index.html`, `produtos.html`, `produto.html`, `perfil.html`, `fale-conosco.html`, `termos.html`, `privacidade.html`

---

## ⚠️ Aviso importante para a agência — Dupla contagem do GA4

### Explicação didática

Imagine que você contratou dois contadores para registrar quantas pessoas entram na sua loja.
O **GA4 direto** é o primeiro contador — fica na porta registrando cada visita.
O **GTM** é o gerente que coordena tudo. Se a agência também configurou um GA4 *dentro do GTM*, você tem agora **dois contadores fazendo o mesmo trabalho** — e cada visita vai aparecer contada **duas vezes** nos relatórios.

**Como resolver:** escolha uma das duas opções:
- **Opção A (recomendada):** remova o GA4 de dentro do GTM e deixe só o que já está no `tracking.js`
- **Opção B:** remova o GA4 do `tracking.js` e deixe o GTM gerenciar tudo — inclusive o GA4

O GTM sozinho já é capaz de gerenciar o GA4. Não precisam dos dois ao mesmo tempo.

---

### Explicação técnica

O `tracking.js` carrega o GA4 de **duas formas simultâneas**:

1. **Diretamente** — cria um elemento `<script async src="https://www.googletagmanager.com/gtag/js?id=G-B4GDQYVER5">` e inicializa via `gtag('config', 'G-B4GDQYVER5')`
2. **Via GTM** — o container `GTM-N3MFXFVX` é carregado em seguida; se houver uma tag GA4 configurada nele, ela dispara uma segunda instância para o mesmo `measurement_id`

Ambas as instâncias enviam hits independentes ao endpoint `https://www.google-analytics.com/g/collect`, resultando em **dupla contagem de `page_view` e demais eventos**.

**Solução A — remover GA4 do container GTM:**
No painel do GTM, excluir ou pausar a tag do tipo *Google Analytics: GA4 Configuration* com o ID `G-B4GDQYVER5`.

**Solução B — remover GA4 direto do `tracking.js`:**
Apagar as linhas abaixo de `// Google Analytics 4` no arquivo `tracking.js` (o bloco do script dinâmico + as chamadas `gtag`). O GTM passa a ser a única fonte.

A Solução B é preferível a longo prazo: centraliza todo o gerenciamento de tags no GTM, facilitando adição futura de eventos customizados sem tocar no código do site.
