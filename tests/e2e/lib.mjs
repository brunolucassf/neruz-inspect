import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BUILD_DIR = join(ROOT, 'apps', 'inspect', '.output', 'chrome-mv3');
export const TEST_BUILD_DIR = join(ROOT, 'apps', 'inspect', '.output-test', 'chrome-mv3');
export const SHOTS_DIR = join(ROOT, '.equipe', 'relatorios', 'qa');

export const TEST_HOSTS = [
  '<all_urls>', // captureVisibleTab exige <all_urls> ou activeTab (só concedido por gesto)
  'http://localhost/*',
  'http://127.0.0.1/*',
  'https://example.com/*',
  'https://developer.mozilla.org/*',
];

/** Copia o build e acrescenta host_permissions de teste (activeTab não vale em automação). */
export const prepareTestBuild = () => {
  if (!existsSync(join(BUILD_DIR, 'manifest.json'))) {
    throw new Error(`Build não encontrado em ${BUILD_DIR}. Rode "pnpm build:ext" antes.`);
  }
  rmSync(TEST_BUILD_DIR, { recursive: true, force: true });
  mkdirSync(dirname(TEST_BUILD_DIR), { recursive: true });
  cpSync(BUILD_DIR, TEST_BUILD_DIR, { recursive: true });
  const manifestPath = join(TEST_BUILD_DIR, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  manifest.host_permissions = TEST_HOSTS;
  writeFileSync(manifestPath, JSON.stringify(manifest));
  // Sem contornos: o teste roda o build como ele é (o CSS do overlay precisa de WAR com matches e z-index máximo).
  return TEST_BUILD_DIR;
};

export const launch = async (
  extensionPath,
  { locale = 'pt-BR', viewport = { width: 1280, height: 800 } } = {},
) => {
  const userDataDir = join(tmpdir(), `neruz-e2e-${Date.now()}`);
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    locale,
    viewport,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent('serviceworker', { timeout: 15000 });
  return { context, worker, userDataDir };
};

export const getTabId = (worker, urlPattern) =>
  worker.evaluate(async (pattern) => {
    const tabs = await chrome.tabs.query({ url: pattern });
    return tabs[0]?.id;
  }, urlPattern);

/** Liga/desliga o overlay injetando o content script a partir do service worker. */
export const injectOverlay = (worker, tabId) =>
  worker.evaluate(
    (id) =>
      chrome.scripting
        .executeScript({ target: { tabId: id }, files: ['/content-scripts/overlay.js'] })
        .then(() => 'ok')
        .catch((error) => `erro: ${error.message}`),
    tabId,
  );

/** Impressão digital do DOM do site (sem o host do overlay) para provar que nada sobrou. */
export const fingerprint = (page) =>
  page.evaluate(() => {
    const clone = document.documentElement.cloneNode(true);
    for (const node of clone.querySelectorAll('neruz-inspect')) node.remove();
    const root = document.documentElement;
    return {
      // style="" vazio é artefato do screenshot do Playwright (esconde o cursor de texto).
      html: clone.outerHTML.replace(/ style=""/g, ''),
      htmlStyle: root.getAttribute('style') ?? '',
      bodyStyle: document.body.getAttribute('style') ?? '',
      htmlClass: root.className,
      adopted: document.adoptedStyleSheets.length,
      styleSheets: document.styleSheets.length,
      hostCount: document.querySelectorAll('neruz-inspect').length,
      cursor: getComputedStyle(root).cursor,
      filter: getComputedStyle(root).filter,
      bodyFilter: getComputedStyle(document.body).filter,
      scrollY: Math.round(window.scrollY),
      title: document.title,
      paused: document.getAnimations().filter((a) => a.playState === 'paused').length,
    };
  });

export const diffFingerprint = (before, after) => {
  const diffs = [];
  for (const key of Object.keys(before)) {
    if (before[key] !== after[key]) {
      if (key === 'html') {
        let i = 0;
        while (i < before.html.length && before.html[i] === after.html[i]) i++;
        diffs.push(
          `html difere perto de #${i}: antes="${before.html.slice(Math.max(0, i - 40), i + 80)}" depois="${after.html.slice(Math.max(0, i - 40), i + 120)}"`,
        );
      } else diffs.push(`${key}: ${JSON.stringify(before[key])} -> ${JSON.stringify(after[key])}`);
    }
  }
  return diffs;
};
