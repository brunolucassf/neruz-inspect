# Como criar uma ferramenta

Modelo completo: `layout/boxModel/`. Copie a pasta e adapte. Contrato em `docs/ARQUITETURA.md`.

## Passo a passo

1. **Pasta**: `src/tools/<grupo>/<toolId>/` com `index.tsx` (default export de um `ToolModule`), puro em `<nome>.ts` + `<nome>.test.ts`, CSS próprio em `<nome>.css` (importado pelo componente que o usa).
2. **Registro**: adicione o módulo ao array de `src/tools/<grupo>/index.ts` na ordem da barra. O `ToolId` já existe em `src/tools/types.ts`.
3. **Textos**: preencha `src/i18n/<grupo>.ts` nas três línguas (pt-BR é a fonte; en e es nativos, nunca literais). Chaves `<grupo>.<toolId>.<chave>`. Obrigatórias: `name`, `desc`, `keywords` (palavras separadas por vírgula, alimentam a busca). Plural: `chave_one` e `chave_other` com `{n}`. Os testes de `src/i18n/messages.test.ts` falham se faltar chave em alguma língua ou se uma ferramenta registrada não tiver nome, descrição e palavras-chave.
4. **Panel**: componente sem props, montado só enquanto a ferramenta está ativa. Toda interação com a página fica em `useEffect` e é desfeita no cleanup. Desmontar = limpar tudo.
5. **Ícone e modo**: ícone lucide; `mode` é `hover` (segue o mouse), `panel` (análise) ou `action` (efeito ligado/desligado). O cabeçalho do painel mostra o modo.

## Peças prontas

| Preciso de                               | Use                                                                                                                                                                                                                                     |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Elemento sob o mouse / travar com clique | `useElementPicker()` → `{ hovered, locked, unlock }` (Esc solta); `useHoverElement({ enabled })`                                                                                                                                        |
| Desenhar sobre a página                  | `useHighlights(items)` (limpa no unmount); itens `box`, `margin`, `padding` (aceitam `hole` para o anel), `line`, `label`, `grid`. Coordenadas de viewport; `getViewportRect(el)`; `useViewportVersion()` re-renderiza em scroll/resize |
| Textos                                   | `useT()` → `t(key, params)`; fora de componente `t` de `lib/i18n`                                                                                                                                                                       |
| Copiar                                   | `CopyRow` (valor + botão) ou `copyText(texto, rótulo)` (toast + histórico)                                                                                                                                                              |
| Cor                                      | `lib/color.ts`: `parseCssColor`, `formatColor(cor, useSettingsStore(s => s.colorFormat))`, `contrastWcag`, `contrastApca`, `nearestTailwind`                                                                                            |
| CSS                                      | `lib/css.ts`: `getComputedSubset`, `toCssText`, `toTailwindClasses`, `formatLength(px, unit)` com a unidade das Opções (`useSettingsStore(s => s.unit)`)                                                                                |
| Dados fora da página                     | `lib/bridge.ts`: `runProbe`, `captureTab`, `fetchViaBackground`, `openReport`                                                                                                                                                           |
| UI                                       | `src/ui`: `PanelSection`, `CopyRow`, `Swatch`, `Tabs`, `EmptyState` (`empty`, `loading`, `error`), `Badge`, `ListTable`; `toast(msg, tone)`; baixar com `lib/download.ts`                                                               |
| Sonda MAIN world                         | edite `src/probes/<nome>.ts`: uma função autocontida (sem imports nem closures, só tipos e dados serializáveis); retorno serializável                                                                                                   |

## Regras de bolso

- Estilo só com `var(--ni-*)` e classes `ni-*`; nunca edite `inspect-tokens.css`. Use `px` (o `rem` do shadow herda da página). Hover só em `@media (hover: hover) and (pointer: fine)`; `:active` com `scale(0.97)` em 100 ms; respeite `prefers-reduced-motion`.
- Estados: carregando, vazio, erro e sucesso com `EmptyState`/`toast`. Um erro de render é contido pela casca; um erro esperado vira `EmptyState kind="error"`.
- Hover com `requestAnimationFrame` (os hooks já fazem); varreduras grandes em fatias com `requestIdleCallback`, limite de 5 000 elementos.
- Sem `innerHTML` com conteúdo da página, sem `eval`/`new Function`, sem rede própria.
- Sem comentários; nomes que explicam.
- Antes de entregar: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build:ext`, `pnpm build:ext:firefox`.
