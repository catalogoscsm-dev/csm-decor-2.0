'use strict';
/**
 * aplicar-modelos-3d.js
 * Lê modelos-3d-map.json e atualiza produtos.html:
 *   - Adiciona data-glb="modelos-3d/<slug>.glb" em cada card que tem modelo gerado
 *   - Adiciona model-viewer dentro do modal do catálogo
 *   - Adiciona botão "Ver em 3D" no modal que abre o viewer
 *
 * Execute APÓS gerar-modelos-3d.js:
 *   node aplicar-modelos-3d.js
 */

const fs   = require('fs');
const path = require('path');

const MAP_FILE    = path.join(__dirname, 'modelos-3d-map.json');
const HTML_IN     = path.join(__dirname, 'produtos.html');
const HTML_OUT    = path.join(__dirname, 'produtos.html');

// ── Carrega mapeamento ────────────────────────────────────────────────────────
function loadMapping() {
  if (!fs.existsSync(MAP_FILE)) {
    console.error('❌ modelos-3d-map.json não encontrado.');
    console.error('   Execute primeiro: node gerar-modelos-3d.js');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
}

// ── Adiciona data-glb nos cards ───────────────────────────────────────────────
function applyGlbToCards(html, mapping) {
  let count = 0;

  for (const [id, info] of Object.entries(mapping)) {
    if (!info.path) continue;

    const marker = `data-id="${id}"`;
    const idx = html.indexOf(marker);
    if (idx === -1) continue;

    // Verifica se data-glb já existe próximo ao marker
    const nearby = html.slice(Math.max(0, idx - 20), idx + marker.length + 20);
    if (nearby.includes('data-glb=')) continue;

    // Insere data-glb logo após data-id="<id>"
    const insert = ` data-glb="${info.path}"`;
    html = html.slice(0, idx + marker.length) + insert + html.slice(idx + marker.length);
    count++;
  }

  return { html, count };
}

// ── Injeta model-viewer no modal (se ainda não existir) ───────────────────────
const MV_SCRIPT_TAG = `<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"></script>`;

const MV_MODAL_HTML = `
      <!-- Viewer 3D dentro do modal (ativado via botão) -->
      <div id="cat-modal-3d" class="cat-modal__3d-wrap" hidden>
        <model-viewer
          id="cat-modal-mv"
          camera-controls
          auto-rotate
          auto-rotate-delay="2000"
          rotation-per-second="14deg"
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="auto"
          shadow-intensity="1.2"
          shadow-softness="0.5"
          environment-image="neutral"
          exposure="1.1"
          tone-mapping="commerce"
          reveal="auto"
          interaction-prompt="none"
          style="width:100%;height:340px;background:#111;display:block;"
        >
          <button slot="ar-button" class="ar-modal__ar-btn ar-modal__ar-btn--inline">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            Ver no ambiente
          </button>
        </model-viewer>
        <p style="text-align:center;font-family:var(--font-sans);font-size:.52rem;color:rgba(255,255,255,.3);letter-spacing:.08em;margin-top:.5rem;">
          Arraste para girar · Pinça para zoom
        </p>
      </div>
      <button id="cat-modal-3d-btn" class="cat-modal__3d-toggle" hidden>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
        Ver em 3D
      </button>`;

const MV_CSS = `
/* ── Modal catálogo — viewer 3D ── */
.cat-modal__3d-wrap {
  margin: .75rem 0;
  border-radius: 2px;
  overflow: hidden;
  background: #0d0d0d;
}
.cat-modal__3d-toggle {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  margin: .5rem 0 .75rem;
  background: rgba(240,120,0,.08);
  border: 1px solid rgba(240,120,0,.35);
  color: var(--orange);
  font-family: var(--font-sans);
  font-size: .6rem;
  font-weight: 600;
  letter-spacing: .14em;
  text-transform: uppercase;
  padding: .5rem 1rem;
  cursor: pointer;
  transition: background .2s, border-color .2s;
}
.cat-modal__3d-toggle:hover {
  background: rgba(240,120,0,.15);
  border-color: var(--orange);
}
.cat-modal__3d-toggle.is-open {
  background: rgba(240,120,0,.15);
  color: var(--orange);
}`;

// JS injetado como script standalone no final do body
const MV_JS = `
  (function () {
    var btn3d  = document.getElementById('cat-modal-3d-btn');
    var wrap3d = document.getElementById('cat-modal-3d');
    var mv     = document.getElementById('cat-modal-mv');
    if (!btn3d || !wrap3d || !mv) return;

    var SVG_OPEN  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>';
    var LABEL_VER = SVG_OPEN + ' Ver em 3D';
    var LABEL_FECH = SVG_OPEN + ' Fechar 3D';

    // Botão toggle abre/fecha o viewer
    btn3d.addEventListener('click', function () {
      if (!wrap3d.hidden) {
        wrap3d.hidden = true;
        mv.removeAttribute('src');
        btn3d.classList.remove('is-open');
        btn3d.innerHTML = LABEL_VER;
      } else {
        var glb = btn3d.dataset.glb;
        if (!glb) return;
        mv.setAttribute('src', glb);
        wrap3d.hidden = false;
        btn3d.classList.add('is-open');
        btn3d.innerHTML = LABEL_FECH;
      }
    });

    // Reset ao fechar o modal
    document.querySelectorAll('.modal__close').forEach(function (c) {
      c.addEventListener('click', function () {
        wrap3d.hidden = true;
        mv.removeAttribute('src');
        btn3d.classList.remove('is-open');
        btn3d.innerHTML = LABEL_VER;
      });
    });
  }());`;

function injectModalComponents(html) {
  let changed = false;

  // 1. Script model-viewer no <head>
  if (!html.includes('model-viewer.min.js')) {
    html = html.replace('</head>', `  ${MV_SCRIPT_TAG}\n</head>`);
    changed = true;
  }

  // 2. HTML do viewer + botão antes do CTA WhatsApp
  const modalInsertMarker = '<a id="modal-wpp-btn"';
  if (!html.includes('cat-modal-3d') && html.includes(modalInsertMarker)) {
    html = html.replace(modalInsertMarker, `${MV_MODAL_HTML}\n      ${modalInsertMarker}`);
    changed = true;
  }

  // 3. CSS no final do último </style>
  if (!html.includes('cat-modal__3d-wrap') && html.includes('</style>')) {
    const lastStyle = html.lastIndexOf('</style>');
    html = html.slice(0, lastStyle) + MV_CSS + '\n' + html.slice(lastStyle);
    changed = true;
  }

  // 4. Injeta lógica 3D diretamente dentro de openProductModal (antes do openModal)
  //    Passa o data-glb do card para o botão, mostrando-o apenas se o modelo existir
  const fnMarker = "openModal('modal-produto');";
  const inject3d = `var _b3=document.getElementById('cat-modal-3d-btn'); var _w3=document.getElementById('cat-modal-3d'); var _m3=document.getElementById('cat-modal-mv'); if(_w3){_w3.hidden=true;} if(_m3){_m3.removeAttribute('src');} if(_b3){var _g=card.dataset.glb||''; _b3.dataset.glb=_g; _b3.hidden=!_g; _b3.classList.remove('is-open'); _b3.innerHTML='<svg width=\\'13\\' height=\\'13\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><path d=\\'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z\\'/></svg> Ver em 3D';} `;

  if (!html.includes('_b3=document.getElementById') && html.includes(fnMarker)) {
    html = html.replace(fnMarker, inject3d + fnMarker);
    changed = true;
  }

  // 5. Script standalone do toggle (antes de </body>)
  const jsMarker = '/* csm-3d-toggle-injected */';
  if (!html.includes(jsMarker) && html.includes('</body>')) {
    html = html.replace('</body>', `<script>${jsMarker}\n${MV_JS}\n  </script>\n</body>`);
    changed = true;
  }

  return { html, changed };
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  CSM Decor — Aplicar Modelos 3D ao Site');
  console.log('══════════════════════════════════════════════════\n');

  const mapping = loadMapping();
  const total   = Object.keys(mapping).length;
  console.log(`📋 ${total} modelos no mapeamento\n`);

  if (!fs.existsSync(HTML_IN)) {
    console.error('❌ produtos.html não encontrado. Rode primeiro: node gerar-catalogo.js');
    process.exit(1);
  }

  let html = fs.readFileSync(HTML_IN, 'utf8');

  // Aplica data-glb nos cards
  const { html: html2, count: cardsAtualiz } = applyGlbToCards(html, mapping);

  // Injeta componentes do modal
  const { html: html3, changed: modalChanged } = injectModalComponents(html2);

  fs.writeFileSync(HTML_OUT, html3, 'utf8');

  console.log(`✅ Cards atualizados com data-glb : ${cardsAtualiz}`);
  console.log(`✅ Componentes 3D no modal        : ${modalChanged ? 'injetados' : 'já existiam'}`);
  console.log(`\n📄 produtos.html atualizado`);
  console.log(`\n🚀 Próximo passo:`);
  console.log(`   git add -A && git commit -m "feat: modelos 3D em ${cardsAtualiz} produtos" && git push`);
  console.log(`   (ou: node aplicar-modelos-3d.js → peça ao Claude para subir ao GitHub)\n`);
}

main();
