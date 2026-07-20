#!/usr/bin/env node
/**
 * gerar-catalogo.js
 * Busca TODOS os produtos da API WordPress/WooCommerce da CSM Decor
 * e gera automaticamente o arquivo produtos.html.
 *
 * Uso: node gerar-catalogo.js
 * Requisito: Node.js 18+ (fetch nativo) OU Node 16 com node-fetch instalado
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

const BASE   = 'https://www.csmdecor.com.br/wsite';
const WPP_NR = '5519990034068';
const OUT    = path.join(__dirname, 'produtos.html');

// ─── Mapeamento categoria WP → tipo de filtro ──────────────────────────────
const CAT_TO_TIPO = {
  // Sofás / Living
  living: 'sofa', 'living-sofas': 'sofa', 'living-tecido': 'sofa',
  'living-couro': 'sofa', 'sofas-em-couro': 'sofa', 'living-modulo': 'sofa',
  'home-theater-tecido': 'sofa', 'home-theater-couro': 'sofa',
  hometheater: 'sofa', 'outlet-sofas': 'sofa', 'sofas-retrateis-eletricos': 'sofa',
  // Poltronas
  'poltronas-para-living': 'poltrona',
  'em-couro-poltronas-para-living': 'poltrona',
  'em-tecido-poltronas-para-living': 'poltrona',
  'poltronas-reclinaveis': 'poltrona',
  'em-couro': 'poltrona', 'em-tecido': 'poltrona',
  poltronas: 'poltrona', 'outlet-poltronas': 'poltrona',
  // Sala de Jantar
  'salas-de-jantar': 'sala-jantar', 'mesas-de-jantar': 'sala-jantar',
  'cadeiras-mesa-de-jantar': 'sala-jantar',
  // Quarto
  'quartos-e-colchoes': 'quarto', camas: 'quarto',
  'cabeceiras-e-paineis': 'quarto', 'sofa-cama': 'quarto',
  // Área Gourmet
  'area-gourmet': 'area-gourmet', 'area-gourmet-acessorios': 'area-gourmet',
  'area-gourmet-adegas': 'area-gourmet', 'sommelier-bancos': 'area-gourmet',
  'area-gourmet-banquetas': 'area-gourmet', 'area-gourmet-mesas': 'area-gourmet',
  'area-gourmet-mochos': 'area-gourmet', 'area-gourmet-pufe': 'area-gourmet',
  'sofas-area-gourmet': 'area-gourmet', 'poltronas-area-gourmet': 'area-gourmet',
  'cadeiras-area-gourmet': 'area-gourmet', 'chaises-area-gourmet': 'area-gourmet',
  // Corporativo / Office
  corporativo: 'corporativo', 'cadeiras-office': 'corporativo',
  'mesas-office': 'corporativo', 'poltronas-office': 'corporativo',
  'prateleiras-office': 'corporativo', 'multifuncionais-office': 'corporativo',
  'sofas-office': 'corporativo', 'puffs-office': 'corporativo',
  // Complementos / Acessórios
  acessorios: 'complemento', aparadores: 'complemento',
  'mesa-de-centro-e-lateral': 'complemento', bancos: 'complemento',
  espelhos: 'complemento', 'carrinho-bar': 'complemento',
  puffs: 'complemento', racks: 'complemento', complementos: 'complemento',
  banquetas: 'complemento', buffets: 'complemento',
};

const TIPO_LABEL = {
  sofa: 'Sofá', poltrona: 'Poltrona', 'sala-jantar': 'Sala de Jantar',
  quarto: 'Quarto', 'area-gourmet': 'Área Gourmet',
  corporativo: 'Corporativo', complemento: 'Complemento',
};

// ─── Fetch helper (usa https nativo para compatibilidade Node 16/18) ─────────
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'csm-catalog-generator/1.0' } }, res => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} em ${url}`));
      }
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error(`JSON inválido: ${e.message}`)); }
      });
    }).on('error', reject);
  });
}

async function fetchCategories() {
  // Busca todas as categorias e devolve um Map id → slug
  const idToSlug = new Map();
  let page = 1;
  while (true) {
    const url = `${BASE}/?rest_route=%2Fwp%2Fv2%2Fproduct_cat&per_page=100&page=${page}&_fields=id,slug`;
    try {
      const data = await fetchJSON(url);
      if (!Array.isArray(data) || data.length === 0) break;
      data.forEach(c => idToSlug.set(c.id, c.slug));
      if (data.length < 100) break;
      page++;
    } catch (e) { break; }
  }
  return idToSlug;
}

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  while (true) {
    // rest_route recebe só o path; os outros parâmetros ficam fora do encodeURIComponent
    const url = `${BASE}/?rest_route=%2Fwp%2Fv2%2Fproduct&per_page=100&page=${page}&_embed=true`;
    process.stdout.write(`  Página ${page}... `);
    try {
      const data = await fetchJSON(url);
      if (!Array.isArray(data) || data.length === 0) { console.log('fim.'); break; }
      all.push(...data);
      console.log(`${data.length} produtos`);
      if (data.length < 100) break;
      page++;
    } catch (e) {
      console.log(`Erro: ${e.message}`);
      break;
    }
  }
  return all;
}

function stripHtml(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8220;|&#8221;|&#8222;/g, '"')
    .replace(/&#8216;|&#8217;/g, "'")
    .replace(/&#[0-9]+;/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extrai especificações técnicas do content.rendered (que contém shortcodes VC não renderizados)
function parseSpecs(rawContent) {
  if (!rawContent) return [];

  // Remove shortcodes do Visual Composer
  let text = rawContent
    .replace(/\[vc_[^\]]*\]/gi, '')
    .replace(/\[\/vc_[^\]]*\]/gi, '');

  // Converte <br> e </p> em quebra de linha, remove demais tags
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8220;|&#8221;|&#8222;/g, '"')
    .replace(/&#[0-9]+;/g, '')
    .replace(/&[a-z]+;/g, '');

  // Campos conhecidos de especificação (por ordem de prioridade de match)
  const FIELDS = [
    'Encosto', 'Estrutura', 'Braços', 'Assento', 'Pés', 'Base',
    'Mecanismo', 'Revestimento', 'Material', 'Acabamento',
    'Almofadas', 'Almofada', 'Assentos', 'Molas',
    'Largura', 'Profundidade', 'Altura', 'Medidas',
  ];

  const specs = [];

  // Processa linha por linha
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.length < 2) continue;

    let found = false;
    for (const field of FIELDS) {
      if (line.startsWith(field)) {
        const val = line.slice(field.length).replace(/^[:\s–-]+/, '').trim();
        if (val) specs.push({ key: field, val });
        found = true;
        break;
      }
    }

    // Linhas no formato "Chave: Valor" que não estão nos campos pré-definidos
    if (!found && line.includes(':') && !line.startsWith('[')) {
      const ci = line.indexOf(':');
      const key = line.slice(0, ci).trim();
      const val = line.slice(ci + 1).trim();
      if (key.length > 1 && key.length <= 25 && val.length > 1 && !/^\[/.test(key)) {
        specs.push({ key, val });
      }
    }
  }

  return specs;
}

function specsToHtml(specs) {
  if (!specs.length) return '';
  const rows = specs.map(s =>
    `<div class="cat-specs__row"><dt>${s.key}</dt><dd>${s.val}</dd></div>`
  ).join('');
  return `
              <details class="cat-specs">
                <summary class="cat-specs__toggle">Especificações técnicas</summary>
                <dl class="cat-specs__list">${rows}</dl>
              </details>`;
}

function buildCard(p, idToSlug) {
  const tipo  = getProductTipo(p, idToSlug);
  if (!tipo) return '';

  const name   = (p.title?.rendered || 'Produto').replace(/'/g, '&#39;');
  const badge  = TIPO_LABEL[tipo] || tipo;
  const wppMsg = encodeURIComponent(`Tenho interesse no produto ${name}. Pode me enviar mais informações?`);
  const wpp    = `https://wa.me/${WPP_NR}?text=${wppMsg}`;

  // Imagem: prefere woocommerce_thumbnail (600×600) em vez da full (1500×1500)
  const mediaEmbed = p._embedded?.['wp:featuredmedia']?.[0];
  const imgFull    = mediaEmbed?.source_url || '';
  const img600     = mediaEmbed?.media_details?.sizes?.woocommerce_thumbnail?.source_url
                  || mediaEmbed?.media_details?.sizes?.medium_large?.source_url
                  || imgFull;

  // Tagline: usa excerpt limpo; se vazio/genérico usa fallback
  let tagline = stripHtml(p.excerpt?.rendered || '');
  if (!tagline || tagline.length < 8 || /^ref\./i.test(tagline)) {
    tagline = `${badge} · Design exclusivo · Alto padrão`;
  }
  tagline = tagline.replace(/'/g, '&#39;').substring(0, 110);

  // Specs
  const specs    = parseSpecs(p.content?.rendered || '');
  const specsHtml = specsToHtml(specs);
  // JSON seguro para o atributo data-specs no modal
  const specsJson = JSON.stringify(specs).replace(/'/g, '&#39;').replace(/"/g, '&quot;');

  const imgTag = img600
    ? `<img src="${img600}" alt="${name} — CSM Decor" loading="lazy" />`
    : `<div class="cat-card__no-img" aria-hidden="true"></div>`;

  return `
          <article class="cat-card" data-tipo="${tipo}" data-id="${p.id}"
            data-imgs='${JSON.stringify(imgFull ? [imgFull] : [])}'
            data-wpp="${wpp}"
            data-specs="${specsJson}">
            <figure class="cat-card__fig" data-nome="${name}">
              ${imgTag}
              <span class="cat-card__badge">${badge}</span>
            </figure>
            <div class="cat-card__body">
              <h2 class="cat-card__name">${name}</h2>
              <p class="cat-card__tagline">${tagline}</p>${specsHtml}
              <button type="button" class="btn btn--primary btn--sm cat-card__cta"
                onclick="openProductModal(this.closest('.cat-card'))">
                Ver Produto
              </button>
            </div>
          </article>`;
}

// ─── Template HTML ──────────────────────────────────────────────────────────
function buildHTML(products, idToSlug) {
  const cards = products.map(p => buildCard(p, idToSlug)).filter(Boolean).join('');
  const total = products.filter(p => getProductTipo(p, idToSlug)).length;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Catálogo completo CSM Decor — Sofás, poltronas, salas de jantar, quartos e área gourmet de alto padrão. Mais de 30 anos de tradição em Campinas." />
  <meta name="robots" content="index, follow" />
  <meta property="og:title" content="Catálogo — CSM Decor | Móveis de Alto Padrão" />
  <meta property="og:description" content="${total}+ produtos exclusivos. Showroom de 6.000m² em Campinas." />
  <meta property="og:type" content="website" />
  <title>Catálogo — CSM Decor | Móveis de Alto Padrão</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <div id="page-curtain" class="page-curtain" aria-hidden="true"></div>

  <!-- ── Header ── -->
  <header class="header" id="header">
    <div class="container header__inner">
      <div class="header__left">
        <button class="header-icon header__menu-btn" id="menu-toggle-btn"
          aria-label="Abrir menu" aria-expanded="false" aria-controls="menu-overlay">
          <div class="header__menu-icon" aria-hidden="true">
            <span class="header__menu-line"></span>
            <span class="header__menu-line"></span>
          </div>
          <span class="header__menu-label">Menu</span>
        </button>
        <button type="button" class="header-icon header__cadastro-btn"
          aria-label="Cadastrar-se" onclick="openModal('modal-arquiteto')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          <span class="header__icon-label">Cadastro</span>
        </button>
        <a class="header-icon header__wpp-btn" href="fale-conosco.html" aria-label="Fale conosco">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="header__icon-label">Fale Conosco</span>
        </a>
      </div>
      <a href="index.html" class="header__logo" aria-label="CSM">
        <img src="imagens/logo/csm-logo.png" alt="CSM — Campinas Shopping Móveis" class="header__logo-img" width="160" height="48" />
      </a>
      <div class="header__right">
        <button type="button" class="header-icon header__search-btn" id="header-search-btn" aria-label="Pesquisar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button class="header-icon header__moodboard-btn" id="moodboard-header-btn" aria-label="Meu Moodboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <span class="header__moodboard-badge" id="moodboard-badge" hidden>0</span>
        </button>
        <button class="header-icon header__theme-toggle" id="theme-toggle" aria-label="Alternar tema">
          <svg class="icon-moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg class="icon-sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        </button>
      </div>
    </div>
  </header>

  <!-- ── Menu Overlay ── -->
  <div class="menu-overlay" id="menu-overlay" role="dialog" aria-modal="true" aria-label="Menu de navegação" hidden>
    <div class="menu-overlay__topbar">
      <div class="container menu-overlay__topbar-inner">
        <div class="header__left">
          <button class="header__menu-btn is-open" id="menu-close-btn" aria-label="Fechar menu">
            <div class="header__menu-icon" aria-hidden="true">
              <span class="header__menu-line"></span>
              <span class="header__menu-line"></span>
            </div>
            <span class="header__menu-label">Fechar</span>
          </button>
        </div>
        <a href="index.html" class="header__logo" aria-label="CSM">
          <img src="imagens/logo/csm-logo.png" alt="CSM" class="header__logo-img menu-overlay__logo" width="160" height="48" />
        </a>
        <div class="header__right"></div>
      </div>
    </div>
    <div class="menu-overlay__body">
      <div class="container menu-overlay__inner">
        <nav class="menu-nav" aria-label="Navegação principal">
          <ul class="menu-nav__list">
            <li class="menu-nav__item"><a href="index.html#inicio"      class="menu-nav__link" data-num="01"><span class="menu-nav__link-text">Início</span></a></li>
            <li class="menu-nav__item"><a href="index.html#historia"    class="menu-nav__link" data-num="02"><span class="menu-nav__link-text">Nossa História</span></a></li>
            <li class="menu-nav__item"><a href="index.html#ambientes"   class="menu-nav__link" data-num="03"><span class="menu-nav__link-text">Ambientes</span></a></li>
            <li class="menu-nav__item"><a href="produtos.html"          class="menu-nav__link is-active" data-num="04"><span class="menu-nav__link-text">Produtos</span></a></li>
            <li class="menu-nav__item"><a href="index.html#showroom"    class="menu-nav__link" data-num="05"><span class="menu-nav__link-text">Showroom</span></a></li>
            <li class="menu-nav__item"><a href="index.html#depoimentos" class="menu-nav__link" data-num="06"><span class="menu-nav__link-text">Depoimentos</span></a></li>
            <li class="menu-nav__item"><a href="index.html#arquitetos"  class="menu-nav__link" data-num="07"><span class="menu-nav__link-text">Arquitetos</span></a></li>
          </ul>
        </nav>
        <aside class="menu-aside">
          <div class="menu-aside__block">
            <p class="menu-aside__label">Showroom</p>
            <p class="menu-aside__text">Av. Dr. Moraes Sales, 1575<br />Cambuí, Campinas — SP</p>
          </div>
          <div class="menu-aside__block">
            <p class="menu-aside__label">Atendimento</p>
            <a href="https://wa.me/${WPP_NR}" class="menu-aside__text menu-aside__link" target="_blank" rel="noopener noreferrer">(19) 99003-4068 — WhatsApp</a>
            <a href="mailto:contato@csmdecor.com.br" class="menu-aside__text menu-aside__link">contato@csmdecor.com.br</a>
          </div>
          <div class="menu-aside__block menu-aside__block--socials">
            <a href="https://www.instagram.com/csmdecor/" target="_blank" rel="noopener noreferrer" class="menu-aside__social">Instagram</a>
            <span class="menu-aside__dot" aria-hidden="true">·</span>
            <a href="https://web.facebook.com/CampinasShoppingMoveis/" target="_blank" rel="noopener noreferrer" class="menu-aside__social">Facebook</a>
          </div>
          <a href="https://wa.me/${WPP_NR}?text=Quero%20agendar%20uma%20visita%20ao%20showroom%20CSM." class="btn btn--primary" target="_blank" rel="noopener noreferrer">Agendar visita ao showroom</a>
        </aside>
      </div>
    </div>
    <div class="menu-overlay__footer">
      <div class="container">
        <p class="menu-overlay__tagline">6.000 m² de Inspiração &nbsp;·&nbsp; 200+ Marcas Parceiras &nbsp;·&nbsp; 30+ Anos de Tradição</p>
      </div>
    </div>
  </div>

  <!-- ── Conteúdo Principal ── -->
  <main>

    <section class="cat-page-hero" aria-label="Catálogo de produtos">
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="index.html">Início</a>
          <span class="breadcrumb__sep" aria-hidden="true">›</span>
          <span class="breadcrumb__current" aria-current="page">Catálogo</span>
        </nav>
        <p class="eyebrow">CSM Decor</p>
        <h1 class="section-title">Nosso <em>Catálogo</em></h1>
        <p class="cat-page-hero__sub">
          ${total} produtos exclusivos produzidos sob encomenda. Escolha o revestimento, o acabamento e as dimensões ideais para o seu projeto.
        </p>
      </div>
    </section>

    <!-- ── Filtros ── -->
    <div class="catalogo__filters cat-page-filters" role="tablist" aria-label="Filtrar por categoria" id="cat-filters">
      <div class="container">
        <button class="filter active" role="tab" aria-selected="true"  data-cat="all">Todos <span class="filter__count" id="cnt-all"></span></button>
        <button class="filter"        role="tab" aria-selected="false" data-cat="sofa">Sofás</button>
        <button class="filter"        role="tab" aria-selected="false" data-cat="poltrona">Poltronas</button>
        <button class="filter"        role="tab" aria-selected="false" data-cat="sala-jantar">Sala de Jantar</button>
        <button class="filter"        role="tab" aria-selected="false" data-cat="quarto">Quartos</button>
        <button class="filter"        role="tab" aria-selected="false" data-cat="area-gourmet">Área Gourmet</button>
        <button class="filter"        role="tab" aria-selected="false" data-cat="corporativo">Corporativo</button>
        <button class="filter"        role="tab" aria-selected="false" data-cat="complemento">Complementos</button>
      </div>
    </div>

    <!-- ── Grade ── -->
    <section class="cat-page-grid" aria-label="Produtos">
      <div class="container">
        <div class="catalogo__grid" id="catalogo-grid">
${cards}
        </div>

        <div class="cat-empty" id="cat-empty" hidden>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:var(--gray-mid);margin-bottom:1rem"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>Nenhum produto encontrado nessa categoria.</p>
          <button class="btn btn--outline" onclick="setFilter('all')" style="margin-top:1rem">Ver todos</button>
        </div>

        <div class="catalogo__rodape" style="padding-top:3rem;border-top:1px solid var(--gray-line);margin-top:1rem;">
          <p class="catalogo__nota">Todos os produtos são fabricados sob encomenda. Revestimentos, dimensões e acabamentos customizáveis. Consulte prazos e condições.</p>
          <a href="https://wa.me/${WPP_NR}?text=Gostaria%20de%20conhecer%20o%20catálogo%20completo%20CSM%20Decor." class="btn btn--outline" target="_blank" rel="noopener noreferrer">Falar com um consultor</a>
        </div>
      </div>
    </section>

  </main>

  <!-- ── Footer ── -->
  <footer class="footer" role="contentinfo">
    <div class="container footer__top">
      <div class="footer__brand">
        <a href="index.html" aria-label="CSM">
          <img src="imagens/logo/csm-logo.png" alt="CSM" class="footer__logo" width="140" height="42" />
        </a>
        <p class="footer__tagline">Transformando ambientes com sofisticação<br />há mais de 30 anos em Campinas.</p>
        <div class="footer__socials" aria-label="Redes sociais">
          <a href="https://www.instagram.com/csmdecor/" class="social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="https://www.facebook.com/csmdecor" class="social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </div>
      </div>
      <nav class="footer__nav" aria-label="Links do rodapé">
        <div class="footer__col footer__col--sitemap">
          <h3 class="footer__col-title">Mapa do Site</h3>
          <ul>
            <li><a href="index.html">Início</a></li>
            <li><a href="index.html#ambientes">Ambientes</a></li>
            <li><a href="produtos.html">Catálogo</a></li>
            <li><a href="index.html#historia">Sobre Nós</a></li>
            <li><a href="index.html#showroom">Showroom</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h3 class="footer__col-title">Contato</h3>
          <ul>
            <li><a href="https://wa.me/${WPP_NR}" target="_blank" rel="noopener noreferrer">(19) 99003-4068</a></li>
            <li><a href="tel:+551937538988">(19) 3753-8988</a></li>
            <li><a href="mailto:contato@csmdecor.com.br">contato@csmdecor.com.br</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <h3 class="footer__col-title">Horários</h3>
          <ul class="footer__hours">
            <li><span>Seg — Sex</span><span>9h às 19h</span></li>
            <li><span>Sábado</span><span>9h às 18h</span></li>
            <li><span>Dom e Feriados</span><span>10h às 18h</span></li>
          </ul>
        </div>
      </nav>
    </div>
    <div class="footer__bottom">
      <div class="container footer__bottom-inner">
        <p>© <span id="ano"></span> CSM — Campinas Shopping Móveis. Todos os direitos reservados.</p>
        <p><a href="#">Política de Privacidade</a> · <a href="#">Termos de Uso</a></p>
      </div>
    </div>
  </footer>

  <!-- ── Modal: Produto ── -->
  <div class="modal-overlay" id="modal-produto" role="dialog" aria-modal="true" aria-labelledby="modal-produto-title" hidden>
    <div class="modal" role="document">
      <button class="modal__close" aria-label="Fechar" onclick="closeModal('modal-produto')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="modal__layout">
        <div class="modal__gallery">
          <div class="modal__img-wrap"><img id="modal-img-main" src="" alt="" class="modal__img-main" /></div>
          <div class="modal__thumbs" id="modal-thumbs"></div>
        </div>
        <div class="modal__info">
          <span class="modal__badge" id="modal-badge"></span>
          <h2 class="modal__title" id="modal-produto-title"></h2>
          <p class="modal__tagline" id="modal-tagline"></p>
          <div id="modal-specs" class="modal__specs"></div>
          <a id="modal-wpp-btn" href="#" class="btn btn--primary modal__cta" target="_blank" rel="noopener noreferrer">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Solicitar Orçamento via WhatsApp
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Modal: Cadastro ── -->
  <div class="modal-overlay" id="modal-arquiteto" role="dialog" aria-modal="true" aria-labelledby="modal-arq-title" hidden>
    <div class="modal modal--sm" role="document">
      <button class="modal__close" aria-label="Fechar" onclick="closeModal('modal-arquiteto')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div id="arq-form-wrap">
        <div class="modal__arq-header">
          <img src="imagens/logo/csm-logo.png" alt="CSM Decor" class="modal__arq-logo" />
          <h2 id="modal-arq-title" class="modal__arq-title">Bem-vindo à CSM</h2>
          <p class="modal__arq-sub">Crie sua conta para acompanhar projetos e receber novidades exclusivas.</p>
        </div>
        <button class="btn-google" onclick="simulateGoogleLogin()">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Entrar com o Google
        </button>
        <div class="modal__divider"><span>ou complete seu cadastro</span></div>
        <form class="arq-form" onsubmit="submitArqForm(event)">
          <div class="arq-form__row">
            <label class="arq-form__label" for="cli-nome">Nome completo</label>
            <input class="arq-form__input" type="text" id="cli-nome" placeholder="Seu nome" required />
          </div>
          <div class="arq-form__row">
            <label class="arq-form__label" for="cli-email">E-mail</label>
            <input class="arq-form__input" type="email" id="cli-email" placeholder="seu@email.com" required />
          </div>
          <div class="arq-form__row">
            <label class="arq-form__label" for="cli-tel">Telefone / WhatsApp</label>
            <input class="arq-form__input" type="tel" id="cli-tel" placeholder="(19) 9 0000-0000" />
          </div>
          <button type="submit" class="btn btn--primary arq-form__submit">Criar minha conta</button>
        </form>
      </div>
      <div id="arq-success" hidden class="arq-success">
        <div class="arq-success__icon" aria-hidden="true">✓</div>
        <h3 class="arq-success__title">Cadastro realizado!</h3>
        <p class="arq-success__text">Nossa equipe entrará em contato em breve.</p>
        <button class="btn btn--outline" onclick="closeModal('modal-arquiteto')" style="margin-top:1.5rem">Fechar</button>
      </div>
    </div>
  </div>

  <!-- ── FAB ── -->
  <div class="fab-cluster" id="fab-cluster" role="complementary" aria-label="Canais de atendimento">
    <div class="fab-subs" id="fab-subs" aria-hidden="true">
      <a href="https://web.facebook.com/CampinasShoppingMoveis/" class="fab-sub fab-sub--fb" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
        <span class="fab-sub__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></span>
        <span class="fab-sub__label">Facebook</span>
      </a>
      <a href="https://www.instagram.com/csmdecor/" class="fab-sub fab-sub--ig" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
        <span class="fab-sub__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></span>
        <span class="fab-sub__label">Instagram</span>
      </a>
      <a href="https://wa.me/${WPP_NR}?text=Olá%2C%20vim%20pelo%20catálogo%20CSM%20e%20gostaria%20de%20falar%20com%20um%20consultor." class="fab-sub fab-sub--wpp" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
        <span class="fab-sub__icon" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></span>
        <span class="fab-sub__label">WhatsApp</span>
      </a>
    </div>
    <button class="fab-main" id="fab-main" aria-expanded="false" aria-controls="fab-subs">
      <span class="fab-main__icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
      <span class="fab-main__label">Atendimento</span>
    </button>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>

  <script>
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

    // Imagem principal (usa a full-size para o modal)
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

    // Specs técnicas
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
  function setFilter(cat){
    activeFilter = cat;
    var cards = document.querySelectorAll('.cat-card');
    var btns  = document.querySelectorAll('[data-cat]');
    var empty = document.getElementById('cat-empty');
    var vis   = 0;
    btns.forEach(function(b){ var a=b.dataset.cat===cat; b.classList.toggle('active',a); b.setAttribute('aria-selected',a?'true':'false'); });
    cards.forEach(function(c){ var m=cat==='all'||c.dataset.tipo===cat; c.style.display=m?'':'none'; if(m) vis++; });
    if (empty) empty.hidden = vis > 0;
    var url = new URL(window.location);
    if (cat==='all') url.searchParams.delete('categoria'); else url.searchParams.set('categoria',cat);
    history.replaceState(null,'',url);
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
    function updateBadge(){ var b=document.getElementById('moodboard-badge'); if(!b) return; b.textContent=saved.length; b.hidden=saved.length===0; }
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

  (function(){
    var f=document.getElementById('fab-main'); var s=document.getElementById('fab-subs'); if(!f||!s) return;
    f.addEventListener('click',function(){ var o=f.getAttribute('aria-expanded')==='true'; f.setAttribute('aria-expanded',o?'false':'true'); s.setAttribute('aria-hidden',o?'true':'false'); f.classList.toggle('is-open',!o); });
    document.addEventListener('click',function(e){ if(!f.contains(e.target)&&!s.contains(e.target)){f.setAttribute('aria-expanded','false');s.setAttribute('aria-hidden','true');f.classList.remove('is-open');} });
  }());

  function submitArqForm(e){ e.preventDefault(); var fw=document.getElementById('arq-form-wrap'); var sw=document.getElementById('arq-success'); if(fw) fw.hidden=true; if(sw) sw.hidden=false; }
  function simulateGoogleLogin(){ submitArqForm({preventDefault:function(){}}); }

  var sb=document.getElementById('header-search-btn');
  if(sb) sb.addEventListener('click',function(){window.location.href='index.html';});

  var an=document.getElementById('ano'); if(an) an.textContent=new Date().getFullYear();
  </script>

  <script>
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
      if(/^(https?:\\/\\/|\\/\\/|mailto:|tel:)/.test(href)) return;
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
  </script>

</body>
</html>`;
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔍 Buscando categorias...');
  const idToSlug = await fetchCategories();
  console.log(`   ${idToSlug.size} categorias carregadas`);

  console.log('\n🔍 Buscando produtos da API CSM Decor...\n');

  const products = await fetchAllProducts();
  console.log(`\n✅ Total de produtos recebidos: ${products.length}`);

  const included = products.filter(p => getProductTipo(p, idToSlug));
  const excluded = products.filter(p => !getProductTipo(p, idToSlug));

  console.log(`   Incluídos no catálogo: ${included.length}`);
  if (excluded.length) {
    console.log(`   Sem categoria mapeada (ignorados): ${excluded.length}`);
    excluded.forEach(p => console.log(`     → [${p.id}] ${p.title?.rendered}`));
  }

  console.log('\n📝 Gerando produtos.html...');
  const html = buildHTML(products, idToSlug);
  fs.writeFileSync(OUT, html, 'utf8');

  console.log(`\n✅ Arquivo gerado: ${OUT}`);
  console.log(`   ${included.length} produtos listados com imagens e filtros.\n`);
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});

// ─── Helpers ───────────────────────────────────────────────────────────────
function getProductTipo(p, idToSlug) {
  // product_cat é um array de IDs numéricos; mapeamos para slug via idToSlug
  const catIds = p.product_cat || [];
  for (const id of catIds) {
    const slug = idToSlug ? idToSlug.get(id) : null;
    if (slug && CAT_TO_TIPO[slug]) return CAT_TO_TIPO[slug];
  }
  return null;
}
