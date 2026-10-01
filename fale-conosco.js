/* fale-conosco.js */

// ── Dark mode ────────────────────────────────────────────────
(function () {
  var saved = localStorage.getItem('csm-theme');
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

  var btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function updateLabel() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.setAttribute('data-label', isDark ? 'Tema claro' : 'Tema escuro');
  }
  updateLabel();

  btn.addEventListener('click', function () {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('csm-theme', isDark ? 'light' : 'dark');
    updateLabel();
  });
}());

// ── Header scroll ────────────────────────────────────────────
(function () {
  var header = document.getElementById('header');
  function onScroll() { header.classList.toggle('header--scrolled', window.scrollY > 50); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}());

// ── Abas ─────────────────────────────────────────────────────
(function () {
  var tabs   = document.querySelectorAll('.fc-tab');
  var panels = document.querySelectorAll('.fc-panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('aria-controls');

      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      panels.forEach(function (p) {
        p.classList.remove('is-active');
        p.setAttribute('hidden', '');
      });

      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      var panel = document.getElementById(target);
      if (panel) { panel.classList.add('is-active'); panel.removeAttribute('hidden'); }
    });
  });
}());

// ── Exibir nome do arquivo selecionado ───────────────────────
(function () {
  var input    = document.getElementById('cv-arquivo');
  var nameSpan = document.getElementById('cv-file-name');
  if (!input || !nameSpan) return;
  input.addEventListener('change', function () {
    if (input.files && input.files[0]) {
      nameSpan.textContent = '✓ ' + input.files[0].name;
      nameSpan.style.display = 'block';
    }
  });
}());

// ── Submissão dos formulários ────────────────────────────────
async function submitContact(e, tipo) {
  e.preventDefault();
  var form  = e.target;
  var honey = form.querySelector('[name="_honey"]');
  if (honey && honey.value) return;
  var btn     = form.querySelector('[type="submit"]');
  var success = document.getElementById('success-' + tipo);
  var subjects = { loja: 'Fale Conosco — CSM Decor', curriculo: 'Currículo (candidatura) — CSM Decor' };
  if (btn) btn.disabled = true;
  var fd = new FormData(form);
  fd.append('_subject', subjects[tipo] || 'Contato — CSM Decor');
  try {
    await fetch('https://formsubmit.co/ajax/contato@csmdecor.com.br', {
      method: 'POST',
      body: fd,
      headers: { 'Accept': 'application/json' }
    });
  } catch (_) {}
  if (!success) return;
  form.style.display = 'none';
  success.classList.add('is-visible');
}

// Wire form submits — replaces onsubmit= attributes
(function () {
  var formLoja = document.getElementById('form-loja');
  if (formLoja) formLoja.addEventListener('submit', function(e) { submitContact(e, 'loja'); });

  var formCurriculo = document.getElementById('form-curriculo');
  if (formCurriculo) formCurriculo.addEventListener('submit', function(e) { submitContact(e, 'curriculo'); });
}());

// ── Footer year ──────────────────────────────────────────────
var anoFooter = document.getElementById('ano-footer');
if (anoFooter) anoFooter.textContent = new Date().getFullYear();

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
