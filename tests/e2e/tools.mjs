// Ação principal de cada ferramenta. Cada função recebe o contexto e lança Error se algo estiver errado.
import { Buffer } from 'node:buffer';

export const TOOL_LAYOUT = {
  color: ['eyedropper', 'palette', 'contrast', 'colorTools', 'gradientShadow', 'colorblind'],
  type: ['fontHover', 'fontList', 'fontSwap', 'typeScale'],
  layout: [
    'ruler',
    'boxModel',
    'gridFlex',
    'overflow',
    'zIndex',
    'breakpoints',
    'outlines',
  ],
  code: ['copyStyles', 'copyComponent', 'designTokens', 'editLive'],
  motion: ['motionInspector', 'pageToggles'],
  tech: ['techStack', 'tagsPixels', 'storageViewer', 'jsonViewer'],
  page: [
    'seoMeta',
    'structuredData',
    'robotsSitemap',
    'links',
    'assets',
    'icons',
    'vitals',
    'a11y',
  ],
  utils: ['units', 'lorem', 'formFill', 'qrCode', 'clipboardHistory'],
};

  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const need = (condition, message) => {
  if (!condition) throw new Error(message);
};

export const ACTIONS = {
  async eyedropper({ page, panel, text, waitText, isolated, reopen }) {
    // Caminho 1: EyeDropper nativo (não automatizável em headless): só garante que o clique não quebra o painel.
    await panel.getByRole('button', { name: 'Pegar uma cor' }).click();
    await page.waitForTimeout(800);
    // Caminho 2: lupa própria, usada quando o navegador não tem EyeDropper.
    await isolated(() => {
      delete window.EyeDropper;
    });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await reopen();
    await panel.getByRole('button', { name: 'Pegar uma cor' }).click();
    await page.waitForTimeout(1200);
    await page.mouse.move(150, 600);
    await page.mouse.click(150, 600);
    await waitText(/#[0-9a-f]{6}/i, 'a lupa não devolveu nenhuma cor depois do clique');
    return `lupa devolveu ${(await text()).match(/#[0-9a-f]{6}/i)?.[0]}`;
  },
  async palette({ panel, text, page }) {
    await panel.locator('button', { hasText: '#ffffff' }).first().click();
    await page.waitForTimeout(300);
    need(
      await page.locator('neruz-inspect .ni-hl').count(),
      'selecionar a cor não destacou os usos na página',
    );
    need(/CORES \(\d+\)/i.test(await text()), 'contagem de cores ausente');
    await panel
      .getByRole('button', { name: /^Copiar/ })
      .last()
      .click();
    await page.waitForTimeout(300);
    need(
      await page.locator('neruz-inspect .ni-toast').count(),
      'exportar/copiar a paleta não mostrou toast',
    );
  },
  async contrast({ page, text, waitText, hover }) {
    await hover('.low-contrast');
    await waitText(/2[.,]3\d/, 'razão de contraste não apareceu ao passar sobre texto cinza');
    need(await page.locator('neruz-inspect .ni-hl').count(), 'sem destaque na página');
  },
  async colorTools({ panel, waitText }) {
    const input = panel.locator('input[type=text]').first();
    await input.fill('#ff0000');
    await waitText(/rgb\(255, 0, 0\)/, 'conversão de #ff0000 não mostrou rgb(255, 0, 0)');
    await input.fill('banana');
    await panel.page().waitForTimeout(300);
  },
  async gradientShadow({ hover, waitText }) {
    await hover('.card:nth-child(2)');
    await waitText(/linear-gradient/i, 'gradiente do card não detectado');
  },
  async colorblind({ page, panel }) {
    await panel.getByRole('button', { name: 'Protanopia' }).click();
    await page.waitForTimeout(400);
    const applied = await page.evaluate(
      () =>
        getComputedStyle(document.documentElement).filter !== 'none' ||
        getComputedStyle(document.body).filter !== 'none',
    );
    need(applied, 'filtro de daltonismo não foi aplicado à página');
    await page.screenshot({ path: '.equipe/relatorios/qa/color-colorblind-aplicado.png' });
  },
  async fontHover({ hover, waitText }) {
    await hover('h1');
    await waitText(/Playfair/i, 'fonte do h1 (Playfair Display) não identificada');
  },
  async fontList({ panel, page, waitText }) {
    await waitText(/FONTES \(\d+\)/i, 'lista de fontes não apareceu');
    await panel.locator('button', { hasText: 'LocalSerif' }).first().click();
    await page.waitForTimeout(500);
  },
  async fontSwap({ panel, page, text }) {
    await panel.getByRole('button', { name: 'Só títulos' }).click();
    await panel
      .locator('select')
      .first()
      .selectOption({ label: 'Roboto' })
      .catch(() => undefined);
    await panel.getByRole('button', { name: 'Aplicar' }).click();
    await page.waitForTimeout(2500);
    const family = await page.evaluate(
      () => getComputedStyle(document.querySelector('h1')).fontFamily,
    );
    need(
      /roboto/i.test(family),
      `h1 não trocou para Roboto (font-family=${family}); texto do painel: ${(await text()).slice(0, 160)}`,
    );
  },
  async typeScale({ panel, text, waitText }) {
    await waitText(/TAMANHOS \(\d+\)/i, 'tamanhos não listados');
    await panel.getByText('Tailwind fontSize').first().click();
    need(/fontSize|text-/.test(await text()), 'export Tailwind não apareceu');
  },
  async ruler({ page, hover, text }) {
    await hover('.card:nth-child(1)');
    await page.waitForTimeout(300);
    await hover('.card:nth-child(3)');
    need(!/Nenhum elemento medido/.test(await text()), 'régua não mediu nada');
    need(
      await page.locator('neruz-inspect .ni-hl, neruz-inspect .ni-hl-label').count(),
      'sem linhas de distância',
    );
  },
  async boxModel({ hover, text, page }) {
    await hover('.card:nth-child(1)');
    await page.waitForTimeout(300);
    need(
      !/Nenhum elemento selecionado/.test(await text()),
      'modelo de caixa vazio ao passar sobre o card',
    );
    need(/16/.test(await text()), 'padding 16 do card não aparece');
  },
  async gridFlex({ panel, page, text }) {
    await panel.getByText('Grid', { exact: true }).first().click();
    await panel.locator('button', { hasText: 'section#cards' }).first().click();
    await page.waitForTimeout(500);
    need(/section#cards/.test(await text()), 'container grid não listado');
  },
  async overflow({ panel, page, text }) {
    need(/Vaza 1144px|1144/.test(await text()), 'vazamento de 1144px não detectado');
    await panel
      .getByRole('button', { name: /Rolar até/ })
      .first()
      .click();
    await page.waitForTimeout(300);
    need(await page.locator('neruz-inspect .ni-hl').count(), 'sem destaque do suspeito');
  },
  async zIndex({ panel, text, page }) {
    need(
      /header\.top/.test(await text()) && /div\.b/.test(await text()),
      'camadas z-index não listadas',
    );
    await panel.locator('button', { hasText: 'div.b' }).first().click();
    await page.waitForTimeout(300);
  },
  async breakpoints({ panel, text, page }) {
    need(
      /700px/.test(await text()) && /1200px/.test(await text()),
      'breakpoints 700/1200 ausentes',
    );
    await panel.getByRole('button', { name: 'Copiar 700px' }).click();
    await page.waitForTimeout(300);
    need(await page.locator('neruz-inspect .ni-toast').count(), 'cópia sem toast');
  },
  async outlines({ page, panel }) {
    await page.waitForTimeout(300);
    const outlined = await page.evaluate(() => {
      const el = document.querySelector('.card');
      const cs = getComputedStyle(el);
      return (
        cs.outlineStyle !== 'none' ||
        cs.boxShadow !== 'none' ||
        !!document.querySelector('style[data-neruz], [data-ni-outline]')
      );
    });
    need(outlined, 'contornos não foram aplicados nos elementos');
    await panel.locator('input[type=checkbox]').first().check();
    await page.waitForTimeout(300);
  },
  async copyStyles({ page, hover, text }) {
    await hover('.card:nth-child(2)');
    await page.mouse.click(
      ...(await page.evaluate(() => {
        const r = document.querySelector('.card:nth-child(2)').getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      })),
    );
    await page.waitForTimeout(400);
    need(/border-radius|background|padding/i.test(await text()), 'CSS do card não apareceu');
  },
  async copyComponent({ page, hover, text }) {
    await hover('.card:nth-child(1)');
    await page.mouse.click(
      ...(await page.evaluate(() => {
        const r = document.querySelector('.card:nth-child(1)').getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      })),
    );
    await page.waitForTimeout(500);
    need(/<article|article/i.test(await text()), 'código do componente (article) não apareceu');
  },
  async designTokens({ panel, waitText }) {
    await panel.getByRole('button', { name: 'Analisar', exact: true }).click();
    await waitText(/#0b6bcb|0b6bcb/i, 'tokens de cor (brand #0b6bcb) não extraídos');
  },
  async editLive({ panel, page }) {
    await panel.getByRole('button', { name: 'Ligar edição de texto' }).click();
    await page.waitForTimeout(300);
    const editable = await page.evaluate(
      () => document.designMode === 'on' || !!document.querySelector('[contenteditable]'),
    );
    need(editable, 'edição não habilitada (sem designMode/contenteditable)');
  },
  async motionInspector({ panel, page, text }) {
    need(/spinner/.test(await text()), 'animação CSS .spinner não listada');
    await panel.getByRole('button', { name: 'Pausar' }).click();
    await page.waitForTimeout(300);
    const paused = await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'paused').length,
    );
    need(paused > 0, 'Pausar não pausou nenhuma animação');
    await panel.getByRole('button', { name: '0,25×' }).click();
  },
  async pageToggles({ panel, page }) {
    const switches = panel.locator('[role=switch]');
    const count = await switches.count();
    for (let i = 0; i < count; i++) await switches.nth(i).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '.equipe/relatorios/qa/motion-pageToggles-todos.png' });
  },
  async techStack({ text, waitText }) {
    await waitText(/WordPress/, 'WordPress (meta generator) não detectado');
    need(/Google Analytics/.test(await text()), 'GA4 (window.gtag) não detectado');
  },
  async tagsPixels({ panel, page, text }) {
    need(/Google Tag Manager/.test(await text()), 'GTM não listado');
    await panel.getByRole('button', { name: 'Atualizar' }).click();
    await page.waitForTimeout(500);
  },
  async storageViewer({ panel, page, text }) {
    need(/visited/.test(await text()), 'cookie visited não listado');
    await panel.getByRole('tab', { name: /localStorage/ }).click();
    await page.waitForTimeout(300);
    need(/theme/.test(await text()), 'localStorage theme não listado');
    await panel.getByRole('tab', { name: /sessionStorage/ }).click();
    need(/session-key/.test(await text()), 'sessionStorage não listado');
  },
  async jsonViewer({ panel, page, text }) {
    await panel.locator('textarea').first().fill('{"a":1,"b":[1,2,{"c":null}]}');
    await panel.getByRole('button', { name: 'Formatar' }).click();
    await page.waitForTimeout(400);
    need(/"b"|b:|b\b/.test(await text()), 'JSON formatado não apareceu');
    await panel.getByRole('button', { name: 'Minificar' }).click();
  },
  async seoMeta({ panel, text, page }) {
    need(/Fixture Neruz/.test(await text()), 'título da página não apareceu');
    await panel.getByRole('tab', { name: 'Prévias' }).click();
    await page.waitForTimeout(300);
    await panel.getByRole('tab', { name: 'Títulos' }).click();
    await page.waitForTimeout(300);
    need(/H1|h1/.test(await text()), 'aba Títulos sem h1');
  },
  async structuredData({ text }) {
    need(
      /Organization/.test(await text()) && /BreadcrumbList/.test(await text()),
      'JSON-LD não listado',
    );
  },
  async robotsSitemap({ panel, page, text }) {
    need(/Disallow|Bloquear/.test(await text()), 'regras do robots.txt ausentes');
    await panel.getByRole('tab', { name: 'sitemap' }).click();
    await page.waitForTimeout(800);
    need(/page2\.html/.test(await text()), 'sitemap.xml não listou page2.html');
  },
  async links({ panel, page, text }) {
    await panel.getByRole('button', { name: 'Problemas' }).click();
    await page.waitForTimeout(300);
    need(/nao-existe/.test(await text()), 'âncora quebrada #nao-existe não aparece em Problemas');
    await panel.getByRole('button', { name: /Verificar status/ }).click();
    await page.waitForTimeout(2500);
  },
  async assets({ panel, page, text }) {
    need(/big\.png/.test(await text()), 'big.png não listada');
    need(/sem width e height/.test(await text()), 'alerta "sem width e height" ausente');
    await panel.getByRole('button', { name: 'Imagens', exact: true }).click();
    await page.waitForTimeout(300);
    const download = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
    await panel.getByRole('button', { name: /Baixar \d+ SVG/ }).click();
    const file = await download;
    return file
      ? `download: ${file.suggestedFilename()}`
      : 'clique em baixar SVGs não gerou download';
  },
  async icons({ panel, page, text }) {
    need(/FAVICONS \(1\)/i.test(await text()), 'favicon não listado');
    await panel.getByRole('button', { name: 'Copiar SVG de estrela' }).click();
    await page.waitForTimeout(300);
    await panel.getByRole('button', { name: 'Destacar na página' }).first().click();
    await page.waitForTimeout(300);
  },
  async vitals({ panel, page, text }) {
    need(/LCP/.test(await text()) && /CLS/.test(await text()), 'LCP/CLS ausentes');
    await panel
      .getByRole('button', { name: /Destacar o elemento/ })
      .first()
      .click();
    await page.waitForTimeout(300);
    need(await page.locator('neruz-inspect .ni-hl').count(), 'destaque do LCP não apareceu');
  },
  async a11y({ panel, page, text }) {
    need(/CONTRASTE BAIXO/i.test(await text()), 'contraste baixo não reportado');
    await panel.getByRole('button', { name: 'Destacar todos' }).click();
    await page.waitForTimeout(400);
    need(await page.locator('neruz-inspect .ni-hl').count(), 'destaques de a11y ausentes');
  },
  async units({ panel, page, text }) {
    const inputs = panel.locator('input:not([type]), input[type=text]');
    await inputs.first().fill('24');
    await page.waitForTimeout(300);
    need(/1[.,]5\s?rem/.test(await text()), '24px não virou 1.5rem');
  },
  async lorem({ panel, page, text }) {
    await panel.locator('input[type=number]').first().fill('2');
    await panel.getByRole('button', { name: 'Gerar outro' }).click();
    await panel.getByRole('button', { name: 'Copiar texto' }).click();
    await page.waitForTimeout(300);
    need(await page.locator('neruz-inspect .ni-toast').count(), 'cópia sem toast');
    need(/palavras/.test(await text()), 'contagem de palavras ausente');
  },
  async formFill({ panel, page }) {
    await panel.getByRole('button', { name: 'Preencher agora' }).click();
    await page.waitForTimeout(500);
    const filled = await page.evaluate(() => document.querySelector('input[name=email]').value);
    need(filled.includes('@'), `e-mail não foi preenchido (valor="${filled}")`);
    await panel.getByRole('button', { name: 'Limpar' }).click();
    await page.waitForTimeout(300);
    const cleared = await page.evaluate(() => document.querySelector('input[name=email]').value);
    need(cleared === '', `Limpar não esvaziou o campo (valor="${cleared}")`);
    await panel.getByRole('button', { name: 'Preencher agora' }).click();
  },
  async qrCode({ panel, page }) {
    await page.waitForTimeout(400);
    const download = page.waitForEvent('download', { timeout: 4000 }).catch(() => null);
    await panel.getByRole('button', { name: 'SVG', exact: true }).click();
    const file = await download;
    need(file, 'botão SVG não gerou download');
    return `download: ${file.suggestedFilename()}`;
  },
  async clipboardHistory({ text }) {
    need(!/Algo deu errado/.test(await text()), 'painel em erro');
  },
};

export const hasAction = (id) => id in ACTIONS;
