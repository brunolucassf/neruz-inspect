import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const E2E_OUT_DIR = '.output-e2e';
export const BUILD_DIR = join(ROOT, 'apps', 'inspect', E2E_OUT_DIR, 'chrome-mv3');
export const TEST_BUILD_DIR = join(ROOT, 'apps', 'inspect', '.output-test', 'chrome-mv3');
export const SHOTS_DIR = join(ROOT, '.equipe', 'relatorios', 'qa');

export const TEST_HOSTS = [
  '<all_urls>', // captureVisibleTab exige <all_urls> ou activeTab (só concedido por gesto)
  'http://localhost/*',
  'http://127.0.0.1/*',
  'https://example.com/*',
  'https://developer.mozilla.org/*',
];

/** Constrói com o shadow root aberto (VITE_NI_E2E) para os testes entrarem nele, copia e acrescenta host_permissions de teste. */
const buildForE2e = () => {
  const result = spawnSync('pnpm', ['--filter', '@neruz/inspect', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, VITE_NI_E2E: 'true', NI_OUT_DIR: E2E_OUT_DIR },
  });
  if (result.status !== 0) throw new Error('Falha ao construir a extensão para o E2E.');
};

export const prepareTestBuild = () => {
  buildForE2e();
  if (!existsSync(join(BUILD_DIR, 'manifest.json'))) {
    throw new Error(`Build de teste não encontrado em ${BUILD_DIR}.`);
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

/** Liga/desliga o overlay pelo mesmo caminho do ícone da barra (gancho existe só no build E2E). */
export const injectOverlay = (worker, tabId) =>
  worker.evaluate(async (id) => {
    try {
      await globalThis.niToggleOverlay(await chrome.tabs.get(id));
      return 'ok';
    } catch (error) {
      return `erro: ${error.message}`;
    }
  }, tabId);

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
