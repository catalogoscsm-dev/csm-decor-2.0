/* perfil.js — extraído de perfil.html para permitir CSP sem unsafe-inline */
'use strict';

/* ── Revela a página (remove cortina preta) ─────────────────────── */
(function () {
  var curtain = document.getElementById('page-curtain');
  if (!curtain) return;
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      curtain.style.transition = 'transform .72s cubic-bezier(.77,0,.175,1)';
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
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
    e.preventDefault();
    curtain.style.transition = 'transform .45s cubic-bezier(.77,0,.175,1)';
    curtain.style.transform  = 'translateY(0)';
    curtain.style.pointerEvents = 'all';
    curtain.addEventListener('transitionend', function () {
      window.location.href = href;
    }, { once: true });
  });
}());

/* ── Main ─────────────────────────────────────────────────────────── */

document.getElementById('ano').textContent = new Date().getFullYear();

// ── Tema ─────────────────────────────────────────────────────────
(function () {
  var saved = localStorage.getItem('csm-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('theme-toggle').addEventListener('click', function () {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('csm-theme', next);
  });
}());

// ── Inicialização assíncrona — aguarda Supabase resolver sessão ──────
var _publicEmail = new URLSearchParams(location.search).get('user') || '';
var _isReset     = new URLSearchParams(location.search).get('reset') === '1';

CSMAuth.ready().then(function (readySession) {
  if (_isReset && readySession) {
    showPasswordResetUI();
  } else if (!readySession && !_publicEmail) {
    window.location.replace('index.html');
  } else if (readySession) {
    initPerfil();
  }
});

// ── Inicializa perfil ─────────────────────────────────────────────
function initPerfil() {
  var session = CSMAuth.getSession();
  if (!session) return;

  var p = CSMAuth.getProfile() || {};
  var user = {
    id:        session.id,
    email:     session.email,
    name:      p.name      || session.name,
    tipo:      p.tipo      || session.tipo,
    genero:    p.genero    || session.genero,
    photoUrl:  p.photo_url || '',
    bio:       p.bio       || '',
    instagram: p.instagram || '',
    cau:       p.cau       || '',
    cnpj:      p.cnpj      || '',
    isPartner: p.is_partner || false,
    role:      p.role      || session.role
  };

  // Avatar e header
  renderAvatar(user);

  // Role badge
  var badge   = document.getElementById('js-role-badge');
  var roleMap = { admin: 'Admin', arquiteto: 'Arquiteto', fornecedor: 'Fornecedor', comum: 'Cliente' };
  var color   = CSMAuth.ROLE_COLORS[user.tipo] || CSMAuth.ROLE_COLORS.comum;
  badge.textContent = roleMap[user.tipo] || 'Cliente';
  badge.style.background = color;
  if (user.tipo && user.tipo !== 'comum') badge.classList.add('perfil-role-badge--' + user.tipo);

  // Partner badge
  var partnerBadge = document.getElementById('js-partner-badge');
  if (user.isPartner) {
    partnerBadge.innerHTML = '<span class="perfil-partner-badge__shimmer" aria-hidden="true"></span>&#10022; Parceiro Oficial';
    partnerBadge.classList.add('perfil-partner-badge--ativo');
  } else {
    partnerBadge.textContent = 'Solicitar Parceria';
    partnerBadge.classList.add('perfil-partner-badge--inativo');
  }
  partnerBadge.removeAttribute('hidden');

  // Infos
  var namePrefix = user.genero === 'masculino' ? 'Sr. ' : user.genero === 'feminino' ? 'Sra. ' : '';
  document.getElementById('js-perfil-name').textContent  = namePrefix + (user.name || session.name);
  document.getElementById('js-perfil-email').textContent = user.email || session.email;

  var bioEl = document.getElementById('js-perfil-bio');
  bioEl.hidden = !user.bio;
  bioEl.textContent = user.bio || '';

  // Social
  var socialEl = document.getElementById('js-perfil-social');
  socialEl.hidden = false;
  if (user.instagram) {
    // Permite apenas caracteres válidos de handle do Instagram (sem XSS possível)
    var instaHandle = user.instagram.replace(/^@/, '').replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 30);
    var link = document.createElement('a');
    link.className = 'perfil-social-link';
    link.href = 'https://instagram.com/' + instaHandle;
    link.target = '_blank';
    link.rel = 'noopener';
    // SVG é estático — seguro usar innerHTML aqui
    link.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>';
    link.appendChild(document.createTextNode('@' + instaHandle));
    socialEl.innerHTML = '';
    socialEl.appendChild(link);
  } else {
    socialEl.hidden = true;
  }

  // Stats
  var reviews   = getUserReviews(user.email);
  var favorites = getFavorites();
  var moodboard = getMoodboardItems();

  document.getElementById('js-stat-avaliacoes').textContent = reviews.length;
  document.getElementById('js-stat-favoritos').textContent  = favorites.length;
  document.getElementById('js-stat-moodboard').textContent  = moodboard.length;

  // Moodboard tab: visível apenas para arquitetos
  if (user.tipo === 'arquiteto' || user.tipo === 'admin') {
    document.getElementById('js-tab-moodboard').classList.add('visible');
    document.getElementById('js-stat-moodboard-wrap').style.display = '';
  }

  // Catálogo tab: visível apenas para fornecedores (e admin)
  if (user.tipo === 'fornecedor' || user.tipo === 'admin') {
    document.getElementById('js-tab-catalogo').classList.add('visible');
    renderCatalogo(user.email);
  }

  // Edit form: pré-preenche
  document.getElementById('edit-name').value      = user.name || '';
  document.getElementById('edit-bio').value       = user.bio || '';
  document.getElementById('edit-instagram').value = user.instagram || '';
  document.getElementById('edit-cau').value       = user.cau || '';
  document.getElementById('edit-cnpj').value      = user.cnpj || '';
  setPhotoUI(user.photoUrl || null);

  if (user.tipo === 'arquiteto')  document.getElementById('js-edit-cau-row').style.display  = '';
  if (user.tipo === 'fornecedor') document.getElementById('js-edit-cnpj-row').style.display = '';

  // Renderiza paineis
  renderAvaliacoes(reviews, true);
  renderFavoritos(favorites);
  renderMoodboard(moodboard);
}

// ── Avatar ────────────────────────────────────────────────────────
function renderAvatar(user) {
  var wrap    = document.getElementById('js-avatar-wrap');
  var initial = document.getElementById('js-avatar-initial');
  var color   = CSMAuth.ROLE_COLORS[user.tipo] || CSMAuth.ROLE_COLORS.comum;
  wrap.style.borderColor = color;
  if (user.photoUrl) {
    var img = document.createElement('img');
    img.src = user.photoUrl;           // atribuído via propriedade — sem interpolação de string
    img.alt = user.name || '';         // idem
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    var firstLetter = (user.name || 'U')[0].toUpperCase();
    img.addEventListener('error', function () {
      var div = document.createElement('div');
      div.className = 'perfil-hero__avatar-initial';
      div.style.background = color;
      div.textContent = firstLetter;
      wrap.innerHTML = '';
      wrap.appendChild(div);
    });
    wrap.innerHTML = '';
    wrap.appendChild(img);
  } else {
    initial.textContent = (user.name || 'U')[0].toUpperCase();
    initial.style.background = color;
  }
}

// ── Dados ─────────────────────────────────────────────────────────
function getUserReviews(email) {
  var all = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (!key || !key.startsWith('csm-reviews-')) continue;
    try {
      var arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.forEach(function(r) {
        if (r.email === email) all.push(Object.assign({}, r, { _storageKey: key }));
      });
    } catch(_) {}
  }
  return all.sort(function(a, b){ return b.id - a.id; });
}

function getMbKey() {
  try {
    var s = window.CSMAuth ? CSMAuth.getSession()
          : JSON.parse(localStorage.getItem('csm-session') || 'null');
    return s && s.email ? 'csm-moodboard-' + s.email : 'csm-moodboard-guest';
  } catch(_) { return 'csm-moodboard-guest'; }
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(getMbKey()) || '[]'); } catch(_) { return []; }
}

function getMoodboardItems() {
  return getFavorites();
}

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

// Animação de remoção de card em 2 fases: fade → colapso de altura
function animateRemoveCard(wrap, callback) {
  if (!wrap) { callback(); return; }
  wrap.style.transition   = 'opacity .22s ease, transform .22s ease';
  wrap.style.opacity      = '0';
  wrap.style.transform    = 'scale(.97) translateY(-6px)';
  wrap.style.pointerEvents = 'none';
  setTimeout(function() {
    var h = wrap.offsetHeight;
    wrap.style.transition = 'none';
    wrap.style.overflow   = 'hidden';
    wrap.style.maxHeight  = h + 'px';
    void wrap.offsetHeight;
    wrap.style.transition   = 'max-height .28s ease, margin-bottom .28s ease';
    wrap.style.maxHeight    = '0';
    wrap.style.marginBottom = '0';
    setTimeout(callback, 300);
  }, 230);
}

var _editStars = 0;

// ── Renderiza avaliações ──────────────────────────────────────────
function renderAvaliacoes(reviews, isOwner) {
  var container = document.getElementById('js-avaliacoes-list');
  if (!reviews.length) {
    container.innerHTML = '<div class="perfil-empty">'
      + '<div class="perfil-empty__icon">★</div>'
      + '<p class="perfil-empty__title">Nenhuma avaliação ainda</p>'
      + '<p class="perfil-empty__sub">Visite a <a href="produtos.html">página de produtos</a> e compartilhe sua experiência.</p>'
      + '</div>';
    return;
  }
  var pencilSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  var trashSvg  = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
  container.innerHTML = reviews.map(function(r) {
    var productId = (r._storageKey || '').replace('csm-reviews-', '');
    var stars = Array.from({length: 5}, function(_, i) {
      return i < r.stars
        ? '<svg class="star-icon" width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
        : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }).join('');
    var sKey = esc(r._storageKey || '');
    var rId  = Number(r.id);
    var ownerActions = isOwner !== false
      ? '<button class="review-action-btn review-action-btn--edit" onclick="event.stopPropagation();openEditProfileReview(\'' + sKey + '\',' + rId + ')">' + pencilSvg + ' Editar</button>'
        + '<button class="review-action-btn review-action-btn--delete" onclick="event.stopPropagation();deleteProfileReview(\'' + sKey + '\',' + rId + ')">' + trashSvg + ' Excluir</button>'
      : '';
    return '<div class="perfil-review-wrap" data-review-id="' + rId + '" style="margin-bottom:1rem;border:1px solid var(--gray-line);border-radius:var(--r-lg);overflow:hidden;">'
      + '<a href="' + (productId ? 'produto.html?id=' + productId : 'produtos.html') + '" class="perfil-review-link" style="text-decoration:none;display:block;color:inherit">'
      + '<article class="google-review-card" style="margin-bottom:0;border:none;border-radius:0;">'
      + '<div class="google-review-card__header">'
      + '<div class="google-review-card__meta"><div class="google-review-card__name">' + esc(r.product || 'Produto') + '</div><div class="google-review-card__date">' + esc(r.date || '') + '</div></div>'
      + '<div class="google-review-card__stars">' + stars + '</div>'
      + '</div>'
      + '<p class="google-review-card__text" style="-webkit-line-clamp:unset">' + esc(r.text) + '</p>'
      + '</article></a>'
      + (ownerActions ? '<div class="review-actions" style="border-top:1px solid var(--gray-line);display:flex;align-items:center;flex-wrap:wrap;gap:0;">' + ownerActions + '</div>' : '')
      + '</div>';
  }).join('');

  // Animação escalonada de entrada nos cards
  container.querySelectorAll('.perfil-review-wrap').forEach(function(w, i) {
    w.style.animationDelay = (i * 0.07) + 's';
    w.classList.add('review-entering');
  });
}

function openEditProfileReview(storageKey, id) {
  var arr = [];
  try { arr = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch(_) {}
  var review = arr.find(function(r){ return r.id === id; });
  if (!review) return;
  _editStars = review.stars;
  var wrap = document.querySelector('.perfil-review-wrap[data-review-id="' + id + '"]');
  if (!wrap) return;
  var starsHtml = [1,2,3,4,5].map(function(n) {
    return '<svg class="pedit-star" data-val="' + n + '" onclick="setEditStar(' + n + ')" width="22" height="22" viewBox="0 0 24 24"'
      + ' fill="' + (n <= _editStars ? '#F59E0B' : 'none') + '"'
      + ' stroke="#F59E0B" stroke-width="1.5" style="cursor:pointer;transition:transform .15s" role="button" tabindex="0"'
      + ' onmouseenter="this.style.transform=\'scale(1.2)\'" onmouseleave="this.style.transform=\'scale(1)\'">'
      + '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  }).join('');
  var safeKey = storageKey.replace(/'/g,"\\'");
  wrap.innerHTML = '<div style="padding:1.25rem 1.25rem 1rem;background:var(--white,#fff);border-left:3px solid var(--orange,#F07800);">'
    + '<p style="font-family:var(--font-serif,serif);font-size:1rem;font-weight:400;letter-spacing:.02em;color:var(--dark,#1E1E1E);margin:0 0 .75rem">Editar avaliação</p>'
    + '<div id="pedit-stars-wrap" style="display:flex;gap:.3rem;margin-bottom:.85rem">' + starsHtml + '</div>'
    + '<textarea id="pedit-text" rows="4" style="width:100%;padding:.6rem .75rem;border:1px solid var(--gray-line,rgba(0,0,0,.12));border-radius:8px;font-size:.85rem;resize:vertical;font-family:inherit;box-sizing:border-box;background:var(--off-white,#F7F6F3);color:var(--dark,#1E1E1E);">' + esc(review.text) + '</textarea>'
    + '<div style="display:flex;gap:.5rem;margin-top:.75rem;justify-content:flex-end">'
    + '<button onclick="initPerfil()" class="review-action-btn" style="border-color:var(--gray-line);color:var(--gray-dark);">Cancelar</button>'
    + '<button onclick="saveEditProfileReview(\'' + safeKey + '\',' + id + ')" style="padding:.35rem 1.1rem;background:var(--orange,#F07800);color:#fff;border:none;border-radius:20px;cursor:pointer;font-size:.7rem;font-weight:600;font-family:var(--font-sans,sans-serif);letter-spacing:.04em;text-transform:uppercase;transition:background .2s;" onmouseover="this.style.background=\'var(--orange-dark,#C86200)\'" onmouseout="this.style.background=\'var(--orange,#F07800)\'">Salvar</button>'
    + '</div>'
    + '</div>';
}

function setEditStar(n) {
  _editStars = n;
  document.querySelectorAll('.pedit-star').forEach(function(s) {
    s.setAttribute('fill', parseInt(s.dataset.val, 10) <= n ? '#F59E0B' : 'none');
  });
}

function saveEditProfileReview(storageKey, id) {
  var ta   = document.getElementById('pedit-text');
  var text = ta ? ta.value.trim() : '';
  if (!text || text.length < 10) { alert('Escreva pelo menos 10 caracteres.'); return; }
  if (!_editStars) { alert('Selecione uma nota de 1 a 5 estrelas.'); return; }
  try {
    var arr = JSON.parse(localStorage.getItem(storageKey) || '[]');
    var idx = arr.findIndex(function(r){ return r.id === id; });
    if (idx > -1) {
      arr[idx].text  = text;
      arr[idx].stars = _editStars;
      arr[idx].date  = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    localStorage.setItem(storageKey, JSON.stringify(arr));
  } catch(_) {}
  initPerfil();
}

function deleteProfileReview(storageKey, id) {
  luxuryConfirm('Excluir avaliação?', 'Esta ação não poderá ser desfeita.', function() {
    var wrap = document.querySelector('.perfil-review-wrap[data-review-id="' + id + '"]');
    animateRemoveCard(wrap, function() {
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      try {
        var arr = JSON.parse(localStorage.getItem(storageKey) || '[]');
        localStorage.setItem(storageKey, JSON.stringify(arr.filter(function(r){ return r.id !== id; })));
      } catch(_) {}
      var countEl = document.getElementById('js-stat-avaliacoes');
      if (countEl) countEl.textContent = Math.max(0, (parseInt(countEl.textContent, 10) || 0) - 1);
      var container = document.getElementById('js-avaliacoes-list');
      if (container && !container.querySelector('.perfil-review-wrap')) {
        container.innerHTML = '<div class="perfil-empty">'
          + '<div class="perfil-empty__icon">★</div>'
          + '<p class="perfil-empty__title">Nenhuma avaliação ainda</p>'
          + '<p class="perfil-empty__sub">Visite a <a href="produtos.html">página de produtos</a> e compartilhe sua experiência.</p>'
          + '</div>';
      }
    });
  });
}

// ── Renderiza favoritos ───────────────────────────────────────────
function renderFavoritos(items) {
  var container = document.getElementById('js-favoritos-grid');
  if (!items.length) {
    container.innerHTML = '<div class="perfil-empty">'
      + '<div class="perfil-empty__icon">♡</div>'
      + '<p class="perfil-empty__title">Nenhum favorito salvo</p>'
      + '<p class="perfil-empty__sub">Clique no ícone de favorito nos produtos para salvá-los aqui.</p>'
      + '</div>';
    return;
  }
  var xSvg = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  container.innerHTML = items.map(function(item) {
    var itemId = esc(item.id || item.name || '');
    return '<div class="perfil-fav-wrap">'
      + '<a href="' + (item.href || 'produtos.html') + '" class="perfil-fav-card">'
      + (item.img ? '<img class="perfil-fav-card__img" src="' + esc(item.img) + '" alt="' + esc(item.name) + '" loading="lazy" />' : '')
      + '<div class="perfil-fav-card__name">' + esc(item.name) + '</div>'
      + '</a>'
      + '<div class="perfil-fav-footer">'
      + '<button class="perfil-fav-remove-btn" onclick="event.preventDefault();removeFavorite(\'' + itemId + '\')">' + xSvg + ' Remover</button>'
      + '</div>'
      + '</div>';
  }).join('');
}

function removeFavorite(itemId) {
  try {
    var items = JSON.parse(localStorage.getItem(getMbKey()) || '[]');
    localStorage.setItem(getMbKey(), JSON.stringify(
      items.filter(function(i){ return (i.id || i.name || '') !== itemId; })
    ));
  } catch(_) {}
  initPerfil();
}

// ── Renderiza moodboard ───────────────────────────────────────────
function renderMoodboard(items) {
  var container = document.getElementById('js-moodboard-list');
  if (!items.length) {
    container.innerHTML = '<div class="perfil-empty">'
      + '<div class="perfil-empty__icon">⊞</div>'
      + '<p class="perfil-empty__title">Moodboard vazio</p>'
      + '<p class="perfil-empty__sub">Adicione produtos ao seu moodboard profissional para montar projetos.</p>'
      + '</div>';
    return;
  }
  container.innerHTML = items.map(function(item) {
    return '<a href="' + (item.href || 'produtos.html') + '" class="perfil-fav-card">'
      + (item.img ? '<img class="perfil-fav-card__img" src="' + esc(item.img) + '" alt="' + esc(item.name) + '" loading="lazy" />' : '')
      + '<div class="perfil-fav-card__name">' + esc(item.name) + '</div>'
      + '</a>';
  }).join('');
}

// ── Catálogo (fornecedores) ───────────────────────────────────────
var _catalogEmail = '';

function getCatalogKey(email) { return 'csm-catalogs-' + email.toLowerCase(); }

function getCatalogItems(email) {
  try { return JSON.parse(localStorage.getItem(getCatalogKey(email)) || '[]'); } catch(e) { return []; }
}

function saveCatalogItems(email, items) {
  localStorage.setItem(getCatalogKey(email), JSON.stringify(items));
}

function renderCatalogo(email) {
  _catalogEmail = email;
  var container = document.getElementById('js-catalogo-content');
  var items     = getCatalogItems(email);
  var uploadId  = 'catalog-upload-input';
  var html = '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;margin-bottom:1.25rem">'
    + '<p class="eyebrow" style="margin:0">Meus Catálogos'
    + (items.length ? ' <small style="font-size:.7rem;opacity:.55;text-transform:none;letter-spacing:0">(' + items.length + ')</small>' : '')
    + '</p>'
    + (items.length ? '<button class="btn btn--primary btn--sm" onclick="sendCatalogByEmail()">&#9993; Enviar para CSM</button>' : '')
    + '</div>'
    + '<label class="perfil-catalogo-upload" for="' + uploadId + '">'
    + '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
    + '<span class="perfil-catalogo-upload__text">Arraste ou clique para enviar</span>'
    + '<span class="perfil-catalogo-upload__hint">PDF, JPG, PNG — máx 5 MB por arquivo</span>'
    + '<input type="file" id="' + uploadId + '" accept=".pdf,image/jpeg,image/png,image/webp" multiple style="display:none" onchange="handleCatalogUpload(this)" />'
    + '</label>';

  if (items.length) {
    html += '<div class="perfil-catalogo-grid">'
      + items.map(function(item) {
          var isPdf = item.type === 'application/pdf';
          var thumb = !isPdf && item.dataUrl
            ? '<img class="perfil-catalogo-card__thumb" src="' + item.dataUrl + '" alt="' + esc(item.name) + '" />'
            : '<div class="perfil-catalogo-card__icon">'
              + (isPdf
                  ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>'
                  : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>')
              + '</div>';
          var date = new Date(item.date).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
          var size = item.size < 1024*1024
            ? Math.round(item.size/1024) + ' KB'
            : (item.size/(1024*1024)).toFixed(1) + ' MB';
          return '<div class="perfil-catalogo-card">'
            + thumb
            + '<div class="perfil-catalogo-card__body">'
            + '<p class="perfil-catalogo-card__name" title="' + esc(item.name) + '">' + esc(item.name) + '</p>'
            + '<p class="perfil-catalogo-card__meta">' + size + ' · ' + date + '</p>'
            + '</div>'
            + '<button class="perfil-catalogo-card__remove" onclick="removeCatalogItem(\'' + esc(item.id) + '\')" title="Remover" aria-label="Remover arquivo">'
            + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
            + '</button>'
            + '</div>';
        }).join('')
      + '</div>';
  } else {
    html += '<div class="perfil-empty" style="margin-top:1.5rem">'
      + '<div class="perfil-empty__icon">&#128196;</div>'
      + '<p class="perfil-empty__title">Nenhum catálogo enviado</p>'
      + '<p class="perfil-empty__sub">Envie seus catálogos e fichas técnicas para nossa equipe avaliar.</p>'
      + '</div>';
  }

  container.innerHTML = html;

  // Drag & drop
  var uploadArea = container.querySelector('.perfil-catalogo-upload');
  uploadArea.addEventListener('dragover', function(e) { e.preventDefault(); uploadArea.classList.add('is-dragover'); });
  uploadArea.addEventListener('dragleave', function() { uploadArea.classList.remove('is-dragover'); });
  uploadArea.addEventListener('drop', function(e) {
    e.preventDefault();
    uploadArea.classList.remove('is-dragover');
    handleCatalogFiles(e.dataTransfer.files);
  });
}

function handleCatalogUpload(input) {
  handleCatalogFiles(input.files);
  input.value = '';
}

function handleCatalogFiles(fileList) {
  var files   = Array.prototype.slice.call(fileList);
  var email   = _catalogEmail;
  var items   = getCatalogItems(email);
  var pending = files.length;

  if (!pending) return;

  files.forEach(function(file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo "' + file.name + '" excede 5 MB e não foi adicionado.');
      pending--;
      if (!pending) renderCatalogo(email);
      return;
    }
    var item = {
      id:   Date.now() + '-' + Math.random().toString(36).slice(2),
      name: file.name,
      type: file.type,
      size: file.size,
      date: Date.now(),
      dataUrl: null
    };
    var isImage = file.type.startsWith('image/');
    if (isImage) {
      var reader = new FileReader();
      reader.onload = function(e) {
        item.dataUrl = e.target.result;
        items.unshift(item);
        pending--;
        try {
          saveCatalogItems(email, items);
        } catch(ex) {
          items[0].dataUrl = null;
          try { saveCatalogItems(email, items); } catch(ex2) {
            alert('Espaço insuficiente no armazenamento local. Remova itens antigos.');
            items.shift();
          }
        }
        if (!pending) renderCatalogo(email);
      };
      reader.readAsDataURL(file);
    } else {
      items.unshift(item);
      pending--;
      try { saveCatalogItems(email, items); } catch(ex) {
        alert('Espaço insuficiente no armazenamento local. Remova itens antigos.');
        items.shift();
      }
      if (!pending) renderCatalogo(email);
    }
  });
}

function sendCatalogByEmail() {
  var session = CSMAuth.getSession();
  var items   = getCatalogItems(_catalogEmail);
  if (!items.length) return;

  var nome  = (session && session.name) || 'Fornecedor';
  var email = (session && session.email) || '';
  var lista = items.map(function(it, i) {
    var size = it.size < 1024*1024
      ? Math.round(it.size/1024) + ' KB'
      : (it.size/(1024*1024)).toFixed(1) + ' MB';
    return (i+1) + '. ' + it.name + ' (' + size + ')';
  }).join('\n');

  var texto = encodeURIComponent(
    'Olá, equipe CSM Decor! 👋\n\n'
    + 'Sou ' + nome + ' (' + email + ') e gostaria de enviar meus catálogos para avaliação de parceria:\n\n'
    + lista + '\n\n'
    + 'Por favor, me orientem sobre como enviar os arquivos. Obrigado(a)!'
  );

  window.open('https://wa.me/5519990034068?text=' + texto, '_blank');
}

function removeCatalogItem(id) {
  var email = _catalogEmail;
  var items = getCatalogItems(email).filter(function(i) { return i.id !== id; });
  saveCatalogItems(email, items);
  renderCatalogo(email);
}

// ── Tabs ──────────────────────────────────────────────────────────
function switchPerfilTab(tab) {
  document.querySelectorAll('.perfil-tab-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.perfil-panel').forEach(function(p) {
    p.classList.toggle('active', p.id === 'panel-' + tab);
  });
}

// ── Edit panel ────────────────────────────────────────────────────
function togglePassVis(inputId, btn) {
  var input   = document.getElementById(inputId);
  var curtain = input.parentElement.querySelector('.perfil-pass-curtain');
  var showing = input.type === 'text';

  btn.classList.toggle('is-visible', !showing);
  btn.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');

  if (!showing) {
    curtain.style.transition = 'none';
    curtain.style.transform  = 'translateX(0)';
    input.type = 'text';
    void curtain.offsetWidth;
    curtain.style.transition = 'transform .75s cubic-bezier(.4,0,.2,1)';
    curtain.style.transform  = 'translateX(110%)';
  } else {
    curtain.style.transition = 'none';
    curtain.style.transform  = 'translateX(-110%)';
    void curtain.offsetWidth;
    curtain.style.transition = 'transform .75s cubic-bezier(.4,0,.2,1)';
    curtain.style.transform  = 'translateX(0)';
    var done = function() {
      curtain.removeEventListener('transitionend', done);
      input.type = 'password';
      curtain.style.transition = 'none';
      curtain.style.transform  = 'translateX(110%)';
    };
    curtain.addEventListener('transitionend', done);
  }
}

function togglePassFields() {
  var fields = document.getElementById('js-pass-fields');
  var btn    = document.getElementById('js-btn-toggle-pass');
  var open   = fields.classList.contains('is-open');
  if (!open) {
    ['edit-pass-current','edit-pass-new','edit-pass-confirm'].forEach(function(id){
      document.getElementById(id).value = '';
    });
    document.getElementById('perfil-pass-error').style.display = 'none';
    fields.classList.add('is-open');
    btn.textContent = 'Cancelar';
  } else {
    fields.classList.remove('is-open');
    btn.textContent = 'Alterar senha';
  }
}

var _editOpen = false;
function toggleEditPanel() {
  _editOpen = !_editOpen;
  var panel = document.getElementById('js-edit-panel');
  var btn   = document.getElementById('js-btn-edit');
  var wrap  = document.getElementById('js-avatar-wrap');
  panel.hidden = !_editOpen;
  btn.textContent = _editOpen ? 'Cancelar' : 'Editar perfil';
  wrap.classList.toggle('perfil-avatar--editable', _editOpen);
  if (!_editOpen) {
    _pendingPhotoFile = null;
    _removePhoto      = false;
    initPerfil();
  }
}

// ── Upload de foto (via avatar do hero) ──────────────────────────
var _pendingPhotoFile = null;
var _removePhoto      = false;
var _savedPhotoUrl    = '';

function avatarClick() {
  if (!_editOpen) return;
  document.getElementById('edit-photo').click();
}

// SVG da câmera reutilizável (estático — seguro em innerHTML)
var _CAMERA_SVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';

function setPhotoUI(savedSrc) {
  _savedPhotoUrl = savedSrc || '';
  var wrap      = document.getElementById('js-avatar-wrap');
  var btnRemove = document.getElementById('js-btn-remove-photo');

  if (savedSrc) {
    // DOM API — sem interpolação de string com dados do usuário
    var img = document.createElement('img');
    img.src = savedSrc;
    img.alt = '';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
    var overlay = document.createElement('div');
    overlay.className = 'perfil-avatar-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = _CAMERA_SVG;
    wrap.innerHTML = '';
    wrap.appendChild(img);
    wrap.appendChild(overlay);
    btnRemove.hidden = false;
  } else {
    if (!wrap.querySelector('.perfil-avatar-overlay')) {
      var ov = document.createElement('div');
      ov.className = 'perfil-avatar-overlay';
      ov.setAttribute('aria-hidden', 'true');
      ov.innerHTML = _CAMERA_SVG;
      wrap.appendChild(ov);
    }
    btnRemove.hidden = true;
  }
}

function handlePhotoUpload(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 4 * 1024 * 1024) {
    alert('Imagem muito grande. Escolha uma com até 4 MB.');
    input.value = '';
    return;
  }
  _pendingPhotoFile = file;
  _removePhoto      = false;
  // URL.createObjectURL retorna blob: URL gerada pelo browser — não é dado do usuário
  var previewUrl = URL.createObjectURL(file);
  var wrap = document.getElementById('js-avatar-wrap');
  var img = document.createElement('img');
  img.src = previewUrl;
  img.alt = '';
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
  var overlay = document.createElement('div');
  overlay.className = 'perfil-avatar-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = _CAMERA_SVG;
  wrap.innerHTML = '';
  wrap.appendChild(img);
  wrap.appendChild(overlay);
}

// Faz resize e upload para Supabase Storage; retorna URL pública ou null
function uploadPhotoToSupabase(file, userId) {
  return new Promise(function (resolve) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var MAX = 400;
        var ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        var canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          var ext  = 'jpg';
          var path = userId + '/' + Date.now() + '.' + ext;
          var sb   = CSMAuth.supabase;
          sb.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
            .then(function (res) {
              if (res.error) { console.error('[Perfil] Upload erro:', res.error); resolve(null); return; }
              var urlRes = sb.storage.from('avatars').getPublicUrl(path);
              resolve(urlRes.data.publicUrl || null);
            });
        }, 'image/jpeg', 0.82);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function removePhoto() {
  _pendingPhotoFile = null;
  _removePhoto      = true;
  document.getElementById('edit-photo').value = '';
  var session = CSMAuth.getSession();
  var color   = CSMAuth.ROLE_COLORS[(session && session.tipo) || 'comum'];
  var initial = ((session && session.name) || 'U')[0].toUpperCase();
  var wrap    = document.getElementById('js-avatar-wrap');
  // color é string de cor predefinida (ex: "#F07800"), initial é 1 letra — ambos seguros
  wrap.innerHTML =
    '<div class="perfil-hero__avatar-initial" id="js-avatar-initial" style="background:' + color + '">' + initial + '</div>'
    + '<div class="perfil-avatar-overlay" aria-hidden="true">' + _CAMERA_SVG + '</div>';
  document.getElementById('js-btn-remove-photo').hidden = true;
}

function saveProfile() {
  var session = CSMAuth.getSession();
  if (!session) return;

  var saveBtn = document.querySelector('.perfil-edit-actions .btn--primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Salvando…'; }

  var data = {
    name:      document.getElementById('edit-name').value.trim() || session.name,
    bio:       document.getElementById('edit-bio').value.trim(),
    instagram: document.getElementById('edit-instagram').value.trim(),
    cau:       document.getElementById('edit-cau').value.trim(),
    cnpj:      document.getElementById('edit-cnpj').value.trim()
  };

  var photoPromise;
  if (_pendingPhotoFile) {
    photoPromise = uploadPhotoToSupabase(_pendingPhotoFile, session.id)
      .then(function (url) { if (url) data.photoUrl = url; });
  } else if (_removePhoto) {
    data.photoUrl = '';
    photoPromise = Promise.resolve();
  } else {
    photoPromise = Promise.resolve();
  }

  photoPromise.then(function () {
    return CSMAuth.updateUserProfile(session.email, data);
  }).then(function (ok) {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Salvar alterações'; }
    if (!ok) { alert('Erro ao salvar. Tente novamente.'); return; }
    _pendingPhotoFile = null;
    _removePhoto      = false;
    toggleEditPanel();
    initPerfil();
  });
}

// ── Alterar senha ─────────────────────────────────────────────────
function handleChangePassword() {
  var current  = (document.getElementById('edit-pass-current')  || {}).value || '';
  var newPass  = (document.getElementById('edit-pass-new')      || {}).value || '';
  var confirm  = (document.getElementById('edit-pass-confirm')  || {}).value || '';
  var errEl    = document.getElementById('perfil-pass-error');
  var btn      = document.querySelector('[onclick="handleChangePassword()"]');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  if (btn) { btn.disabled = true; btn.textContent = 'Aguarde…'; }

  CSMAuth.doChangePassword(current, newPass, confirm).then(function (result) {
    if (btn) { btn.disabled = false; btn.textContent = 'Confirmar'; }
    if (!result.ok) {
      if (errEl) { errEl.textContent = result.msg; errEl.style.display = 'block'; }
      return;
    }
    ['edit-pass-current','edit-pass-new','edit-pass-confirm'].forEach(function(id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    togglePassFields();
    alert('Senha alterada com sucesso!');
  });
}

// ── Redefinição de senha (chegou via link no e-mail) ──────────────
function showPasswordResetUI() {
  var hero = document.getElementById('perfil-hero');
  var tabs = document.querySelector('.perfil-tabs-bar');
  if (hero)   hero.style.display   = 'none';
  if (tabs)   tabs.style.display   = 'none';

  var editSection = document.getElementById('js-edit-panel');
  if (editSection) editSection.hidden = false;

  var editGrid    = document.querySelector('.perfil-edit-grid');
  var editActions = document.querySelector('.perfil-edit-actions');
  var passTitle   = document.getElementById('js-btn-toggle-pass');
  if (editGrid)    editGrid.style.display    = 'none';
  if (editActions) editActions.style.display = 'none';
  if (passTitle)   passTitle.style.display   = 'none';

  var passFields = document.getElementById('js-pass-fields');
  if (passFields) passFields.classList.add('is-open');

  var currentLabel = document.querySelector('[for="edit-pass-current"]');
  if (currentLabel) currentLabel.closest('.perfil-edit-row').style.display = 'none';

  var confirmBtn = document.querySelector('[onclick="handleChangePassword()"]');
  if (confirmBtn) {
    confirmBtn.textContent = 'Definir nova senha';
    confirmBtn.onclick = function () { handleResetPassword(); };
  }
  var cancelBtn = document.querySelector('[onclick="togglePassFields()"]');
  if (cancelBtn) cancelBtn.style.display = 'none';
}

function handleResetPassword() {
  var newPass = (document.getElementById('edit-pass-new')     || {}).value || '';
  var confirm = (document.getElementById('edit-pass-confirm') || {}).value || '';
  var errEl   = document.getElementById('perfil-pass-error');
  var btn     = document.querySelector('[onclick="handleResetPassword()"]');
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando…'; }

  CSMAuth.doSetNewPassword(newPass, confirm).then(function (result) {
    if (btn) { btn.disabled = false; btn.textContent = 'Definir nova senha'; }
    if (!result.ok) {
      if (errEl) { errEl.textContent = result.msg; errEl.style.display = 'block'; }
      return;
    }
    alert('Senha redefinida com sucesso! Você já pode usar a nova senha.');
    window.location.href = 'index.html';
  });
}

// ── Escape ────────────────────────────────────────────────────────
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Perfil público (somente leitura) ─────────────────────────────
function initPublicPerfil(targetEmail) {
  var allUsers = CSMAuth.getUsers ? CSMAuth.getUsers() : [];
  var user     = allUsers.find(function(u){ return (u.email||'').toLowerCase() === targetEmail.toLowerCase(); });

  if (!user) {
    document.getElementById('perfil-hero').innerHTML =
      '<div class="container" style="padding:4rem 0;text-align:center">'
      + '<p style="font-size:1.1rem;color:var(--gray-mid)">Perfil não encontrado.</p>'
      + '<a href="javascript:history.back()" class="btn btn--outline btn--sm" style="margin-top:1rem">← Voltar</a>'
      + '</div>';
    return;
  }

  // Oculta elementos que não fazem sentido no modo público
  ['js-edit-panel','js-edit-panel'].forEach(function(id){
    var el = document.getElementById(id); if (el) el.hidden = true;
  });
  var editPanel = document.getElementById('js-edit-panel');
  if (editPanel) editPanel.hidden = true;
  var tabBar = document.querySelector('.perfil-tabs-bar');
  if (tabBar) tabBar.hidden = true;
  var panels = document.querySelectorAll('.perfil-panel');
  panels.forEach(function(p){ p.hidden = true; });

  // Avatar e avatar overlay (remove botão de troca)
  var avatarWrap = document.getElementById('js-avatar-wrap');
  if (avatarWrap) {
    avatarWrap.onclick  = null;
    avatarWrap.title    = '';
    avatarWrap.style.cursor = 'default';
    var overlay = avatarWrap.querySelector('.perfil-avatar-overlay');
    if (overlay) overlay.hidden = true;
  }
  var removeBtn = document.getElementById('js-btn-remove-photo');
  if (removeBtn) removeBtn.hidden = true;

  // Renderiza dados do usuário-alvo
  renderAvatar(user);

  var badge    = document.getElementById('js-role-badge');
  var roleMap  = { admin: 'Admin', arquiteto: 'Arquiteto', fornecedor: 'Fornecedor', comum: 'Cliente' };
  var color    = CSMAuth.ROLE_COLORS[user.tipo] || CSMAuth.ROLE_COLORS.comum;
  badge.textContent = roleMap[user.tipo] || 'Cliente';
  badge.style.background = color;
  if (user.tipo && user.tipo !== 'comum') badge.classList.add('perfil-role-badge--' + user.tipo);

  var partnerBadge = document.getElementById('js-partner-badge');
  if (partnerBadge) {
    if (user.isPartner) {
      partnerBadge.innerHTML = '<span class="perfil-partner-badge__shimmer" aria-hidden="true"></span>&#10022; Parceiro Oficial';
      partnerBadge.classList.add('perfil-partner-badge--ativo');
    } else {
      partnerBadge.hidden = true;
    }
    partnerBadge.removeAttribute('hidden');
    if (!user.isPartner) partnerBadge.hidden = true;
  }

  var namePrefix = user.genero === 'masculino' ? 'Sr. ' : user.genero === 'feminino' ? 'Sra. ' : '';
  document.getElementById('js-perfil-name').textContent  = namePrefix + user.name;
  document.getElementById('js-perfil-email').hidden = true;

  var bioEl = document.getElementById('js-perfil-bio');
  bioEl.hidden = !user.bio;
  bioEl.textContent = user.bio || '';

  // Social — DOM API + whitelist de chars (mesmo padrão do initPerfil)
  var socialEl = document.getElementById('js-perfil-social');
  socialEl.hidden = false;
  if (user.instagram) {
    var instaHandle = user.instagram.replace(/^@/, '').replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 30);
    var pubLink = document.createElement('a');
    pubLink.className = 'perfil-social-link';
    pubLink.href = 'https://instagram.com/' + instaHandle;
    pubLink.target = '_blank';
    pubLink.rel = 'noopener';
    pubLink.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>';
    pubLink.appendChild(document.createTextNode('@' + instaHandle));
    socialEl.innerHTML = '';
    socialEl.appendChild(pubLink);
  } else { socialEl.hidden = true; }

  // Stats: apenas avaliações
  var reviews = getUserReviews(user.email);
  document.getElementById('js-stat-avaliacoes').textContent = reviews.length;
  document.getElementById('js-stat-favoritos').parentElement.hidden = true;
  var moodWrap = document.getElementById('js-stat-moodboard-wrap');
  if (moodWrap) moodWrap.hidden = true;

  // CTAs: só "Voltar"
  var ctasEl = document.querySelector('.perfil-hero__ctas');
  if (ctasEl) ctasEl.innerHTML = '<a href="javascript:history.back()" class="btn btn--outline btn--sm">← Voltar</a>';

  // Painel de avaliações público
  var panelAval = document.getElementById('panel-avaliacoes');
  if (panelAval) {
    panelAval.hidden = false;
    panelAval.classList.add('active');
    renderAvaliacoes(reviews, false);
    panelAval.querySelectorAll('.review-action-btn').forEach(function(b){ b.closest('.perfil-review-actions') && (b.closest('.perfil-review-actions').hidden = true); });
  }

  // Título da página
  document.title = 'Perfil de ' + user.name + ' — CSM Decor';
}

// ── Run ───────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    _publicEmail ? initPublicPerfil(_publicEmail) : initPerfil();
  });
} else {
  _publicEmail ? initPublicPerfil(_publicEmail) : initPerfil();
}
