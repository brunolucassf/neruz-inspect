// Kit das lojas: capturas 1280x800 reais da extensão e artes promocionais.
// Uso: node tests/store/capture.mjs [--locales=pt-BR,en,es] [--only=shots|promo] [--skip-build]
import { copyFileSync, createReadStream, existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import {
  getTabId,
  injectOverlay,
  launch,
  prepareTestBuild,
  ROOT,
  TEST_BUILD_DIR,
} from '../e2e/lib.mjs';

const OUT = join(ROOT, 'docs', 'store', 'assets');
const PORT = 4181;
const BASE = `http://localhost:${PORT}`;
const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const LOCALES = (arg('locales') ?? 'pt-BR,en,es').split(',');
const ONLY = arg('only');

const COPY = {
  'pt-BR': {
    lang: 'pt-BR',
    title: 'Maré Cerâmica | Peças feitas à mão em Florianópolis',
    description: 'Ateliê de cerâmica autoral: xícaras, pratos e vasos queimados em forno a lenha.',
    nav: ['Coleção', 'Ateliê', 'Oficinas', 'Contato'],
    eyebrow: 'Cerâmica autoral',
    h1: 'Peças feitas à mão, no ritmo da maré.',
    lead: 'Xícaras, pratos e vasos modelados no torno e queimados em forno a lenha. Cada peça sai única, com a marca de quem a fez.',
    cta: 'Ver a coleção',
    ghost: 'Conhecer o ateliê',
    cards: [
      ['Xícara Concha', 'R$ 98', 'Esmalte areia, 180 ml'],
      ['Prato Duna', 'R$ 142', 'Grés queimado a 1280 °C'],
      ['Vaso Baía', 'R$ 236', 'Torneado, esmalte oceano'],
    ],
    addCart: 'Adicionar',
    find: 'Buscar',
    note: 'Frete grátis acima de R$ 300.',
    promoSub: 'Cor, tipografia, medidas, tecnologias e acessibilidade, direto na página.',
    promoTitle: ['Inspecione', 'qualquer site'],
  },
  en: {
    lang: 'en',
    title: 'Maré Ceramics | Handmade pieces from Florianópolis',
    description: 'Independent ceramic studio: cups, plates and vases fired in a wood kiln.',
    nav: ['Collection', 'Studio', 'Workshops', 'Contact'],
    eyebrow: 'Studio ceramics',
    h1: 'Handmade pieces, at the pace of the tide.',
    lead: 'Cups, plates and vases thrown on the wheel and fired in a wood kiln. Every piece comes out one of a kind, with the mark of its maker.',
    cta: 'See the collection',
    ghost: 'Meet the studio',
    cards: [
      ['Shell Cup', '$ 19', 'Sand glaze, 6 oz'],
      ['Dune Plate', '$ 28', 'Stoneware fired at 1280 °C'],
      ['Bay Vase', '$ 46', 'Wheel thrown, ocean glaze'],
    ],
    addCart: 'Add',
    find: 'Search',
    note: 'Free shipping over $ 60.',
    promoSub: 'Color, type, spacing, tech and accessibility, right on the page.',
    promoTitle: ['Inspect', 'any website'],
  },
  es: {
    lang: 'es',
    title: 'Maré Cerámica | Piezas hechas a mano en Florianópolis',
    description: 'Taller de cerámica de autor: tazas, platos y jarrones cocidos en horno de leña.',
    nav: ['Colección', 'Taller', 'Talleres', 'Contacto'],
    eyebrow: 'Cerámica de autor',
    h1: 'Piezas hechas a mano, al ritmo de la marea.',
    lead: 'Tazas, platos y jarrones modelados en el torno y cocidos en horno de leña. Cada pieza sale única, con la marca de quien la hizo.',
    cta: 'Ver la colección',
    ghost: 'Conocer el taller',
    cards: [
      ['Taza Concha', '$ 19', 'Esmalte arena, 180 ml'],
      ['Plato Duna', '$ 28', 'Gres cocido a 1280 °C'],
      ['Jarrón Bahía', '$ 46', 'Torneado, esmalte océano'],
    ],
    addCart: 'Añadir',
    find: 'Buscar',
    note: 'Envío gratis desde $ 60.',
    promoSub: 'Color, tipografía, medidas, tecnologías y accesibilidad, directo en la página.',
    promoTitle: ['Inspecciona', 'cualquier sitio'],
  },
};

const pieceSvg = (kind, a, b) => {
  const shapes = [
    `<path d="M70 70h100l-8 70q-2 16-18 16H96q-16 0-18-16z" fill="${a}"/><path d="M170 86q30 0 30 24t-32 28" fill="none" stroke="${a}" stroke-width="10" stroke-linecap="round"/><ellipse cx="120" cy="70" rx="50" ry="9" fill="${b}"/>`,
    `<ellipse cx="120" cy="116" rx="92" ry="30" fill="${a}"/><ellipse cx="120" cy="110" rx="70" ry="20" fill="${b}"/>`,
    `<path d="M96 40h48v22q38 18 38 56 0 38-28 44H86q-28-6-28-44 0-38 38-56z" fill="${a}"/><ellipse cx="120" cy="40" rx="24" ry="6" fill="${b}"/>`,
  ];
  return `<svg viewBox="0 0 240 180" role="img" aria-hidden="true">${shapes[kind]}</svg>`;
};

const pageHtml = (c) => `<!doctype html>
<html lang="${c.lang}" class="lenis lenis-smooth"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${c.title}</title>
<meta name="description" content="${c.description}">
<meta name="generator" content="Astro v4.16">
<meta property="og:title" content="${c.title}"><meta property="og:description" content="${c.description}">
<meta property="og:type" content="website"><meta property="og:image" content="${BASE}/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${BASE}/"><link rel="icon" href="data:,">
<script>window.gsap={version:'3.12.5'};window.ScrollTrigger={version:'3.12.5'};window.jQuery=function(){};window.jQuery.fn={jquery:'3.7.1'};</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Store","name":"Maré Cerâmica","url":"${BASE}/","description":"${c.description}"}</script>
<style>
@font-face{font-family:Fraunces;src:url(/fonts/Fraunces-600.woff2) format("woff2");font-weight:600;font-display:block}
@font-face{font-family:Inter;src:url(/fonts/Inter-400.woff2) format("woff2");font-weight:400;font-display:block}
@font-face{font-family:Inter;src:url(/fonts/Inter-600.woff2) format("woff2");font-weight:600;font-display:block}
*{box-sizing:border-box;margin:0}
body{font-family:Inter,sans-serif;background:#f6efe6;color:#2a2220;min-height:100vh}
header{display:flex;align-items:center;justify-content:space-between;padding:22px 56px}
.brand{font-family:Fraunces,serif;font-weight:600;font-size:26px;letter-spacing:-.01em;color:#1f4e5f}
nav{display:flex;gap:30px;font-size:15px}
nav a{color:#4a3f3a;text-decoration:none}
nav{align-items:center}
.brand{display:inline-flex;align-items:center;gap:8px}
.find{width:130px;height:34px;border:1px solid #c9b9a8;border-radius:8px;padding:0 10px;background:#fffaf3;font:14px Inter,sans-serif}
.bag{width:34px;height:34px;border:0;background:#f0e2d0;border-radius:8px}
.note{display:block;margin-top:22px;font-size:13px;color:#b8aba0}
main{padding:30px 56px 0;display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}
.eyebrow{font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#a24a30;font-weight:600}
h1{font-family:Fraunces,serif;font-weight:600;font-size:58px;line-height:1.05;letter-spacing:-.02em;margin:14px 0 20px;color:#1f4e5f}
.lead{font-size:18px;line-height:1.6;color:#5a4e48;max-width:520px}
.actions{display:flex;gap:14px;margin-top:30px}
.btn{display:inline-flex;align-items:center;height:48px;padding:0 24px;border-radius:12px;font-weight:600;font-size:15px;text-decoration:none}
.btn.primary{background:#1f4e5f;color:#f6efe6}
.btn.ghost{border:1.5px solid #c9b9a8;color:#2a2220}
.hero-art{background:linear-gradient(150deg,#e7a98a,#c9694a);border-radius:28px;height:380px;display:grid;place-items:center}
.hero-art svg{width:78%}
.cards{grid-column:1 / -1;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:16px 0 40px}
.card{background:#fffaf3;border-radius:20px;padding:18px;box-shadow:0 1px 0 #e6d9c8,0 12px 28px -18px #5a3b2a}
.card .art{border-radius:14px;height:130px;display:grid;place-items:center}
.card .art svg{height:104px}
.card h3{font-family:Fraunces,serif;font-size:20px;margin:16px 0 4px;color:#1f4e5f}
.card p{font-size:14px;color:#6b5d55}
.card .row{display:flex;justify-content:space-between;align-items:center;margin-top:14px}
.price{font-weight:600;font-size:17px}
.add{border:0;background:#f0e2d0;border-radius:10px;height:36px;padding:0 14px;font:600 14px Inter,sans-serif;color:#2a2220}
</style></head><body>
<div data-reactroot class="min-h-screen w-full">
<header><span class="brand"><img class="mark" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M2 14q5-8 10 0t10 0v8H2z' fill='%231f4e5f'/%3E%3C/svg%3E" width="28" height="28">Maré</span><nav aria-label="Menu">${c.nav.map((n) => `<a href="#">${n}</a>`).join('')}<input class="find" type="text" placeholder="${c.find}"><button class="bag" type="button"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6z" fill="none" stroke="#2a2220" stroke-width="2"/></svg></button></nav></header>
<main>
<section><p class="eyebrow">${c.eyebrow}</p><h1>${c.h1}</h1><p class="lead">${c.lead}</p>
<div class="actions"><a class="btn primary" href="#colecao">${c.cta}</a><a class="btn ghost" href="#">${c.ghost}</a></div><span class="note">${c.note}</span></section>
<div class="hero-art">${pieceSvg(2, '#f6efe6', '#1f4e5f')}</div>
<section class="cards flex items-center justify-between gap-4 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 border-gray-200" id="colecao">
${c.cards
  .map(
    ([name, price, note], i) =>
      `<article class="card"><div class="art" style="background:${['#dfe9e6', '#f0dccb', '#d5e3ea'][i]}">${pieceSvg(i, ['#d9b48a', '#c9694a', '#1f4e5f'][i], '#f6efe6')}</div><h3>${name}</h3><p>${note}</p><div class="row"><span class="price">${price}</span><button class="add" type="button">${c.addCart}</button></div></article>`,
  )
  .join('')}
</section></main></div></body></html>`;

const MIME = {
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.html': 'text/html; charset=utf-8',
};
const STATIC_DIRS = {
  '/fonts/': join(ROOT, 'apps', 'landing', 'public', 'fonts'),
  '/brand/': join(ROOT, 'apps', 'landing', 'public', 'brand'),
};

let currentLocale = 'pt-BR';
let promoHtml = '';
const startServer = () =>
  new Promise((resolveServer) => {
    const server = createServer((req, res) => {
      const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
      const dir = Object.keys(STATIC_DIRS).find((d) => path.startsWith(d));
      if (dir) {
        const file = join(STATIC_DIRS[dir], path.slice(dir.length));
        if (existsSync(file)) {
          res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
          return createReadStream(file).pipe(res);
        }
      }
      if (path === '/promo') {
        res.writeHead(200, { 'content-type': MIME['.html'] });
        return res.end(promoHtml);
      }
      if (path === '/') {
        res.writeHead(200, { 'content-type': MIME['.html'] });
        return res.end(pageHtml(COPY[currentLocale]));
      }
      res.writeHead(404);
      res.end();
    });
    server.listen(PORT, () => resolveServer(server));
  });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const captureShots = async (locale) => {
  currentLocale = locale;
  const { context, worker } = await launch(TEST_BUILD_DIR, { locale });
  const page = await context.newPage();
  const panel = page.locator('neruz-inspect .ni-panel');
  const dir = join(OUT, locale);
  mkdirSync(dir, { recursive: true });
  const shot = (n) => page.screenshot({ path: join(dir, `screenshot-0${n}.png`), type: 'png' });

  const fresh = async () => {
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await wait(400);
    const result = await injectOverlay(worker, await getTabId(worker, 'http://localhost/*'));
    if (result !== 'ok') throw new Error(result);
    await page.waitForSelector('neruz-inspect .ni-toolbar');
    await wait(700);
  };
  const open = async (group, tool) => {
    await page.locator('neruz-inspect .ni-toolbar__group').nth(group).click();
    await page.locator('neruz-inspect .ni-list__item').nth(tool).click();
    await page.waitForSelector('neruz-inspect .ni-panel');
    await wait(900);
  };
  const moveTo = async (selector, dx = 0, dy = 0) => {
    const box = await page.locator(selector).first().boundingBox();
    await page.mouse.move(box.x + box.width / 2 - 8 + dx, box.y + box.height / 2 + dy);
    await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 5 });
    await wait(500);
  };

  await fresh();
  await open(0, 1);
  await shot(1);

  await fresh();
  await open(1, 0);
  await moveTo('h1', -120, 0);
  await shot(2);

  await fresh();
  await open(2, 1);
  await moveTo('.card:nth-child(2) h3', 40, 0);
  await shot(3);

  await fresh();
  await open(5, 0);
  await wait(900);
  await shot(4);

  await fresh();
  await open(6, 7);
  await wait(1500);
  await shot(5);

  await fresh();
  await open(6, 8);
  const reportPage = context.waitForEvent('page', { timeout: 30000 });
  await panel.locator('input[type=checkbox]').last().uncheck();
  await panel.locator('.ni-rp__generate').click();
  const report = await reportPage;
  await report.setViewportSize({ width: 1280, height: 800 });
  await report.waitForLoadState('load');
  await wait(2500);
  await report.screenshot({ path: join(dir, 'screenshot-06.png'), type: 'png' });

  await context.close();
};

const promoCss = `
@font-face{font-family:Sora;src:url(/fonts/Sora-700.woff2) format("woff2");font-weight:700}
@font-face{font-family:Inter;src:url(/fonts/Inter-500.woff2) format("woff2");font-weight:500}
@font-face{font-family:JBM;src:url(/fonts/JetBrainsMono-500.woff2) format("woff2");font-weight:500}
:root{--night:#080d14;--shell:#0b111a;--graphite:#141d29;--hover:#1b2635;--line:#304256;--gelo:#f4f8fc;--nevoa:#a6b5c5;--magenta:#ff4fd0}
*{box-sizing:border-box;margin:0}
html,body{width:100%;height:100%;overflow:hidden;background:var(--night);font-family:Inter,sans-serif;color:var(--gelo)}
.stage{position:absolute;inset:0;background:radial-gradient(60% 90% at 78% 45%,rgba(255,79,208,.10),transparent 60%),var(--night)}
.copy{position:absolute}
.copy h1{font-family:Sora,sans-serif;font-weight:700;letter-spacing:-.03em;line-height:1.04}
.copy h1 em{font-style:normal;color:var(--magenta);display:block}
.persp{position:absolute;perspective:1400px}
.rig{position:relative;transform-style:preserve-3d;transform:rotateX(54deg) rotateZ(-36deg)}
.plane{position:absolute;inset:0;border-radius:12px;transform-style:preserve-3d}
.page{background:#f6efe6;border:1px solid #d8c9b6;box-shadow:24px 30px 40px -6px rgba(0,0,0,.55)}
.page i,.panelp i{position:absolute;display:block;border-radius:5px}
.glass{position:absolute;border:2px solid var(--magenta);background:rgba(255,79,208,.12);border-radius:6px}
.panelp{background:var(--shell);border:1px solid var(--line);box-shadow:24px 30px 40px -6px rgba(0,0,0,.5)}
.panelp i{background:var(--graphite);border:1px solid #243346}
.dockp{background:var(--shell);border:1px solid var(--line);border-radius:999px}
.dockp i{position:absolute;display:block;width:11%;aspect-ratio:1;border-radius:50%;top:50%;transform:translateY(-50%);background:var(--hover)}
.dockp i.on{background:var(--magenta)}
.callout{position:absolute;font:500 12px JBM,monospace;color:var(--night);background:var(--magenta);padding:3px 7px;border-radius:4px;white-space:nowrap}
`;

const layerStack = (width, height, zStep) => `
<div class="persp" style="left:%LEFT%px;top:%TOP%px;width:${width}px;height:${height}px">
<div class="rig" style="width:${width}px;height:${height}px">
  <div class="plane page" style="transform:translateZ(0)">
    <i style="left:6%;top:9%;width:24%;height:8%;background:#1f4e5f"></i>
    <i style="left:6%;top:30%;width:52%;height:12%;background:#1f4e5f"></i>
    <i style="left:6%;top:48%;width:46%;height:5%;background:#c9b9a8"></i>
    <i style="left:6%;top:58%;width:36%;height:5%;background:#c9b9a8"></i>
    <i style="left:6%;top:74%;width:24%;height:13%;background:#1f4e5f"></i>
    <i style="right:6%;top:24%;width:30%;height:58%;background:#d99a7c"></i>
  </div>
  <div class="plane" style="transform:translateZ(${zStep}px)">
    <div class="glass" style="left:5%;top:72%;width:27%;height:17%"></div>
    <span class="callout" style="left:5%;top:60%;font-size:${Math.round(width / 28)}px">a.btn 168 x 48</span>
  </div>
  <div class="plane panelp" style="left:56%;width:44%;transform:translateZ(${zStep * 2}px)">
    <i style="left:8%;top:8%;width:60%;height:9%"></i>
    <i style="left:8%;top:24%;width:84%;height:20%"></i>
    <i style="left:8%;top:50%;width:84%;height:20%"></i>
    <i style="left:8%;top:76%;width:84%;height:14%"></i>
  </div>
  <div class="plane dockp" style="top:auto;bottom:-62%;left:0%;right:44%;height:16%;transform:translateZ(${zStep * 3}px)">
    <i style="left:6%"></i><i style="left:24%"></i><i class="on" style="left:42%"></i><i style="left:60%"></i><i style="left:78%"></i>
  </div>
</div></div>`;

const placeStack = (width, height, zStep, left, top) =>
  layerStack(width, height, zStep).replace('%LEFT%', left).replace('%TOP%', top);

const promoBody = (kind, locale) => {
  const c = COPY[locale];
  const headline = `${c.promoTitle[0]}<em>${c.promoTitle[1]}</em>`;
  if (kind === 'tile') {
    return `<div class="stage"></div>
<img src="${BASE}/brand/neruz-inspect-simbolo.svg" alt="" style="position:absolute;left:26px;top:26px;height:40px">
<div class="copy" style="left:26px;bottom:28px;width:230px"><h1 style="font-size:29px">${headline}</h1></div>
${placeStack(190, 124, 30, 214, 50)}`;
  }
  return `<div class="stage"></div>
<img src="${BASE}/brand/neruz-inspect-horizontal.svg" alt="" style="position:absolute;left:80px;top:72px;height:64px">
<div class="copy" style="left:80px;top:200px;width:700px"><h1 style="font-size:86px">${headline}</h1>
<p style="margin-top:28px;font-size:24px;line-height:1.4;color:var(--nevoa);font-weight:500;max-width:560px">${c.promoSub}</p></div>
${placeStack(400, 255, 70, 800, 190)}`;
};

const capturePromos = async (locale) => {
  const browser = await chromium.launch({ channel: 'chromium' });
  const dir = join(OUT, locale);
  mkdirSync(dir, { recursive: true });
  for (const [kind, width, height, file] of [
    ['tile', 440, 280, 'promo-tile-440x280.png'],
    ['marquee', 1400, 560, 'promo-marquee-1400x560.png'],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    promoHtml = `<!doctype html><html lang="${locale}"><meta charset="utf-8"><style>${promoCss}</style><body>${promoBody(kind, locale)}</body></html>`;
    await page.goto(`${BASE}/promo`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await wait(400);
    await page.screenshot({ path: join(dir, file), type: 'png' });
    await page.close();
  }
  await browser.close();
};

const server = await startServer();
try {
  if (ONLY !== 'promo' && !process.argv.includes('--skip-build')) prepareTestBuild();
  if (ONLY !== 'promo') for (const locale of LOCALES) await captureShots(locale);
  if (ONLY !== 'shots') for (const locale of LOCALES) await capturePromos(locale);
  copyFileSync(
    join(ROOT, 'apps', 'inspect', 'public', 'icon', '128.png'),
    join(OUT, 'icon-128.png'),
  );
} finally {
  server.close();
}
