/* auth.js — CSM Decor · Autenticação via Supabase v4.0
 *
 * SETUP (uma vez, antes de usar):
 *   1. Crie um projeto em https://supabase.com
 *   2. Vá em Project Settings > API e copie:
 *        Project URL  → SUPABASE_URL abaixo
 *        anon/public  → SUPABASE_ANON_KEY abaixo
 *   3. Execute supabase-schema.sql no SQL Editor do projeto
 *   4. Crie o bucket "avatars" conforme instruções no schema
 *   5. Crie a conta admin conforme instruções no schema
 *
 * DEPENDÊNCIA (antes deste script em cada HTML):
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 *
 * localStorage RESTANTE (não-sensível, não contém credenciais):
 *   csm-theme              → preferência de tema (UI)
 *   csm-moodboard-{email}  → itens de favoritos
 *   csm-reviews-{slug}     → avaliações de produtos
 *   csm-produto-current    → estado de navegação de produto
 *   sb-{ref}-auth-token    → JWT gerenciado pelo Supabase (não é senha)
 *
 * REMOVIDO (era inseguro):
 *   csm-users    → lista de usuários com senhas em texto puro ❌
 *   csm-session  → dados de sessão em texto puro               ❌
 */
(function () {
  'use strict';

  // ── CONFIGURAÇÃO — substitua pelos valores do seu projeto ────────────
  var SUPABASE_URL      = 'https://SEU-PROJETO.supabase.co';
  var SUPABASE_ANON_KEY = 'COLE-SUA-ANON-KEY-AQUI';
  var AVATARS_BUCKET    = 'avatars';
  // ────────────────────────────────────────────────────────────────────

  if (!window.supabase) {
    console.error('[CSMAuth] Supabase JS não foi carregado. Adicione o CDN antes de auth.js.');
    // Expõe API vazia para não quebrar chamadas existentes
    window.CSMAuth = {
      ready: Promise.resolve(null), getSession: function(){ return null; },
      getProfile: function(){ return null; }, openAuthModal: function(){},
      closeAuthModal: function(){}, updateHeaderAuth: function(){},
      switchAuthTab: function(){}, switchRegisterTipo: function(){},
      switchGenero: function(){}, doLogin: function(){}, doRegister: function(){},
      doGoogleLogin: function(){}, doLogout: function(){}, showVerifyPanel: function(){},
      doVerify: function(){}, resendVerifyCode: function(){}, showForgotPanel: function(){},
      doForgotRequest: function(){}, doResetPassword: function(){},
      updateUserProfile: function(){ return Promise.resolve(false); },
      updateUserPhoto: function(){ return Promise.resolve(false); },
      doChangePassword: function(){ return Promise.resolve({ ok: false, msg: 'Auth não inicializado.' }); },
      canUseMoodboard: function(){ return false; },
      requireMoodboard: function(){ return false; },
      ROLE_COLORS: { admin:'#8b5cf6', arquiteto:'#1a4f8a', fornecedor:'#1a7a4a', comum:'#F07800' }
    };
    return;
  }

  var _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // ── Estado em memória ─────────────────────────────────────────────────
  var _sbSession   = null;
  var _profile     = null;
  var _readyDone   = false;
  var _readyResolve;
  var _ready = new Promise(function (resolve) { _readyResolve = resolve; });

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var ROLE_COLORS = {
    admin:      '#8b5cf6',
    arquiteto:  '#1a4f8a',
    fornecedor: '#1a7a4a',
    comum:      '#F07800'
  };

  // ── Listener de estado de auth ────────────────────────────────────────
  _sb.auth.onAuthStateChange(function (event, session) {
    // Redireciona para perfil quando usuário chega via link de reset de senha
    if (event === 'PASSWORD_RECOVERY') {
      if (!window.location.pathname.includes('perfil.html')) {
        window.location.href = 'perfil.html?reset=1';
        return;
      }
    }

    _sbSession = session;

    if (session) {
      _sb.from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        .then(function (res) {
          _profile = res.data || null;
          updateHeaderAuth();
          _resolveReady();
        })
        .catch(function () { _resolveReady(); });
    } else {
      _profile = null;
      updateHeaderAuth();
      _resolveReady();
    }
  });

  function _resolveReady() {
    if (!_readyDone) {
      _readyDone = true;
      if (_readyResolve) _readyResolve(getSession());
    }
  }

  // ── Sessão síncrona (via cache; atualizado pelo onAuthStateChange) ────
  function getSession() {
    if (!_sbSession) return null;
    var u = _sbSession.user;
    var p = _profile || {};
    return {
      id:        u.id,
      email:     u.email,
      name:      p.name      || u.email.split('@')[0],
      role:      p.role      || 'user',
      tipo:      p.tipo      || 'comum',
      genero:    p.genero    || '',
      photoUrl:  p.photo_url || '',
      isPartner: p.is_partner || false
    };
  }

  function getProfile() { return _profile; }

  // ── Login ─────────────────────────────────────────────────────────────
  function doLogin() {
    var email = val('auth-login-email').toLowerCase().trim();
    var pass  = val('auth-login-pass');
    var errEl = document.getElementById('auth-login-error');
    var btn   = document.getElementById('auth-login-btn');
    hideErr(errEl);

    if (!email || !pass) return showErr(errEl, 'Preencha e-mail e senha.');

    setBtnLoading(btn, true);
    _sb.auth.signInWithPassword({ email: email, password: pass })
      .then(function (res) {
        setBtnLoading(btn, false);
        if (res.error) {
          var lower = (res.error.message || '').toLowerCase();
          var msg = lower.includes('email not confirmed')
            ? 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.'
            : 'E-mail ou senha incorretos.';
          return showErr(errEl, msg);
        }
        afterAuth();
      })
      .catch(function () {
        setBtnLoading(btn, false);
        showErr(errEl, 'Erro de conexão. Tente novamente.');
      });
  }

  // ── Register ──────────────────────────────────────────────────────────
  function doRegister() {
    var name   = val('auth-reg-name').trim();
    var email  = val('auth-reg-email').toLowerCase().trim();
    var pass   = val('auth-reg-pass');
    var tipo   = getSelectedTipo();
    var genero = getSelectedGenero();
    var cau    = val('auth-reg-cau').trim();
    var cnpj   = val('auth-reg-cnpj').trim();
    var errEl  = document.getElementById('auth-reg-error');
    var btn    = document.getElementById('auth-reg-btn');
    hideErr(errEl);

    if (!name)  return showErr(errEl, 'Preencha seu nome completo.');
    if (!email) return showErr(errEl, 'Preencha seu e-mail.');
    if (!EMAIL_RE.test(email)) return showErr(errEl, 'Informe um e-mail válido (ex: nome@dominio.com).');
    if (pass.length < 6) return showErr(errEl, 'Senha deve ter ao menos 6 caracteres.');
    if (tipo === 'arquiteto'  && !cau) return showErr(errEl, 'Preencha seu Registro CAU / CFT.');
    if (tipo === 'fornecedor' && cnpj.replace(/\D/g,'').length !== 14)
      return showErr(errEl, 'CNPJ inválido. Digite os 14 dígitos.');

    setBtnLoading(btn, true);
    _sb.auth.signUp({
      email: email,
      password: pass,
      options: { data: { name: name, tipo: tipo, genero: genero, cau: cau, cnpj: cnpj } }
    })
    .then(function (res) {
      setBtnLoading(btn, false);
      if (res.error) {
        var msg = (res.error.message || '').toLowerCase().includes('already registered')
          ? 'E-mail já cadastrado. Faça login.'
          : res.error.message;
        return showErr(errEl, msg);
      }
      // Se confirmação de e-mail estiver desativada, session é imediata
      if (res.data && res.data.session) {
        afterAuth();
      } else {
        showVerifyPanel(email);
      }
    })
    .catch(function () {
      setBtnLoading(btn, false);
      showErr(errEl, 'Erro de conexão. Tente novamente.');
    });
  }

  // ── Google Login ──────────────────────────────────────────────────────
  function doGoogleLogin() {
    _sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
  }

  // ── Logout ────────────────────────────────────────────────────────────
  function doLogout() {
    if (!confirm('Deseja sair da sua conta?')) return;
    _sb.auth.signOut().then(function () {
      if (window.location.pathname.match(/perfil\.html/)) {
        window.location.href = 'index.html';
      }
    });
  }

  // ── After auth ────────────────────────────────────────────────────────
  function afterAuth() {
    closeAuthModal();
    if (typeof window.__authCallback === 'function') {
      var cb = window.__authCallback;
      window.__authCallback = null;
      setTimeout(cb, 80);
    }
  }

  // ── Verificação de e-mail ─────────────────────────────────────────────
  function showVerifyPanel(email) {
    var panel = document.getElementById('auth-panel-verify');
    if (!panel) return;
    panel.dataset.email = email;
    var emailEl = panel.querySelector('.auth-verify__email');
    if (emailEl) emailEl.textContent = email;
    hideErr(document.getElementById('auth-verify-error'));
    var hint = panel.querySelector('.auth-verify__hint');
    if (hint) hint.style.display = 'none';
    switchAuthTab('verify');
  }

  // Mantido para compatibilidade com botão no HTML; fluxo agora é via link no e-mail
  function doVerify() { switchAuthTab('login'); }

  function resendVerifyCode() {
    var panel = document.getElementById('auth-panel-verify');
    if (!panel) return;
    var email = panel.dataset.email;
    if (!email) return;
    var hint = panel.querySelector('.auth-verify__hint');
    _sb.auth.resend({ type: 'signup', email: email })
      .then(function (res) {
        if (hint) {
          hint.textContent = res.error
            ? 'Erro ao reenviar. Tente em alguns minutos.'
            : 'E-mail reenviado! Verifique sua caixa de entrada (e a pasta de spam).';
          hint.style.display = 'block';
        }
      });
  }

  // ── Recuperação de senha ──────────────────────────────────────────────
  function showForgotPanel() {
    var panel = document.getElementById('auth-panel-forgot');
    if (!panel) return;
    var step1 = panel.querySelector('.auth-forgot__step1');
    var step2 = panel.querySelector('.auth-forgot__step2');
    if (step1) step1.style.display = '';
    if (step2) step2.style.display = 'none';
    hideErr(document.getElementById('auth-forgot-error'));
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

    var base = window.location.origin
      + window.location.pathname.replace(/[^/]*$/, '');
    var redirectTo = base + 'perfil.html?reset=1';

    _sb.auth.resetPasswordForEmail(email, { redirectTo: redirectTo })
      .then(function () {
        var panel = document.getElementById('auth-panel-forgot');
        if (!panel) return;
        var step1 = panel.querySelector('.auth-forgot__step1');
        var step2 = panel.querySelector('.auth-forgot__step2');
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = '';
      });
  }

  // Fluxo de redefinição concluído em perfil.html após redirect do link
  function doResetPassword() {}

  // ── Atualização de perfil ─────────────────────────────────────────────
  function updateUserProfile(emailIgnored, data) {
    var session = getSession();
    if (!session) return Promise.resolve(false);

    var updates = {};
    if (data.name      !== undefined) updates.name      = data.name;
    if (data.bio       !== undefined) updates.bio       = data.bio;
    if (data.instagram !== undefined) updates.instagram = data.instagram;
    if (data.cau       !== undefined) updates.cau       = data.cau;
    if (data.cnpj      !== undefined) updates.cnpj      = data.cnpj;
    if (data.photoUrl  !== undefined) updates.photo_url = data.photoUrl;

    return _sb.from('profiles').update(updates).eq('id', session.id)
      .then(function (res) {
        if (!res.error) {
          if (!_profile) _profile = {};
          Object.assign(_profile, updates);
          updateHeaderAuth();
        }
        return !res.error;
      });
  }

  function updateUserPhoto(emailIgnored, photoUrl) {
    return updateUserProfile(null, { photoUrl: photoUrl });
  }

  // ── Alterar senha ─────────────────────────────────────────────────────
  function doChangePassword(currentPass, newPass, confirmPass) {
    if (!currentPass || !newPass || !confirmPass)
      return Promise.resolve({ ok: false, msg: 'Preencha todos os campos.' });
    if (newPass.length < 6)
      return Promise.resolve({ ok: false, msg: 'Nova senha deve ter ao menos 6 caracteres.' });
    if (newPass !== confirmPass)
      return Promise.resolve({ ok: false, msg: 'A confirmação de senha não confere.' });

    var session = getSession();
    if (!session) return Promise.resolve({ ok: false, msg: 'Sessão inválida.' });

    // Re-autentica com a senha atual para confirmar antes de trocar
    return _sb.auth.signInWithPassword({ email: session.email, password: currentPass })
      .then(function (reauth) {
        if (reauth.error) return { ok: false, msg: 'Senha atual incorreta.' };
        return _sb.auth.updateUser({ password: newPass })
          .then(function (res) {
            if (res.error) return { ok: false, msg: res.error.message };
            return { ok: true };
          });
      });
  }

  // ── Redefinição de senha (chamada de perfil.html após link de reset) ──
  function doSetNewPassword(newPass, confirmPass) {
    if (!newPass || !confirmPass)
      return Promise.resolve({ ok: false, msg: 'Preencha todos os campos.' });
    if (newPass.length < 6)
      return Promise.resolve({ ok: false, msg: 'A senha deve ter ao menos 6 caracteres.' });
    if (newPass !== confirmPass)
      return Promise.resolve({ ok: false, msg: 'A confirmação não confere.' });

    return _sb.auth.updateUser({ password: newPass })
      .then(function (res) {
        if (res.error) return { ok: false, msg: res.error.message };
        return { ok: true };
      });
  }

  // ── Header ────────────────────────────────────────────────────────────
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
        + avatarContent + '</div>'
        + '<span class="header__icon-label">' + esc(displayName) + '</span>';
      btn.setAttribute('aria-label', 'Perfil de ' + esc(session.name));
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

  // ── Modal ─────────────────────────────────────────────────────────────
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

  // ── Tabs ──────────────────────────────────────────────────────────────
  function switchAuthTab(tab) {
    document.querySelectorAll('#modal-auth .auth-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.panel === tab);
    });
    document.querySelectorAll('#modal-auth .auth-panel').forEach(function (p) {
      p.classList.toggle('active', p.id === 'auth-panel-' + tab);
    });
  }

  // ── Tipo / Gênero ─────────────────────────────────────────────────────
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

  function switchGenero(genero) {
    document.querySelectorAll('#modal-auth .auth-genero__opt').forEach(function (opt) {
      opt.classList.toggle('selected', opt.dataset.genero === genero);
    });
  }

  function getSelectedGenero() {
    var sel = document.querySelector('#modal-auth .auth-genero__opt.selected');
    return sel ? sel.dataset.genero : '';
  }

  // ── Scroll ────────────────────────────────────────────────────────────
  function lockScroll()   { document.body.style.overflow = 'hidden'; }
  function unlockScroll() { document.body.style.overflow = ''; }

  // ── Moodboard ─────────────────────────────────────────────────────────
  function canUseMoodboard() {
    var s = getSession();
    if (!s) return false;
    return s.tipo === 'comum' || s.tipo === 'arquiteto' || s.role === 'admin';
  }

  function requireMoodboard(opts) {
    var s = getSession();
    if (!s) {
      openAuthModal(opts || { subtitle: 'Crie sua conta gratuita para salvar seus favoritos.' });
      return false;
    }
    if (!canUseMoodboard()) {
      _showMbNotice('Favoritos disponíveis apenas para Clientes e Arquitetos.');
      return false;
    }
    return true;
  }

  function _showMbNotice(msg) {
    var el = document.getElementById('csm-mb-notice');
    if (!el) {
      el = document.createElement('div');
      el.id = 'csm-mb-notice';
      el.style.cssText = [
        'position:fixed','bottom:1.5rem','left:50%','transform:translateX(-50%)',
        'background:#1a1a1a','color:#fff','padding:.65rem 1.25rem',
        'border-radius:8px','font-size:.78rem','letter-spacing:.03em',
        'z-index:99999','pointer-events:none','opacity:0',
        'transition:opacity .25s','white-space:nowrap'
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.opacity = '0'; }, 3000);
  }

  // ── Máscara CNPJ ──────────────────────────────────────────────────────
  function formatCNPJInput(input) {
    var d = input.value.replace(/\D/g, '').slice(0, 14);
    var v = d;
    if      (d.length > 12) v = d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8,12)+'-'+d.slice(12);
    else if (d.length >  8) v = d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5,8)+'/'+d.slice(8);
    else if (d.length >  5) v = d.slice(0,2)+'.'+d.slice(2,5)+'.'+d.slice(5);
    else if (d.length >  2) v = d.slice(0,2)+'.'+d.slice(2);
    input.value = v;
  }
  window.formatCNPJInput = formatCNPJInput;

  // ── Utilitários ───────────────────────────────────────────────────────
  function val(id) { var el = document.getElementById(id); return el ? (el.value || '') : ''; }
  function showErr(el, msg) { if (!el) return; el.textContent = msg; el.style.display = 'block'; }
  function hideErr(el) { if (!el) return; el.style.display = 'none'; el.textContent = ''; }
  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/"/g,'&quot;')
      .replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function setBtnLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.origLabel = btn.textContent;
      btn.textContent = 'Aguarde…';
      btn.disabled = true;
    } else {
      btn.textContent = btn.dataset.origLabel || btn.textContent;
      btn.disabled = false;
    }
  }

  // ── Painéis extras do modal ───────────────────────────────────────────
  function injectExtraPanels() {
    var modal = document.getElementById('modal-auth');
    if (!modal) return;

    var loginPanel = document.getElementById('auth-panel-login');
    var container  = loginPanel ? loginPanel.parentNode : modal;

    // IDs nos botões de submit para estado de loading
    if (loginPanel) {
      var loginSubmit = loginPanel.querySelector('.arq-form__submit');
      if (loginSubmit && !loginSubmit.id) loginSubmit.id = 'auth-login-btn';

      // Link "Esqueci minha senha"
      if (!loginPanel.querySelector('.auth-forgot-link')) {
        var forgotLink = document.createElement('p');
        forgotLink.className = 'auth-forgot-link';
        forgotLink.style.cssText = 'text-align:center;margin-top:.6rem;font-size:.8rem;';
        forgotLink.innerHTML =
          '<a href="#" onclick="event.preventDefault();CSMAuth.showForgotPanel()" '
          + 'style="color:var(--orange,#F07800);text-decoration:none;font-weight:500;">'
          + 'Esqueci minha senha</a>';
        loginPanel.appendChild(forgotLink);
      }
    }

    var registerPanel = document.getElementById('auth-panel-register');
    if (registerPanel) {
      var regSubmit = registerPanel.querySelector('.arq-form__submit');
      if (regSubmit && !regSubmit.id) regSubmit.id = 'auth-reg-btn';
    }

    // Painel de verificação — agora instrui a checar o e-mail (link, não código)
    if (!document.getElementById('auth-panel-verify')) {
      var vPanel = document.createElement('div');
      vPanel.id = 'auth-panel-verify';
      vPanel.className = 'auth-panel';
      vPanel.innerHTML = [
        '<div style="text-align:center;padding:1.25rem 0">',
          '<svg width="44" height="44" viewBox="0 0 24 24" fill="none"',
            ' stroke="var(--orange,#F07800)" stroke-width="1.5" stroke-linecap="round"',
            ' style="margin-bottom:1rem" aria-hidden="true">',
            '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>',
            '<polyline points="22,6 12,13 2,6"/>',
          '</svg>',
          '<p style="font-size:.9rem;font-weight:600;margin:0 0 .5rem;color:var(--text-main,#111)">',
            'Confirme seu e-mail',
          '</p>',
          '<p style="font-size:.82rem;color:var(--gray-mid,#888);line-height:1.55;margin:0 0 1rem">',
            'Enviamos um link de ativação para<br>',
            '<strong class="auth-verify__email" style="color:var(--text-main,#111)"></strong>.',
            '<br>Clique no link para ativar sua conta.',
          '</p>',
          '<p class="auth-verify__hint" style="display:none;background:#fffbea;color:#7a5800;',
            'border:1px solid rgba(245,200,66,.25);border-radius:6px;padding:.5rem .75rem;',
            'font-size:.8rem;margin-bottom:.75rem;font-weight:500;"></p>',
          '<p id="auth-verify-error" class="arq-form__error" style="display:none"></p>',
          '<p style="font-size:.8rem;color:var(--gray-mid,#888);margin-top:.75rem">',
            'Não recebeu? Verifique a pasta de spam ou ',
            '<a href="#" onclick="event.preventDefault();CSMAuth.resendVerifyCode()"',
              ' style="color:var(--orange,#F07800);text-decoration:none;font-weight:500;">',
              'reenvie o e-mail</a>.',
          '</p>',
        '</div>'
      ].join('');
      container.appendChild(vPanel);
    }

    // Painel de recuperação de senha — envia link por e-mail
    if (!document.getElementById('auth-panel-forgot')) {
      var fPanel = document.createElement('div');
      fPanel.id = 'auth-panel-forgot';
      fPanel.className = 'auth-panel';
      fPanel.innerHTML = [
        // Step 1: formulário de e-mail
        '<div class="auth-forgot__step1">',
          '<p style="font-size:.875rem;margin-bottom:1rem;color:var(--gray-mid,#888)">',
            'Informe o e-mail cadastrado. Enviaremos um link para redefinir sua senha.',
          '</p>',
          '<label class="arq-form__label" for="auth-forgot-email">E-mail cadastrado</label>',
          '<input id="auth-forgot-email" class="arq-form__input" type="email"',
            ' placeholder="seu@email.com" autocomplete="email" />',
          '<p id="auth-forgot-error" class="arq-form__error" style="display:none"></p>',
          '<button type="button" class="arq-form__btn" style="width:100%;margin-top:.75rem"',
            ' onclick="CSMAuth.doForgotRequest()">Enviar link de redefinição</button>',
          '<p style="text-align:center;margin-top:.75rem;font-size:.8rem">',
            '<a href="#" onclick="event.preventDefault();CSMAuth.switchAuthTab(\'login\')"',
              ' style="color:var(--orange,#F07800);text-decoration:none;font-weight:500;">',
              '← Voltar ao login</a>',
          '</p>',
        '</div>',
        // Step 2: confirmação de envio
        '<div class="auth-forgot__step2" style="display:none;text-align:center;padding:1.25rem 0">',
          '<svg width="44" height="44" viewBox="0 0 24 24" fill="none"',
            ' stroke="var(--orange,#F07800)" stroke-width="1.5" stroke-linecap="round"',
            ' style="margin-bottom:1rem" aria-hidden="true">',
            '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>',
            '<polyline points="22,6 12,13 2,6"/>',
          '</svg>',
          '<p style="font-size:.9rem;font-weight:600;margin:0 0 .5rem;color:var(--text-main,#111)">',
            'E-mail enviado!',
          '</p>',
          '<p style="font-size:.82rem;color:var(--gray-mid,#888);line-height:1.55;margin:0 0 1rem">',
            'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
            '<br>Verifique também a pasta de spam.',
          '</p>',
          '<p style="text-align:center;font-size:.8rem">',
            '<a href="#" onclick="event.preventDefault();CSMAuth.switchAuthTab(\'login\')"',
              ' style="color:var(--orange,#F07800);text-decoration:none;font-weight:500;">',
              '← Voltar ao login</a>',
          '</p>',
        '</div>'
      ].join('');
      container.appendChild(fPanel);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────
  function init() {
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

  // ── API pública ───────────────────────────────────────────────────────
  window.CSMAuth = {
    ready:              _ready,           // Promise<session|null> — aguarda init da sessão
    supabase:           _sb,              // cliente Supabase (para uso avançado)
    getSession:         getSession,       // síncrono via cache
    getProfile:         getProfile,       // retorna objeto profile da tabela profiles
    updateUserPhoto:    updateUserPhoto,
    updateUserProfile:  updateUserProfile,
    doChangePassword:   doChangePassword,
    doSetNewPassword:   doSetNewPassword, // usado em perfil.html após link de reset
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
    showVerifyPanel:    showVerifyPanel,
    doVerify:           doVerify,
    resendVerifyCode:   resendVerifyCode,
    showForgotPanel:    showForgotPanel,
    doForgotRequest:    doForgotRequest,
    doResetPassword:    doResetPassword,
    ROLE_COLORS:        ROLE_COLORS,
    canUseMoodboard:    canUseMoodboard,
    requireMoodboard:   requireMoodboard
  };
}());
