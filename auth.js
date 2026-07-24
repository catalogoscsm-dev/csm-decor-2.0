/* auth.js — CSM Decor · Módulo de autenticação compartilhado v3.0 */
(function () {
  'use strict';

  var USERS_KEY = 'csm-users';
  var SESSION_KEY = 'csm-session';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      genero:   user.genero   || '',
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

  // Atualiza foto no csm-users E na session — chamado por perfil.html
  function updateUserPhoto(email, photoUrl) {
    var lc = email.toLowerCase();
    var users = getUsers();
    var u = users.find(function (x) { return x.email.toLowerCase() === lc; });
    if (u) { u.photoUrl = photoUrl; saveUsers(users); }
    var session = getSession();
    if (session && session.email.toLowerCase() === lc) {
      session.photoUrl = photoUrl;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      updateHeaderAuth();
    }
  }

  // Atualiza campos gerais no csm-users E na session — chamado por perfil.html
  function updateUserProfile(email, data) {
    var lc = email.toLowerCase();
    var users = getUsers();
    var u = users.find(function (x) { return x.email.toLowerCase() === lc; });
    if (u) {
      ['name', 'bio', 'instagram', 'cau', 'cnpj', 'photoUrl'].forEach(function (k) {
        if (data[k] !== undefined) u[k] = data[k];
      });
      saveUsers(users);
    }
    var session = getSession();
    if (session && session.email.toLowerCase() === lc) {
      if (data.name     !== undefined) session.name     = data.name;
      if (data.photoUrl !== undefined) session.photoUrl = data.photoUrl;
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      updateHeaderAuth();
    }
  }

  // Alterar senha pelo perfil — retorna { ok, msg }
  function doChangePassword(currentPass, newPass, confirmPass) {
    var session = getSession();
    if (!session) return { ok: false, msg: 'Sessão inválida.' };
    if (!currentPass || !newPass || !confirmPass)
      return { ok: false, msg: 'Preencha todos os campos.' };
    if (newPass.length < 6)
      return { ok: false, msg: 'Nova senha deve ter ao menos 6 caracteres.' };
    if (newPass !== confirmPass)
      return { ok: false, msg: 'A confirmação de senha não confere.' };
    var users = getUsers();
    var u = users.find(function (x) { return x.email.toLowerCase() === session.email.toLowerCase(); });
    if (!u) return { ok: false, msg: 'Usuário não encontrado.' };
    if (u.password !== currentPass) return { ok: false, msg: 'Senha atual incorreta.' };
    u.password = newPass;
    saveUsers(users);
    return { ok: true };
  }

  function seedAdmin() {
    var users = getUsers();
    if (!users.find(function (u) { return u.email === 'admin@csmdecor.com.br'; })) {
      users.unshift({
        name: 'Admin CSM', email: 'admin@csmdecor.com.br', password: 'CSMAdmin2026',
        role: 'admin', tipo: 'comum', genero: 'masculino',
        photoUrl: '', bio: '', created: Date.now(), verified: true
      });
      saveUsers(users);
    }
  }

  // ── Código de verificação ─────────────────────────────────────────
  function genCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  // Placeholder para envio de e-mail.
  // Quando o EmailJS estiver configurado, substitua o corpo desta função:
  //   emailjs.send('SERVICE_ID', type==='verify' ? 'TEMPLATE_VERIFY' : 'TEMPLATE_RESET',
  //     { to_email: email, to_name: name || email.split('@')[0], code: code });
  function sendCode(email, code, type) {
    // Modo de teste: código exibido na tela (veja o painel de verificação/recuperação)
    void email; void code; void type;
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
    var users = getUsers();
    var user = users.find(function (u) {
      return u.email.toLowerCase() === email && u.password === pass;
    });
    if (!user) return showErr(errEl, 'E-mail ou senha incorretos.');
    // Se conta nova ainda não verificada, redirecionar para verificação
    if (user.verified === false) {
      var code = genCode();
      user.verificationCode = code;
      saveUsers(users);
      sendCode(user.email, code, 'verify');
      showVerifyPanel(user.email, code);
      return;
    }
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
    if (!name)  return showErr(errEl, 'Preencha seu nome completo.');
    if (!email) return showErr(errEl, 'Preencha seu e-mail.');
    if (!EMAIL_RE.test(email)) return showErr(errEl, 'Informe um endereço de e-mail válido (ex: nome@dominio.com).');
    if (pass.length < 6) return showErr(errEl, 'Senha deve ter ao menos 6 caracteres.');
    var users = getUsers();
    if (users.find(function (u) { return u.email.toLowerCase() === email; })) {
      return showErr(errEl, 'E-mail já cadastrado. Faça login.');
    }
    var genero = getSelectedGenero();
    var code = genCode();
    var newUser = {
      name: name, email: email, password: pass,
      role: 'user', tipo: tipo, genero: genero, cau: cau, cnpj: cnpj,
      photoUrl: '', bio: '', instagram: '', created: Date.now(),
      verified: false, verificationCode: code
    };
    users.push(newUser);
    saveUsers(users);
    sendCode(email, code, 'verify');
    showVerifyPanel(email, code);
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
        role: 'user', tipo: 'comum', genero: '', photoUrl: '', bio: '',
        created: Date.now(), verified: true
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

  // ── After auth ────────────────────────────────────────────────────
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

  // ── Verificação de conta ──────────────────────────────────────────
  function showVerifyPanel(email, code) {
    var panel = document.getElementById('auth-panel-verify');
    if (!panel) return;
    panel.dataset.email = email;
    var emailEl = panel.querySelector('.auth-verify__email');
    if (emailEl) emailEl.textContent = email;
    var hint = panel.querySelector('.auth-verify__hint');
    if (hint) {
      hint.textContent = 'Modo de teste — seu código: ' + (code || '');
      hint.style.display = code ? 'block' : 'none';
    }
    hideErr(document.getElementById('auth-verify-error'));
    var inp = document.getElementById('auth-verify-code');
    if (inp) inp.value = '';
    switchAuthTab('verify');
    setTimeout(function () { if (inp) inp.focus(); }, 120);
  }

  function doVerify() {
    var panel = document.getElementById('auth-panel-verify');
    if (!panel) return;
    var email = panel.dataset.email;
    var code  = val('auth-verify-code').trim();
    var errEl = document.getElementById('auth-verify-error');
    hideErr(errEl);
    if (!code) return showErr(errEl, 'Digite o código de verificação.');
    var users = getUsers();
    var u = users.find(function (x) { return x.email === email; });
    if (!u) return showErr(errEl, 'Conta não encontrada.');
    if (u.verificationCode !== code) return showErr(errEl, 'Código incorreto. Verifique e tente novamente.');
    u.verified = true;
    delete u.verificationCode;
    saveUsers(users);
    afterAuth(u);
  }

  function resendVerifyCode() {
    var panel = document.getElementById('auth-panel-verify');
    if (!panel) return;
    var email = panel.dataset.email;
    var users = getUsers();
    var u = users.find(function (x) { return x.email === email; });
    if (!u) return;
    var code = genCode();
    u.verificationCode = code;
    saveUsers(users);
    sendCode(email, code, 'verify');
    var hint = panel.querySelector('.auth-verify__hint');
    if (hint) {
      hint.textContent = 'Modo de teste — novo código: ' + code;
      hint.style.display = 'block';
    }
  }

  // ── Recuperação de senha ──────────────────────────────────────────
  function showForgotPanel() {
    var panel = document.getElementById('auth-panel-forgot');
    if (!panel) return;
    var step1 = panel.querySelector('.auth-forgot__step1');
    var step2 = panel.querySelector('.auth-forgot__step2');
    if (step1) step1.style.display = '';
    if (step2) step2.style.display = 'none';
    hideErr(document.getElementById('auth-forgot-error'));
    hideErr(document.getElementById('auth-reset-error'));
    var inp = document.getElementById('auth-forgot-email');
    if (inp) inp.value = '';
    switchAuthTab('forgot');
    setTimeout(function () { if (inp) inp.focus(); }, 120);
  }

  function doForgotRequest() {
    var email = val('auth-forgot-email').toLowerCase().trim();
    var errEl = document.getElementById('auth-forgot-error');
    hideErr(errEl);
    if (!email) return showErr(errEl, 'Informe seu e-mail.');
    if (!EMAIL_RE.test(email)) return showErr(errEl, 'Informe um e-mail válido.');
    var users = getUsers();
    var u = users.find(function (x) { return x.email === email; });
    if (!u) return showErr(errEl, 'E-mail não encontrado. Verifique ou crie uma conta.');
    var code = genCode();
    u.resetCode = code;
    u.resetExpiry = Date.now() + 15 * 60 * 1000;
    saveUsers(users);
    sendCode(email, code, 'reset');
    var panel = document.getElementById('auth-panel-forgot');
    if (!panel) return;
    panel.dataset.email = email;
    var step1 = panel.querySelector('.auth-forgot__step1');
    var step2 = panel.querySelector('.auth-forgot__step2');
    if (step1) step1.style.display = 'none';
    if (step2) step2.style.display = '';
    var hint = panel.querySelector('.auth-forgot__hint');
    if (hint) {
      hint.textContent = 'Modo de teste — código: ' + code;
      hint.style.display = 'block';
    }
    hideErr(document.getElementById('auth-reset-error'));
    var firstInp = document.getElementById('auth-reset-code');
    if (firstInp) setTimeout(function () { firstInp.focus(); }, 80);
  }

  function doResetPassword() {
    var panel = document.getElementById('auth-panel-forgot');
    if (!panel) return;
    var email    = panel.dataset.email;
    var code     = val('auth-reset-code').trim();
    var newPass  = val('auth-reset-pass');
    var confPass = val('auth-reset-confirm');
    var errEl    = document.getElementById('auth-reset-error');
    hideErr(errEl);
    if (!code || !newPass || !confPass) return showErr(errEl, 'Preencha todos os campos.');
    if (newPass.length < 6) return showErr(errEl, 'Senha deve ter ao menos 6 caracteres.');
    if (newPass !== confPass) return showErr(errEl, 'A confirmação de senha não confere.');
    var users = getUsers();
    var u = users.find(function (x) { return x.email === email; });
    if (!u) return showErr(errEl, 'Conta não encontrada.');
    if (u.resetCode !== code) return showErr(errEl, 'Código incorreto.');
    if (u.resetExpiry && Date.now() > u.resetExpiry)
      return showErr(errEl, 'Código expirado (15 min). Clique em "Voltar" e solicite um novo.');
    u.password = newPass;
    delete u.resetCode;
    delete u.resetExpiry;
    saveUsers(users);
    alert('Senha alterada com sucesso! Faça login com sua nova senha.');
    switchAuthTab('login');
  }

  // ── Header ────────────────────────────────────────────────────────
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

      var prefix = session.genero === 'feminino'  ? 'Sra. '
                 : session.genero === 'masculino' ? 'Sr. '  : '';
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

  // ── Injeção dinâmica de painéis extras no #modal-auth ─────────────
  function injectExtraPanels() {
    var modal = document.getElementById('modal-auth');
    if (!modal) return;

    // Referência ao container dos painéis existentes
    var existingPanel = document.getElementById('auth-panel-login');
    var container = existingPanel ? existingPanel.parentNode : modal;

    // Link "Esqueci minha senha" no painel de login
    var loginPanel = document.getElementById('auth-panel-login');
    if (loginPanel && !loginPanel.querySelector('.auth-forgot-link')) {
      var forgotLink = document.createElement('p');
      forgotLink.className = 'auth-forgot-link';
      forgotLink.style.cssText = 'text-align:center;margin-top:.6rem;font-size:.8rem;';
      forgotLink.innerHTML = '<a href="#" onclick="event.preventDefault();CSMAuth.showForgotPanel()" '
        + 'style="color:var(--orange,#F07800);text-decoration:none;font-weight:500;">Esqueci minha senha</a>';
      loginPanel.appendChild(forgotLink);
    }

    // ── Painel de verificação de conta ──────────────────────────────
    if (!document.getElementById('auth-panel-verify')) {
      var vPanel = document.createElement('div');
      vPanel.id = 'auth-panel-verify';
      vPanel.className = 'auth-panel';
      vPanel.innerHTML = [
        '<p style="font-size:.875rem;margin-bottom:1rem;color:var(--gray-mid,#888)">',
          'Digite o código de verificação enviado para<br>',
          '<strong class="auth-verify__email" style="color:var(--text-main,#111)"></strong>.',
        '</p>',
        '<p class="auth-verify__hint" style="display:none;background:#fffbea;color:#7a5800;',
          'border:1px solid #f5c84240;border-radius:6px;padding:.5rem .75rem;',
          'font-size:.8rem;margin-bottom:.75rem;font-weight:500;"></p>',
        '<label class="arq-form__label" for="auth-verify-code">Código de verificação</label>',
        '<input id="auth-verify-code" class="arq-form__input" type="text" maxlength="6"',
          ' placeholder="000000" autocomplete="one-time-code" inputmode="numeric" />',
        '<p id="auth-verify-error" class="arq-form__error" style="display:none"></p>',
        '<button type="button" class="arq-form__btn" style="width:100%;margin-top:.75rem"',
          ' onclick="CSMAuth.doVerify()">Confirmar código</button>',
        '<p style="text-align:center;margin-top:.75rem;font-size:.8rem">',
          'Não recebeu? ',
          '<a href="#" onclick="event.preventDefault();CSMAuth.resendVerifyCode()"',
            ' style="color:var(--orange,#F07800);text-decoration:none;font-weight:500;">',
            'Reenviar código</a>',
        '</p>'
      ].join('');
      container.appendChild(vPanel);
    }

    // ── Painel de recuperação de senha ──────────────────────────────
    if (!document.getElementById('auth-panel-forgot')) {
      var fPanel = document.createElement('div');
      fPanel.id = 'auth-panel-forgot';
      fPanel.className = 'auth-panel';
      fPanel.innerHTML = [
        // Step 1: solicitar e-mail
        '<div class="auth-forgot__step1">',
          '<p style="font-size:.875rem;margin-bottom:1rem;color:var(--gray-mid,#888)">',
            'Informe o e-mail cadastrado e enviaremos um código para redefinir sua senha.',
          '</p>',
          '<label class="arq-form__label" for="auth-forgot-email">E-mail cadastrado</label>',
          '<input id="auth-forgot-email" class="arq-form__input" type="email"',
            ' placeholder="seu@email.com" autocomplete="email" />',
          '<p id="auth-forgot-error" class="arq-form__error" style="display:none"></p>',
          '<button type="button" class="arq-form__btn" style="width:100%;margin-top:.75rem"',
            ' onclick="CSMAuth.doForgotRequest()">Enviar código</button>',
          '<p style="text-align:center;margin-top:.75rem;font-size:.8rem">',
            '<a href="#" onclick="event.preventDefault();CSMAuth.switchAuthTab(\'login\')"',
              ' style="color:var(--orange,#F07800);text-decoration:none;font-weight:500;">',
              '← Voltar ao login</a>',
          '</p>',
        '</div>',
        // Step 2: código + nova senha
        '<div class="auth-forgot__step2" style="display:none">',
          '<p class="auth-forgot__hint" style="display:none;background:#fffbea;color:#7a5800;',
            'border:1px solid #f5c84240;border-radius:6px;padding:.5rem .75rem;',
            'font-size:.8rem;margin-bottom:.75rem;font-weight:500;"></p>',
          '<label class="arq-form__label" for="auth-reset-code">Código recebido</label>',
          '<input id="auth-reset-code" class="arq-form__input" type="text" maxlength="6"',
            ' placeholder="000000" autocomplete="one-time-code" inputmode="numeric" />',
          '<label class="arq-form__label" for="auth-reset-pass" style="margin-top:.5rem">',
            'Nova senha</label>',
          '<input id="auth-reset-pass" class="arq-form__input" type="password"',
            ' placeholder="Mínimo 6 caracteres" />',
          '<label class="arq-form__label" for="auth-reset-confirm" style="margin-top:.5rem">',
            'Confirmar nova senha</label>',
          '<input id="auth-reset-confirm" class="arq-form__input" type="password"',
            ' placeholder="Repita a nova senha" />',
          '<p id="auth-reset-error" class="arq-form__error" style="display:none"></p>',
          '<button type="button" class="arq-form__btn" style="width:100%;margin-top:.75rem"',
            ' onclick="CSMAuth.doResetPassword()">Redefinir senha</button>',
          '<p style="text-align:center;margin-top:.75rem;font-size:.8rem">',
            '<a href="#" onclick="event.preventDefault();CSMAuth.showForgotPanel()"',
              ' style="color:var(--orange,#F07800);text-decoration:none;font-weight:500;">',
              '← Voltar</a>',
          '</p>',
        '</div>'
      ].join('');
      container.appendChild(fPanel);
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
    injectExtraPanels();

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
    updateUserPhoto:    updateUserPhoto,
    updateUserProfile:  updateUserProfile,
    doChangePassword:   doChangePassword,
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
    doVerify:           doVerify,
    resendVerifyCode:   resendVerifyCode,
    showVerifyPanel:    showVerifyPanel,
    showForgotPanel:    showForgotPanel,
    doForgotRequest:    doForgotRequest,
    doResetPassword:    doResetPassword,
    ROLE_COLORS:        ROLE_COLORS
  };
}());
