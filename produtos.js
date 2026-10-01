'use strict';

function lockScroll()   { document.body.style.overflow = 'hidden'; }
function unlockScroll() { document.body.style.overflow = ''; }

(function(){
  var s = localStorage.getItem('csm-theme');
  if (s === 'dark') document.documentElement.setAttribute('data-theme','dark');
  var btn = document.getElementById('theme-toggle');
  if (!btn) return;
  btn.addEventListener('click', function(){
    var d = document.documentElement.getAttribute('data-theme') === 'dark';
    if (d) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('csm-theme','light'); }
    else   { document.documentElement.setAttribute('data-theme','dark'); localStorage.setItem('csm-theme','dark'); }
  });
}());

(function(){
  var h = document.getElementById('header'); if (!h) return;
  var t = false;
  window.addEventListener('scroll', function(){
    if (!t) { requestAnimationFrame(function(){ h.classList.toggle('header--scrolled', window.scrollY > 30); t=false; }); t=true; }
  }, { passive: true });
}());

(function(){
  var ov = document.getElementById('menu-overlay');
  var ob = document.getElementById('menu-toggle-btn');
  var cb = document.getElementById('menu-close-btn');
  if (!ov || !ob) return;
  function open(){ ov.removeAttribute('hidden'); requestAnimationFrame(function(){ ov.classList.add('is-open'); }); ob.setAttribute('aria-expanded','true'); lockScroll(); if(cb) cb.focus(); }
  function close(){ ov.classList.remove('is-open'); ov.addEventListener('transitionend', function h(){ ov.setAttribute('hidden',''); ov.removeEventListener('transitionend',h); }); ob.setAttribute('aria-expanded','false'); unlockScroll(); ob.focus(); }
  ob.addEventListener('click', open);
  if (cb) cb.addEventListener('click', close);
  ov.querySelectorAll('.menu-nav__link').forEach(function(l){ l.addEventListener('click', close); });
  document.addEventListener('keydown', function(e){ if (e.key==='Escape' && !ov.hasAttribute('hidden')) close(); });
}());

function openModal(id){ var el=document.getElementById(id); if(!el) return; el.removeAttribute('hidden'); lockScroll(); var c=el.querySelector('.modal__close'); if(c) c.focus(); }
function closeModal(id){ var el=document.getElementById(id); if(!el) return; el.setAttribute('hidden',''); unlockScroll(); if(id==='modal-arquiteto'){ var fw=document.getElementById('arq-form-wrap'); var sw=document.getElementById('arq-success'); if(fw) fw.hidden=false; if(sw) sw.hidden=true; } }
document.querySelectorAll('.modal-overlay').forEach(function(ov){ ov.addEventListener('click', function(e){ if(e.target===ov) closeModal(ov.id); }); });
document.addEventListener('keydown', function(e){ if(e.key==='Escape') document.querySelectorAll('.modal-overlay:not([hidden])').forEach(function(m){ closeModal(m.id); }); });

function navigateToProduct(card) {
  var name  = (card.querySelector('.cat-card__name') || {}).textContent || '';
  var badge = card.querySelector('.cat-card__badge');
  var tipo  = card.dataset.tipo || 'sofa';
  var tag   = (card.querySelector('.cat-card__tagline') || {}).textContent || '';
  var imgs  = []; try { imgs = JSON.parse(card.dataset.imgs || '[]'); } catch(_) {}
  var wpp   = card.dataset.wpp || '';
  var glb   = card.dataset.glb || '';
  var desc  = card.dataset.description || '';
  var specs = []; try { specs = JSON.parse(card.dataset.specs || '[]'); } catch(_) {}
  if (!specs.length) {
    card.querySelectorAll('.cat-specs__row').forEach(function(row) {
      var k = (row.querySelector('dt') || {}).textContent || '';
      var v = (row.querySelector('dd') || {}).textContent || '';
      if (k) specs.push({ key: k, val: v });
    });
  }
  var statusEl = card.querySelector('.cat-card__status');
  try {
    localStorage.setItem('csm-produto-current', JSON.stringify({
      id: card.dataset.id || '', name: name, badge: badge ? badge.textContent : '',
      status: card.dataset.status || '',
      statusLabel: statusEl ? statusEl.textContent.trim() : '',
      tipo: tipo, tagline: tag, imgs: imgs, wpp: wpp, glb: glb, specs: specs,
      description: desc
    }));
  } catch(_) {}
  window.location.href = 'produto.html?id=' + (card.dataset.id || '');
}

function openProductModal(card){
  var img   = card.querySelector('img');
  var badge = card.querySelector('.cat-card__badge');
  var name  = card.querySelector('.cat-card__name').textContent;
  var tag   = card.querySelector('.cat-card__tagline').textContent;
  var wpp   = card.dataset.wpp;

  document.getElementById('modal-produto-title').textContent = name;
  document.getElementById('modal-tagline').textContent       = tag;
  document.getElementById('modal-wpp-btn').href              = wpp;
  var mb = document.getElementById('modal-badge');
  if (mb && badge) mb.textContent = badge.textContent;

  var mi = document.getElementById('modal-img-main');
  var imgs = JSON.parse(card.dataset.imgs || '[]');
  if (mi) { mi.src = imgs[0] || (img ? img.src : ''); mi.alt = name; }

  var thumbs = document.getElementById('modal-thumbs');
  if (thumbs) {
    thumbs.innerHTML = '';
    imgs.forEach(function(src, i){
      var t = document.createElement('div'); t.className='modal__thumb'+(i===0?' active':'');
      var ti = document.createElement('img'); ti.src=src; ti.loading='lazy';
      t.appendChild(ti);
      t.addEventListener('click', function(){ thumbs.querySelectorAll('.modal__thumb').forEach(function(x){ x.classList.remove('active'); }); t.classList.add('active'); if(mi) mi.src=src; });
      thumbs.appendChild(t);
    });
  }

  var specsEl = document.getElementById('modal-specs');
  if (specsEl) {
    specsEl.innerHTML = '';
    try {
      var specs = JSON.parse(card.dataset.specs || '[]');
      if (specs.length) {
        var dl = document.createElement('dl'); dl.className='cat-specs__list';
        specs.forEach(function(s){
          var row=document.createElement('div'); row.className='cat-specs__row';
          var dt=document.createElement('dt'); dt.textContent=s.key;
          var dd=document.createElement('dd'); dd.textContent=s.val;
          row.appendChild(dt); row.appendChild(dd); dl.appendChild(row);
        });
        specsEl.appendChild(dl);
      }
    } catch(_){}
  }
  openModal('modal-produto');
}

var activeFilter = 'all';
var activeSearch  = '';

var ALL_CARDS = (function () {
  return Array.from(document.querySelectorAll('.cat-card')).map(function (card) {
    var name    = (card.querySelector('.cat-card__name')    || {}).textContent || '';
    var tagline = (card.querySelector('.cat-card__tagline') || {}).textContent || '';
    var badge   = (card.querySelector('.cat-card__badge')   || {}).textContent || '';
    var tipo    = card.dataset.tipo        || '';
    var forn    = card.dataset.fornecedor  || '';
    var kw      = card.dataset.keywords    || '';
    var specs   = [];
    try { specs = JSON.parse(card.dataset.specs || '[]'); } catch (_) {}
    var specText = specs.map(function (s) { return (s.key || '') + ' ' + (s.val || ''); }).join(' ');
    card._searchText = [name, tagline, badge, tipo, specText, forn, kw, card.dataset.description || ''].join(' ');
    return card;
  });
}());

function normStr(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

var SYNONYMS = {
  'casal':        'cama quarto dormitorio',
  'solteiro':     'cama quarto dormitorio',
  'cama':         'quarto casal solteiro dormitorio',
  'quarto':       'cama dormitorio cabeceira',
  'sala':         'sofa poltrona living estar',
  'jantar':       'mesa cadeira sala-jantar',
  'escritorio':   'corporativo office trabalho',
  'gourmet':      'area-gourmet banqueta banco mocho',
  'puff':         'puf complemento banco',
  'reclinavel':   'poltrona reclinavel',
  'retratil':     'sofa retratil',
  'modular':      'modular sofa',
  'chesterfield': 'sofa classico',
  'couro':        'couro leather',
  'veludo':       'veludo velvet',
  'madeira':      'madeira estrutura',
};

function expandQuery(nq) {
  var terms = [nq];
  Object.keys(SYNONYMS).forEach(function (key) {
    var nkey = normStr(key);
    if (nq === nkey || nkey.indexOf(nq) !== -1 || nq.indexOf(nkey) !== -1) {
      SYNONYMS[key].split(' ').forEach(function (syn) {
        var nsyn = normStr(syn);
        if (terms.indexOf(nsyn) === -1) terms.push(nsyn);
      });
    }
  });
  return terms;
}

var _cntTimer;
function updateCounter(vis) {
  var el    = document.getElementById('csb-counter');
  var total = ALL_CARDS.length;
  if (!el) return;
  var searching = activeSearch && activeSearch.length >= 2;
  var filtered  = activeFilter !== 'all';
  var showCount = searching || (filtered && vis < total);
  if (!showCount) { el.classList.remove('csb-counter--active'); el.textContent = ''; return; }
  var label = vis + (vis < total ? ' de ' + total : '') + ' produto' + (vis !== 1 ? 's' : '');
  if (el.textContent !== label) {
    el.classList.add('csb-counter--tick');
    clearTimeout(_cntTimer);
    _cntTimer = setTimeout(function () { el.classList.remove('csb-counter--tick'); }, 220);
  }
  el.textContent = label;
  el.classList.add('csb-counter--active');
}

function applyFilters() {
  var nq    = normStr(activeSearch).trim();
  var cat   = activeFilter;
  var empty = document.getElementById('cat-empty');
  var vis   = 0;
  var delay = 0;
  ALL_CARDS.forEach(function (card) {
    var matchesCat    = cat === 'all' || card.dataset.tipo === cat || (cat === 'promocao' && card.dataset.status === 'promocao');
    var matchesSearch = nq.length < 2 || (function () {
      var text  = normStr(card._searchText);
      var terms = expandQuery(nq);
      return terms.some(function (t) { return text.indexOf(t) !== -1; });
    }());
    var show = matchesCat && matchesSearch;
    var wasHidden = card.style.display === 'none';
    if (show) {
      card.style.display = '';
      if (wasHidden) {
        card.style.animationDelay = delay + 'ms';
        card.classList.remove('csb-reveal');
        void card.offsetWidth;
        card.classList.add('csb-reveal');
        delay = Math.min(delay + 32, 240);
      }
      vis++;
    } else {
      card.style.display = 'none';
      card.classList.remove('csb-reveal');
    }
  });
  if (empty) empty.hidden = vis > 0;
  updateCounter(vis);
  requestAnimationFrame(function () { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh(); });
}

function setFilter(cat) {
  activeFilter = cat;
  document.querySelectorAll('[data-cat]').forEach(function (b) {
    var a = b.dataset.cat === cat;
    b.classList.toggle('active', a);
    b.setAttribute('aria-selected', a ? 'true' : 'false');
  });
  var url = new URL(window.location);
  if (cat === 'all') url.searchParams.delete('categoria'); else url.searchParams.set('categoria', cat);
  history.replaceState(null, '', url);
  applyFilters();
}

(function(){
  var p = new URLSearchParams(window.location.search);
  var c = p.get('categoria') || 'all';
  setFilter(c);
}());

document.querySelectorAll('[data-cat]').forEach(function(b){ b.addEventListener('click', function(){ setFilter(b.dataset.cat); }); });

(function(){
  if (typeof gsap==='undefined'||typeof ScrollTrigger==='undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.utils.toArray('.cat-card').forEach(function(card, i){
    gsap.fromTo(card, {opacity:0,y:28}, {opacity:1,y:0,duration:.55,ease:'power2.out',delay:(i%3)*.06,scrollTrigger:{trigger:card,start:'top 88%',once:true}});
  });
}());

(function(){
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem('csm-moodboard')||'[]'); } catch(_){}
  function updateBadge(){ var b=document.getElementById('moodboard-badge'); if(b){ b.textContent=saved.length; b.hidden=saved.length===0; } if(window.updatePillFavBadge) window.updatePillFavBadge(); }
  updateBadge();
  document.querySelectorAll('.cat-card').forEach(function(card){
    var fig=card.querySelector('.cat-card__fig'); var nm=card.querySelector('.cat-card__name'); if(!fig||!nm) return;
    var btn=document.createElement('button'); btn.className='cat-card__save'; btn.type='button'; btn.setAttribute('aria-label','Salvar nos favoritos'); btn.setAttribute('aria-pressed','false');
    btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    fig.appendChild(btn);
    var n=nm.textContent.trim(); var imgEl=card.querySelector('img'); var src=imgEl?imgEl.src:'';
    var isSaved=saved.some(function(s){return s.name===n;});
    if(isSaved){btn.classList.add('is-saved');btn.setAttribute('aria-pressed','true');}
    btn.addEventListener('click',function(e){ e.stopPropagation(); var idx=saved.findIndex(function(s){return s.name===n;}); if(idx>-1){saved.splice(idx,1);btn.classList.remove('is-saved');btn.setAttribute('aria-pressed','false');}else{saved.push({name:n,img:src,tipo:card.dataset.tipo||''});btn.classList.add('is-saved');btn.setAttribute('aria-pressed','true');} try{localStorage.setItem('csm-moodboard',JSON.stringify(saved));}catch(_){} updateBadge(); });
  });
  var mb=document.getElementById('moodboard-header-btn');
  if(mb) mb.addEventListener('click',function(){window.location.href='moodboard.html';});
}());

function submitArqForm(e){ e.preventDefault(); var fw=document.getElementById('arq-form-wrap'); var sw=document.getElementById('arq-success'); if(fw) fw.hidden=true; if(sw) sw.hidden=false; }
function simulateGoogleLogin(){ submitArqForm({preventDefault:function(){}}); }

var sb=document.getElementById('header-search-btn');
if(sb) sb.addEventListener('click',function(){ var inp=document.getElementById('csb-input'); if(inp){ inp.scrollIntoView({behavior:'smooth',block:'center'}); inp.focus(); } });

var an=document.getElementById('ano'); if(an) an.textContent=new Date().getFullYear();

(function () {
  var inp     = document.getElementById('csb-input');
  var hintEl  = document.getElementById('csb-hint');
  var clrBtn  = document.getElementById('csb-clear');
  var chipsEl = document.getElementById('csb-chips');
  var csbEl   = document.getElementById('csb');
  if (!inp) return;

  var HINTS = ['Pesquisar produtos…','Chesterfield…','Poltrona Ondine…','Couro natural…','Sofá retrátil…','Shoulder…','Madeira maciça…','Veludo…','Pier…','Reclinável…'];
  var hintIdx = 0;
  if (hintEl) hintEl.textContent = HINTS[0];

  setInterval(function () {
    if (inp.value || document.activeElement === inp || !hintEl) return;
    hintEl.classList.add('csb-hint--out');
    setTimeout(function () {
      hintIdx = (hintIdx + 1) % HINTS.length;
      hintEl.textContent = HINTS[hintIdx];
      hintEl.classList.remove('csb-hint--out');
    }, 300);
  }, 3400);

  inp.addEventListener('focus', function () {
    if (hintEl) hintEl.style.opacity = '0';
    if (csbEl)  csbEl.classList.add('csb--focused');
  });
  inp.addEventListener('blur', function () {
    if (hintEl && !inp.value) hintEl.style.opacity = '1';
    if (csbEl)  csbEl.classList.remove('csb--focused');
  });

  var debTimer;
  inp.addEventListener('input', function () {
    activeSearch = inp.value;
    clrBtn.hidden = !inp.value;
    if (hintEl) hintEl.style.opacity = inp.value ? '0' : '1';
    if (chipsEl) chipsEl.querySelectorAll('.csb__chip').forEach(function (c) { c.classList.remove('is-active'); });
    clearTimeout(debTimer);
    debTimer = setTimeout(applyFilters, 140);
  });

  clrBtn.addEventListener('click', function () {
    inp.value    = '';
    activeSearch = '';
    clrBtn.hidden = true;
    if (hintEl) hintEl.style.opacity = '1';
    if (chipsEl) chipsEl.querySelectorAll('.csb__chip').forEach(function (c) { c.classList.remove('is-active'); });
    inp.focus();
    applyFilters();
  });

  if (chipsEl) {
    chipsEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.csb__chip');
      if (!chip) return;
      var q = chip.dataset.q || '';
      var already = chip.classList.contains('is-active');
      chipsEl.querySelectorAll('.csb__chip').forEach(function (c) { c.classList.remove('is-active'); });
      if (already) {
        inp.value = ''; activeSearch = ''; clrBtn.hidden = true;
        if (hintEl) hintEl.style.opacity = '1';
      } else {
        chip.classList.add('is-active');
        inp.value = q; activeSearch = q; clrBtn.hidden = false;
        if (hintEl) hintEl.style.opacity = '0';
      }
      inp.focus();
      applyFilters();
    });
  }

  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (inp.value) {
        inp.value = ''; activeSearch = ''; clrBtn.hidden = true;
        if (hintEl) hintEl.style.opacity = '1';
        if (chipsEl) chipsEl.querySelectorAll('.csb__chip').forEach(function (c) { c.classList.remove('is-active'); });
        applyFilters();
      } else { inp.blur(); }
      e.preventDefault();
    }
    if (e.key === 'Enter') {
      var first = document.querySelector('.cat-card:not([style*="display: none"])');
      if (first) { inp.blur(); first.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      e.preventDefault();
    }
  });

  if (window.location.hash === '#buscar') {
    setTimeout(function () {
      inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inp.focus();
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }, 350);
  }

  (function () {
    var p = new URLSearchParams(window.location.search);
    var b = p.get('busca');
    if (!b) return;
    inp.value = b;
    activeSearch = b;
    clrBtn.hidden = false;
    if (hintEl) hintEl.style.opacity = '0';
    applyFilters();
    setTimeout(function () {
      inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      inp.focus();
    }, 350);
  }());
}());

(function () {
  var id = new URLSearchParams(window.location.search).get('autoopen');
  if (!id) return;
  var card = document.querySelector('.cat-card[data-id="' + id + '"]');
  if (card && typeof navigateToProduct === 'function') navigateToProduct(card);
}());

/* ── Page curtain ── */
(function(){
  var curtain=document.getElementById('page-curtain'); if(!curtain) return;
  var ease='cubic-bezier(.77,0,.175,1)';
  requestAnimationFrame(function(){ requestAnimationFrame(function(){
    curtain.style.transition='transform .72s '+ease; curtain.style.transform='translateY(-100%)';
    curtain.addEventListener('transitionend',function(){ curtain.style.pointerEvents='none'; },{once:true});
  }); });
  document.addEventListener('click',function(e){
    var link=e.target.closest('a[href]'); if(!link) return;
    var href=link.getAttribute('href');
    if(!href||href.charAt(0)==='#') return;
    if(/^(https?:\/\/|\/\/|mailto:|tel:)/.test(href)) return;
    if(link.target==='_blank') return;
    if(href.indexOf('.html')===-1) return;
    e.preventDefault();
    try{sessionStorage.setItem('csm-pt','1');}catch(_){}
    curtain.style.transition='none'; curtain.style.transform='translateY(100%)'; curtain.style.pointerEvents='all';
    curtain.offsetHeight;
    curtain.style.transition='transform .65s '+ease; curtain.style.transform='translateY(0)';
    curtain.addEventListener('transitionend',function(){ window.location.href=href; },{once:true});
  });
}());

/* ── Cat-ticker: scroll JS com freio/aceleração e drag ── */
(function () {
  var ticker = document.querySelector('.cat-ticker');
  var track  = document.querySelector('.cat-ticker__track');
  if (!ticker || !track) return;

  track.style.animation = 'none';

  var SPEED   = 58;
  var EASE    = 0.055;
  var pos     = 0;
  var current = SPEED;
  var target  = SPEED;
  var dragging   = false;
  var hovered    = false;
  var dragStartX = 0;
  var dragStartP = 0;
  var lastTs     = null;

  function half() { return track.scrollWidth / 2; }

  function wrap(p) {
    var h = half();
    if (!h) return p;
    while (p <= -h) p += h;
    while (p >   0) p -= h;
    return p;
  }

  function tick(ts) {
    if (lastTs === null) lastTs = ts;
    var dt = Math.min(ts - lastTs, 50) / 1000;
    lastTs = ts;
    current += (target - current) * (1 - Math.pow(1 - EASE, dt * 60));
    if (!dragging) {
      pos = wrap(pos - current * dt);
    }
    track.style.transform = 'translateX(' + pos.toFixed(2) + 'px)';
    requestAnimationFrame(tick);
  }

  ticker.addEventListener('mouseenter', function () { hovered = true; target  = 0; });
  ticker.addEventListener('mouseleave', function () { hovered = false; if (!dragging) target = SPEED; });

  ticker.style.cursor = 'grab';
  ticker.addEventListener('mousedown', function (e) {
    dragging   = true; dragStartX = e.clientX; dragStartP = pos;
    ticker.style.cursor = 'grabbing'; target = 0; current = 0; e.preventDefault();
  });
  window.addEventListener('mousemove', function (e) { if (!dragging) return; pos = wrap(dragStartP + (e.clientX - dragStartX)); });
  window.addEventListener('mouseup', function () {
    if (!dragging) return; dragging = false; ticker.style.cursor = 'grab'; target = hovered ? 0 : SPEED;
  });

  ticker.addEventListener('touchstart', function (e) {
    dragging = true; dragStartX = e.touches[0].clientX; dragStartP = pos; target = 0; current = 0;
  }, { passive: true });
  window.addEventListener('touchmove', function (e) { if (!dragging) return; pos = wrap(dragStartP + (e.touches[0].clientX - dragStartX)); }, { passive: true });
  window.addEventListener('touchend', function () { if (!dragging) return; dragging = false; target = SPEED; });

  requestAnimationFrame(tick);
}());

/* ── Cat-ticker: momentum-based ── */
(function () {
  var el    = document.querySelector('.cat-ticker');
  var track = el && el.querySelector('.cat-ticker__track');
  if (!el || !track) return;

  var AUTO  = 0.80;
  var SLOW  = 0.15;
  var LERP  = 0.055;
  var DECAY = 0.88;

  var halfW    = 0;
  var pos      = 0;
  var speed    = AUTO;
  var targetS  = AUTO;
  var dragging = false;
  var lastX    = 0;
  var momentum = 0;

  track.style.animation = 'none';

  function measure() { halfW = track.scrollWidth / 2; }
  measure();
  window.addEventListener('resize', measure);

  function wrap(p) {
    p = p % halfW;
    return p > 0 ? p - halfW : p;
  }

  function tick() {
    if (!dragging) {
      if (Math.abs(momentum) > 0.05) {
        pos      = wrap(pos + momentum);
        momentum *= DECAY;
      } else {
        momentum  = 0;
        speed    += (targetS - speed) * LERP;
        pos       = wrap(pos - speed);
      }
    }
    track.style.transform = 'translate3d(' + pos.toFixed(2) + 'px,0,0)';
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  el.addEventListener('mouseenter', function () { if (!dragging) targetS = SLOW; });
  el.addEventListener('mouseleave', function () { targetS = AUTO; });

  function dragStart(x) { dragging = true; lastX = x; momentum = 0; el.style.cursor = 'grabbing'; }
  function dragMove(x) { if (!dragging) return; var delta = x - lastX; pos = wrap(pos + delta); momentum = delta; lastX = x; }
  function dragEnd() { if (!dragging) return; dragging = false; el.style.cursor = 'grab'; }

  el.addEventListener('mousedown',  function (e) { e.preventDefault(); dragStart(e.clientX); });
  window.addEventListener('mousemove',  function (e) { dragMove(e.clientX); });
  window.addEventListener('mouseup',    function ()  { dragEnd(); });

  el.addEventListener('touchstart', function (e) { dragStart(e.touches[0].clientX); }, { passive: true });
  el.addEventListener('touchmove',  function (e) { dragMove(e.touches[0].clientX); }, { passive: true });
  el.addEventListener('touchend',   function ()  { dragEnd(); });

  el.style.cursor = 'grab';
}());

/* ── Card image hover cycling ── */
(function () {
  document.querySelectorAll('.cat-card').forEach(function (card) {
    var imgs = [];
    try { imgs = JSON.parse(card.dataset.imgs || '[]'); } catch (_) {}
    if (imgs.length < 2) return;
    var img = card.querySelector('.cat-card__fig img');
    if (!img) return;
    var idx = 0, timer = null;
    card.addEventListener('mouseenter', function () {
      idx = 0;
      timer = setInterval(function () {
        idx = (idx + 1) % imgs.length;
        img.style.opacity = '0';
        setTimeout(function () { img.src = imgs[idx]; img.style.opacity = '1'; }, 200);
      }, 1400);
    });
    card.addEventListener('mouseleave', function () {
      clearInterval(timer);
      timer = null;
      img.src = imgs[0];
      img.style.opacity = '1';
    });
  });
}());

/* ── Card click → navigateToProduct ── */
(function () {
  document.querySelectorAll('.cat-card').forEach(function (card) {
    card.addEventListener('click', function () {
      if (typeof navigateToProduct === 'function') navigateToProduct(card);
    });
  });
}());

/* ── View toggle duo/solo ── */
(function () {
  var grid    = document.getElementById('catalogo-grid');
  var btnDuo  = document.getElementById('btn-duo');
  var btnSolo = document.getElementById('btn-solo');
  var countEl = document.getElementById('view-count');
  if (!grid || !btnDuo || !btnSolo) return;

  var _busy = false;

  function updateCount() {
    var visible = grid.querySelectorAll('.cat-card:not([hidden]):not([style*="display: none"])').length;
    if (countEl) countEl.textContent = visible + ' produto' + (visible !== 1 ? 's' : '');
  }

  function visibleCards() {
    return Array.from(grid.querySelectorAll('.cat-card')).filter(function (c) {
      return c.style.display !== 'none' && !c.hasAttribute('hidden');
    });
  }

  function applyMode(mode) {
    var isSolo = mode === 'solo';
    grid.classList.toggle('catalogo__grid--solo', isSolo);
    btnDuo.classList.toggle('active', !isSolo);
    btnSolo.classList.toggle('active', isSolo);
    btnDuo.setAttribute('aria-pressed', String(!isSolo));
    btnSolo.setAttribute('aria-pressed', String(isSolo));
    try { localStorage.setItem('csm-view-pref', mode); } catch (_) {}
  }

  function setView(mode, animate) {
    if (!animate) { applyMode(mode); return; }
    if (_busy) return;
    _busy = true;

    var cards = visibleCards();

    cards.forEach(function (c) { c.classList.add('cat-card--exit'); });

    setTimeout(function () {
      applyMode(mode);
      cards.forEach(function (c, i) {
        c.classList.remove('cat-card--exit');
        c.style.animationDelay = Math.min(i * 32, 220) + 'ms';
        c.classList.add('cat-card--enter');
      });

      setTimeout(function () {
        cards.forEach(function (c) {
          c.classList.remove('cat-card--enter');
          c.style.animationDelay = '';
        });
        _busy = false;
      }, 700);

    }, 230);
  }

  var saved = 'duo';
  try { saved = localStorage.getItem('csm-view-pref') || 'duo'; } catch (_) {}
  setView(saved, false);
  updateCount();

  btnDuo.addEventListener('click',  function () { setView('duo',  true); });
  btnSolo.addEventListener('click', function () { setView('solo', true); });

  var observer = new MutationObserver(updateCount);
  observer.observe(grid, { childList: false, attributes: true, subtree: true, attributeFilter: ['hidden', 'style'] });
}());

/* ── Pill nav ── */
(function () {
  var track = document.querySelector('.pill-nav__track');
  if (!track) return;
  var indicator = track.querySelector('.pill-nav__indicator');
  var items = track.querySelectorAll('.pill-nav__item');
  var activeIdx = 0;
  items.forEach(function (item, i) {
    if (item.classList.contains('pill-nav__item--active')) activeIdx = i;
  });
  function place(idx, animate) {
    if (!animate) indicator.style.transition = 'none';
    var w = track.offsetWidth / items.length;
    indicator.style.transform = 'translateY(-50%) translateX(' + (idx * w + w / 2 - 33) + 'px)';
    if (!animate) requestAnimationFrame(function () { indicator.style.transition = ''; });
  }
  place(activeIdx, false);
  window.addEventListener('resize', function () { place(activeIdx, false); });
  items.forEach(function (item, i) {
    item.addEventListener('click', function () {
      items.forEach(function (el) { el.classList.remove('pill-nav__item--active'); });
      item.classList.add('pill-nav__item--active');
      activeIdx = i;
      place(i, true);
    });
  });

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function updatePillNavConta() {
    var btn = document.getElementById('pill-nav-conta');
    if (!btn) return;
    var session = window.CSMAuth ? CSMAuth.getSession() : null;
    if (session) {
      var color    = ((window.CSMAuth && CSMAuth.ROLE_COLORS) || {})[session.tipo] || '#F07800';
      var initial  = (session.name || 'U')[0].toUpperCase();
      var prefix   = session.genero === 'feminino'  ? 'Sra. '
                   : session.genero === 'masculino' ? 'Sr. '  : '';
      var firstName = (session.name || '').split(' ')[0];
      if (firstName.length > 8) firstName = firstName.slice(0, 7) + '…';
      var avatarHTML = session.photoUrl
        ? '<img class="pill-nav__avatar" src="' + esc(session.photoUrl) + '" alt="">'
        : '<span class="pill-nav__avatar pill-nav__avatar--initial" style="background:' + esc(color) + '">' + esc(initial) + '</span>';
      btn.innerHTML = avatarHTML + '<span class="pill-nav__label">' + esc(prefix + firstName) + '</span>';
      btn.setAttribute('aria-label', 'Perfil de ' + esc(session.name));
      btn.onclick = function () { window.location.href = 'perfil.html'; };
    } else {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
        + '<span class="pill-nav__label">Entrar</span>';
      btn.setAttribute('aria-label', 'Entrar na conta');
      btn.onclick = function () { if (window.CSMAuth) CSMAuth.openAuthModal(); };
    }
  }
  updatePillNavConta();
  if (window.CSMAuth && CSMAuth.ready) {
    CSMAuth.ready.then(function () {
      updatePillNavConta();
      var orig = CSMAuth.updateHeaderAuth;
      CSMAuth.updateHeaderAuth = function () { orig.call(this); updatePillNavConta(); };
    });
  }

  window.updatePillFavBadge = function () {
    var b = document.getElementById('pill-fav-badge');
    if (!b) return;
    var n = 0;
    try { n = (JSON.parse(localStorage.getItem('csm-moodboard') || '[]') || []).length; } catch (_) {}
    b.textContent = n;
    b.hidden = n === 0;
  };
  updatePillFavBadge();
  window.addEventListener('storage', function (e) { if (e.key === 'csm-moodboard') updatePillFavBadge(); });
}());

/* ── Wire static inline handlers ── */
(function () {
  var cadastroBtn = document.querySelector('.header__cadastro-btn');
  if (cadastroBtn) cadastroBtn.addEventListener('click', function () { openModal('modal-arquiteto'); });

  var emptyAllBtn = document.querySelector('#cat-empty .btn');
  if (emptyAllBtn) emptyAllBtn.addEventListener('click', function () { setFilter('all'); });

  var modalProdutoClose = document.querySelector('#modal-produto .modal__close');
  if (modalProdutoClose) modalProdutoClose.addEventListener('click', function () { closeModal('modal-produto'); });

  var modalArqClose = document.querySelector('#modal-arquiteto .modal__close');
  if (modalArqClose) modalArqClose.addEventListener('click', function () { closeModal('modal-arquiteto'); });

  var googleBtn = document.querySelector('.btn-google');
  if (googleBtn) googleBtn.addEventListener('click', simulateGoogleLogin);

  var arqForm = document.querySelector('.arq-form');
  if (arqForm) arqForm.addEventListener('submit', submitArqForm);

  var arqSuccessClose = document.querySelector('#arq-success .btn');
  if (arqSuccessClose) arqSuccessClose.addEventListener('click', function () { closeModal('modal-arquiteto'); });
}());
