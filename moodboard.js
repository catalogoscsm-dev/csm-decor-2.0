/* moodboard.js */
document.getElementById('ano').textContent = new Date().getFullYear();

// ── Data do projeto ──────────────────────────────────────────
var now = new Date();
document.getElementById('project-date').textContent =
  now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
document.getElementById('print-date-footer').textContent =
  'Gerado em ' + now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ── Detecção de modo visualização ────────────────────────────
var VIEW_DATA = null;
(function() {
  try {
    var param = new URLSearchParams(location.search).get('view');
    if (param) VIEW_DATA = JSON.parse(decodeURIComponent(escape(atob(param))));
  } catch(_) {}
})();
var IS_VIEW_MODE = !!VIEW_DATA;
if (IS_VIEW_MODE) document.body.classList.add('is-view-mode');

// ── Storage keys ─────────────────────────────────────────────
function getMbKey(){ try{ var s=JSON.parse(localStorage.getItem('csm-session')||'null'); return s&&s.email?'csm-moodboard-'+s.email:'csm-moodboard-guest'; }catch(_){return'csm-moodboard-guest';} }
var ITEMS_KEY  = getMbKey();
var NAME_KEY   = 'csm-mb-project-name';
var ARCH_KEY   = 'csm-mb-architect';
var NOTES_KEY  = 'csm-mb-notes';

// ── Campos do projeto ─────────────────────────────────────────
var nameInput  = document.getElementById('project-name');
var archInput  = document.getElementById('architect-name');
var notesInput = document.getElementById('project-notes');

if (IS_VIEW_MODE) {
  var meta = VIEW_DATA.meta || {};
  nameInput.value  = meta.projectName    || '';
  archInput.value  = meta.architectName  || '';
  notesInput.value = meta.notes          || '';
  nameInput.readOnly  = true;
  archInput.readOnly  = true;
  notesInput.readOnly = true;
  document.title = (meta.projectName ? meta.projectName + ' — ' : '') + 'CSM Decor';
} else {
  nameInput.value  = localStorage.getItem(NAME_KEY)  || '';
  archInput.value  = localStorage.getItem(ARCH_KEY)  || '';
  notesInput.value = localStorage.getItem(NOTES_KEY) || '';
  nameInput.addEventListener('input',  function(){ localStorage.setItem(NAME_KEY,  nameInput.value); });
  archInput.addEventListener('input',  function(){ localStorage.setItem(ARCH_KEY,  archInput.value); });
  notesInput.addEventListener('input', function(){
    localStorage.setItem(NOTES_KEY, notesInput.value);
    document.getElementById('print-notes-content').textContent = notesInput.value;
  });
}

document.getElementById('print-notes-content').textContent = notesInput.value;

// ── Itens ────────────────────────────────────────────────────
function getItems() {
  var raw;
  if (IS_VIEW_MODE) {
    raw = VIEW_DATA.items || [];
  } else {
    try { raw = JSON.parse(localStorage.getItem(ITEMS_KEY)) || []; } catch(e) { raw = []; }
  }
  return raw.map(function(i) {
    return {
      id:      i.id      || (i.name||'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''),
      name:    i.name    || '',
      type:    i.type    || i.tipo || '',
      tagline: i.tagline || '',
      img:     i.img     || '',
      wpp:     i.wpp     || '',
      tipo:    i.tipo    || i.type || '',
      href:    i.href    || '',
    };
  });
}
function saveItems(items) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
}
function removeItem(id) {
  saveItems(getItems().filter(function(i){ return i.id !== id; }));
}

// ── Render ────────────────────────────────────────────────────
function render() {
  var items      = getItems();
  var grid       = document.getElementById('mb-grid');
  var empty      = document.getElementById('empty-state');
  var countEl    = document.getElementById('items-count');
  var notesSection = document.getElementById('notes-section');
  var ctaSection   = document.getElementById('cta-section');
  var viewCta      = document.getElementById('mb-view-cta');
  var printNotes   = document.getElementById('print-notes-section');

  grid.innerHTML = '';
  countEl.textContent = items.length + ' ' + (items.length === 1 ? 'item' : 'itens');

  if (items.length === 0) {
    empty.hidden         = false;
    notesSection.hidden  = true;
    ctaSection.hidden    = true;
    viewCta.hidden       = true;
    printNotes.style.display = 'none';
    return;
  }

  empty.hidden = true;
  printNotes.style.display = 'none';

  if (IS_VIEW_MODE) {
    notesSection.hidden = true;
    ctaSection.hidden   = true;
    viewCta.hidden      = false;
  } else {
    notesSection.hidden = false;
    ctaSection.hidden   = false;
    viewCta.hidden      = true;
  }

  items.forEach(function(item) {
    var card = document.createElement('article');
    card.className = 'mb-card';

    var productLink = item.href || (item.id ? 'produto.html?id=' + item.id : '');
    var imgWrap = '<div class="mb-card__img-wrap">'
      + '<img class="mb-card__img" src="' + item.img + '" alt="' + item.name + '" loading="lazy" />'
      + '<span class="mb-card__type">' + item.type + '</span>'
      + (IS_VIEW_MODE ? '' : '<button class="mb-card__remove" aria-label="Remover ' + item.name + '" data-id="' + item.id + '" type="button">'
        + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
        + '</button>')
      + '</div>';

    var wppBtn = '<a href="' + item.wpp + '" class="btn btn--primary btn--sm" target="_blank" rel="noopener noreferrer">'
      + '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>'
      + 'Orçamento</a>';

    var bodyFooter = IS_VIEW_MODE && productLink
      ? '<a href="' + productLink + '" class="btn btn--outline btn--sm">Ver produto</a>'
      : wppBtn;

    card.innerHTML = imgWrap
      + '<div class="mb-card__body">'
      + '<h3 class="mb-card__name">' + item.name + '</h3>'
      + '<p class="mb-card__tagline">' + item.tagline + '</p>'
      + '<div class="mb-card__footer">' + bodyFooter + '</div>'
      + '</div>';

    if (!IS_VIEW_MODE) {
      card.querySelector('.mb-card__remove').addEventListener('click', function(e) {
        var id = e.currentTarget.dataset.id;
        removeItem(id);
        card.style.transition = 'opacity .22s, transform .22s';
        card.style.opacity = '0';
        card.style.transform = 'scale(.96)';
        setTimeout(function(){ card.remove(); render(); }, 220);
      });
    }

    grid.appendChild(card);
  });
}

render();

// ── Sync notes para área de impressão ────────────────────────
notesInput.addEventListener('input', function() {
  document.getElementById('print-notes-content').textContent = notesInput.value;
});

// ── Compartilhar com cliente ──────────────────────────────────
document.getElementById('share-btn').addEventListener('click', async function(e) {
  e.preventDefault();
  if (IS_VIEW_MODE) return;

  var items = getItems();
  if (!items.length) { showToast('Adicione produtos ao moodboard antes de compartilhar.'); return; }

  var meta = {
    projectName:   nameInput.value,
    architectName: archInput.value,
    notes:         notesInput.value,
  };
  var safeItems = items.map(function(i) {
    return { id: i.id, name: i.name, type: i.type, tagline: i.tagline,
             img: (i.img || '').substring(0, 300), wpp: i.wpp, tipo: i.tipo, href: i.href };
  });

  var encoded;
  try {
    encoded = btoa(unescape(encodeURIComponent(JSON.stringify({ items: safeItems, meta: meta }))));
  } catch(_) {
    showToast('Erro ao gerar o link. Tente novamente.');
    return;
  }
  var url = location.href.split('?')[0] + '?view=' + encoded;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try { await navigator.clipboard.writeText(url); showToast('Link copiado! Envie para seu cliente.'); return; } catch(_) {}
  }
  try {
    var tmp = document.createElement('textarea');
    tmp.value = url; tmp.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    document.body.appendChild(tmp); tmp.focus(); tmp.select();
    document.execCommand('copy'); document.body.removeChild(tmp);
    showToast('Link copiado! Envie para seu cliente.');
  } catch(_) {
    showToast('Copie o link da barra de endereço do navegador.');
  }
});

// ── Exportar PDF ─────────────────────────────────────────────
document.getElementById('print-btn').addEventListener('click', function() {
  var notes = notesInput.value;
  var pn = document.getElementById('print-notes-section');
  document.getElementById('print-notes-content').textContent = notes;
  if (notes) pn.style.display = '';
  setTimeout(function() {
    window.print();
    pn.style.display = 'none';
  }, 80);
});

// ── Toast helper ──────────────────────────────────────────────
function showToast(msg, duration) {
  duration = duration || 2800;
  var toast = document.getElementById('mb-toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(function(){ toast.classList.remove('visible'); }, duration);
}

// ── Transição de página (curtain) ─────────────────────────────
(function () {
  var curtain = document.getElementById('page-curtain');
  if (!curtain) return;
  var ease = 'cubic-bezier(.77,0,.175,1)';

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      curtain.style.transition = 'transform .72s ' + ease;
      curtain.style.transform  = 'translateY(-100%)';
      curtain.addEventListener('transitionend', function () {
        curtain.style.pointerEvents = 'none';
      }, { once: true });
    });
  });

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (/^(https?:\/\/|\/\/|mailto:|tel:)/.test(href)) return;
    if (link.target === '_blank') return;
    if (href.indexOf('.html') === -1) return;

    e.preventDefault();
    try { sessionStorage.setItem('csm-pt', '1'); } catch (_) {}

    curtain.style.transition    = 'none';
    curtain.style.transform     = 'translateY(100%)';
    curtain.style.pointerEvents = 'all';
    curtain.offsetHeight;
    curtain.style.transition = 'transform .65s ' + ease;
    curtain.style.transform  = 'translateY(0)';
    curtain.addEventListener('transitionend', function () {
      window.location.href = href;
    }, { once: true });
  });
}());
