# UI v2: primitivas para as ferramentas

Tudo sai de `../ui` (`import { Card, Tile } from '../../ui'`). Estilo em `ui.css`, tokens em `inspect-tokens.css`. Valores sempre dentro de lâmina; campo, código e miniatura no poço.

| Primitiva | Props | Uso |
|---|---|---|
| `PanelSection` | `title`, `count?`, `actions?` | `<PanelSection title="Ativos" count={2}>…</PanelSection>` (título caixa alta, contagem em Névoa; corpo com gap 8) |
| `Card` | `variant?: 'plain' \| 'rows' \| 'padded'` | `<Card variant="rows"><CopyRow …/><CopyRow …/></Card>` (rows: padding 4, divisórias automáticas) |
| `CopyRow` | `label`, `value`, `copyValue?`, `leading?` | Linha de 36 px; copiar no hover/foco (sempre visível em toque); copiado = magenta + check; `leading={<Swatch …/>}` |
| `Tiles` / `Tile` | `columns?: 2\|3`; `label`, `value`, `unit?`, `icon?`, `tone?: success\|warning\|danger` | `<Tiles columns={3}><Tile label="Ativos" value={2} tone="success" icon={<Check size={16}/>}/></Tiles>` |
| `Badge` | `tone?: neutral\|accent\|success\|warning\|danger\|info`, `icon?: ReactNode\|false` | Ícone automático por tom (success, warning, danger, info); `icon={false}` remove |
| `CodeChip` | `accent?`, `children` | `<CodeChip accent="div">.hero</CodeChip>` (tag em magenta) |
| `FilterChips` | `label`, `items: {id,label,count?,isWarning?}[]`, `value`, `onChange` | Chips com contagem; ativo Gelo sólido |
| `Tabs` | `label`, `items`, `value`, `onChange`, `children` | Trilho segmentado; mesma API de antes |
| `StatusPill` | `status: active\|notLoaded\|missing`, `label` | `<StatusPill status="active" label="Ativo"/>` (ativo com ponto pulsante) |
| `IdChip` | `value`, `label?='ID'` | Poço; clique copia e mostra check |
| `Ratio` | `shown`, `actual`, `label` | `<Ratio shown={640} actual={2400} label="3,7× maior que exibida"/>` (barra âmbar) |
| `Thumb` | `src?`, `alt?`, `hasTransparency?`, `fallback?` | Miniatura 44; xadrez para PNG/SVG transparente |
| `ListTable` | `caption`, `columns`, `rows`, `emptyLabel?` | Já vem dentro de lâmina; `align: 'end'` vira Mono à direita |
| `EmptyState` | `kind?: empty\|loading\|error`, `title`, `hint?`, `action?`, `icon?` | `loading` usa `LoadingState`, `error` usa `ErrorState` |
| `LoadingState` | `title`, `blocks?=3` | Barra 2 px magenta + esqueleto com shimmer; anuncia `title` |
| `ErrorState` | `title`, `hint?`, `action?` | Lâmina com borda coral, `role="alert"`; diga o que houve e o que fazer |
| `Swatch` | `color`, `size?`, `label?` | Igual a antes, raio 4 e xadrez para transparência |
| `Toaster` | n/d | Já montado no `OverlayApp`; use `toast(msg, tone)` de `lib/toast` |

## Classes CSS soltas
`ni-button` (+ `--primary`, `--sm`), `ni-actions`, `ni-hint`, `ni-icon-button`, `ni-bevel` (chanfro TL/BR), `ni-dot` (+ `--pulse`), `ni-visually-hidden`.

## Regras
- Hover só em `(hover: hover) and (pointer: fine)`; pressionar escala 0,97 em 100 ms.
- Foco: outline 2 px magenta, offset 3 px (já global no overlay).
- Status nunca só por cor: ícone e texto sempre.
- Reduced-motion e forced-colors já tratados em `ui.css`; não repita nas ferramentas.
- Ferramentas que ainda têm `ni-pg-*`, `ni-tech-*` ou `ni-code-chip` no próprio CSS devem remover a duplicata ao migrar (a primitiva agora é dona de `ni-pg-thumb`, `ni-code-chip`, `ni-ratio`, `ni-id`, `ni-status`, `ni-filter`).
