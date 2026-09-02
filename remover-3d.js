const fs = require('fs');

function read(f) { return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); }
function write(f, s) { fs.writeFileSync(f, s.replace(/\n/g, '\r\n'), 'utf8'); }

// ── index.html ─────────────────────────────────────────────────────────────
let index = read('index.html');

const arStart = index.indexOf('  <!-- ============================================================\n       AR VIEWER MODAL');
const arEnd   = index.indexOf('  <!-- ============================================================\n       TRANSIÇÕES DE PÁGINA');
if (arStart !== -1 && arEnd !== -1) {
  index = index.slice(0, arStart) + index.slice(arEnd);
  console.log('index.html: bloco AR VIEWER removido');
} else {
  console.error('index.html: marcadores não encontrados', { arStart, arEnd });
}
write('index.html', index);

// ── produto.html ────────────────────────────────────────────────────────────
let produto = read('produto.html');

// 1. Remove script model-viewer do <head> (já feito se modelo-viewer não aparece)
if (produto.includes('model-viewer') && produto.includes('ajax.googleapis.com/ajax/libs/model-viewer')) {
  produto = produto.replace(
    /\n  <!-- model-viewer — AR \/ 3D para produtos -->\n  <script type="module" src="[^"]*model-viewer[^"]*"><\/script>/,
    ''
  );
  console.log('produto.html: script model-viewer removido');
}

// 2. Remove bloco gallery-3d-view
const g3dStart = produto.indexOf('              <!-- Vista 3D / AR');
const g3dEnd   = produto.indexOf('\n            <!-- Thumbnails -->');
if (g3dStart !== -1 && g3dEnd !== -1) {
  produto = produto.slice(0, g3dStart) + produto.slice(g3dEnd);
  console.log('produto.html: gallery-3d-view removida');
} else {
  console.error('produto.html: gallery-3d-view não encontrada', { g3dStart, g3dEnd });
}

// 3. Remove tab thumb-3d (entre <!-- Tab 3D / AR --> e o </div> que o fecha)
const thumbStart = produto.indexOf('\n              <!-- Tab 3D / AR -->');
if (thumbStart !== -1) {
  const afterComment = produto.indexOf('</div>', thumbStart + 10);
  const thumbBlockEnd = afterComment + '</div>'.length;
  produto = produto.slice(0, thumbStart) + produto.slice(thumbBlockEnd);
  console.log('produto.html: tab thumb-3d removida');
} else {
  console.error('produto.html: thumb-3d não encontrado');
}

// 4. Remove script AR / 3D Gallery Toggle
const toggleStart = produto.indexOf('\n  <!-- AR / 3D Gallery Toggle -->');
const toggleEnd   = produto.indexOf('\n  <!-- =====', toggleStart + 10);
if (toggleStart !== -1 && toggleEnd !== -1) {
  produto = produto.slice(0, toggleStart) + produto.slice(toggleEnd);
  console.log('produto.html: AR/3D Gallery Toggle script removido');
} else {
  console.error('produto.html: toggle script não encontrado', { toggleStart, toggleEnd });
}

write('produto.html', produto);

// ── style.css ───────────────────────────────────────────────────────────────
let css = read('style.css');

// Remove seção BOTÃO 3D · AR
const btn3dStart = css.indexOf('/* ----------------------------------------------------------\n   BOTÃO 3D');
const btn3dEnd   = css.indexOf('/* ----------------------------------------------------------\n   16. RESPONSIVO');
if (btn3dStart !== -1 && btn3dEnd !== -1) {
  css = css.slice(0, btn3dStart) + css.slice(btn3dEnd);
  console.log('style.css: seção BOTÃO 3D removida');
} else {
  console.error('style.css: BOTÃO 3D não encontrado', { btn3dStart, btn3dEnd });
}

// Remove seção AR VIEWER
const arCssStart = css.indexOf('/* ================================================================\n   AR VIEWER');
const arCssEnd   = css.indexOf('/* ================================================================\n   TRANSIÇÕES DE PÁGINA');
if (arCssStart !== -1 && arCssEnd !== -1) {
  css = css.slice(0, arCssStart) + css.slice(arCssEnd);
  console.log('style.css: seção AR VIEWER removida');
} else {
  console.error('style.css: AR VIEWER não encontrado', { arCssStart, arCssEnd });
}

write('style.css', css);
console.log('\nConcluído!');
