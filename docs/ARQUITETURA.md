# Neruz Inspect · Arquitetura e contratos

Extensão de navegador (Chrome, Edge, Opera, Brave, Firefox 128+) com ferramentas de inspeção visual e técnica para qualquer site. Gratuita, MIT, sem telemetria, sem servidor próprio. pt-BR, en e es nativos.

## Stack
pnpm workspaces · WXT 0.21.5 · React 19.3 · Zustand 5 · Valibot · lucide-react · TypeScript 6 · Biome 2 · Vitest 4 · Astro 7 + Three.js + GSAP + Lenis (landing). Versões exatas, sem `^` em pacotes novos.

## Como roda
- **Ícone ou Alt+Shift+I** → `background` injeta `content-scripts/overlay.js` na aba (permissão `activeTab`). Injetar de novo desmonta (liga/desliga).
- **Overlay** = React dentro de Shadow DOM (`createShadowRootUi`), z-index máximo, CSS isolado. Esc sai da ferramenta ativa; Esc de novo fecha tudo.
- **Barra** flutuante (arrastável, lembra posição) com 8 grupos + campo de busca (`/` foca a busca). Escolher uma ferramenta abre o **painel** lateral (encaixa à esquerda ou à direita).
- **Camada de destaque** (`HighlightLayer`): caixas, linhas de distância e rótulos desenhados sobre a página, em coordenadas de viewport, sem tocar no DOM do site.
- **Página de relatório** (`entrypoints/report`): página da extensão que recebe os dados da análise e imprime em PDF com `window.print()`. Também é onde se pedem permissões opcionais (só páginas da extensão podem chamar `permissions.request`).
- **Opções** (`entrypoints/options`): idioma, atalhos, formato padrão de cor, unidade, histórico do clipboard.

## Permissões
Obrigatórias: `storage`, `scripting`, `activeTab`. Opcionais: `clipboardWrite`; hosts `http://*/*` e `https://*/*` (só para checar links e baixar recursos de outros domínios, pedido na página de relatório/opções com gesto do usuário). Nada de `<all_urls>` obrigatório, `debugger`, `cookies`, `webRequest`, `tabs`.

## Contrato de ferramenta
Pasta: `apps/inspect/src/tools/<grupo>/<toolId>/index.tsx`, exportando `default` um `ToolModule`:

```ts
type ToolModule = {
  id: ToolId;
  group: ToolGroup;
  icon: LucideIcon;
  mode: 'hover' | 'panel' | 'action'; // hover = segue o mouse; panel = análise; action = efeito ligado/desligado
  Panel: React.FC; // montado enquanto a ferramenta está ativa; desmontar = limpar tudo o que fez na página
};
```
- Toda interação com a página acontece em `useEffect` do `Panel` e é desfeita no cleanup.
- Textos: `useT()` com chaves `<grupo>.<toolId>.<chave>`. Nome e descrição obrigatórios: `<grupo>.<toolId>.name`, `<grupo>.<toolId>.desc`, `<grupo>.<toolId>.keywords` (palavras para a busca, separadas por vírgula).
- Cada grupo tem seu dicionário em `apps/inspect/src/i18n/<grupo>.ts`: `export default { 'pt-BR': {...}, en: {...}, es: {...} } satisfies GroupMessages`. pt-BR é a fonte; en e es traduzidos de forma nativa, nunca literal.
- Registro: `apps/inspect/src/tools/<grupo>/index.ts` exporta `default` um array de `ToolModule` na ordem da barra. A fundação importa os 8 índices.
- Pure functions (parsers, conversões, detecção) em arquivos `.ts` separados, com teste Vitest `*.test.ts` ao lado.

## Grupos e ferramentas
| Grupo | ToolIds |
|---|---|
| color | eyedropper, palette, contrast, colorTools, gradientShadow, colorblind |
| type | fontHover, fontList, fontSwap, typeScale |
| layout | ruler, boxModel, gridFlex, overflow, zIndex, breakpoints, outlines, figmaOverlay |
| code | copyStyles, copyComponent, designTokens, editLive |
| motion | motionInspector, pageToggles |
| tech | techStack, tagsPixels, storageViewer, jsonViewer |
| page | seoMeta, structuredData, robotsSitemap, links, assets, icons, vitals, a11y, report |
| utils | units, lorem, formFill, qrCode, clipboardHistory |

## Biblioteca compartilhada (`apps/inspect/src/lib`, dona: fundação)
- `i18n.ts`: `useT()`, `t(key, params)`, locale de `storage` ou do navegador.
- `picker.ts`: `useHoverElement({ enabled })` → elemento sob o mouse (ignora o host do overlay); `useElementPicker()` → clique trava a seleção, Esc cancela; `getElementLabel(el)`.
- `highlight.ts` + `HighlightLayer.tsx`: store com `setHighlights(items)`, itens `{ kind: 'box' | 'margin' | 'padding' | 'line' | 'label' | 'grid', rect, text? }`.
- `clipboard.ts`: `copyText(text, label)` → copia, mostra toast e grava no histórico (`storage.local`, últimos 50).
- `download.ts`: `downloadBlob(blob, filename)`, `downloadText(text, filename, mime)`.
- `toast.ts`: `toast(message, tone?)`.
- `color.ts`: `parseCssColor`, `toHex/toRgb/toHsl/toOklch`, `formatColor(color, format)`, `contrastWcag`, `contrastApca`, `nearestTailwind`.
- `bridge.ts`: chamadas ao background tipadas: `runProbe(name, args)`, `captureTab()`, `fetchViaBackground(url, init)`, `openReport(data)`.
- `css.ts`: `getComputedSubset(el, props)`, `toCssText(map)`, `toTailwindClasses(map)` (aproximação).
- UI comum em `apps/inspect/src/ui`: `PanelSection`, `CopyRow` (valor + botão copiar), `Swatch`, `Tabs`, `EmptyState`, `Badge`, `ListTable`.

## Background (`entrypoints/background.ts`, dono: fundação)
Mensagens validadas com Valibot, só de abas onde o overlay foi injetado:
- `ni.probe { name: ProbeName, args }` → `scripting.executeScript({ world: 'MAIN', func, args })`. Sondas em `apps/inspect/src/probes/<name>.ts`, cada uma uma função **autocontida** (sem imports, sem closures; serializável), dona: o agente do grupo. `ProbeName = 'tech' | 'tags' | 'motion' | 'vitals'`.
- `ni.capture` → `tabs.captureVisibleTab` (PNG dataURL), limitado a 2/s.
- `ni.fetch { url, method }` → `fetch` no background (status, headers, texto até 2 MB); só http/https.
- `ni.openReport { data }` → grava em `storage.session` e abre `report.html`.

## Regras
- Nada de `innerHTML` com conteúdo da página (plugin Grit bloqueia), nada de `eval`/`new Function`.
- Zero rede própria. Fontes do Google no "testar fonte" carregadas só quando a pessoa pede.
- Desempenho: hover com `requestAnimationFrame`, nada de varrer o DOM inteiro a cada movimento; varreduras grandes em fatias (`requestIdleCallback`), limite de 5 000 elementos com aviso.
- Acessível: tudo operável por teclado, foco visível, `prefers-reduced-motion`.
- Rodapé de créditos no painel e no relatório: "Desenvolvido por Fonte Dev · Bruno Lucas" com link para https://fontedev.com.
