/* auth.js — CSM Decor · Módulo de autenticação compartilhado v2.0 */
(function () {
  'use strict';

  var USERS_KEY   = 'csm-users';
  var SESSION_KEY = 'csm-session';

  var ROLE_COLORS = {
    admin:      '#8b5cf6',
    arquiteto:  '#1a4f8a',
    fornecedor: '#1a7a4a',
    comum:      '#F07800'
  };

  // ── Storage ───────────────────────────────────────────────────────
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (e) { return null; }
  }

  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      email:    user.email,
      name:     user.name,
      role:     user.role     || 'user',
      tipo:     user.tipo     || 'comum',
      photoUrl: user.photoUrl || '',
      ts:       Date.now()
    }));
  }

  function clearSession() { localStorage.removeItem(SESSION_KEY); }

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch (e) { return []; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function seedAdmin() {
    var users = getUsers();
    if (!users.find(function (u) { return u.email === 'admin@csmdecor.com.br'; })) {
      users.unshift({
        name: 'Admin CSM', email: 'admin@csmdecor.com.br', password: 'CSMAdmin2026',
        role: 'admin', tipo: 'comum', genero: 'masculino', photoUrl: '', bio: '', created: Date.now()
      });
      saveUsers(users);
    }
  }

  // ── Scroll ────────────────────────────────────────────────────────
  function lockScroll()   { document.body.style.overflow = 'hidden'; }
  function unlockScroll() { document.body.style.overflow = ''; }

  // ── Modal ─────────────────────────────────────────────────────────
  function openAuthModal(opts) {
    opts = opts || {};
    var el = document.getElementById('modal-auth');
    if (!el) return;
    if (opts.subtitle) {
      var sub = document.getElementById('auth-modal-sub');
      if (sub) sub.textContent = opts.subtitle;
    }
    if (typeof opts.callback === 'function') window.__authCallback = opts.callback;
    switchAuthTab('login');
    el.removeAttribute('hidden');
    lockScroll();
    setTimeout(function () {
      var inp = el.querySelector('#auth-login-email');
      if (inp) inp.focus();
    }, 120);
  }

  function closeAuthModal() {
    var el = document.getElementById('modal-auth');
    if (!el) return;
    el.setAttribute('hidden', '');
    unlockScroll();
    el.querySelectorAll('.arq-form__error').forEach(function (e) {
      e.style.display = 'none'; e.textContent = '';
    });
  }

  // ── Tabs ──────────────────────────────────────────────────────────
  function switchAuthTab(tab) {
    document.querySelectorAll('#modal-auth .auth-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.panel === tab);
    });
    document.querySelectorAll('#modal-auth .auth-panel').forEach(function (p) {
      p.classList.toggle('active', p.id === 'auth-panel-' + tab);
    });
  }

  // ── Tipo selection ────────────────────────────────────────────────
  function switchRegisterTipo(tipo) {
    document.querySelectorAll('#modal-auth .auth-tipo__opt').forEach(function (opt) {
      opt.classList.toggle('selected', opt.dataset.tipo === tipo);
    });
    document.querySelectorAll('#modal-auth .auth-tipo__extra').forEach(function (ex) {
      ex.hidden = ex.dataset.tipo !== tipo;
    });
  }

  function getSelectedTipo() {
    var sel = document.querySelector('#modal-auth .auth-tipo__opt.selected');
    return sel ? sel.dataset.tipo : 'comum';
  }

  // ── Gênero selection ──────────────────────────────────────────────
  function switchGenero(genero) {
    document.querySelectorAll('#modal-auth .auth-genero__opt').forEach(function (opt) {
      opt.classList.toggle('selected', opt.dataset.genero === genero);
    });
  }

  function getSelectedGenero() {
    var sel = document.querySelector('#modal-auth .auth-genero__opt.selected');
    return sel ? sel.dataset.genero : '';
  }

  // ── Login ─────────────────────────────────────────────────────────
  function doLogin() {
    var email = val('auth-login-email').toLowerCase().trim();
    var pass  = val('auth-login-pass');
    var errEl = document.getElementById('auth-login-error');
    hideErr(errEl);
    if (!email || !pass) return showErr(errEl, 'Preencha e-mail e senha.');
    var user = getUsers().find(function (u) {
      return u.email.toLowerCase() === email && u.password === pass;
    });
    if (!user) return showErr(errEl, 'E-mail ou senha incorretos.');
    afterAuth(user);
  }

  // ── Register ──────────────────────────────────────────────────────
  function doRegister() {
    var name  = val('auth-reg-name').trim();
    var email = val('auth-reg-email').toLowerCase().trim();
    var pass  = val('auth-reg-pass');
    var tipo  = getSelectedTipo();
    var cau   = val('auth-reg-cau').trim();
    var cnpj  = val('auth-reg-cnpj').trim();
    var errEl = document.getElementById('auth-reg-error');
    hideErr(errEl);
    if (!name || !email)  return showErr(errEl, 'Preencha nome e e-mail.');
    if (pass.length < 6)  return showErr(errEl, 'Senha deve ter ao menos 6 caracteres.');
    var users = getUsers();
    if (users.find(function (u) { return u.email.toLowerCase() === email; })) {
      return showErr(errEl, 'E-mail já cadastrado. Faça login.');
    }
    var genero = getSelectedGenero();
    var newUser = {
      name: name, email: email, password: pass,
      role: 'user', tipo: tipo, genero: genero, cau: cau, cnpj: cnpj,
      photoUrl: '', bio: '', instagram: '', created: Date.now()
    };
    users.push(newUser);
    saveUsers(users);
    afterAuth(newUser);
  }

  // ── Google Login (demo) ───────────────────────────────────────────
  function doGoogleLogin() {
    var email = prompt('Demo — informe seu e-mail Google:');
    if (!email) return;
    email = email.trim().toLowerCase();
    var users = getUsers();
    var user  = users.find(function (u) { return u.email.toLowerCase() === email; });
    if (!user) {
      user = {
        name: email.split('@')[0], email: email, password: '',
        role: 'user', tipo: 'comum', photoUrl: '', bio: '', created: Date.now()
      };
      users.push(user);
      saveUsers(users);
    }
    afterAuth(user);
  }

  // ── Logout ────────────────────────────────────────────────────────
  function doLogout() {
    if (!confirm('Deseja sair da sua conta?')) return;
    clearSession();
    updateHeaderAuth();
    if (window.location.pathname.match(/perfil\.html/)) {
      window.location.href = 'index.html';
    }
  }

  // ── After auth (caminho comum para login/register/google) ─────────
  function afterAuth(user) {
    setSession(user);
    closeAuthModal();
    updateHeaderAuth();
    if (typeof window.__authCallback === 'function') {
      var cb = window.__authCallback;
      window.__authCallback = null;
      setTimeout(cb, 80);
    }
  }

  // ── Header: atualiza botão Cadastro ↔ Perfil ──────────────────────
  function updateHeaderAuth() {
    var session = getSession();
    var btn = document.querySelector('.header__cadastro-btn');
    if (!btn) return;

    if (session) {
      var color   = ROLE_COLORS[session.tipo] || ROLE_COLORS.comum;
      var initial = (session.name || 'U')[0].toUpperCase();
      var avatarContent = session.photoUrl
        ? '<img src="' + esc(session.photoUrl) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />'
        : '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;'
          + 'background:' + color + ';color:#fff;font-size:.55rem;font-weight:700;'
          + 'font-family:var(--font-sans);letter-spacing:.02em">' + initial + '</span>';

      var prefix = session.genero === 'feminino' ? 'Sra. '
                 : session.genero === 'masculino' ? 'Sr. ' : '';
      var firstName = (session.name || '').split(' ')[0];
      if (firstName.length > 11) firstName = firstName.slice(0, 10) + '…';
      var displayName = prefix + firstName;

      btn.innerHTML =
        '<div class="header__perfil-avatar" style="border-color:' + color + '">'
        + avatarContent
        + '</div>'
        + '<span class="header__icon-label">' + esc(displayName) + '</span>';
      btn.setAttribute('aria-label', 'Perfil de ' + session.name);
      btn.classList.add('header__perfil-chip');
      btn.onclick = function () { window.location.href = 'perfil.html'; };
    } else {
      btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
        + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        + '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>'
        + '<circle cx="9" cy="7" r="4"/>'
        + '<line x1="19" y1="8" x2="19" y2="14"/>'
        + '<line x1="22" y1="11" x2="16" y2="11"/></svg>'
        + '<span class="header__icon-label">Cadastro</span>';
      btn.setAttribute('aria-label', 'Cadastrar-se');
      btn.classList.remove('header__perfil-chip');
      btn.onclick = function () { openAuthModal(); };
    }
  }

  // ── Utilitários ───────────────────────────────────────────────────
  function val(id) { var el = document.getElementById(id); return el ? (el.value || '') : ''; }
  function showErr(el, msg) { if (!el) return; el.textContent = msg; el.style.display = 'block'; }
  function hideErr(el) { if (!el) return; el.style.display = 'none'; el.textContent = ''; }
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    seedAdmin();
    updateHeaderAuth();

    var overlay = document.getElementById('modal-auth');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeAuthModal();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var el = document.getElementById('modal-auth');
        if (el && !el.hasAttribute('hidden')) closeAuthModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── API pública ───────────────────────────────────────────────────
  window.CSMAuth = {
    getSession:         getSession,
    setSession:         setSession,
    clearSession:       clearSession,
    getUsers:           getUsers,
    saveUsers:          saveUsers,
    openAuthModal:      openAuthModal,
    closeAuthModal:     closeAuthModal,
    updateHeaderAuth:   updateHeaderAuth,
    switchAuthTab:      switchAuthTab,
    switchRegisterTipo: switchRegisterTipo,
    switchGenero:       switchGenero,
    doLogin:            doLogin,
    doRegister:         doRegister,
    doGoogleLogin:      doGoogleLogin,
    doLogout:           doLogout,
    ROLE_COLORS:        ROLE_COLORS
  };
}());
