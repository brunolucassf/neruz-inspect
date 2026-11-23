// E2E do Neruz Inspect: carrega o build no Chromium, injeta o overlay via service worker e exercita as 41 ferramentas.
// Uso: pnpm test:e2e [--only=<toolId,...>] [--skip-sites]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { startServer } from '../fixtures/server.mjs';
import {
  diffFingerprint,
  fingerprint,
  getTabId,
  injectOverlay,
  launch,
  prepareTestBuild,
  ROOT,
  SHOTS_DIR,
} from './lib.mjs';
import { ACTIONS, TOOL_LAYOUT } from './tools.mjs';

const URL_FIXTURE = 'http://localhost:4173/';
const only = process.argv
  .find((a) => a.startsWith('--only='))
  ?.slice(7)
  .split(',');
const skipSites = process.argv.includes('--skip-sites');
mkdirSync(SHOTS_DIR, { recursive: true });

const server = await startServer();
const { context, worker } = await launch(prepareTestBuild());
const page = await context.newPage();
page.setDefaultTimeout(6000);

let consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(`console.error: ${m.text().slice(0, 300)}`);
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 300)}`));
worker.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(`worker.error: ${m.text().slice(0, 300)}`);
});

const sleep = (ms) => page.waitForTimeout(ms);
const panel = page.locator('neruz-inspect .ni-panel');
const panelText = () => panel.innerText({ timeout: 3000 }).catch(() => '');
const waitText = async (regex, message, timeout = 6000) => {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (regex.test(await panelText())) return;
    await sleep(150);
  }
  throw new Error(message);
};
const hover = async (selector) => {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`sem caixa para ${selector}`);
  await page.mouse.move(box.x + box.width / 2 - 10, box.y + box.height / 2 - 2);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
  await sleep(350);
};

const openFixture = async (url = URL_FIXTURE) => {
  await page.goto(url, { waitUntil: 'load' });
  await sleep(500);
};
const toggleOverlay = async (urlPattern = 'http://localhost/*') => {
  const tabId = await getTabId(worker, urlPattern);
  return injectOverlay(worker, tabId);
};
const injectAndWait = async (urlPattern) => {
  const result = await toggleOverlay(urlPattern);
  if (result !== 'ok') throw new Error(`injeção falhou: ${result}`);
  await page.waitForSelector('neruz-inspect .ni-toolbar', { timeout: 8000 });
  await sleep(500);
};
const openFromBar = async (groupIndex, toolIndex) => {
  await page.locator('neruz-inspect .ni-toolbar__group').nth(groupIndex).click();
  await page.locator('neruz-inspect .ni-list__item').nth(toolIndex).click();
  await page.waitForSelector('neruz-inspect .ni-panel', { timeout: 5000 });
  await sleep(700);
};
const closeToolWithEsc = async () => {
  for (let i = 0; i < 4; i++) {
    if ((await panel.count()) === 0) return true;
    await page.keyboard.press('Escape');
    await sleep(250);
  }
  return (await panel.count()) === 0;
};
const boundary = () =>
  page.evaluate(() => {
    const p = document.querySelector('neruz-inspect')?.shadowRoot?.querySelector('.ni-panel');
    return /Esta ferramenta falhou|This tool crashed|Esta herramienta falló/.test(
      p?.innerText ?? '',
    );
  });

const results = [];
const bugs = [];
let flatIndex = 0;

for (const [group, tools] of Object.entries(TOOL_LAYOUT)) {
  const groupIndex = Object.keys(TOOL_LAYOUT).indexOf(group);
  for (let toolIndex = 0; toolIndex < tools.length; toolIndex++) {
    const id = tools[toolIndex];
    flatIndex += 1;
    if (only && !only.includes(id)) continue;
    const row = {
      group,
      id,
      opens: false,
      searchOpens: false,
      action: false,
      clean: false,
      console: false,
      notes: [],
    };
    consoleErrors = [];
    try {
      await openFixture();
      await injectAndWait();
      const before = await fingerprint(page);
      await openFromBar(groupIndex, toolIndex);
      const title = (await panel.locator('.ni-panel__title').innerText()).trim();
      row.title = title;
      row.opens = !(await boundary());
      if (!row.opens) row.notes.push('painel caiu no ToolErrorBoundary');

      const ctx = {
        page,
        panel,
        text: panelText,
        waitText,
        hover,
        isolated: async () => {
          const tabId = await getTabId(worker, 'http://localhost/*');
          return worker.evaluate(
            (id) =>
              chrome.scripting.executeScript({
                target: { tabId: id },
                func: () => {
                  delete window.EyeDropper;
                },
              }),
            tabId,
          );
        },
        reopen: () => openFromBar(groupIndex, toolIndex),
      };
      try {
        const note = await ACTIONS[id](ctx);
        row.action = true;
        if (typeof note === 'string') row.notes.push(note);
      } catch (error) {
        row.notes.push(
          `ação: ${String(error.message).split('\n').slice(0, 7).join(' / ').slice(0, 700)}`,
        );
      }
      await sleep(300);
      await page.screenshot({ path: join(SHOTS_DIR, `${group}-${id}.png`) });
      if (await boundary()) {
        row.opens = false;
        row.notes.push('ToolErrorBoundary apareceu durante a ação');
      }

      const closed = await closeToolWithEsc();
      if (!closed) row.notes.push('Esc não fechou o painel');
      await sleep(300);
      const after = await fingerprint(page);
      before.scrollY = after.scrollY = 0;
      const diffs = diffFingerprint(before, after);
      row.clean = closed && diffs.length === 0;
      for (const diff of diffs) row.notes.push(`resíduo: ${diff.slice(0, 400)}`);

      // Reabrir pela busca (mesma sessão do overlay).
      await page.locator('neruz-inspect .ni-search__input').fill(title);
      await sleep(250);
      await page.locator('neruz-inspect .ni-list__item').first().click();
      await page.waitForSelector('neruz-inspect .ni-panel', { timeout: 4000 });
      const searchTitle = (await panel.locator('.ni-panel__title').innerText()).trim();
      row.searchOpens = searchTitle === title && !(await boundary());
      if (!row.searchOpens) row.notes.push(`busca por "${title}" abriu "${searchTitle}"`);
      await closeToolWithEsc();
      // Esc final fecha o overlay: nada deve sobrar.
      await page.keyboard.press('Escape');
      await sleep(300);
      const hosts = await page.locator('neruz-inspect').count();
      if (hosts !== 0) {
        row.clean = false;
        row.notes.push('host do overlay continuou na página após Esc');
      }
    } catch (error) {
      row.notes.push(`falha de teste: ${error.message.split('\n')[0]}`);
    }
    row.console = consoleErrors.length === 0;
    for (const line of consoleErrors.slice(0, 4)) row.notes.push(line);
    results.push(row);
    console.log(
      `${String(flatIndex).padStart(2)} ${group}.${id}: abre=${row.opens} busca=${row.searchOpens} acao=${row.action} limpa=${row.clean} console=${row.console}${row.notes.length ? `\n     ${row.notes.join('\n     ')}` : ''}`,
    );
  }
}

// ---------- comportamentos do overlay ----------
const behaviors = [];
const behave = async (name, fn) => {
  consoleErrors = [];
  try {
    const note = await fn();
    behaviors.push({ name, ok: true, note: note ?? '', console: consoleErrors.length === 0 });
  } catch (error) {
    behaviors.push({
      name,
      ok: false,
      note: error.message.split('\n')[0],
      console: consoleErrors.length === 0,
    });
  }
  const last = behaviors.at(-1);
  console.log(
    `[comportamento] ${last.ok ? 'OK ' : 'FALHA'} ${name} ${last.note}${consoleErrors.length ? ` | console: ${consoleErrors[0]}` : ''}`,
  );
};

if (!only) {
  await behave('toggle liga/desliga (injetar 2x remove; 3x volta)', async () => {
    await openFixture();
    await injectAndWait();
    const before = await fingerprint(page);
    await toggleOverlay();
    await sleep(500);
    if ((await page.locator('neruz-inspect').count()) !== 0)
      throw new Error('segunda injeção não removeu o overlay');
    const gone = await fingerprint(page);
    if (diffFingerprint(before, gone).length)
      throw new Error(`página mudou: ${diffFingerprint(before, gone)[0]}`);
    await injectAndWait();
    await toggleOverlay();
    await sleep(300);
  });

  await behave('arrastar a barra (mouse) e posição lembrada após recarregar', async () => {
    await openFixture();
    await injectAndWait();
    const grip = page.locator('neruz-inspect .ni-toolbar__grip');
    const gb = await grip.boundingBox();
    const startBar = await page.locator('neruz-inspect .ni-toolbar').boundingBox();
    await page.mouse.move(gb.x + 8, gb.y + 8);
    await page.mouse.down();
    await page.mouse.move(gb.x + 8 - 200, gb.y + 8 + 300, { steps: 8 });
    await page.mouse.up();
    await sleep(500);
    const moved = await page.locator('neruz-inspect .ni-toolbar').boundingBox();
    if (Math.abs(moved.x - startBar.x) < 100 || Math.abs(moved.y - startBar.y) < 100) {
      throw new Error(
        `barra não se moveu (de ${Math.round(startBar.x)},${Math.round(startBar.y)} para ${Math.round(moved.x)},${Math.round(moved.y)})`,
      );
    }
    await page.screenshot({ path: join(SHOTS_DIR, 'overlay-barra-arrastada.png') });
    await openFixture();
    await injectAndWait();
    const again = await page.locator('neruz-inspect .ni-toolbar').boundingBox();
    if (Math.abs(again.x - moved.x) > 4 || Math.abs(again.y - moved.y) > 4) {
      throw new Error(
        `posição não lembrada: ${Math.round(moved.x)},${Math.round(moved.y)} -> ${Math.round(again.x)},${Math.round(again.y)}`,
      );
    }
    // arrastar por teclado
    await page.locator('neruz-inspect .ni-toolbar__grip').focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await sleep(300);
    const kb = await page.locator('neruz-inspect .ni-toolbar').boundingBox();
    if (Math.abs(kb.x - again.x - 10) > 3 || Math.abs(kb.y - again.y - 10) > 3) {
      throw new Error(
        `setas no grip não moveram 10px (dx=${kb.x - again.x}, dy=${kb.y - again.y})`,
      );
    }
    return 'mouse e setas ok; posição persiste';
  });

  await behave(
    'teclado: / foca a busca, Tab percorre a barra, Enter abre menu, Esc fecha na ordem',
    async () => {
      await openFixture();
      await injectAndWait();
      await page.keyboard.press('/');
      const focused = await page.evaluate(
        () => document.querySelector('neruz-inspect').shadowRoot.activeElement?.className,
      );
      if (!/ni-search__input/.test(focused ?? ''))
        throw new Error(`"/" não focou a busca (foco em ${focused})`);
      await page.keyboard.type('contra');
      await sleep(300);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await sleep(500);
      const title = await panel.locator('.ni-panel__title').innerText();
      await page.keyboard.press('Escape');
      await sleep(200);
      if ((await panel.count()) !== 0) throw new Error('Esc não fechou o painel');
      await page.keyboard.press('Escape');
      await sleep(300);
      if ((await page.locator('neruz-inspect').count()) !== 0)
        throw new Error('segundo Esc não fechou o overlay');
      // menu de grupo por teclado
      await injectAndWait();
      await page.locator('neruz-inspect .ni-toolbar__group').first().focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
      await sleep(300);
      const open = await page.locator('neruz-inspect .ni-popup').count();
      if (!open) throw new Error('Enter no grupo não abriu o menu');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await sleep(500);
      if ((await panel.count()) === 0) throw new Error('Enter na lista não abriu a ferramenta');
      const focusInPanel = await page.evaluate(
        () => document.querySelector('neruz-inspect').shadowRoot.activeElement?.className,
      );
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await sleep(300);
      return `busca abriu "${title}"; foco no painel: ${focusInPanel}`;
    },
  );

  await behave(
    'teclas do site não vazam: digitar na busca não aciona atalhos da página',
    async () => {
      await openFixture();
      await page.evaluate(() => {
        window.__keys = [];
        window.__keysCapture = [];
        document.addEventListener('keydown', (e) => window.__keys.push(e.key));
        window.addEventListener('keydown', (e) => window.__keysCapture.push(e.key), true);
      });
      await injectAndWait();
      await page.keyboard.press('/');
      await page.keyboard.type('abc');
      const keys = await page.evaluate(() => window.__keys.join(''));
      const capture = await page.evaluate(() => window.__keysCapture.join(''));
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      if (keys.includes('abc'))
        throw new Error(`a página recebeu as teclas digitadas na busca (${keys})`);
      return `listener em bolha viu "${keys}"; listener em captura na window viu "${capture}" (inevitável em captura)`;
    },
  );

  await behave('painel: encaixar esquerda/direita', async () => {
    await openFixture();
    await injectAndWait();
    await openFromBar(0, 1);
    const right = await panel.boundingBox();
    await panel.locator('button[aria-label^="Encaixar"]').click();
    await sleep(400);
    const left = await panel.boundingBox();
    if (!(left.x < right.x)) throw new Error('painel não foi para a esquerda');
    await panel.locator('button[aria-label^="Encaixar"]').click();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  });

  await behave('barra continua clicável sobre cabeçalho sticky do site (z-index)', async () => {
    await openFixture();
    await injectAndWait();
    const hit = await page.evaluate(() => {
      const bar = document.querySelector('neruz-inspect').shadowRoot.querySelector('.ni-toolbar');
      const r = bar.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return el?.localName;
    });
    await page.keyboard.press('Escape');
    if (hit !== 'neruz-inspect') throw new Error(`elemento no ponto da barra: ${hit}`);
  });

  await behave('overlay sem CSS carregado (regressão do WAR matches)', async () => {
    await openFixture();
    await injectAndWait();
    const fixed = await page.evaluate(
      () =>
        getComputedStyle(
          document.querySelector('neruz-inspect').shadowRoot.querySelector('.ni-toolbar'),
        ).position,
    );
    await page.keyboard.press('Escape');
    if (fixed !== 'fixed') throw new Error(`estilo do overlay não aplicado (position=${fixed})`);
  });

  await behave('viewport estreito 360px: barra cabe e painel não estoura', async () => {
    await page.setViewportSize({ width: 360, height: 700 });
    await openFixture();
    await injectAndWait();
    await openFromBar(0, 1);
    const box = await page.evaluate(() => {
      const root = document.querySelector('neruz-inspect').shadowRoot;
      const b = root.querySelector('.ni-toolbar').getBoundingClientRect();
      const p = root.querySelector('.ni-panel').getBoundingClientRect();
      return { bar: [b.left, b.right], panel: [p.left, p.right], w: window.innerWidth };
    });
    await page.screenshot({ path: join(SHOTS_DIR, 'overlay-360px.png') });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1280, height: 800 });
    if (box.bar[0] < -1 || box.bar[1] > box.w + 1)
      throw new Error(`barra fora da tela: ${JSON.stringify(box)}`);
    if (box.panel[0] < -1 || box.panel[1] > box.w + 1)
      throw new Error(`painel fora da tela: ${JSON.stringify(box)}`);
  });

  await behave('página restrita (about:blank / chrome://): injeção falha sem quebrar', async () => {
    const outcomes = [];
    for (const url of ['about:blank', 'chrome://version']) {
      const before = await worker.evaluate(async () =>
        (await chrome.tabs.query({})).map((t) => t.id),
      );
      const restricted = await context.newPage();
      await restricted.goto(url).catch(() => undefined);
      const tabId = await worker.evaluate(
        async (known) => (await chrome.tabs.query({})).find((t) => !known.includes(t.id))?.id,
        before,
      );
      outcomes.push(
        `${url} -> ${tabId ? (await injectOverlay(worker, tabId)).slice(0, 90) : 'sem aba'}`,
      );
      await sleep(300);
      const hasHost = await restricted.locator('neruz-inspect').count();
      await restricted.close();
      if (hasHost) throw new Error(`overlay apareceu em ${url}`);
    }
    return outcomes.join('; ');
  });

  await behave('reduced-motion: overlay abre e a barra aparece', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture();
    await injectAndWait();
    await openFromBar(1, 0);
    await page.screenshot({ path: join(SHOTS_DIR, 'overlay-reduced-motion.png') });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
}

// ---------- sites reais ----------
const sites = [];
if (!only && !skipSites) {
  const REAL = [
    { name: 'example.com', url: 'https://example.com/', pattern: 'https://example.com/*' },
    {
      name: 'developer.mozilla.org',
      url: 'https://developer.mozilla.org/pt-BR/',
      pattern: 'https://developer.mozilla.org/*',
    },
  ];
  const probes = [
    ['tech', 'techStack', /tecnologia|Nenhuma|Analisar/i],
    ['page', 'seoMeta', /Título|Analisar/i],
    ['page', 'vitals', /LCP/],
  ];
  for (const site of REAL) {
    for (const [group, id, expectRe] of probes) {
      consoleErrors = [];
      const row = { site: site.name, tool: id, ok: false, note: '' };
      try {
        await page.goto(site.url, { waitUntil: 'load', timeout: 30000 });
        await sleep(1500);
        await injectAndWait(site.pattern);
        await openFromBar(Object.keys(TOOL_LAYOUT).indexOf(group), TOOL_LAYOUT[group].indexOf(id));
        await sleep(2500);
        const text = await panelText();
        row.ok = !(await boundary()) && expectRe.test(text);
        row.note = text.replace(/\n+/g, ' | ').slice(0, 220);
        await page.screenshot({ path: join(SHOTS_DIR, `site-${site.name}-${id}.png`) });
        await page.keyboard.press('Escape');
        await page.keyboard.press('Escape');
      } catch (error) {
        row.note = `falha: ${error.message.split('\n')[0]}`;
      }
      row.console = consoleErrors.length === 0;
      row.consoleLines = consoleErrors.slice(0, 3);
      sites.push(row);
      console.log(
        `[site] ${site.name} ${id}: ok=${row.ok} console=${row.console} ${row.note.slice(0, 160)}`,
      );
    }
  }
}

writeFileSync(
  join(SHOTS_DIR, '..', 'qa-e2e-resultados.json'),
  JSON.stringify({ results, behaviors, sites, at: new Date().toISOString() }, null, 2),
);
const failed = results.filter(
  (r) => !(r.opens && r.searchOpens && r.action && r.clean && r.console),
);
console.log(
  `\n${results.length} ferramentas, ${failed.length} com pendência; comportamentos com falha: ${behaviors.filter((b) => !b.ok).length}`,
);
await context.close();
server.close();
void ROOT;
void bugs;
process.exit(failed.length || behaviors.some((b) => !b.ok) ? 1 : 0);
