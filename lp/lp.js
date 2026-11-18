(function(){
  var WA = "5519990034068";
  var dl = (window.dataLayer = window.dataLayer || []);
  document.documentElement.classList.add('js');
  function track(name, extra){ try{ var e = {event:name}; for (var k in extra){ e[k]=extra[k]; } dl.push(e); if(window.fbq && name === 'lead_submit'){ window.fbq('track','Lead'); } }catch(_){} }

  var origem = "";
  try{
    var q = new URLSearchParams(location.search), parts = [];
    ["utm_source","utm_medium","utm_campaign"].forEach(function(k){ if(q.get(k)) parts.push(q.get(k)); });
    origem = parts.join("/");
  }catch(_){}

  function waLink(text){ return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); }
  function base(msg){ return msg + (origem ? "\n(origem: " + origem + ")" : ""); }

  var hello = base("Olá! Vim pela página da CSM e quero agendar uma visita ao showroom.");
  ["wa-hero","wa-dock"].forEach(function(id){ var a=document.getElementById(id); if(a) a.href = waLink(hello); });
  var pro = document.getElementById("wa-pro");
  if(pro) pro.href = waLink(base("Olá! Sou arquiteto(a)/decorador(a) e quero me cadastrar como parceiro da CSM."));

  track("lp_view", {page:"lp-agendar-visita", origem: origem});

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // header shadow on scroll
  var hdr = document.getElementById("hdr");
  function onScroll(){ hdr.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, {passive:true}); onScroll();

  // reveal: only elements below the fold start hidden; failsafe shows everything
  var rv = [].slice.call(document.querySelectorAll(".rv"));
  if(reduce || !("IntersectionObserver" in window)){
    rv.forEach(function(el){ el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
    }, {threshold:.12, rootMargin:"0px 0px -6% 0px"});
    rv.forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.top < window.innerHeight){ el.classList.add("in"); } else { io.observe(el); }
    });
    setTimeout(function(){ rv.forEach(function(el){ el.classList.add("in"); }); }, 4000);
  }

  // hero 3D: mouse (desktop), finger drag, phone tilt (gyroscope) and scroll (everywhere)
  var stage = document.getElementById("stage");
  if(stage && !reduce){
    var tx = 0, ty = 0, cx = 0, cy = 0, running = false, gyroOn = false, gotTilt = false, g0 = null, b0 = null;
    function apply(){
      cx += (tx - cx) * .12; cy += (ty - cy) * .12;
      stage.style.setProperty("--px", cx.toFixed(3)); stage.style.setProperty("--py", cy.toFixed(3));
      if(Math.abs(tx - cx) > .002 || Math.abs(ty - cy) > .002){ requestAnimationFrame(apply); } else { running = false; }
    }
    function aim(x, y){
      tx = Math.max(-1, Math.min(1, x)); ty = Math.max(-1, Math.min(1, y));
      if(!running){ running = true; requestAnimationFrame(apply); }
    }
    stage.addEventListener("pointermove", function(ev){
      var b = stage.getBoundingClientRect();
      aim(((ev.clientX - b.left) / b.width - .5) * 2, ((ev.clientY - b.top) / b.height - .5) * 2);
    });
    ["pointerleave","pointerup","pointercancel"].forEach(function(n){
      stage.addEventListener(n, function(){ if(!gyroOn){ aim(0, 0); } });
    });

    // phone tilt: the effect follows the angle and slowly re-centers when the phone is held still
    function onTilt(e){
      if(e.gamma == null || e.beta == null){ return; }
      if(g0 === null){ g0 = e.gamma; b0 = e.beta; }
      gotTilt = true; gyroOn = true;
      aim((e.gamma - g0) / 16, (e.beta - b0) / 16);
      g0 += (e.gamma - g0) * .015; b0 += (e.beta - b0) * .015;
    }
    var DOE = window.DeviceOrientationEvent;
    var finePointer = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches;
    if(DOE && !finePointer){
      // Android and most browsers send motion right away; iPhone only after a tap
      window.addEventListener("deviceorientation", onTilt);
      setTimeout(function(){
        var gb = document.getElementById("gyro");
        if(!gotTilt && gb && typeof DOE.requestPermission === "function"){
          gb.hidden = false;
          gb.addEventListener("click", function(){
            DOE.requestPermission().then(function(r){ if(r === "granted"){ track("gyro_on", {}); } gb.hidden = true; }).catch(function(){ gb.hidden = true; });
          });
        }
      }, 900);
    }

    // scroll depth: works on every device, no permission needed
    function onScrollDepth(){
      var r = stage.getBoundingClientRect(), vh = window.innerHeight;
      if(r.bottom < 0 || r.top > vh){ return; }
      var p = ((r.top + r.height / 2) - vh / 2) / vh;
      stage.style.setProperty("--sy", Math.max(-1, Math.min(1, p)).toFixed(3));
    }
    window.addEventListener("scroll", onScrollDepth, {passive:true}); onScrollDepth();
  }

  // clicks: tracking + room preselect
  var form = document.getElementById("lead");
  var customRoom = "";
  document.addEventListener("click", function(ev){
    var t = ev.target;
    var el = t.closest ? t.closest("[data-cta]") : null;
    if(el){ track("cta_click", {cta: el.getAttribute("data-cta")}); }
    var room = t.closest ? t.closest("[data-room]") : null;
    if(room){
      var v = room.getAttribute("data-room"), found = false;
      var radios = form.querySelectorAll("input[name=amb]");
      for(var i=0;i<radios.length;i++){ radios[i].checked = (radios[i].value === v); if(radios[i].checked) found = true; }
      customRoom = found ? "" : v;
      track("room_click", {room: v});
    }
  });
  form.addEventListener("change", function(ev){ if(ev.target.name === "amb"){ customRoom = ""; } });

  var done = document.getElementById("done");
  function val(name){ var c = form.querySelector("input[name="+name+"]:checked"); return c ? c.value : ""; }

  form.addEventListener("submit", function(ev){
    ev.preventDefault();
    var nome = form.nome.value.trim();
    var digits = form.fone.value.replace(/\D/g,"");
    var okNome = nome.length >= 3;
    var okFone = digits.length === 10 || digits.length === 11;
    document.getElementById("err-nome").textContent = okNome ? "" : "Digite seu nome.";
    document.getElementById("err-fone").textContent = okFone ? "" : "Digite o WhatsApp com DDD, por exemplo (19) 90000-0000.";
    form.nome.setAttribute("aria-invalid", okNome ? "false":"true");
    form.fone.setAttribute("aria-invalid", okFone ? "false":"true");
    if(!okNome){ form.nome.focus(); return; }
    if(!okFone){ form.fone.focus(); return; }

    var amb = val("amb") || customRoom;
    var prazo = val("prazo");
    var linhas = ["Olá! Quero agendar uma visita ao showroom da CSM.", "Nome: " + nome, "WhatsApp: " + form.fone.value.trim()];
    if(amb) linhas.push("Ambiente: " + amb);
    if(prazo) linhas.push("Prazo: " + prazo);
    document.getElementById("wa-final").href = waLink(base(linhas.join("\n")));

    track("lead_submit", {ambiente: amb, prazo: prazo, origem: origem});
    // Produção: enviar também os dados ao CRM/e-mail da CSM antes de mostrar este passo.
    form.style.display = "none";
    done.classList.add("show");
    done.focus();
  });
})();
