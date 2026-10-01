(function () {
  'use strict';

  var CAT = {
    'sofa':         { label: 'Sofás',          eyebrow: 'Sofás de Alta Costura',    url: 'produtos.html?categoria=sofa' },
    'poltrona':     { label: 'Poltronas',      eyebrow: 'Poltronas & Cadeiras',     url: 'produtos.html?categoria=poltrona' },
    'sala-jantar':  { label: 'Sala de Jantar', eyebrow: 'Ambientes de Jantar',      url: 'produtos.html?categoria=sala-jantar' },
    'quarto':       { label: 'Quartos',        eyebrow: 'Quartos e Dormitórios',    url: 'produtos.html?categoria=quarto' },
    'area-gourmet': { label: 'Área Gourmet',   eyebrow: 'Área Gourmet & Externo',   url: 'produtos.html?categoria=area-gourmet' },
    'corporativo':  { label: 'Corporativo',    eyebrow: 'Móveis Corporativos',      url: 'produtos.html?categoria=corporativo' },
    'complemento':  { label: 'Complementos',   eyebrow: 'Complementos & Decoração', url: 'produtos.html?categoria=complemento' },
  };

  var params = new URLSearchParams(window.location.search);
  var urlId  = params.get('id');
  if (!urlId) return;

  var stored = null;
  try { stored = JSON.parse(localStorage.getItem('csm-produto-current')); } catch (_) {}

  if (!stored || String(stored.id) !== String(urlId)) {
    window.location.replace('produtos.html');
    return;
  }

  var p   = stored;
  var cat = CAT[p.tipo] || CAT['sofa'];

  // ── Head
  document.title = p.name + ' — CSM Decor | Alto Padrão';
  var sm = function (sel, val) { var el = document.querySelector(sel); if (el) el.setAttribute('content', val); };
  sm('meta[name="description"]', p.name + ' — CSM Decor. ' + p.tagline + '. Encomenda exclusiva.');
  sm('meta[property="og:title"]',    p.name + ' — CSM Decor');
  sm('meta[property="og:description"]', p.tagline + '. Alto padrão em Campinas e região.');
  if (p.imgs && p.imgs[0]) sm('meta[property="og:image"]', p.imgs[0]);

  // ── Breadcrumb
  var bcCat = document.querySelector('.breadcrumb a:last-of-type');
  if (bcCat) { bcCat.textContent = cat.label; bcCat.href = cat.url; }
  var bcCur = document.querySelector('.breadcrumb__current');
  if (bcCur) bcCur.textContent = p.name;

  // ── Gallery main image
  var firstImg = (p.imgs && p.imgs[0]) ? p.imgs[0] : '';
  var mainImg  = document.getElementById('gallery-main-img');
  if (mainImg) {
    if (firstImg) {
      mainImg.src = firstImg;
      mainImg.alt = p.name + ' — vista frontal';
      mainImg.style.display = '';
    } else {
      mainImg.src = '';
      mainImg.alt = '';
      mainImg.style.display = 'none';
    }
  }

  // ── Gallery badge
  var galBadge = document.querySelector('.gallery-badge--cat');
  if (galBadge) galBadge.textContent = p.badge || cat.label;

  // ── Gallery thumbs: rebuild from imgs array
  var thumbsWrap = document.querySelector('.product-gallery__thumbs');
  if (thumbsWrap) {
    thumbsWrap.innerHTML = '';
    var rawImgs = (p.imgs && p.imgs.length) ? p.imgs : (firstImg ? [firstImg] : []);
    var imgs = rawImgs.filter(function (src, idx, arr) { return arr.indexOf(src) === idx; });
    imgs.forEach(function (src, i) {
      var div = document.createElement('div');
      div.className = 'gallery-thumb' + (i === 0 ? ' active' : '');
      div.setAttribute('role', 'listitem');
      div.setAttribute('aria-label', 'Vista ' + (i + 1));
      div.setAttribute('tabindex', '0');
      div.dataset.src = src;
      var img = document.createElement('img');
      img.src = src; img.alt = p.name + ' — vista ' + (i + 1); img.loading = 'lazy';
      div.appendChild(img);
      thumbsWrap.appendChild(div);
    });
  }

  // ── Eyebrow
  var eyebrow = document.querySelector('.product-panel__eyebrow');
  if (eyebrow) eyebrow.textContent = cat.eyebrow;

  // ── Status chip
  var oldChip = document.querySelector('.product-panel__status-chip');
  if (oldChip) oldChip.remove();
  if (p.statusLabel && p.status) {
    var chip = document.createElement('span');
    chip.className = 'product-panel__status-chip product-panel__status-chip--' + p.status;
    chip.textContent = p.statusLabel;
    if (eyebrow) eyebrow.insertAdjacentElement('afterend', chip);
  }

  // ── H1
  var h1 = document.querySelector('.product-panel__name');
  if (h1) {
    var badge = p.badge || '';
    if (badge && p.name.startsWith(badge)) {
      var rest = p.name.slice(badge.length).trim();
      h1.innerHTML = badge + (rest ? ' <em>' + rest + '</em>' : '');
    } else {
      h1.innerHTML = '<em>' + p.name + '</em>';
    }
  }

  // ── Descrição do produto
  var descEl = document.getElementById('product-desc');
  if (descEl && p.description && p.description.trim()) {
    descEl.textContent = p.description;
    descEl.removeAttribute('hidden');
  }

  // ── Specs: from localStorage data if available, else generic
  var specsBody = document.getElementById('specs-body');
  if (specsBody) {
    if (p.specs && p.specs.length) {
      specsBody.innerHTML = '';
      p.specs.forEach(function (s) {
        var row = document.createElement('div');
        row.className = 'product-specs__row';
        var key = document.createElement('span');
        key.className = 'product-specs__key';
        key.textContent = s.key || '';
        var val = document.createElement('span');
        val.className = 'product-specs__val';
        val.textContent = s.val || '';
        row.appendChild(key);
        row.appendChild(val);
        specsBody.appendChild(row);
      });
    } else {
      specsBody.innerHTML =
        '<div class="product-specs__row"><span class="product-specs__key">Material</span><span class="product-specs__val">Sob consulta — conforme revestimento escolhido</span></div>' +
        '<div class="product-specs__row"><span class="product-specs__key">Estrutura</span><span class="product-specs__val">Madeira maciça ou estrutura metálica</span></div>' +
        '<div class="product-specs__row"><span class="product-specs__key">Acabamento</span><span class="product-specs__val">Personalizado conforme pedido</span></div>' +
        '<div class="product-specs__row"><span class="product-specs__key">Prazo de entrega</span><span class="product-specs__val">30 a 60 dias úteis</span></div>' +
        '<div class="product-specs__row"><span class="product-specs__key">Dimensões</span><span class="product-specs__val">Disponíveis sob consulta</span></div>';
    }
  }

  // ── WhatsApp CTA
  var wppCta = document.querySelector('.product-panel__ctas .btn--primary');
  if (wppCta && p.wpp) wppCta.href = p.wpp;

  // Expose for share handler and favorites in next script block
  window.__produtoNome    = p.name;
  window.__produtoTagline = p.tagline;
  window.__produto        = p;

  // Repara href faltante em itens salvos antes do rastreamento de href
  (function(){
    function _mbKey(){ try{ var s=JSON.parse(localStorage.getItem('csm-session')||'null'); return s&&s.email?'csm-moodboard-'+s.email:'csm-moodboard-guest'; }catch(_){return'csm-moodboard-guest';} }
    var KEY=_mbKey();
    try {
      var items=JSON.parse(localStorage.getItem(KEY)||'[]');
      var pageHref=window.location.href;
      var pName=p.name||'';
      var changed=false;
      items.forEach(function(item){ if(item.name===pName && !item.href){ item.href=pageHref; changed=true; } });
      if(changed) localStorage.setItem(KEY,JSON.stringify(items));
    } catch(_){}
  }());

  // ── Sugestões dinâmicas com imagens reais
  var SUGG_POOL = (function () {
    var pool = {};
    (window.CSM_PRODUTOS || []).forEach(function (p) {
      if (!p.id || !p.img) return;
      var t = p.tipo || 'sofa';
      if (!pool[t]) pool[t] = [];
      pool[t].push({ id: p.id, name: p.name, cat: p.badge || t, tipo: t, img: p.img });
    });
    return pool;
  }());
  var PAIRED_CAT = { 'sofa':'poltrona', 'poltrona':'sofa', 'sala-tv':'sofa', 'sala-jantar':'sala-tv', 'quarto':'sala-jantar', 'corporativo':'sofa' };

  (function renderSuggestions(currentId, tipo) {
    var track = document.getElementById('sugg-track');
    if (!track) return;
    function shuffle(arr) { return arr.slice().sort(function() { return Math.random() - 0.5; }); }
    var pool = shuffle((SUGG_POOL[tipo] || []).filter(function(pr) { return String(pr.id) !== String(currentId); }));
    if (pool.length < 5) {
      var extra = shuffle((SUGG_POOL[PAIRED_CAT[tipo]] || []).filter(function(pr) {
        return String(pr.id) !== String(currentId) && !pool.some(function(x) { return x.id === pr.id; });
      }));
      pool = pool.concat(extra);
    }
    var picks = pool.slice(0, 5);
    if (!picks.length) return;
    track.innerHTML = picks.map(function(pr) {
      return '<a href="produtos.html?autoopen=' + pr.id + '" class="suggestion-card" role="listitem" aria-label="' + pr.name + '" data-sugg=\'' + JSON.stringify(pr).replace(/'/g, '&#39;') + '\'>' +
        '<div class="suggestion-card__img"><img src="' + pr.img + '" alt="' + pr.name + '" loading="lazy" /></div>' +
        '<div class="suggestion-card__body">' +
          '<p class="suggestion-card__cat">' + pr.cat + '</p>' +
          '<h3 class="suggestion-card__name">' + pr.name + '</h3>' +
        '</div></a>';
    }).join('');
    track.querySelectorAll('.suggestion-card').forEach(function(card) {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        var pr = JSON.parse(card.dataset.sugg);
        window.location.href = 'produtos.html?autoopen=' + pr.id;
      });
    });
  }(p.id, p.tipo));

}());

'use strict';

// ── Helpers de scroll
function lockScroll()   { document.body.style.overflow = 'hidden'; }
function unlockScroll() { document.body.style.overflow = ''; }

// ── Header scroll
const header = document.getElementById('header');
const onScroll = () => header.classList.toggle('header--scrolled', window.scrollY > 50);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ── Menu Overlay
(function () {
  var toggleBtn = document.getElementById('menu-toggle-btn');
  var closeBtn  = document.getElementById('menu-close-btn');
  var overlay   = document.getElementById('menu-overlay');
  if (!toggleBtn || !overlay) return;

  var isOpen  = false;
  var openRAF = null;

  overlay.querySelectorAll('.menu-nav__link').forEach(function (link, i) {
    link.style.transitionDelay = (0.08 + i * 0.055) + 's';
  });

  function openMenu() {
    isOpen = true;
    overlay.removeAttribute('hidden');
    overlay.removeAttribute('aria-hidden');
    lockScroll();
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.classList.add('is-open');
    cancelAnimationFrame(openRAF);
    openRAF = requestAnimationFrame(function () {
      requestAnimationFrame(function () { overlay.classList.add('is-open'); });
    });
  }

  function closeMenu() {
    isOpen = false;
    overlay.classList.remove('is-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.classList.remove('is-open');
    unlockScroll();
    overlay.addEventListener('transitionend', function hide(e) {
      if (e.propertyName !== 'clip-path') return;
      overlay.setAttribute('hidden', '');
      overlay.removeEventListener('transitionend', hide);
    });
  }

  toggleBtn.addEventListener('click', function () { isOpen ? closeMenu() : openMenu(); });
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);

  overlay.querySelectorAll('.menu-nav__link').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });
}());

// ── Dark Mode
(function () {
  var toggle = document.getElementById('theme-toggle');
  var html   = document.documentElement;
  var saved  = localStorage.getItem('csm-theme');
  if (saved) html.setAttribute('data-theme', saved);
  if (toggle) {
    toggle.addEventListener('click', function () {
      var isDark = html.getAttribute('data-theme') === 'dark';
      html.setAttribute('data-theme', isDark ? 'light' : 'dark');
      localStorage.setItem('csm-theme', isDark ? 'light' : 'dark');
    });
  }
}());

// ── Pesquisar → catálogo com busca ativa (curtain + #buscar)
(function () {
  var btn = document.getElementById('header-search-btn');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var curtain = document.getElementById('page-curtain');
    if (curtain) {
      var ease = 'cubic-bezier(0.76, 0, 0.24, 1)';
      curtain.style.transition    = 'none';
      curtain.style.transform     = 'translateY(100%)';
      curtain.style.pointerEvents = 'all';
      curtain.offsetHeight;
      curtain.style.transition = 'transform .65s ' + ease;
      curtain.style.transform  = 'translateY(0)';
      curtain.addEventListener('transitionend', function () {
        window.location.href = 'produtos.html#buscar';
      }, { once: true });
    } else {
      window.location.href = 'produtos.html#buscar';
    }
  });
}());

// ── Galeria de imagens
const mainImg   = document.getElementById('gallery-main-img');
const thumbs    = document.querySelectorAll('.gallery-thumb');
const galleryEl = document.getElementById('gallery-main');

thumbs.forEach(thumb => {
  const activate = () => {
    thumbs.forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
    mainImg.src = thumb.dataset.src;
    mainImg.alt = thumb.querySelector('img').alt;
  };
  thumb.addEventListener('click', activate);
  thumb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
});

// ── Lightbox
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');

function openLightbox(src, alt) {
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  galleryEl.focus();
}

galleryEl.addEventListener('click', () => openLightbox(mainImg.src, mainImg.alt));
galleryEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(mainImg.src, mainImg.alt); } });
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox(); });

// ── Accordion de especificações
const specsToggle = document.getElementById('specs-toggle');
const specsBodyEl = document.getElementById('specs-body');

function openSpecs() {
  var rows = specsBodyEl.querySelectorAll('.product-specs__row');
  rows.forEach(function(row) {
    row.style.transition = 'none';
    row.style.opacity    = '0';
    row.style.transform  = 'translateY(8px)';
  });
  specsBodyEl.style.maxHeight = specsBodyEl.scrollHeight + 'px';
  specsToggle.classList.add('open');
  specsToggle.setAttribute('aria-expanded', 'true');
  rows.forEach(function(row, i) {
    setTimeout(function() {
      row.style.transition = 'opacity .32s ease, transform .32s ease';
      row.style.opacity    = '1';
      row.style.transform  = 'none';
    }, 60 + i * 55);
  });
}

function closeSpecs() {
  var rows = specsBodyEl.querySelectorAll('.product-specs__row');
  rows.forEach(function(row, i) {
    row.style.transition      = 'opacity .13s ease, transform .13s ease';
    row.style.transitionDelay = (i * 10) + 'ms';
    row.style.opacity         = '0';
    row.style.transform       = 'translateY(4px)';
  });
  setTimeout(function() {
    specsBodyEl.style.maxHeight = '0';
    specsToggle.classList.remove('open');
    specsToggle.setAttribute('aria-expanded', 'false');
  }, 80);
}

specsToggle.addEventListener('click', function() {
  var isOpen = specsBodyEl.style.maxHeight && specsBodyEl.style.maxHeight !== '0px';
  if (isOpen) { closeSpecs(); } else { openSpecs(); }
});


// ── Favoritar
function getMbKey() {
  try {
    var s = window.CSMAuth ? CSMAuth.getSession()
          : JSON.parse(localStorage.getItem('csm-session') || 'null');
    return s && s.email ? 'csm-moodboard-' + s.email : 'csm-moodboard-guest';
  } catch(_) { return 'csm-moodboard-guest'; }
}

function getMbItems() {
  try { return JSON.parse(localStorage.getItem(getMbKey())) || []; } catch(_) { return []; }
}
function saveMbItems(items) {
  try { localStorage.setItem(getMbKey(), JSON.stringify(items)); } catch(_) {}
}
function genMbId(name) {
  return (name||'').toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
}
function updateMbBadge() {
  const badge = document.getElementById('moodboard-badge');
  if (!badge) return;
  const n = getMbItems().length;
  badge.textContent = n;
  badge.hidden = n === 0;
}

const btnFav = document.getElementById('btn-favoritar');

function setFavState(active) {
  btnFav.classList.toggle('active', active);
  btnFav.setAttribute('aria-pressed', String(active));
  btnFav.setAttribute('aria-label', active ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
  const svg = btnFav.querySelector('svg');
  svg.setAttribute('fill',   active ? 'var(--orange)' : 'none');
  svg.setAttribute('stroke', active ? 'var(--orange)' : 'currentColor');
  const label = btnFav.childNodes[btnFav.childNodes.length - 1];
  if (label && label.nodeType === 3) label.textContent = active ? ' Favoritado' : ' Favoritar';
}

function findMbIdx(items, p) {
  const id   = genMbId(p.name);
  const name = (p.name || '').trim();
  return items.findIndex(i =>
    i.id === id ||
    genMbId(i.name) === id ||
    (i.name || '').trim() === name
  );
}

// Inicializa estado com base no que já está salvo
(function initFav() {
  const p = window.__produto; if (!p) return;
  setFavState(findMbIdx(getMbItems(), p) > -1);
  updateMbBadge();
}());

btnFav.addEventListener('click', () => {
  if (!CSMAuth.requireMoodboard()) return;
  const p = window.__produto; if (!p) return;
  const id = genMbId(p.name);
  let items = getMbItems();
  const idx = findMbIdx(items, p);
  if (idx > -1) {
    items.splice(idx, 1);
    setFavState(false);
  } else {
    items.push({
      id:      id,
      name:    p.name    || '',
      type:    p.badge   || '',
      tagline: p.tagline || '',
      img:     (p.imgs && p.imgs[0]) || '',
      wpp:     p.wpp    || '',
      tipo:    p.tipo   || '',
      href:    window.location.href,
    });
    setFavState(true);
  }
  saveMbItems(items);
  updateMbBadge();
});

// ── Painel de favoritos
function buildWppUrl() {
  const items = getMbItems(); if (!items.length) return '#';
  const nome = localStorage.getItem('csm-user-nome') || '';
  const saud = nome ? 'Olá, sou ' + nome + '!' : 'Olá!';
  const lista = items.map(i => '• ' + i.type + ': ' + i.name).join('\n');
  return 'https://wa.me/5519990034068?text=' + encodeURIComponent(saud + ' Tenho interesse nos seguintes produtos CSM Decor:\n\n' + lista + '\n\nPoderia me enviar informações e orçamento?');
}

function renderPanel() {
  const items  = getMbItems();
  const listEl = document.getElementById('moodboard-list');
  const countEl= document.getElementById('moodboard-count-label');
  const wppBtn = document.getElementById('moodboard-wpp-btn');
  const secRow = document.getElementById('moodboard-secondary-row');
  if (!listEl) return;
  listEl.innerHTML = '';
  if (!items.length) {
    listEl.innerHTML = '<div class="moodboard-empty"><div class="moodboard-empty__icon"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div><p class="moodboard-empty__title">Nenhum favorito ainda</p><p class="moodboard-empty__text">Clique no marcador de um produto para salvar na sua lista.</p></div>';
    if (wppBtn) wppBtn.hidden = true;
    if (secRow) secRow.hidden = true;
  } else {
    items.forEach(item => {
      const href = item.href || null;
      const div = document.createElement('div'); div.className = 'moodboard-item';
      div.innerHTML = `<div class="moodboard-item__link" role="link" tabindex="${href?'0':'-1'}" aria-label="Ver ${item.name}" style="${href?'cursor:pointer':''}"><img class="moodboard-item__img" src="${item.img}" alt="${item.name}" loading="lazy" /><div class="moodboard-item__info"><span class="moodboard-item__type">${item.type}</span><p class="moodboard-item__name">${item.name}</p><p class="moodboard-item__tagline">${item.tagline}</p></div></div><button class="moodboard-item__remove" aria-label="Remover ${item.name}" data-id="${item.id}" type="button"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
      const linkEl = div.querySelector('.moodboard-item__link');
      if (href) {
        linkEl.addEventListener('click', () => { window.location.href = href; });
        linkEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = href; } });
      }
      div.querySelector('.moodboard-item__remove').addEventListener('click', e => {
        e.stopPropagation();
        const cur = getMbItems().filter(i => i.id !== item.id);
        saveMbItems(cur); div.classList.add('removing');
        setTimeout(() => { div.remove(); renderPanel(); updateMbBadge(); }, 220);
      });
      listEl.appendChild(div);
    });
    if (wppBtn) { wppBtn.href = buildWppUrl(); wppBtn.hidden = false; }
    if (secRow) secRow.hidden = false;
  }
  if (countEl) { const n = items.length; countEl.textContent = n === 0 ? 'Nenhum item salvo' : n + ' ' + (n === 1 ? 'item na lista' : 'itens na lista'); }
}

function openPanel() {
  const panel    = document.getElementById('moodboard-panel');
  const backdrop = document.getElementById('moodboard-backdrop');
  if (!panel) return;
  renderPanel();
  panel.classList.add('is-open'); panel.setAttribute('aria-hidden', 'false');
  if (backdrop) backdrop.classList.add('is-visible');
  document.body.style.overflow = 'hidden';
  const hBtn = document.getElementById('moodboard-header-btn');
  if (hBtn) { hBtn.setAttribute('aria-expanded', 'true'); hBtn.classList.add('is-active'); }
  setTimeout(() => document.getElementById('moodboard-close-btn')?.focus(), 80);
}

function closePanel() {
  const panel    = document.getElementById('moodboard-panel');
  const backdrop = document.getElementById('moodboard-backdrop');
  if (panel)    { panel.classList.remove('is-open'); panel.setAttribute('aria-hidden', 'true'); }
  if (backdrop) backdrop.classList.remove('is-visible');
  document.body.style.overflow = '';
  const hBtn = document.getElementById('moodboard-header-btn');
  if (hBtn) { hBtn.setAttribute('aria-expanded', 'false'); hBtn.classList.remove('is-active'); }
}

document.addEventListener('click', e => {
  if (e.target.closest('#moodboard-close-btn'))  { closePanel(); return; }
  if (e.target.closest('#moodboard-clear-btn'))  { saveMbItems([]); renderPanel(); updateMbBadge(); setFavState(false); return; }
  if (e.target.matches('#moodboard-backdrop'))   { closePanel(); return; }
});
document.addEventListener('touchend', e => {
  if (e.target.matches('#moodboard-backdrop')) { e.preventDefault(); closePanel(); }
}, { passive: false });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { const p = document.getElementById('moodboard-panel'); if (p && p.classList.contains('is-open')) closePanel(); }
});

const mbHeaderBtn = document.getElementById('moodboard-header-btn');
if (mbHeaderBtn) mbHeaderBtn.addEventListener('click', function () {
  if (!CSMAuth.requireMoodboard()) return;
  openPanel();
});
updateMbBadge();

// ── Carrossel de sugestões
const track   = document.getElementById('sugg-track');
const btnPrev = document.getElementById('sugg-prev');
const btnNext = document.getElementById('sugg-next');
const SCROLL_BY = 300;

btnPrev.addEventListener('click', () => track.scrollBy({ left: -SCROLL_BY, behavior: 'smooth' }));
btnNext.addEventListener('click', () => track.scrollBy({ left:  SCROLL_BY, behavior: 'smooth' }));

// ── Modal helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.removeAttribute('hidden');
  el.querySelector('button, input, [tabindex]')?.focus();
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('hidden', '');
  document.body.style.overflow = '';
}
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      if (overlay.id === 'modal-review' && typeof resetReviewModal === 'function') resetReviewModal();
      closeModal(overlay.id);
    }
  });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not([hidden])').forEach(m => {
      if (m.id === 'modal-review' && typeof resetReviewModal === 'function') resetReviewModal();
      closeModal(m.id);
    });
  }
});

// ── Ano dinâmico
document.getElementById('ano').textContent = new Date().getFullYear();

// ── Compartilhar
document.getElementById('btn-compartilhar').addEventListener('click', async function() {
  var title = (window.__produtoNome || 'Produto CSM Decor') + ' — CSM Decor';
  var text  = window.__produtoTagline || 'Móveis de alto padrão — CSM Decor, Campinas.';
  var url   = window.location.href;

  if (navigator.share) {
    try { await navigator.share({ title: title, text: text, url: url }); return; } catch(_) {}
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      var btn = document.getElementById('btn-compartilhar');
      var orig = btn.innerHTML;
      btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Link copiado!';
      setTimeout(function(){ btn.innerHTML = orig; }, 2200);
      return;
    } catch(_) {}
  }
  try {
    var ta = document.createElement('textarea');
    ta.value = url; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    var btn2 = document.getElementById('btn-compartilhar');
    var orig2 = btn2.innerHTML;
    btn2.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Link copiado!';
    setTimeout(function(){ btn2.innerHTML = orig2; }, 2200);
  } catch(_) {
    prompt('Copie o link abaixo:', url);
  }
});

// ── Tags dinâmicas por produto
(function renderTags() {
  var p = window.__produto;
  if (!p) return;
  var wrap = document.getElementById('product-tags');
  if (!wrap) return;

  var name  = (p.name  || '').toLowerCase();
  var tipo  = (p.tipo  || '').toLowerCase();
  var specs = JSON.stringify(p.specs || '').toLowerCase();

  var tags = [];

  if (tipo === 'sofa' || tipo === 'poltrona' || tipo === 'sala-tv') {
    tags.push({ label: 'Exclusivo', cls: 'product-tag--orange', icon: true });
  }
  if (name.includes('chester')) {
    tags.push({ label: 'Capitonê Manual', cls: '' });
    tags.push({ label: 'Design Britânico', cls: '' });
  }
  if (specs.includes('chaise')) tags.push({ label: 'Modular com Chaise', cls: '' });
  if (specs.includes('elétrico') || specs.includes('touch') || specs.includes('eletrico')) {
    tags.push({ label: 'Acionamento Elétrico', cls: '' });
  }
  if (specs.includes('d-45') || specs.includes('d45')) tags.push({ label: 'Espuma D-45', cls: '' });
  if (tipo === 'poltrona' || tipo === 'sala-tv') tags.push({ label: 'Alta Ergonomia', cls: '' });
  if (tipo === 'sala-jantar') tags.push({ label: 'Design Contemporâneo', cls: '' });
  tags.push({ label: 'Sob Encomenda', cls: '' });

  var iconSvg = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

  wrap.innerHTML = tags.map(function(t) {
    return '<span class="product-tag ' + t.cls + '">' + (t.icon ? iconSvg + ' ' : '') + t.label + '</span>';
  }).join('');
}());

// ── Botão "Deixar minha avaliação"
var _btnAvaliar = document.getElementById('btn-avaliar');
if (_btnAvaliar) _btnAvaliar.addEventListener('click', function() {
  var pname = document.getElementById('review-product-name');
  if (pname) pname.textContent = (window.__produtoNome || 'Produto selecionado');
  var session = CSMAuth.getSession();
  if (!session) {
    CSMAuth.openAuthModal({
      subtitle: 'Para deixar sua avaliação, faça login ou crie uma conta CSM.',
      callback: function() { openModal('modal-review'); }
    });
  } else {
    openModal('modal-review');
  }
});

// ── Star Rating
var _selectedStars  = 0;
var _editingReview  = null;

function luxuryConfirm(title, sub, onConfirm) {
  var overlay = document.getElementById('luxury-confirm');
  document.getElementById('luxury-confirm-title').textContent = title;
  document.getElementById('luxury-confirm-sub').textContent = sub;
  overlay.classList.add('is-open');
  var ok = document.getElementById('luxury-confirm-ok');
  var cancel = document.getElementById('luxury-confirm-cancel');
  function close() {
    overlay.classList.remove('is-open');
    ok.onclick = null; cancel.onclick = null; overlay.onclick = null;
  }
  ok.onclick = function() { close(); onConfirm(); };
  cancel.onclick = close;
  overlay.onclick = function(e) { if (e.target === overlay) close(); };
}

function animateRemoveCard(wrap, callback) {
  if (!wrap) { callback(); return; }
  wrap.style.transition = 'opacity .22s ease, transform .22s ease';
  wrap.style.opacity    = '0';
  wrap.style.transform  = 'scale(.97) translateY(-6px)';
  wrap.style.pointerEvents = 'none';
  setTimeout(function() {
    var h = wrap.offsetHeight;
    wrap.style.transition = 'none';
    wrap.style.overflow   = 'hidden';
    wrap.style.maxHeight  = h + 'px';
    void wrap.offsetHeight;
    wrap.style.transition    = 'max-height .28s ease, margin-bottom .28s ease';
    wrap.style.maxHeight     = '0';
    wrap.style.marginBottom  = '0';
    setTimeout(callback, 300);
  }, 230);
}

function highlightStars(n) {
  document.querySelectorAll('.star-rating__star').forEach(function(s) {
    s.classList.toggle('filled', parseInt(s.dataset.val, 10) <= n);
  });
}

function resetReviewModal() {
  _editingReview = null;
  var titleEl = document.getElementById('review-title');
  if (titleEl) titleEl.textContent = 'Deixar Avaliação';
  var submitBtn = document.getElementById('review-submit-btn');
  if (submitBtn) submitBtn.textContent = 'Publicar avaliação';
}

function openEditReview(key, id) {
  var arr = [];
  try { arr = JSON.parse(localStorage.getItem(key) || '[]'); } catch(_) {}
  var review = arr.find(function(r){ return r.id === id; });
  if (!review) return;
  _editingReview = { key: key, id: id };
  document.getElementById('review-title').textContent = 'Editar Avaliação';
  document.getElementById('review-text').value = review.text;
  var submitBtn = document.getElementById('review-submit-btn');
  if (submitBtn) submitBtn.textContent = 'Salvar alterações';
  _selectedStars = review.stars;
  highlightStars(review.stars);
  openModal('modal-review');
}

function submitReview() {
  var session = CSMAuth.getSession(); if (!session) return;
  var text  = (document.getElementById('review-text').value || '').trim();
  var errEl = document.getElementById('review-error');
  errEl.style.display = 'none';
  if (_selectedStars === 0) { errEl.textContent = 'Selecione uma nota de 1 a 5 estrelas.'; errEl.style.display = 'block'; return; }
  if (text.length < 10) { errEl.textContent = 'Escreva pelo menos 10 caracteres.'; errEl.style.display = 'block'; return; }

  if (_editingReview) {
    var arr = [];
    try { arr = JSON.parse(localStorage.getItem(_editingReview.key) || '[]'); } catch(_) {}
    var idx = arr.findIndex(function(r){ return r.id === _editingReview.id; });
    if (idx > -1) {
      arr[idx].text  = text;
      arr[idx].stars = _selectedStars;
      arr[idx].date  = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    try { localStorage.setItem(_editingReview.key, JSON.stringify(arr)); } catch(_) {}
    resetReviewModal();
  } else {
    var p   = window.__produto;
    var key = 'csm-reviews-' + (p ? p.id : 'generic');
    var reviews = [];
    try { reviews = JSON.parse(localStorage.getItem(key) || '[]'); } catch(_) {}
    reviews.unshift({
      id:      Date.now(),
      author:  session.name,
      email:   session.email,
      role:    session.role,
      stars:   _selectedStars,
      text:    text,
      product: window.__produtoNome || '',
      date:    new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    });
    try { localStorage.setItem(key, JSON.stringify(reviews)); } catch(_) {}
  }

  var _wasNew = !_editingReview;
  closeModal('modal-review');
  document.getElementById('review-text').value = '';
  _selectedStars = 0;
  highlightStars(0);
  renderLocalReviews(_wasNew ? { highlight: true } : null);
}

function renderLocalReviews(opts) {
  var p = window.__produto;
  var key = 'csm-reviews-' + (p ? p.id : 'generic');
  var reviews = [];
  try { reviews = JSON.parse(localStorage.getItem(key) || '[]'); } catch(_) {}
  var container = document.getElementById('local-reviews-list');
  if (!container || !reviews.length) { if (container) container.innerHTML = ''; return; }

  var session = window.CSMAuth ? CSMAuth.getSession() : null;
  var sessionEmail = session ? (session.email || '').toLowerCase() : '';

  var usersMap = {};
  var allUsers = (window.CSMAuth && CSMAuth.getUsers) ? CSMAuth.getUsers() : [];
  allUsers.forEach(function(u) { if (u.email) usersMap[u.email.toLowerCase()] = u; });

  var starSvg   = '<svg class="star-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  var trashSvg  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
  var pencilSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  container.innerHTML = '<div style="margin-top:2rem"><p class="eyebrow">Avaliações dos Usuários</p><h3 class="section-title" style="font-size:1.4rem;margin-bottom:1.5rem">O que os <em>clientes dizem</em></h3></div>' +
    reviews.map(function(r) {
      var reviewer = usersMap[(r.email || '').toLowerCase()] || {};
      var photoUrl = reviewer.photoUrl || '';
      var genero   = reviewer.genero   || '';
      var prefix   = genero === 'masculino' ? 'Sr. ' : genero === 'feminino' ? 'Sra. ' : '';
      var displayName = prefix + r.author;
      var initials = r.author.trim().split(' ').map(function(w){ return w[0]; }).slice(0,2).join('').toUpperCase();
      var roleColor = (window.CSMAuth && CSMAuth.ROLE_COLORS)
        ? (CSMAuth.ROLE_COLORS[reviewer.tipo] || CSMAuth.ROLE_COLORS.comum) : '#F07800';
      var avatarHtml = photoUrl
        ? '<img src="' + photoUrl + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'
        : '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;'
          + 'background:' + roleColor + ';color:#fff;font-size:.65rem;font-weight:700;">' + initials + '</span>';
      var stars = Array.from({length: 5}, function(_, i) {
        return i < r.stars ? starSvg : starSvg.replace('fill="currentColor"', 'fill="none" stroke="currentColor" stroke-width="1.5"');
      }).join('');
      var badge = r.role === 'admin' ? '<span style="font-size:.65rem;background:rgba(240,120,0,.12);color:var(--orange);padding:.15rem .4rem;border-radius:4px;font-weight:600;margin-left:.5rem">ADM</span>' : '';
      var isOwn = sessionEmail && (r.email || '').toLowerCase() === sessionEmail;
      var safeKey = key.replace(/'/g,"\\'");
      var rId = Number(r.id);
      var actionsHtml = isOwn
        ? '<div class="review-actions" style="margin-top:.25rem;display:flex;align-items:center;flex-wrap:wrap;gap:0;">'
          + '<button class="review-action-btn review-action-btn--edit" data-action="edit-review" data-skey="' + safeKey + '" data-id="' + rId + '">' + pencilSvg + ' Editar</button>'
          + '<button class="review-action-btn review-action-btn--delete" data-action="delete-review" data-skey="' + safeKey + '" data-id="' + rId + '">' + trashSvg + ' Excluir</button>'
          + '</div>'
        : '';
      var profileHref = isOwn
        ? 'perfil.html'
        : 'perfil.html?user=' + encodeURIComponent((r.email || '').toLowerCase());
      return '<div class="review-card-wrap" data-review-id="' + rId + '" style="margin-bottom:1.25rem;">' +
        '<article class="review-card">' +
          '<div class="review-card__header">' +
            '<a href="' + profileHref + '" class="review-card__author-link" title="Ver perfil de ' + r.author + '">' +
              '<div class="review-card__avatar" style="overflow:hidden;padding:0;" aria-hidden="true">' + avatarHtml + '</div>' +
              '<div class="review-card__meta">' +
                '<div class="review-card__name">' + displayName + badge + '</div>' +
                '<div class="review-card__date">' + r.date + '</div>' +
              '</div>' +
            '</a>' +
            '<div class="review-card__stars" aria-label="' + r.stars + ' de 5 estrelas">' + stars + '</div>' +
          '</div>' +
          '<p class="review-card__text">' + r.text.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>' +
        '</article>' +
        actionsHtml +
      '</div>';
    }).join('');

  container.querySelectorAll('.review-card-wrap').forEach(function(w, i) {
    w.style.animationDelay = (i * 0.07) + 's';
    w.classList.add(opts && opts.highlight && i === 0 ? 'review-new' : 'review-entering');
  });
}

function deleteReview(key, id) {
  luxuryConfirm('Excluir avaliação?', 'Esta ação não poderá ser desfeita.', function() {
    var wrap = document.querySelector('.review-card-wrap[data-review-id="' + id + '"]');
    animateRemoveCard(wrap, function() {
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      try {
        var arr = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify(arr.filter(function(r){ return r.id !== id; })));
      } catch(_) {}
      var container = document.getElementById('local-reviews-list');
      if (container && !container.querySelector('.review-card-wrap')) {
        container.innerHTML = '';
      }
    });
  });
}

// Event delegation for review action buttons
document.getElementById('local-reviews-list').addEventListener('click', function(e) {
  var btn = e.target.closest('[data-action]');
  if (!btn) return;
  var action = btn.dataset.action;
  var skey = btn.dataset.skey;
  var id = parseInt(btn.dataset.id, 10);
  if (action === 'edit-review')   { e.stopPropagation(); openEditReview(skey, id); }
  else if (action === 'delete-review') { e.stopPropagation(); deleteReview(skey, id); }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderLocalReviews);
} else {
  renderLocalReviews();
}

// ── Review modal close + submit buttons
(function() {
  var reviewClose = document.getElementById('review-modal-close');
  if (reviewClose) reviewClose.addEventListener('click', function() {
    resetReviewModal();
    closeModal('modal-review');
  });
  var reviewSubmit = document.getElementById('review-submit-btn');
  if (reviewSubmit) reviewSubmit.addEventListener('click', submitReview);
}());

// ── Star rating container event delegation
(function () {
  var container = document.getElementById('star-rating');
  if (!container) return;
  container.addEventListener('click', function (e) {
    var star = e.target.closest ? e.target.closest('.star-rating__star') : null;
    if (!star) return;
    _selectedStars = parseInt(star.dataset.val, 10);
    highlightStars(_selectedStars);
  });
  container.addEventListener('mouseover', function (e) {
    var star = e.target.closest ? e.target.closest('.star-rating__star') : null;
    if (star) highlightStars(parseInt(star.dataset.val, 10));
  });
  container.addEventListener('mouseleave', function () {
    highlightStars(_selectedStars);
  });
  container.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var star = e.target.closest ? e.target.closest('.star-rating__star') : null;
    if (!star) return;
    e.preventDefault();
    _selectedStars = parseInt(star.dataset.val, 10);
    highlightStars(_selectedStars);
  });
}());

// ── Zoom
(function () {
  var ZOOM = 3;

  var lens      = document.getElementById('zoom-lens');
  var result    = document.getElementById('zoom-result');
  var img       = document.getElementById('gallery-main-img');
  var container = document.getElementById('gallery-main');
  var panel     = document.querySelector('.product-panel');
  var lightbox  = document.getElementById('lightbox');

  if (!lens || !result || !img || !container) return;

  var rW = 0, rH = 0, lW = 0, lH = 0;

  function anchor() {
    var cr = container.getBoundingClientRect();
    var pr = panel ? panel.getBoundingClientRect() : null;

    if (pr && pr.width > 80) {
      result.style.left = pr.left + 'px';
      rW = pr.width;
    } else {
      result.style.left = (cr.right + 20) + 'px';
      rW = 400;
    }

    rH = cr.height;
    result.style.top    = cr.top + 'px';
    result.style.width  = rW + 'px';
    result.style.height = rH + 'px';

    lW = Math.round(rW / ZOOM);
    lH = Math.round(rH / ZOOM);
    lens.style.width  = lW + 'px';
    lens.style.height = lH + 'px';
  }

  function move(e) {
    var rect = img.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    var lx = Math.max(0, Math.min(x - lW / 2, rect.width  - lW));
    var ly = Math.max(0, Math.min(y - lH / 2, rect.height - lH));

    lens.style.left = lx + 'px';
    lens.style.top  = ly + 'px';

    result.style.backgroundImage    = 'url("' + img.src + '")';
    result.style.backgroundSize     = (rect.width * ZOOM) + 'px ' + (rect.height * ZOOM) + 'px';
    result.style.backgroundPosition = (-lx * ZOOM) + 'px ' + (-ly * ZOOM) + 'px';
  }

  container.addEventListener('mouseenter', function () {
    if (lightbox && lightbox.classList.contains('open')) return;
    anchor();
    lens.style.display   = 'block';
    result.style.display = 'block';
    container.classList.add('is-zooming');
  });

  container.addEventListener('mouseleave', function () {
    lens.style.display   = 'none';
    result.style.display = 'none';
    container.classList.remove('is-zooming');
  });

  container.addEventListener('mousemove', move);
  window.addEventListener('resize', function () {
    if (result.style.display === 'block') anchor();
  });
}());

// ── Page curtain
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
