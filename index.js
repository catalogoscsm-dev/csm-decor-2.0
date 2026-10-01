/* index.js — scripts extraídos de index.html para permitir CSP sem unsafe-inline */
    // Helpers globais: travar/destravar scroll
    function lockScroll()   { document.body.style.overflow = 'hidden'; }
    function unlockScroll() { document.body.style.overflow = ''; }

    // Scroll suave para elemento com offset de cabeçalho
    function smoothScrollTo(target, offset) {
      var top = target.getBoundingClientRect().top + window.scrollY + (offset || -80);
      window.scrollTo({ top: top, behavior: 'smooth' });
    }

    // ── Loading Screen — dismiss e reveal ───────────────────────
    (function () {
      var ls = document.getElementById('loading-screen');
      if (!ls) return;

      // Vindo de outra página via transição de cortina: pula o loading screen
      if (sessionStorage.getItem('csm-pt')) {
        sessionStorage.removeItem('csm-pt');
        ls.remove();
        unlockScroll();
        // heroTl ainda não foi criado aqui (GSAP carrega depois); usamos flag
        window.heroShouldPlay = true;
        return;
      }

      // Reduced motion: pula tudo instantaneamente
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        ls.remove();
        return;
      }

      // Mantém scroll travado durante o loading
      lockScroll();

      function dismiss() {
        ls.classList.add('ls--done');
        ls.addEventListener('transitionend', function (e) {
          if (e.propertyName !== 'opacity') return;
          ls.remove();
          unlockScroll();
          // Dispara a animação hero após o reveal
          if (window.heroTl) window.heroTl.play();
        }, { once: true });
      }

      // Animações do loader terminam em ~1.45s → dismiss em 1.5s
      setTimeout(dismiss, 1500);
    }());

    // ── Âncoras internas → scroll suave ─────────────────────────
    document.addEventListener('click', function (e) {
      var anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      var id = anchor.getAttribute('href');
      if (id === '#') return;
      var target = document.querySelector(id);
      if (!target) return;
      // Só intercepta se o menu overlay não estiver aberto
      var overlay = document.getElementById('menu-overlay');
      if (overlay && !overlay.hasAttribute('hidden')) return;
      e.preventDefault();
      smoothScrollTo(target, -80);
    });

    // ── Utilitários ──────────────────────────────────────────────
    document.getElementById('ano').textContent = new Date().getFullYear();

    function imgFallback(img, url) {
      if (!img.dataset.fb) {
        img.dataset.fb = '1';
        img.src = url;
      } else {
        img.closest('figure').classList.add('img-fallback');
      }
    }

    // ── Header scroll ────────────────────────────────────────────
    const header  = document.getElementById('header');
    const onScroll = () => {
      header.classList.toggle('header--scrolled', window.scrollY > 10);
      const pillNav = document.querySelector('.pill-nav');
      if (pillNav) {
        pillNav.classList.toggle('pill-nav--visible', window.scrollY > window.innerHeight * 0.4);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ── Menu Overlay (LV-style) ──────────────────────────────────
    (function () {
      const toggleBtn = document.getElementById('menu-toggle-btn');
      const closeBtn  = document.getElementById('menu-close-btn');
      const overlay   = document.getElementById('menu-overlay');
      if (!toggleBtn || !overlay) return;

      const navLinks = overlay.querySelectorAll('.menu-nav__link');
      let isOpen = false;
      let openRAF = null;

      // Aplica delays escalonados em cada link
      navLinks.forEach((link, i) => {
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
        openRAF = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            overlay.classList.add('is-open');
          });
        });
      }

      function closeMenu() {
        isOpen = false;
        overlay.classList.remove('is-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.classList.remove('is-open');
        unlockScroll();
        // Aguarda transição antes de esconder
        overlay.addEventListener('transitionend', function hide(e) {
          if (e.propertyName !== 'clip-path') return;
          overlay.setAttribute('hidden', '');
          overlay.removeEventListener('transitionend', hide);
        });
      }

      toggleBtn.addEventListener('click', () => isOpen ? closeMenu() : openMenu());
      closeBtn?.addEventListener('click', closeMenu);

      // Fecha ao clicar em um link do menu + scroll suave via Lenis
      overlay.querySelectorAll('[data-menu-link]').forEach(link => {
        link.addEventListener('click', function (e) {
          var href = link.getAttribute('href');
          var target = href && href !== '#' ? document.querySelector(href) : null;
          e.preventDefault();
          closeMenu();
          if (target) {
            setTimeout(function () {
              smoothScrollTo(target, -80);
            }, 680);
          }
        });
      });

      // Escape fecha
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isOpen) closeMenu();
      });
    }());

    // ── Carrossel Ambientes — Center Mode Infinite ───────────────
    (function () {
      var CLONE_N      = 3;        // clones em cada lado
      var AUTOPLAY_MS  = 5000;
      var TRANS_MS     = 650;
      var easing       = 'cubic-bezier(0.25, 1, 0.5, 1)';

      var carousel  = document.getElementById('amb-carousel');
      var track     = document.getElementById('amb-track');
      var dotsWrap  = document.getElementById('amb-dots');
      if (!carousel || !track) return;

      // Slides originais
      var origSlides = Array.from(track.querySelectorAll('.amb-slide'));
      var n          = origSlides.length;

      // Clona head + tail para loop infinito
      var headClones = origSlides.slice(-CLONE_N).map(function (s) {
        var c = s.cloneNode(true); c.setAttribute('aria-hidden', 'true'); return c;
      });
      var tailClones = origSlides.slice(0, CLONE_N).map(function (s) {
        var c = s.cloneNode(true); c.setAttribute('aria-hidden', 'true'); return c;
      });
      headClones.forEach(function (c) { track.insertBefore(c, track.firstChild); });
      tailClones.forEach(function (c) { track.appendChild(c); });

      var allSlides = Array.from(track.querySelectorAll('.amb-slide'));
      var total     = allSlides.length; // n + 2*CLONE_N

      var current   = CLONE_N; // índice do primeiro slide real
      var locked    = false;
      var timer     = null;

      // ─── Dots
      origSlides.forEach(function (s, i) {
        var dot = document.createElement('button');
        dot.className = 'amb-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Categoria ' + (i + 1));
        dot.dataset.idx = String(i);
        dot.addEventListener('click', function () { goTo(CLONE_N + i, true); resetAutoplay(); });
        dotsWrap.appendChild(dot);
      });
      var dots = Array.from(dotsWrap.querySelectorAll('.amb-dot'));

      // ─── Cálculo do offset para centralizar o slide
      function offset(idx) {
        var vw     = carousel.offsetWidth;
        var slide  = allSlides[idx] || allSlides[0];
        var sw     = slide.offsetWidth;
        var gap    = parseFloat(getComputedStyle(track).gap) || 0;
        var center = (vw - sw) / 2;
        return -(idx * (sw + gap)) + center;
      }

      // ─── Hooks preenchidos pelos módulos abaixo (parallax, crossfade, filtros)
      var resetParallax  = function () {};
      var syncFilterBtns = function () {};
      var onCardChange   = function () {};
      var pauseCF        = function () {};   // pausar crossfade interno do card
      var resumeCF       = function () {};   // retomar crossfade

      // ─── Atualiza classes ativas
      function updateState() {
        allSlides.forEach(function (s, i) { s.classList.toggle('is-active', i === current); });
        var realIdx = ((current - CLONE_N) % n + n) % n;
        dots.forEach(function (d, i) { d.classList.toggle('is-active', i === realIdx); });
        resetParallax();
        syncFilterBtns(realIdx);
        onCardChange(realIdx);
      }

      // ─── Navega para índice
      function goTo(idx, animate) {
        if (animate === undefined) animate = true;
        if (animate) {
          track.style.transition = 'transform ' + TRANS_MS + 'ms ' + easing;
        } else {
          track.style.transition = 'none';
        }
        current = idx;
        track.style.transform = 'translateX(' + offset(idx) + 'px)';
        updateState();
        if (!animate) {
          // Força reflow para que a próxima transição funcione
          void track.offsetWidth;
        }
      }

      // ─── Loop infinito: ao terminar a transição, salta silenciosamente
      track.addEventListener('transitionend', function () {
        if (current < CLONE_N) {
          goTo(current + n, false);
        } else if (current >= CLONE_N + n) {
          goTo(current - n, false);
        }
        locked = false;
      });

      function next() {
        if (locked) return;
        locked = true;
        goTo(current + 1, true);
      }
      function prev() {
        if (locked) return;
        locked = true;
        goTo(current - 1, true);
      }

      // ─── Autoplay
      function startAutoplay() {
        stopAutoplay();
        timer = setInterval(next, AUTOPLAY_MS);
      }
      function stopAutoplay() { clearInterval(timer); }
      function resetAutoplay() { stopAutoplay(); startAutoplay(); }

      carousel.addEventListener('mouseenter', function () { stopAutoplay(); pauseCF(); });
      carousel.addEventListener('mouseleave', function () { startAutoplay(); resumeCF(); });

      // ─── Setas
      var btnPrev = document.getElementById('amb-prev');
      var btnNext = document.getElementById('amb-next');
      if (btnPrev) btnPrev.addEventListener('click', function () { prev(); resetAutoplay(); });
      if (btnNext) btnNext.addEventListener('click', function () { next(); resetAutoplay(); });

      // ─── Swipe touch
      var tx0 = 0, ty0 = 0;
      carousel.addEventListener('touchstart', function (e) {
        tx0 = e.touches[0].clientX;
        ty0 = e.touches[0].clientY;
        stopAutoplay();
        pauseCF();
      }, { passive: true });
      carousel.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - tx0;
        var dy = e.changedTouches[0].clientY - ty0;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 44) {
          dx < 0 ? next() : prev();
        }
        startAutoplay();
        resumeCF();
      }, { passive: true });

      // ─── Filtros → scroll para primeiro card + sincronização bidirecional
      var filterBtns = Array.from(document.querySelectorAll('.ambientes__filters .filter'));

      // syncFilterBtns: chamado pelo updateState a cada troca de card (autoplay/swipe/seta)
      syncFilterBtns = function (realIdx) {
        var cat = origSlides[realIdx] ? origSlides[realIdx].dataset.cat : null;
        filterBtns.forEach(function (b) {
          var matches = b.dataset.filter === cat;
          b.classList.toggle('active', matches);
          b.setAttribute('aria-selected', matches ? 'true' : 'false');
        });
      };

      // Clique no filtro → navega e marca ativo
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterBtns.forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          var f = btn.dataset.filter;
          if (f === 'all') {
            goTo(CLONE_N, true);
          } else {
            var idx = origSlides.findIndex(function (s) { return s.dataset.cat === f; });
            if (idx >= 0) goTo(CLONE_N + idx, true);
          }
          resetAutoplay();
        });
      });

      // ─── Navegação por clique no card ativo
      track.addEventListener('click', function (e) {
        var slide = e.target.closest('.amb-slide');
        if (!slide) return;
        if (!slide.classList.contains('is-active')) return;
        var card  = slide.querySelector('.amb-card');
        if (!card) return;
        if (e.target.closest('.amb-card__btn')) return;
        window.location.href = card.dataset.href;
      });

      // ─── Inicialização
      goTo(CLONE_N, false);
      startAutoplay();

      // Recalcula posição ao redimensionar
      window.addEventListener('resize', function () { goTo(current, false); });

      // ── PARALLAX 3D — Microinteração no card ativo ───────────────
      (function () {
        var MAX_PX   = 16;    // deslocamento máximo em px (~ 4% de 400px)
        var SCALE    = 1.08;  // escala de buffer anti-borda-branca
        var LERP_T   = 0.08;  // suavidade do lerp (0 = parado, 1 = instantâneo)

        var pxTarget = 0, pyTarget = 0;
        var pxCur    = 0, pyCur    = 0;
        var pActive  = false;   // true enquanto há input de mouse / gyro
        var prafId   = null;
        var pPrevImg = null;    // referência ao <img> do último card ativo

        function lerp(a, b, t) { return a + (b - a) * t; }

        function getActiveImg() {
          var s = track.querySelector('.amb-slide.is-active');
          if (!s) return null;
          var shown = s.querySelector('.amb-card__img.is-shown img');
          return shown || s.querySelector('.amb-card__img img');
        }

        function applyPx(img, x, y) {
          img.style.transform =
            'scale(' + SCALE + ') translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)';
        }

        // RAF loop — lerp suave até o target; para quando próximo de zero sem input
        function prafLoop() {
          var img = getActiveImg();

          // Detecta troca de card ativo → reseta posição
          if (img !== pPrevImg) {
            if (pPrevImg) pPrevImg.style.transform = '';
            pxCur = 0; pyCur = 0;
            pPrevImg = img;
          }

          if (!img) { prafId = null; return; }

          pxCur = lerp(pxCur, pxTarget, LERP_T);
          pyCur = lerp(pyCur, pyTarget, LERP_T);
          applyPx(img, pxCur, pyCur);

          // Encerra o loop quando próximo de zero e sem input
          if (!pActive && Math.abs(pxCur) < 0.06 && Math.abs(pyCur) < 0.06) {
            img.style.transform = '';
            pxCur = 0; pyCur = 0;
            prafId = null;
            return;
          }
          prafId = requestAnimationFrame(prafLoop);
        }

        function ensurePRAF() {
          if (!prafId) prafId = requestAnimationFrame(prafLoop);
        }

        // Expõe o reset para o hook de updateState (troca de slide)
        resetParallax = function () {
          pActive  = false;
          pxTarget = 0;
          pyTarget = 0;
          if (pPrevImg) { pPrevImg.style.transform = ''; pPrevImg = null; }
          pxCur = 0; pyCur = 0;
        };

        // ── Desktop: mousemove sobre o carrossel ─────────────────────
        carousel.addEventListener('mousemove', function (e) {
          var img = getActiveImg();
          if (!img) return;
          var card = img.closest('.amb-card');
          if (!card) return;
          var r  = card.getBoundingClientRect();
          var nx = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width  / 2) / (r.width  / 2)));
          var ny = Math.max(-1, Math.min(1, (e.clientY - r.top  - r.height / 2) / (r.height / 2)));
          pxTarget = -nx * MAX_PX;
          pyTarget = -ny * MAX_PX;
          pActive  = true;
          ensurePRAF();
        });

        carousel.addEventListener('mouseleave', function () {
          pActive  = false;
          pxTarget = 0;
          pyTarget = 0;
          ensurePRAF(); // continua o lerp de retorno ao centro
        });

        // ── Mobile: deviceorientation (giroscópio) ───────────────────
        function onOrientation(e) {
          var img = getActiveImg();
          if (!img) return;
          // gamma: inclinação esquerda/direita  (−90° a +90°)
          // beta:  inclinação frente/trás       (−180° a +180°)
          var gx = Math.max(-25, Math.min(25, e.gamma || 0)) / 25;
          var gy = Math.max(-30, Math.min(30, e.beta  || 0)) / 30;
          pxTarget = -gx * MAX_PX * 0.65;
          pyTarget = -gy * MAX_PX * 0.45;
          pActive  = true;
          ensurePRAF();
        }

        function setupGyro() {
          if (typeof DeviceOrientationEvent === 'undefined') return;
          function start() { window.addEventListener('deviceorientation', onOrientation, true); }
          // iOS 13+ exige permissão explícita
          if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            carousel.addEventListener('touchend', function askOnce() {
              DeviceOrientationEvent.requestPermission()
                .then(function (s) { if (s === 'granted') start(); })
                .catch(function () {});
              carousel.removeEventListener('touchend', askOnce);
            }, { once: true });
          } else if (window.matchMedia('(hover: none)').matches) {
            // Android e outros browsers sem API de permissão
            start();
          }
        }

        setupGyro();
      }());

      // ── CROSSFADE INTERNO — alterna até 3 imagens no card centralizado ──
      (function () {
        var FADE_MS     = 3500;  // ms entre cada imagem
        var cfTimer     = null;
        var cfIdx       = 0;
        var prevRealIdx = -1;    // rastreia qual card estava ativo antes

        // Retorna os .amb-card__img do slide real indicado
        function imgItems(realIdx) {
          var slide = origSlides[realIdx];
          return slide ? Array.from(slide.querySelectorAll('.amb-card__img')) : [];
        }

        // Troca qual imagem está visível dentro do slide
        function showImg(items, idx) {
          items.forEach(function (el, i) { el.classList.toggle('is-shown', i === idx); });
        }

        // Pausa o timer e reseta o card indicado para a 1ª imagem
        function resetCard(realIdx) {
          if (realIdx < 0) return;
          var items = imgItems(realIdx);
          if (items.length) showImg(items, 0);
        }

        function stopCF() { clearInterval(cfTimer); cfTimer = null; }

        function startCF(realIdx) {
          stopCF();
          var items = imgItems(realIdx);
          if (items.length <= 1) return;
          cfIdx = 0;
          showImg(items, 0);
          cfTimer = setInterval(function () {
            cfIdx = (cfIdx + 1) % items.length;
            showImg(imgItems(realIdx), cfIdx);
          }, FADE_MS);
        }

        // Hook chamado pelo updateState a cada troca de card ativo
        onCardChange = function (realIdx) {
          // 1. Para o timer e reseta o card que acabou de sair do centro
          if (prevRealIdx >= 0 && prevRealIdx !== realIdx) {
            stopCF();
            resetCard(prevRealIdx);
          }
          prevRealIdx = realIdx;
          // 2. Inicia crossfade no novo card central
          startCF(realIdx);
        };

        // Inicializa no card 0
        onCardChange(0);

        // Expõe controle de pause para o hover e touch do carrossel externo
        pauseCF  = stopCF;
        resumeCF = function () { startCF(prevRealIdx); };
      }());

    }());

    // ── Marquee — desaceleração suave no hover e touch ──────────
    (function () {
      var marquee = document.querySelector('.amb-marquee');
      if (!marquee) return;

      var tracks  = Array.from(marquee.querySelectorAll('.amb-marquee__track'));
      var rafId   = null;
      var SLOW_MS = 700;   // ms para flutuar até parar
      var FAST_MS = 450;   // ms para retomar velocidade

      function getAnims() {
        var list = [];
        tracks.forEach(function (t) {
          t.getAnimations().forEach(function (a) { list.push(a); });
        });
        return list;
      }

      function animateTo(target, dur) {
        if (rafId) cancelAnimationFrame(rafId);
        var anims = getAnims();
        if (!anims.length) return;
        var from  = anims[0].playbackRate;
        var start = null;

        function tick(now) {
          if (!start) start = now;
          var t = Math.min((now - start) / dur, 1);
          // ease-out quart ao parar (flutua até zero); ease-in-out cubic ao retomar
          var e = target === 0
            ? 1 - Math.pow(1 - t, 4)
            : t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          var rate = from + (target - from) * e;
          getAnims().forEach(function (a) { a.playbackRate = rate; });
          if (t < 1) {
            rafId = requestAnimationFrame(tick);
          } else {
            rafId = null;
          }
        }
        rafId = requestAnimationFrame(tick);
      }

      // Desktop
      marquee.addEventListener('mouseenter', function () { animateTo(0, SLOW_MS); });
      marquee.addEventListener('mouseleave', function () { animateTo(1, FAST_MS); });

      // Mobile
      marquee.addEventListener('touchstart',  function () { animateTo(0, SLOW_MS); }, { passive: true });
      marquee.addEventListener('touchend',    function () { animateTo(1, FAST_MS); }, { passive: true });
      marquee.addEventListener('touchcancel', function () { animateTo(1, FAST_MS); }, { passive: true });
    }());

    // ── Marquee — ciclo de fotos no hover ───────────────────────
    document.querySelectorAll('.amb-marquee__item').forEach(function(item) {
      var imgs = [];
      try { imgs = JSON.parse(item.dataset.imgs || '[]'); } catch(_) {}
      if (imgs.length < 2) return;
      var img = item.querySelector('.amb-marquee__img');
      if (!img) return;
      var idx = 0, timer = null;
      item.addEventListener('mouseenter', function() {
        idx = 0;
        timer = setInterval(function() {
          idx = (idx + 1) % imgs.length;
          img.style.opacity = '0';
          setTimeout(function() { img.src = imgs[idx]; img.style.opacity = '1'; }, 200);
        }, 1400);
      });
      item.addEventListener('mouseleave', function() {
        clearInterval(timer);
        img.src = imgs[0];
        img.style.opacity = '1';
      });
    });

    // ── Cinematic Drag — dual marquee ────────────────────────────
    (function () {
      // Previne drag nativo de imagens/links no carrossel
      document.querySelectorAll('.amb-marquee__img').forEach(function(img) {
        img.draggable = false;
      });

      var CFG = [
        { sel: '.amb-marquee__track--fwd', anim: 'csm-gallery-fwd', dur: 55, fwd: true  },
        { sel: '.amb-marquee__track--rev', anim: 'csm-gallery-rev', dur: 62, fwd: false }
      ];
      CFG.forEach(function (c) {
        var el = document.querySelector(c.sel);
        if (!el) return;

        var FRICTION = 0.91, RESIST = 0.78, MIN_VEL = 0.35;
        var isDown = false, didMove = false, prevX = 0, startX = 0, curX = 0, vel = 0, rafId = null;
        var startTarget = null;

        function hw()      { return el.scrollWidth / 2; }
        function norm(x)   { var h = hw(); while (x < -h) x += h; while (x > 0) x -= h; return x; }
        function readX()   { return new DOMMatrix(getComputedStyle(el).transform).m41; }
        function applyX(x) { curX = norm(x); el.style.transform = 'translateX(' + curX + 'px)'; }

        function freeze() {
          curX = readX();
          el.style.animation = 'none';
          void el.offsetWidth;
          el.style.transform = 'translateX(' + curX + 'px)';
        }

        function thaw() {
          var x = norm(curX);
          var progress = c.fwd ? Math.abs(x) / hw() : (x / hw() + 1);
          var delay    = -(progress * c.dur);
          el.style.transform = '';
          el.style.animation = 'none';
          void el.offsetWidth;
          el.style.animation          = c.anim + ' ' + c.dur + 's linear infinite ' + delay + 's';
          el.style.animationPlayState = ''; // allow CSS :hover rule to take effect
        }

        function tick() {
          vel *= FRICTION;
          if (Math.abs(vel) < MIN_VEL) { rafId = null; thaw(); return; }
          applyX(curX + vel);
          rafId = requestAnimationFrame(tick);
        }

        // Navega para o link com a cortina de transição de página
        function navigateTo(href) {
          var curtain = document.getElementById('page-curtain');
          var ease = 'cubic-bezier(.77,0,.175,1)';
          if (curtain) {
            curtain.style.transition = 'none';
            curtain.style.transform  = 'translateY(100%)';
            curtain.style.pointerEvents = 'all';
            curtain.offsetHeight;
            curtain.style.transition = 'transform .65s ' + ease;
            curtain.style.transform  = 'translateY(0)';
            curtain.addEventListener('transitionend', function () {
              window.location.href = href;
            }, { once: true });
          } else {
            window.location.href = href;
          }
        }

        el.addEventListener('pointerdown', function (e) {
          if (e.button !== 0 && e.pointerType === 'mouse') return;
          e.preventDefault(); // previne drag nativo de imagem/link
          startTarget = e.target;
          if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
          isDown = true; didMove = false; prevX = e.clientX; startX = e.clientX; vel = 0;
          freeze();
          el.setPointerCapture(e.pointerId);
          el.classList.add('is-dragging');
        });

        el.addEventListener('pointermove', function (e) {
          if (!isDown) return;
          var dx = e.clientX - prevX;
          // Usa distância total desde o início para evitar falsos positivos em touch
          if (Math.abs(e.clientX - startX) > 5) didMove = true;
          vel = dx * RESIST;
          applyX(curX + vel);
          prevX = e.clientX;
        });

        el.addEventListener('dragstart', function (e) { e.preventDefault(); });

        function release() {
          if (!isDown) return;
          isDown = false;
          el.classList.remove('is-dragging');

          // Se não houve drag, navegar para o link do item tocado
          if (!didMove && startTarget) {
            var item = startTarget.closest('a.amb-marquee__item[href]');
            if (item) {
              var href = item.getAttribute('href');
              if (href && href.indexOf('.html') !== -1) {
                startTarget = null;
                navigateTo(href);
                return;
              }
            }
          }
          startTarget = null;
          rafId = requestAnimationFrame(tick);
        }
        el.addEventListener('pointerup',     release);
        el.addEventListener('pointercancel', function () {
          isDown = false;
          startTarget = null;
          el.classList.remove('is-dragging');
          thaw();
        });

        // Bloqueia clicks que foram drags (fallback para mouse)
        el.addEventListener('click', function (e) { if (didMove) e.preventDefault(); }, true);
      });
    }());

    // ── Scroll reveal ────────────────────────────────────────────
    const revealEls = document.querySelectorAll('[data-animate], .stat, .review'); /* .cat-card removido — gerenciado pelo GSAP */
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));

    // ── Modais ───────────────────────────────────────────────────
    function openModal(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.removeAttribute('hidden');
      lockScroll();
      el.querySelector('.modal__close')?.focus();
    }

    function closeModal(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.setAttribute('hidden', '');
      unlockScroll();
    }

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not([hidden])').forEach(m => closeModal(m.id));
      }
    });

    // ── Navega para página do produto (salva dados no localStorage) ─
    function goToProduct(card) {
      var name    = (card.querySelector('.cat-card__name') || {}).textContent || '';
      var badge   = (card.querySelector('.cat-card__badge') || {}).textContent || 'Sofá';
      var tipo    = card.dataset.tipo || 'sofa';
      var tagline = (card.querySelector('.cat-card__tagline') || {}).textContent || '';
      var imgs    = JSON.parse(card.dataset.imgs || '[]');
      var wpp     = card.dataset.wpp || '';
      var glb     = card.dataset.model || card.dataset.glb || '';
      var specs   = [];
      card.querySelectorAll('.cat-specs__row').forEach(function (row) {
        var key = (row.querySelector('dt') || {}).textContent || '';
        var val = (row.querySelector('dd') || {}).textContent || '';
        if (key) specs.push({ key: key, val: val });
      });
      try {
        localStorage.setItem('csm-produto-current', JSON.stringify({
          id: 'csm-index', name: name, badge: badge, tipo: tipo, tagline: tagline,
          imgs: imgs, wpp: wpp, glb: glb, specs: specs
        }));
      } catch (_) {}
      window.location.href = 'produto.html?id=csm-index';
    }

    // ── Navega para produto a partir de um destaque card ────────
    function goToDestaqueCard(card, id) {
      var nameEl  = card.querySelector('.destaque__name');
      var badgeEl = card.querySelector('.destaque__badge');
      var name    = nameEl  ? nameEl.textContent.trim()  : '';
      var badge   = badgeEl ? badgeEl.textContent.trim() : name.split(' ')[0];
      var tipo    = badge.toLowerCase().indexOf('poltrona') !== -1 ? 'poltrona' : 'sofa';
      var tagline = (card.querySelector('.destaque__tagline') || {}).textContent || '';
      var imgs    = [];
      card.querySelectorAll('.destaque__imgs img').forEach(function(img) { if (img.src) imgs.push(img.src); });
      var wppEl   = card.querySelector('.destaque__ctas .btn--primary');
      var wpp     = wppEl ? wppEl.href : '';
      var specs   = [];
      card.querySelectorAll('.destaque__specs-row').forEach(function(row) {
        var k = (row.querySelector('dt') || {}).textContent || '';
        var v = (row.querySelector('dd') || {}).textContent || '';
        if (k) specs.push({ key: k, val: v });
      });
      try {
        localStorage.setItem('csm-produto-current', JSON.stringify({
          id: id, name: name, badge: badge, tipo: tipo, tagline: tagline,
          imgs: imgs, wpp: wpp, glb: '', specs: specs
        }));
      } catch(_) {}
      window.location.href = 'produto.html?id=' + id;
    }


    // ── Modal de produto ─────────────────────────────────────────
    function openProductModal(card) {
      const fig     = card.querySelector('.cat-card__fig');
      const img     = card.querySelector('img');
      const badge   = card.querySelector('.cat-card__badge');
      const name    = card.querySelector('.cat-card__name').textContent;
      const tagline = card.querySelector('.cat-card__tagline').textContent;
      const specsDl = card.querySelector('.cat-specs__list');
      const wpp     = card.dataset.wpp;
      const isPolt  = card.dataset.tipo === 'poltrona';

      document.getElementById('modal-produto-title').textContent = name;
      document.getElementById('modal-tagline').textContent = tagline;
      document.getElementById('modal-wpp-btn').href = wpp;

      const modalBadge = document.getElementById('modal-badge');
      modalBadge.textContent = badge.textContent;
      modalBadge.className = 'modal__badge' + (isPolt ? ' modal__badge--poltrona' : '');

      const mainImg = document.getElementById('modal-img-main');
      mainImg.src   = img.src;
      mainImg.alt   = img.alt;

      const specsContainer = document.getElementById('modal-specs');
      specsContainer.innerHTML = '';
      if (specsDl) specsContainer.appendChild(specsDl.cloneNode(true));

      const thumbsContainer = document.getElementById('modal-thumbs');
      thumbsContainer.innerHTML = '';
      const galleryImgs = JSON.parse(card.dataset.imgs || 'null') || [img.src];
      galleryImgs.forEach((src, i) => {
        const thumb = document.createElement('div');
        thumb.className = 'modal__thumb' + (i === 0 ? ' active' : '');
        const ti = document.createElement('img');
        ti.src = src;
        ti.alt = name + ' — vista ' + (i + 1);
        ti.loading = 'lazy';
        thumb.appendChild(ti);
        thumb.addEventListener('click', () => {
          thumbsContainer.querySelectorAll('.modal__thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          mainImg.src = src;
        });
        thumbsContainer.appendChild(thumb);
      });

      openModal('modal-produto');
    }

    // ── Modal arquiteto ──────────────────────────────────────────
    function simulateGoogleLogin() { showArqSuccess(); }

    async function submitArqForm(e) {
      e.preventDefault();
      var form = e.target;
      var honey = form.querySelector('[name="_honey"]');
      if (honey && honey.value) return;
      var btn  = form.querySelector('[type="submit"]');
      var data = Object.fromEntries(new FormData(form));
      var tipo = form.closest('#form-arq-wrap')  ? 'Arquiteto Parceiro' :
                 form.closest('#form-forn-wrap') ? 'Fornecedor' : 'Cliente';
      if (btn) btn.disabled = true;
      try {
        await fetch('https://formsubmit.co/ajax/contato@csmdecor.com.br', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(Object.assign({}, data, { _subject: 'Cadastro ' + tipo + ' — CSM Decor' }))
        });
      } catch (_) {}
      showArqSuccess();
    }

    function showArqSuccess() {
      document.getElementById('arq-form-wrap').hidden = true;
      document.getElementById('arq-success').hidden = false;
    }

    // ── Abas profissionais (modal cadastro) ─────────────────────
    function switchProTab(btn) {
      const target   = btn.dataset.target;
      const isActive = btn.classList.contains('pro-tab--active');

      document.querySelectorAll('.pro-tab').forEach(t => t.classList.remove('pro-tab--active'));
      document.getElementById('form-cliente-wrap').hidden = false;
      document.getElementById('form-arq-wrap').hidden     = true;
      document.getElementById('form-forn-wrap').hidden    = true;

      if (!isActive) {
        btn.classList.add('pro-tab--active');
        document.getElementById('form-cliente-wrap').hidden              = true;
        document.getElementById('form-' + target + '-wrap').hidden       = false;
      }
    }


    // ── Hero vídeo: playlist gemini → francis → gemini → … ──
    (function () {
      var video = document.getElementById('hero-video');
      if (!video) return;

      var PLAYLIST = ['gemini.mp4', 'francis.mp4'];
      var idx = 0;
      var visible = true;

      // Avança para o próximo vídeo da playlist ao terminar
      video.addEventListener('ended', function () {
        idx = (idx + 1) % PLAYLIST.length;
        video.src = PLAYLIST[idx];
        video.load();
        video.play().catch(function () {});
      });

      // Heartbeat: garante reprodução quando visível
      setInterval(function () {
        if (visible && video.paused && !video.ended) {
          video.play().catch(function () {});
        }
      }, 2000);

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            visible = e.isIntersecting;
            if (e.isIntersecting) {
              video.play().catch(function () {});
            } else {
              video.pause();
            }
          });
        }, { threshold: 0.25 }).observe(video);
      }
    }());

    // ── Carousel Depoimentos ─────────────────────────────────
    (function () {
      var track  = document.getElementById('dep-track');
      var slides = document.querySelectorAll('.dep__slide');
      var dots   = document.querySelectorAll('.dep__dot');
      var prev   = document.getElementById('dep-prev');
      var next   = document.getElementById('dep-next');
      if (!track || !slides.length) return;

      var current = 0;
      var total   = slides.length;
      var timer   = null;
      var DELAY   = 6000;

      function goTo(n) {
        slides[current].classList.remove('dep__slide--active');
        dots[current].classList.remove('dep__dot--active');
        dots[current].removeAttribute('aria-current');
        current = (n + total) % total;
        slides[current].classList.add('dep__slide--active');
        dots[current].classList.add('dep__dot--active');
        dots[current].setAttribute('aria-current', 'true');
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
      }

      function stopTimer()   { clearInterval(timer); timer = null; }
      function startTimer()  { stopTimer(); timer = setInterval(function () { goTo(current + 1); }, DELAY); }
      function resetTimer()  { startTimer(); }

      // Estado inicial
      slides[0].classList.add('dep__slide--active');
      dots[0].classList.add('dep__dot--active');
      dots[0].setAttribute('aria-current', 'true');

      prev.addEventListener('click', function () { goTo(current - 1); resetTimer(); });
      next.addEventListener('click', function () { goTo(current + 1); resetTimer(); });
      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () { goTo(i); resetTimer(); });
      });

      // Pausa ao hover / foco
      var carousel = document.getElementById('dep-carousel');
      carousel.addEventListener('mouseenter', stopTimer);
      carousel.addEventListener('mouseleave', startTimer);
      carousel.addEventListener('focusin',    stopTimer);
      carousel.addEventListener('focusout',   startTimer);

      // Mobile: pausa no toque e navega por swipe
      var depTx = 0;
      carousel.addEventListener('touchstart', function (e) {
        depTx = e.touches[0].clientX;
        stopTimer();
      }, { passive: true });
      carousel.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - depTx;
        if (Math.abs(dx) > 44) dx < 0 ? goTo(current + 1) : goTo(current - 1);
        startTimer();
      }, { passive: true });

      startTimer();
    }());

    // ── Dark Mode ─────────────────────────────────────────────
    (function () {
      const toggle = document.getElementById('theme-toggle');
      const html   = document.documentElement;
      function setTheme(dark) {
        html.setAttribute('data-theme', dark ? 'dark' : 'light');
        localStorage.setItem('csm-theme', dark ? 'dark' : 'light');
        toggle.setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
      }
      if (localStorage.getItem('csm-theme') === 'dark') setTheme(true);
      toggle.addEventListener('click', () => setTheme(html.getAttribute('data-theme') !== 'dark'));
    }());

    // ── Shimmer nos links de navegação ────────────────────────
    // Clique: shimmer imediato. Enquanto ativo: repete a cada 10 s.
    (function () {
      let shimmerTimer = null;

      function triggerShimmer(link) {
        link.classList.remove('nav-link--shimmer');
        void link.offsetWidth; // força reflow para reiniciar a animação CSS
        link.classList.add('nav-link--shimmer');
        link.addEventListener('animationend', () => {
          link.classList.remove('nav-link--shimmer');
        }, { once: true });
      }

      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function () {
          if (shimmerTimer) clearInterval(shimmerTimer);

          document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.remove('nav-link--active', 'nav-link--shimmer');
          });

          const activeLink = this;
          activeLink.classList.add('nav-link--active');
          triggerShimmer(activeLink);

          shimmerTimer = setInterval(() => {
            if (activeLink.classList.contains('nav-link--active')) {
              triggerShimmer(activeLink);
            } else {
              clearInterval(shimmerTimer);
            }
          }, 10000);
        });
      });
    }());

    // ── Busca ao vivo — usa dados reais do catálogo ──────────
    (function () {
      'use strict';

      function norm(s) {
        return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      }

      function escHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/”/g,'&quot;');
      }

      function highlight(text, nq) {
        var nt = norm(text);
        var i  = nt.indexOf(nq);
        if (i < 0) return escHtml(text);
        return escHtml(text.slice(0,i)) + '<mark>' + escHtml(text.slice(i, i+nq.length)) + '</mark>' + escHtml(text.slice(i+nq.length));
      }

      function doSearch(q) {
        var DB = window.CSM_PRODUTOS || [];
        if (!q || q.length < 2) return [];
        var nq = norm(q);
        var results = [];
        for (var i = 0; i < DB.length; i++) {
          var p = DB[i];
          if (norm(p.name).indexOf(nq) !== -1 || norm(p.keywords || '').indexOf(nq) !== -1 || norm(p.badge || '').indexOf(nq) !== -1) {
            results.push(p);
            if (results.length >= 6) break;
          }
        }
        return results;
      }

      function goSearch(q) {
        if (q) window.location.href = 'produtos.html?busca=' + encodeURIComponent(q);
      }

      var openBtn = document.getElementById('header-search-btn');
      if (!openBtn) return;

      var kbdIdx = -1;
      var wired  = false;

      function $(id) { return document.getElementById(id); }

      function openSearch() {
        var ov = $('search-overlay');
        if (!ov || !ov.hasAttribute('hidden')) return;
        ov.removeAttribute('hidden');
        openBtn.setAttribute('aria-expanded', 'true');
        openBtn.classList.add('is-active');
        lockScroll();
        setTimeout(function () { var el = $('search-input'); if (el) el.focus(); }, 60);
        kbdIdx = -1;
      }

      function closeSearch() {
        var ov = $('search-overlay');
        if (!ov || ov.hasAttribute('hidden')) return;
        ov.classList.add('is-closing');
        setTimeout(function () {
          ov.setAttribute('hidden', '');
          ov.classList.remove('is-closing');
          var inp = $('search-input');        if (inp) inp.value = '';
          var clr = $('search-clear');        if (clr) clr.hidden = true;
          var lst = $('search-results-list'); if (lst) { lst.hidden = true; lst.innerHTML = ''; }
          var tr  = $('search-trending');     if (tr)  tr.hidden = false;
        }, 280);
        openBtn.setAttribute('aria-expanded', 'false');
        openBtn.classList.remove('is-active');
        unlockScroll();
        kbdIdx = -1;
      }

      function renderResults(q) {
        var lst = $('search-results-list');
        var tr  = $('search-trending');
        if (!lst) return;
        lst.innerHTML = '';
        kbdIdx = -1;
        if (!q || q.length < 2) {
          lst.hidden = true;
          if (tr) tr.hidden = false;
          return;
        }
        if (tr) tr.hidden = true;
        lst.hidden = false;
        var nq      = norm(q);
        var results = doSearch(q);
        if (results.length === 0) {
          var noLi = document.createElement('li');
          noLi.className = 'search-noresults';
          noLi.innerHTML = 'Nenhum produto para “<strong>' + escHtml(q) + '</strong>”';
          lst.appendChild(noLi);
        } else {
          results.forEach(function (p, i) {
            var li = document.createElement('li');
            li.style.animationDelay = (i * 40) + 'ms';
            var a   = document.createElement('a');
            a.className   = 'search-result-item';
            a.href        = 'produtos.html?busca=' + encodeURIComponent(p.name);
            var img = document.createElement('img');
            img.className = 'search-result-item__thumb';
            img.alt       = '';
            img.width     = 52;
            img.height    = 52;
            img.referrerPolicy = 'no-referrer';
            img.onerror   = function () { this.style.display = 'none'; };
            img.src       = p.img;
            var info = document.createElement('div');
            info.className = 'search-result-item__info';
            info.innerHTML =
              '<span class=”search-result-item__name”>' + highlight(p.name, nq) + '</span>' +
              '<span class=”search-result-item__cat”>'  + escHtml(p.badge) + '</span>';
            var arrow = document.createElement('span');
            arrow.innerHTML = '<svg class=”search-result-item__arrow” width=”14” height=”14” viewBox=”0 0 24 24” fill=”none” stroke=”currentColor” stroke-width=”2” stroke-linecap=”round” aria-hidden=”true”><polyline points=”9 18 15 12 9 6”/></svg>';
            a.appendChild(img);
            a.appendChild(info);
            a.appendChild(arrow.firstChild);
            li.appendChild(a);
            lst.appendChild(li);
          });
        }
        var footer = document.createElement('li');
        footer.className = 'search-results__footer';
        footer.innerHTML = '<a class=”search-results__all” href=”produtos.html?busca=' + encodeURIComponent(q) + '”>Ver todos os resultados para “<strong>' + escHtml(q) + '</strong>” →</a>';
        lst.appendChild(footer);
      }

      function kbdMove(dir) {
        var lst = $('search-results-list');
        if (!lst) return;
        var items = lst.querySelectorAll('li:not(.search-results__footer)');
        if (!items.length) return;
        items.forEach(function (el) { el.classList.remove('is-kbd-active'); });
        kbdIdx = Math.max(-1, Math.min(kbdIdx + dir, items.length - 1));
        if (kbdIdx < 0) {
          var inp = $('search-input'); if (inp) inp.focus();
        } else {
          items[kbdIdx].classList.add('is-kbd-active');
          var a = items[kbdIdx].querySelector('a'); if (a) a.focus();
        }
      }

      function ensureWired() {
        if (wired) return;
        wired = true;
        var close    = $('search-close');
        var backdrop = $('search-backdrop');
        var input    = $('search-input');
        var clrBtn   = $('search-clear');
        if (close)    close.addEventListener('click', closeSearch);
        if (backdrop) backdrop.addEventListener('click', closeSearch);
        if (input) {
          input.addEventListener('input', function () {
            var q = input.value.trim();
            var clr = $('search-clear'); if (clr) clr.hidden = !q;
            renderResults(q);
          });
          input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { closeSearch(); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); kbdMove(1); }
            if (e.key === 'ArrowUp')   { e.preventDefault(); kbdMove(-1); }
            if (e.key === 'Enter') {
              e.preventDefault();
              var lst = $('search-results-list');
              if (lst && kbdIdx >= 0) {
                var its = lst.querySelectorAll('li:not(.search-results__footer)');
                if (its[kbdIdx]) { var a = its[kbdIdx].querySelector('a'); if (a) a.click(); return; }
              }
              goSearch(input.value.trim());
            }
          });
        }
        if (clrBtn) {
          clrBtn.addEventListener('click', function () {
            var inp = $('search-input'); if (inp) { inp.value = ''; inp.focus(); }
            var clr = $('search-clear'); if (clr) clr.hidden = true;
            var lst = $('search-results-list'); if (lst) { lst.hidden = true; lst.innerHTML = ''; }
            var tr  = $('search-trending'); if (tr) tr.hidden = false;
            kbdIdx = -1;
          });
        }
        document.querySelectorAll('.search-trending__tag').forEach(function (btn) {
          btn.addEventListener('click', function () {
            goSearch(btn.dataset.search);
          });
        });
        document.addEventListener('keydown', function (e) {
          var ov = $('search-overlay');
          if (e.key === 'Escape' && ov && !ov.hasAttribute('hidden')) closeSearch();
        });
      }

      openBtn.addEventListener('click', function () {
        ensureWired();
        openSearch();
      });
    }());

    // ── MOODBOARD ─────────────────────────────────────────────────
    const moodboard = (function () {
      function getMbKey() {
        try {
          const s = window.CSMAuth ? CSMAuth.getSession()
                  : JSON.parse(localStorage.getItem('csm-session') || 'null');
          return s && s.email ? 'csm-moodboard-' + s.email : 'csm-moodboard-guest';
        } catch(_) { return 'csm-moodboard-guest'; }
      }

      function getItems() {
        try { return JSON.parse(localStorage.getItem(getMbKey())) || []; } catch(e) { return []; }
      }
      function saveItems(items) {
        localStorage.setItem(getMbKey(), JSON.stringify(items));
      }
      function hasItem(id) {
        return getItems().some(i => i.id === id);
      }
      function addItem(item) {
        const items = getItems();
        if (!items.find(i => i.id === item.id)) { items.push(item); saveItems(items); return true; }
        return false;
      }
      function removeItem(id) {
        saveItems(getItems().filter(i => i.id !== id));
      }

      function genId(card) {
        const name = (card.querySelector('.cat-card__name')?.textContent || '').trim();
        const type = (card.querySelector('.cat-card__badge')?.textContent || '').trim();
        const full = type ? `${type} ${name}` : name;
        return full.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
      }

      function extractItem(card) {
        const imgs = JSON.parse(card.dataset.imgs || 'null') || [];
        const imgEl = card.querySelector('img');
        const name = (card.querySelector('.cat-card__name')?.textContent || '').trim();
        const type = (card.querySelector('.cat-card__badge')?.textContent || '').trim();
        const pid  = card.dataset.id || '';
        return {
          id:      genId(card),
          name:    type ? `${type} ${name}` : name,
          type:    type,
          tagline: card.querySelector('.cat-card__tagline')?.textContent.trim() || '',
          img:     imgs[0] || imgEl?.src || '',
          wpp:     card.dataset.wpp || '',
          href:    pid ? 'produto.html?id=' + pid : '',
        };
      }

      function toggle(card) {
        const id = genId(card);
        if (hasItem(id)) { removeItem(id); return false; }
        return addItem(extractItem(card));
      }

      function updateBadge() {
        const n = getItems().length;
        const badge = document.getElementById('moodboard-badge');
        if (!badge) return;
        badge.textContent = n;
        badge.hidden = n === 0;
        if (n > 0) {
          badge.classList.remove('pop');
          void badge.offsetWidth;
          badge.classList.add('pop');
        }
      }

      function updateSaveButtons() {
        document.querySelectorAll('.cat-card__save').forEach(btn => {
          const card = btn.closest('.cat-card');
          const id = genId(card);
          const saved = hasItem(id);
          btn.classList.toggle('is-saved', saved);
          btn.setAttribute('aria-label', saved ? 'Remover dos Favoritos' : 'Salvar aos Favoritos');
          btn.title = saved ? 'Remover dos Favoritos' : 'Salvar aos Favoritos';
        });
      }

      // [nome] — lido do localStorage 'csm-user-nome'.
      // Quando o cadastro de clientes for implementado, basta gravar:
      //   localStorage.setItem('csm-user-nome', 'João Silva')
      // e a saudação já aparecerá automaticamente em todas as mensagens.
      function getClienteNome() {
        return localStorage.getItem('csm-user-nome') || '';
      }

      function buildWppUrl() {
        const items = getItems();
        if (!items.length) return '#';
        const nome = getClienteNome();
        const saudacao = nome ? `Olá, sou ${nome}!` : 'Olá!';
        const lista = items.map(i => `• ${i.type}: ${i.name}`).join('\n');
        const msg = `${saudacao} Tenho interesse nos seguintes produtos CSM Decor:\n\n${lista}\n\nPoderia me enviar informações e orçamento?`;
        return `https://wa.me/5519990034068?text=${encodeURIComponent(msg)}`;
      }

      function renderPanel() {
        const items = getItems();
        const listEl = document.getElementById('moodboard-list');
        const countEl = document.getElementById('moodboard-count-label');
        const wppBtn = document.getElementById('moodboard-wpp-btn');
        const secRow = document.getElementById('moodboard-secondary-row');
        if (!listEl) return;

        listEl.innerHTML = '';

        if (items.length === 0) {
          listEl.innerHTML = `
            <div class="moodboard-empty">
              <div class="moodboard-empty__icon">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p class="moodboard-empty__title">Nenhum favorito ainda</p>
              <p class="moodboard-empty__text">Passe o mouse sobre um produto e clique no marcador para salvar na sua lista.</p>
            </div>`;
          if (wppBtn) wppBtn.hidden = true;
          if (secRow) secRow.hidden = true;
        } else {
          items.forEach(item => {
            const href = item.href || '';
            const div = document.createElement('div');
            div.className = 'moodboard-item';
            div.innerHTML = `
              <div class="moodboard-item__link" role="${href ? 'link' : 'presentation'}"
                   tabindex="${href ? '0' : '-1'}" aria-label="Ver ${item.name}"
                   style="${href ? 'cursor:pointer' : ''}">
                <img class="moodboard-item__img" src="${item.img}" alt="${item.name}" loading="lazy" />
                <div class="moodboard-item__info">
                  <span class="moodboard-item__type">${item.type}</span>
                  <p class="moodboard-item__name">${item.name}</p>
                  <p class="moodboard-item__tagline">${item.tagline}</p>
                </div>
              </div>
              <button class="moodboard-item__remove" aria-label="Remover ${item.name}" data-id="${item.id}" type="button">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>`;

            if (href) {
              const linkEl = div.querySelector('.moodboard-item__link');
              linkEl.addEventListener('click', (function(h) {
                return function() {
                  var m = h.match(/produto\.html\?id=(\d+)/);
                  if (m) {
                    var numId = m[1];
                    var c = document.querySelector('.cat-card[data-id="' + numId + '"]');
                    if (c) {
                      var imgs = []; try { imgs = JSON.parse(c.dataset.imgs || '[]'); } catch(_) {}
                      try { localStorage.setItem('csm-produto-current', JSON.stringify({
                        id: numId,
                        name: (c.querySelector('.cat-card__name') || {textContent:''}).textContent.trim(),
                        badge: (c.querySelector('.cat-card__badge') || {textContent:''}).textContent.trim(),
                        tipo: c.dataset.tipo || '',
                        tagline: (c.querySelector('.cat-card__tagline') || {textContent:''}).textContent.trim(),
                        imgs: imgs, wpp: c.dataset.wpp || '', glb: c.dataset.glb || ''
                      })); } catch(_) {}
                    }
                  }
                  window.location.href = h;
                };
              }(href)));
              linkEl.addEventListener('keydown', (function(h) {
                return function(e) {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = h; }
                };
              }(href)));
            }

            div.querySelector('.moodboard-item__remove').addEventListener('click', e => {
              e.stopPropagation();
              removeItem(item.id);
              div.classList.add('removing');
              setTimeout(() => { div.remove(); renderPanel(); updateBadge(); updateSaveButtons(); }, 220);
            });
            listEl.appendChild(div);
          });
          if (wppBtn) { wppBtn.href = buildWppUrl(); wppBtn.hidden = false; }
          if (secRow) secRow.hidden = false;
        }

        if (countEl) {
          const n = items.length;
          countEl.textContent = n === 0 ? 'Nenhum item salvo' : `${n} ${n === 1 ? 'item na lista' : 'itens na lista'}`;
        }
      }

      function openPanel() {
        const panel = document.getElementById('moodboard-panel');
        const backdrop = document.getElementById('moodboard-backdrop');
        if (!panel) return;
        renderPanel();
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        backdrop?.classList.add('is-visible');
        document.getElementById('contatos-flutuantes')?.style.setProperty('opacity','0'); document.getElementById('contatos-flutuantes')?.style.setProperty('pointer-events','none');
        lockScroll();
        const hBtn = document.getElementById('moodboard-header-btn');
        hBtn?.setAttribute('aria-expanded', 'true');
        hBtn?.classList.add('is-active');
        // Focus com pequeno delay para garantir que a animação iniciou
        setTimeout(() => document.getElementById('moodboard-close-btn')?.focus(), 80);
      }

      function closePanel() {
        const panel = document.getElementById('moodboard-panel');
        const backdrop = document.getElementById('moodboard-backdrop');
        panel?.classList.remove('is-open');
        panel?.setAttribute('aria-hidden', 'true');
        backdrop?.classList.remove('is-visible');
        document.getElementById('contatos-flutuantes')?.style.removeProperty('opacity'); document.getElementById('contatos-flutuantes')?.style.removeProperty('pointer-events');
        unlockScroll();
        const hBtn = document.getElementById('moodboard-header-btn');
        hBtn?.setAttribute('aria-expanded', 'false');
        hBtn?.classList.remove('is-active');
      }

      function init() {
        // Injeta botão de save em todos os cat-cards (exceto "ambiente")
        document.querySelectorAll('.cat-card').forEach(card => {
          if (card.dataset.tipo === 'ambiente') return;
          const fig = card.querySelector('.cat-card__fig');
          if (!fig || fig.querySelector('.cat-card__save')) return;
          const id = genId(card);
          const saved = hasItem(id);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cat-card__save' + (saved ? ' is-saved' : '');
          btn.setAttribute('aria-label', saved ? 'Remover dos Favoritos' : 'Salvar aos Favoritos');
          btn.title = btn.getAttribute('aria-label');
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;

          btn.addEventListener('click', e => {
            e.stopPropagation();
            e.preventDefault();
            if (!CSMAuth.requireMoodboard()) return;
            const wasSaved = hasItem(genId(card));
            const nowSaved = toggle(card);
            btn.classList.toggle('is-saved', nowSaved);
            btn.setAttribute('aria-label', nowSaved ? 'Remover dos Favoritos' : 'Salvar aos Favoritos');
            btn.title = btn.getAttribute('aria-label');
            btn.querySelector('svg').setAttribute('fill', nowSaved ? 'currentColor' : 'none');
            updateBadge();
            if (nowSaved) {
              btn.animate(
                [{ transform:'scale(1)' },{ transform:'scale(1.45)' },{ transform:'scale(1)' }],
                { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)' }
              );
            }
          });
          fig.appendChild(btn);
        });

        updateBadge();

        // Moodboard: abre painel se autorizado, pede login/avisa se não
        document.getElementById('moodboard-header-btn')?.addEventListener('click', function () {
          if (!CSMAuth.requireMoodboard()) return;
          openPanel();
        });

        // Delegação de evento — funciona mesmo que os elementos existam após este script
        document.addEventListener('click', e => {
          if (e.target.closest('#moodboard-close-btn')) { closePanel(); return; }
          if (e.target.id === 'moodboard-backdrop') { closePanel(); return; }
          if (e.target.id === 'moodboard-clear-btn' || e.target.closest('#moodboard-clear-btn')) {
            if (!confirm('Limpar todos os itens da sua lista?')) return;
            saveItems([]);
            renderPanel();
            updateBadge();
            updateSaveButtons();
          }
        });

        // Fechar com toque fora (mobile)
        document.addEventListener('touchend', e => {
          if (e.target.id === 'moodboard-backdrop') { e.preventDefault(); closePanel(); }
        }, { passive: false });

        // Fechar com Escape
        document.addEventListener('keydown', e => {
          if (e.key === 'Escape' && document.getElementById('moodboard-panel')?.classList.contains('is-open')) {
            closePanel();
          }
        });
      }

      return { init, openPanel, closePanel, getItems, toggle, hasItem };
    })();

    moodboard.init();

    // ── GSAP — animações de entrada e revelação ao rolar ─────────
    (function () {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

      var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!motionOK) return;

      gsap.registerPlugin(ScrollTrigger);

      // ── 1. Hero — timeline pausado, dispara após loading screen
      window.heroTl = gsap.timeline({ paused: true });
      window.heroTl
        .from('#hero-eyebrow',       { y: 22,  opacity: 0, duration: 0.55, ease: 'power2.out' })
        .from('#hero-headline',      { y: 60,  opacity: 0, duration: 0.9,  ease: 'power3.out' }, '-=0.35')
        .from('#hero-sub',           { y: 40,  opacity: 0, duration: 0.75, ease: 'power2.out' }, '-=0.5')
        .from('#hero-actions .btn',  { y: 26,  opacity: 0, duration: 0.65, ease: 'power2.out', stagger: 0.15 }, '-=0.4');

      // Dispara imediatamente se a flag foi levantada pela loading screen (back-navigation)
      if (window.heroShouldPlay) {
        window.heroTl.play();
        window.heroShouldPlay = false;
      }

      // ── 2. Eyebrows de seção (excluindo hero)
      gsap.utils.toArray('.eyebrow').forEach(function (el) {
        if (el.closest('#inicio')) return;
        gsap.from(el, {
          y: 22, opacity: 0, duration: 0.9, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });

      // ── 3. Títulos de seção — movimento bem visível
      gsap.utils.toArray('.section-title').forEach(function (el) {
        gsap.from(el, {
          y: 65, opacity: 0, duration: 1.35, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 87%', once: true },
        });
      });

      gsap.utils.toArray('.section-sub').forEach(function (el) {
        gsap.from(el, {
          y: 38, opacity: 0, duration: 1.15, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        });
      });

      // ── 4. Destaque — escala quando o próximo card chega à posição sticky
      var destaqueCards = gsap.utils.toArray('.destaque__card');
      destaqueCards.forEach(function(card, i) {
        if (i === destaqueCards.length - 1) return;
        var nextCard = destaqueCards[i + 1];
        if (!nextCard) return;
        var nextTop = 80 + (i + 1) * 80; // top do próximo card
        gsap.to(card, {
          scale: 0.9,
          ease: 'none',
          scrollTrigger: {
            trigger: nextCard,
            start: 'top 95%',
            end: 'top ' + nextTop + 'px',
            scrub: true,
          },
        });
      });

      // ── 4b. Destaque — fade-in do cabeçalho
      var destaqueHead = document.querySelector('.destaque__head');
      if (destaqueHead) {
        gsap.from(destaqueHead.children, {
          y: 28, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12,
          scrollTrigger: { trigger: destaqueHead, start: 'top bottom', once: true },
        });
      }

      // ── 6. Showroom — slides sequenciais da esquerda
      var showroomInner = document.querySelector('.showroom__inner');
      if (showroomInner) {
        gsap.from(showroomInner.querySelectorAll('.showroom__body, .showroom__features, .showroom__ctas'), {
          y: 50, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: 0.2,
          scrollTrigger: { trigger: showroomInner, start: 'top 82%', once: true },
        });
      }

    }());
  function openCatSpecs(specs) {
    var body = specs.querySelector('.cat-specs__body');
    var rows = specs.querySelectorAll('.cat-specs__row');
    if (!body) return;
    rows.forEach(function (row) {
      row.style.transition = 'none';
      row.style.opacity = '0';
      row.style.transform = 'translateY(7px)';
      row.style.transitionDelay = '0ms';
    });
    specs.classList.add('is-open');
    body.style.maxHeight = body.scrollHeight + 'px';
    rows.forEach(function (row, i) {
      setTimeout(function () {
        row.style.transition = 'opacity 0.30s ease, transform 0.30s ease';
        row.style.opacity = '1';
        row.style.transform = 'none';
      }, 45 + i * 55);
    });
  }
  function closeCatSpecs(specs) {
    var body = specs.querySelector('.cat-specs__body');
    var rows = specs.querySelectorAll('.cat-specs__row');
    if (!body) return;
    rows.forEach(function (row, i) {
      row.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
      row.style.transitionDelay = i * 15 + 'ms';
      row.style.opacity = '0';
      row.style.transform = 'translateY(4px)';
    });
    setTimeout(function () {
      body.style.maxHeight = '0';
      specs.classList.remove('is-open');
    }, 70);
  }
  function toggleCatSpecs(btn) {
    var specs = btn.closest('.cat-specs');
    if (!specs) return;
    var isOpen = specs.classList.contains('is-open');
    document.querySelectorAll('.cat-specs.is-open').forEach(function (other) {
      if (other !== specs) closeCatSpecs(other);
    });
    if (isOpen) { closeCatSpecs(specs); } else { openCatSpecs(specs); }
  }

  // ── Destaque — accordion de especificações ──────────────────
  function toggleDestaqueSpecs(btn) {
    var panel = btn.nextElementSibling;
    if (!panel) return;
    var isOpen = panel.classList.contains('is-open');
    document.querySelectorAll('.destaque__specs-panel.is-open').forEach(function(p) {
      p.classList.remove('is-open');
      if (p.previousElementSibling) {
        p.previousElementSibling.classList.remove('is-open');
        p.previousElementSibling.setAttribute('aria-expanded', 'false');
      }
    });
    if (!isOpen) {
      panel.classList.add('is-open');
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
  }

  (function () {
    var modal   = document.getElementById('ar-modal');
    var viewer  = document.getElementById('csm-model-viewer');
    var loading = document.getElementById('ar-loading');
    var nameEl  = document.getElementById('ar-product-name');
    var closeBtn= document.getElementById('ar-modal-close');
    var wppLink = document.getElementById('ar-wpp-link');
    if (!modal || !viewer) return;

    function openAR(modelSrc, productName, wppHref) {
      nameEl.textContent = productName || '3D · AR';
      viewer.src = modelSrc;
      if (wppHref) wppLink.href = wppHref;
      loading.classList.remove('is-hidden');
      modal.removeAttribute('hidden');
      lockScroll();

      viewer.addEventListener('load', function onLoad() {
        loading.classList.add('is-hidden');
        viewer.removeEventListener('load', onLoad);
      });
    }

    function closeAR() {
      modal.setAttribute('hidden', '');
      unlockScroll();
      viewer.src = '';
      loading.classList.remove('is-hidden');
    }

    // Expõe openAR globalmente para botões inline nos cards
    window.openAR = openAR;

    closeBtn.addEventListener('click', closeAR);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hasAttribute('hidden')) closeAR();
    });

    // Injetar badges 3D/AR nos cards com data-model
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('.cat-card[data-model]').forEach(function (card) {
        var fig = card.querySelector('.cat-card__fig');
        if (!fig) return;
        var badge = document.createElement('button');
        badge.type = 'button';
        badge.className = 'cat-card__ar-badge';
        badge.setAttribute('aria-label', 'Ver em 3D e Realidade Aumentada');
        badge.innerHTML =
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>' +
          '3D · AR';
        badge.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          openAR(
            card.dataset.model,
            card.dataset.modelName || card.querySelector('.cat-card__name')?.textContent,
            card.dataset.wpp
          );
        });
        fig.appendChild(badge);
      });
    });
  }());

  (function () {
    var curtain = document.getElementById('page-curtain');
    if (!curtain) return;
    var ease = 'cubic-bezier(.77,0,.175,1)';

    // Revela a página: cortina sobe para fora da tela
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        curtain.style.transition = 'transform .72s ' + ease;
        curtain.style.transform  = 'translateY(-100%)';
        curtain.addEventListener('transitionend', function () {
          curtain.style.pointerEvents = 'none';
        }, { once: true });
      });
    });

    // Cobre a página ao clicar num link .html interno, depois navega
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
      curtain.offsetHeight; // força reflow
      curtain.style.transition = 'transform .65s ' + ease;
      curtain.style.transform  = 'translateY(0)';
      curtain.addEventListener('transitionend', function () {
        window.location.href = href;
      }, { once: true });
    });
  }());

    (function () {
      function tempoRelativo(dataStr) {
        var dias = Math.floor((Date.now() - new Date(dataStr)) / 86400000);
        if (dias < 2)  return 'ontem';
        if (dias < 7)  return dias + ' dias atrás';
        var sem = Math.floor(dias / 7);
        if (sem < 5)   return sem === 1 ? 'uma semana atrás' : sem + ' semanas atrás';
        var mes = Math.floor(dias / 30);
        if (mes < 12)  return mes === 1 ? 'um mês atrás' : mes + ' meses atrás';
        var anos = Math.floor(dias / 365);
        return anos === 1 ? 'um ano atrás' : 'há ' + anos + ' anos';
      }
      document.querySelectorAll('[data-review-date]').forEach(function (el) {
        el.textContent = tempoRelativo(el.dataset.reviewDate) + ' · Google Maps';
      });
    })();

    // ── 3D Parallax Tilt — Review Cards ──────────────────────────
    (function () {
      var cards = document.querySelectorAll('.rc-page .google-review-card');

      // Profundidades de parallax por camada (px de deslocamento máximo)
      var layers = [
        { sel: '.google-review-card__header', depth: 7 },
        { sel: '.google-review-card__photos', depth: 5.5 },
        { sel: '.google-review-card__stars',  depth: 4 },
        { sel: '.google-review-card__link',   depth: 3 },
        { sel: '.google-review-card__text',   depth: 1.5 }
      ];

      cards.forEach(function (card) {
        var glare = document.createElement('div');
        glare.className = 'rc-glare';
        card.appendChild(glare);

        var els = layers.map(function (l) {
          return { el: card.querySelector(l.sel), depth: l.depth };
        }).filter(function (l) { return l.el; });

        var tRX = 0, tRY = 0, cRX = 0, cRY = 0;
        var tNX = 0, tNY = 0, cNX = 0, cNY = 0;
        var raf = null, inside = false;

        function lerp(a, b, t) { return a + (b - a) * t; }

        function resetLayers() {
          els.forEach(function (l) { l.el.style.transform = ''; });
        }

        function tick() {
          cRX = lerp(cRX, tRX, 0.1);
          cRY = lerp(cRY, tRY, 0.1);
          cNX = lerp(cNX, tNX, 0.1);
          cNY = lerp(cNY, tNY, 0.1);

          // Tilt do card
          var lift = inside ? 1.025 : 1;
          card.style.transform =
            'perspective(900px) rotateX(' + cRX + 'deg) rotateY(' + cRY + 'deg) scale(' + lift + ')';

          // Sombra dinâmica
          var depth = Math.sqrt(cRX * cRX + cRY * cRY);
          card.style.boxShadow =
            '0 ' + (8 + depth * 2.5) + 'px ' + (24 + depth * 6) + 'px rgba(0,0,0,' + (0.07 + depth * 0.008) + ')';

          // Parallax interno — deslocamento 2D por camada
          els.forEach(function (l) {
            var ox = cNX * l.depth;
            var oy = cNY * l.depth;
            l.el.style.transform = 'translate(' + ox + 'px, ' + oy + 'px)';
          });

          var still =
            Math.abs(cRX - tRX) < 0.02 && Math.abs(cRY - tRY) < 0.02 &&
            Math.abs(cNX - tNX) < 0.005 && Math.abs(cNY - tNY) < 0.005;

          if (still) {
            raf = null;
            if (!inside) {
              card.style.transform = '';
              card.style.boxShadow = '';
              resetLayers();
            }
          } else {
            raf = requestAnimationFrame(tick);
          }
        }

        card.addEventListener('mouseenter', function () { inside = true; });

        card.addEventListener('mousemove', function (e) {
          var r  = card.getBoundingClientRect();
          var nx = (e.clientX - r.left) / r.width  - 0.5;
          var ny = (e.clientY - r.top)  / r.height - 0.5;

          tRY = nx * 18;
          tRX = -ny * 12;
          tNX = nx;
          tNY = ny;

          glare.style.opacity = '1';
          glare.style.background =
            'radial-gradient(circle at ' + (nx * 100 + 50) + '% ' + (ny * 100 + 50) + '%, rgba(255,255,255,.28) 0%, transparent 58%)';

          if (!raf) raf = requestAnimationFrame(tick);
        });

        card.addEventListener('mouseleave', function () {
          inside = false;
          tRX = 0; tRY = 0; tNX = 0; tNY = 0;
          glare.style.opacity = '0';
          if (!raf) raf = requestAnimationFrame(tick);
        });
      });
    }());

    // ── Reviews Carousel ─────────────────────────────────────────
    (function () {
      var track   = document.getElementById('rc-track');
      var bar     = document.getElementById('rc-bar');
      var counter = document.getElementById('rc-counter');
      var btnPrev = document.getElementById('rc-prev');
      var btnNext = document.getElementById('rc-next');
      var wrap    = track ? track.closest('.rc-wrap') : null;
      if (!track) return;

      var pages   = track.querySelectorAll('.rc-page');
      var total   = pages.length;
      var current = 0;

      function update() {
        btnPrev.disabled = current === 0;
        btnNext.disabled = current === total - 1;
        var pct = ((current + 1) / total * 100) + '%';
        if (bar)     bar.style.width = pct;
        if (counter) counter.textContent = '0' + (current + 1) + ' / 0' + total;
        if (wrap)    wrap.classList.toggle('is-last', current === total - 1);
      }

      function goTo(idx) {
        current = Math.max(0, Math.min(total - 1, idx));
        track.scrollTo({ left: current * track.clientWidth, behavior: 'smooth' });
        update();
      }

      btnPrev.addEventListener('click', function () { goTo(current - 1); });
      btnNext.addEventListener('click', function () { goTo(current + 1); });

      // Sincroniza com swipe/touch nativo
      var t;
      track.addEventListener('scroll', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          var idx = Math.round(track.scrollLeft / track.clientWidth);
          if (idx !== current) { current = idx; update(); }
        }, 80);
      });

      update();
    }());

  (function () {
    var DURATION = 1800;
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    function formatValue(val, el) {
      var decimal = parseInt(el.getAttribute('data-count-decimal') || '0', 10);
      var sep     = el.getAttribute('data-count-sep') || '.';
      var fmt     = el.getAttribute('data-count-format') || '';
      var prefix  = el.getAttribute('data-count-prefix') || '';
      var num;
      if (decimal > 0) {
        num = val.toFixed(decimal).replace('.', sep);
      } else if (fmt === 'dot') {
        num = Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      } else {
        num = Math.round(val).toString();
      }
      return prefix + num;
    }

    function animateCounter(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var sup    = el.querySelector('sup');
      var start  = null;

      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / DURATION, 1);
        var current  = target * easeOut(progress);
        var text     = formatValue(current, el);
        if (sup) {
          el.firstChild.textContent = text;
        } else {
          el.textContent = text;
        }
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    var fired = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !fired.has(entry.target)) {
          fired.add(entry.target);
          animateCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    document.querySelectorAll('[data-count]').forEach(function (el) { io.observe(el); });
  }());

  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Envolve cada img[data-reveal] num wrapper com overflow:hidden
    // e preserva todos os atributos/dimensões originais da imagem
    document.querySelectorAll('img[data-reveal]').forEach(function (img) {
      var wrap = document.createElement('div');
      wrap.className = 'img-reveal-wrap';

      // Copia dimensões inline se existirem
      if (img.style.width)  wrap.style.width  = img.style.width;
      if (img.style.height) wrap.style.height = img.style.height;

      // Preserva classes utilitárias de layout que possam estar no img
      // (ex: google-review-card__photo já tem seu próprio sizing via CSS)
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var wrap  = entry.target;
        var delay = parseInt(wrap.querySelector('img').getAttribute('data-reveal-delay') || '0', 10);
        setTimeout(function () { wrap.classList.add('is-revealed'); }, delay);
        io.unobserve(wrap);
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.img-reveal-wrap').forEach(function (wrap) {
      io.observe(wrap);
    });
  }());

  (function () {
    var el    = document.querySelector('.sec-divider');
    var track = el && el.querySelector('.sec-divider__track');
    if (!el || !track) return;

    var AUTO  = 0.80;   /* px/frame velocidade normal (≈ 48 px/s @ 60fps) */
    var SLOW  = 0.15;   /* px/frame ao parar sobre o ticker               */
    var LERP  = 0.055;  /* suavidade da aceleração/desaceleração           */
    var DECAY = 0.88;   /* fricção do momentum após soltar                 */

    var halfW    = 0;
    var pos      = 0;   /* translateX atual em px, sempre em (-halfW, 0]  */
    var speed    = AUTO;
    var targetS  = AUTO;
    var dragging = false;
    var lastX    = 0;
    var momentum = 0;

    /* Mata a animação CSS — o JS assume o controle */
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
          speed    += (targetS - speed) * LERP;   /* lerp suave de velocidade */
          pos       = wrap(pos - speed);
        }
      }
      track.style.transform = 'translate3d(' + pos.toFixed(2) + 'px,0,0)';
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    /* Hover: desacelera / acelera */
    el.addEventListener('mouseenter', function () { if (!dragging) targetS = SLOW; });
    el.addEventListener('mouseleave', function () { targetS = AUTO; });

    /* ── Drag ── */
    function dragStart(x) {
      dragging = true; lastX = x; momentum = 0;
      el.style.cursor = 'grabbing';
    }
    function dragMove(x) {
      if (!dragging) return;
      var delta = x - lastX;
      pos   = wrap(pos + delta);
      momentum = delta;          /* último delta vira momentum na soltura */
      lastX = x;
    }
    function dragEnd() {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = 'grab';
      /* targetS já foi setado pelo mouseleave ou fica AUTO se vier de touch */
    }

    el.addEventListener('mousedown',  function (e) { e.preventDefault(); dragStart(e.clientX); });
    window.addEventListener('mousemove',  function (e) { dragMove(e.clientX); });
    window.addEventListener('mouseup',    function ()  { dragEnd(); });

    el.addEventListener('touchstart', function (e) { dragStart(e.touches[0].clientX); },       { passive: true });
    el.addEventListener('touchmove',  function (e) { dragMove(e.touches[0].clientX); },        { passive: true });
    el.addEventListener('touchend',   function ()  { dragEnd(); });

    el.style.cursor = 'grab';
  }());

  (function () {
    var hero = document.getElementById('inicio');
    var fab  = document.getElementById('contatos-flutuantes');
    if (!hero || !fab) return;

    var observer = new IntersectionObserver(function (entries) {
      var visible = entries[0].isIntersecting;
      fab.style.transition  = 'opacity 0.4s ease, transform 0.4s ease';
      fab.style.opacity     = visible ? '0' : '';
      fab.style.transform   = visible ? 'translateY(12px)' : '';
      fab.style.pointerEvents = visible ? 'none' : '';
    }, { threshold: 0.15 });

    observer.observe(hero);
  }());

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

    // ── Conta: estado dinâmico login/perfil ──
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

    // ── Favoritos: badge dinâmico ──
    function updatePillFavBadge() {
      var b = document.getElementById('pill-fav-badge');
      if (!b) return;
      var n = 0;
      try { n = (JSON.parse(localStorage.getItem('csm-moodboard') || '[]') || []).length; } catch (_) {}
      b.textContent = n;
      b.hidden = n === 0;
    }
    updatePillFavBadge();
    window.addEventListener('storage', function (e) { if (e.key === 'csm-moodboard') updatePillFavBadge(); });
  }());


// ── Wiring de handlers antes inline no HTML ─────────────────────────

document.addEventListener('click', function (e) {
  // Destaque card navigation links (data-goto="product-id")
  var gotoLink = e.target.closest('a[data-goto]');
  if (gotoLink) {
    e.preventDefault();
    goToDestaqueCard(gotoLink.closest('.destaque__card'), gotoLink.dataset.goto);
    return;
  }

  // Destaque specs toggle button
  var specsBtn = e.target.closest('.destaque__specs-btn');
  if (specsBtn && !e.target.closest('a[data-goto]')) {
    toggleDestaqueSpecs(specsBtn);
    return;
  }

  // Product modal close
  if (e.target.closest('#modal-produto-close')) {
    closeModal('modal-produto');
    return;
  }

  // Auth modal close
  if (e.target.closest('#auth-modal-close-btn')) {
    if (window.CSMAuth) CSMAuth.closeAuthModal();
    return;
  }

  // Auth tabs (data-panel)
  var authTab = e.target.closest('.auth-modal-tabs .auth-tab[data-panel]');
  if (authTab) {
    if (window.CSMAuth) CSMAuth.switchAuthTab(authTab.dataset.panel);
    return;
  }

  // Auth genero opts (data-genero)
  var generoOpt = e.target.closest('.auth-genero__opt[data-genero]');
  if (generoOpt) {
    if (window.CSMAuth) CSMAuth.switchGenero(generoOpt.dataset.genero);
    return;
  }

  // Auth tipo opts (data-tipo)
  var tipoOpt = e.target.closest('.auth-tipo__opt[data-tipo]');
  if (tipoOpt) {
    if (window.CSMAuth) CSMAuth.switchRegisterTipo(tipoOpt.dataset.tipo);
    return;
  }

  // Login submit
  if (e.target.id === 'auth-login-submit' || e.target.closest('#auth-login-submit')) {
    if (window.CSMAuth) CSMAuth.doLogin();
    return;
  }

  // Google login
  if (e.target.id === 'auth-google-btn' || e.target.closest('#auth-google-btn')) {
    if (window.CSMAuth) CSMAuth.doGoogleLogin();
    return;
  }

  // Register submit
  if (e.target.id === 'auth-register-submit' || e.target.closest('#auth-register-submit')) {
    if (window.CSMAuth) CSMAuth.doRegister();
    return;
  }
});

// CNPJ input formatting
document.addEventListener('input', function (e) {
  if (e.target.id === 'auth-reg-cnpj' && window.formatCNPJInput) {
    formatCNPJInput(e.target);
  }
});

