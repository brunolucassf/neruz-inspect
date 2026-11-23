import {
  Braces,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
  Download,
} from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { copyText } from '../../../lib/clipboard';
import { downloadText } from '../../../lib/download';
import { useT } from '../../../lib/i18n';
import { EmptyState } from '../../../ui';
import type { ToolModule } from '../../types';
import '../tech.css';
import './json-viewer.css';
import {
  appendPath,
  childEntries,
  collectContainerPaths,
  findMatches,
  formatJson,
  isContainer,
  kindOf,
  minifyJson,
  pageJsonCandidate,
  parseJson,
  ROOT_PATH,
  summaryOf,
} from './json';

const CHILDREN_PAGE = 100;
const DEFAULT_OPEN_DEPTH = 1;
const EXPAND_ALL_DEPTH = 6;
const MAX_STRING_PREVIEW = 300;

type TreeContext = {
  open: ReadonlySet<string>;
  matches: ReadonlySet<string>;
  toggle: (path: string) => void;
};

const displayPrimitive = (value: unknown): string => {
  if (typeof value === 'string') {
    const text = JSON.stringify(value);
    return text.length > MAX_STRING_PREVIEW ? `${text.slice(0, MAX_STRING_PREVIEW)}…"` : text;
  }
  return String(value);
};

const readPageJson = (): string | null => {
  const body = document.body;
  if (!body) return null;
  return pageJsonCandidate(
    document.contentType,
    body.textContent ?? '',
    body.querySelectorAll('*').length,
  );
};

type JsonNodeProps = {
  label: string | number | undefined;
  value: unknown;
  path: string;
  context: TreeContext;
};

const JsonNode = ({ label, value, path, context }: JsonNodeProps) => {
  const t = useT();
  const [shown, setShown] = useState(CHILDREN_PAGE);
  const kind = kindOf(value);
  const container = isContainer(value);
  const isOpen = container && context.open.has(path);
  const entries = isOpen ? childEntries(value) : [];
  const isArray = kind === 'array';

  return (
    <li className="ni-json-node">
      <div className="ni-json-row" data-match={context.matches.has(path) || undefined}>
        {container ? (
          <button
            type="button"
            className="ni-json-toggle"
            aria-expanded={isOpen}
            aria-label={t(isOpen ? 'tech.jsonViewer.collapse' : 'tech.jsonViewer.expand', { path })}
            onClick={() => context.toggle(path)}
          >
            {isOpen ? (
              <ChevronDown size={12} aria-hidden="true" />
            ) : (
              <ChevronRight size={12} aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="ni-json-spacer" />
        )}
        {label === undefined ? null : (
          <>
            <span className="ni-json-key">{typeof label === 'number' ? label : `"${label}"`}</span>
            <span className="ni-json-colon">:</span>
          </>
        )}
        {container ? (
          <span className="ni-json-summary">
            {isOpen ? (isArray ? '[' : '{') : summaryOf(value)}
          </span>
        ) : (
          <span className={`ni-json-value ni-json-value--${kind}`}>{displayPrimitive(value)}</span>
        )}
        <span className="ni-json-actions">
          <button
            type="button"
            className="ni-json-action"
            aria-label={t('tech.jsonViewer.copyPath', { path })}
            title={t('tech.jsonViewer.copyPath', { path })}
            onClick={() => void copyText(path, t('tech.jsonViewer.pathLabel'))}
          >
            {t('tech.jsonViewer.pathShort')}
          </button>
          <button
            type="button"
            className="ni-json-action"
            aria-label={t('tech.jsonViewer.copyValue', { path })}
            title={t('tech.jsonViewer.copyValue', { path })}
            onClick={() =>
              void copyText(
                container ? formatJson(value) : typeof value === 'string' ? value : String(value),
                t('tech.jsonViewer.valueLabel'),
              )
            }
          >
            <Copy size={11} aria-hidden="true" />
          </button>
        </span>
      </div>
      {isOpen ? (
        <>
          <ul className="ni-json-children">
            {entries.slice(0, shown).map(([segment, child]) => (
              <JsonNode
                key={String(segment)}
                label={segment}
                value={child}
                path={appendPath(path, segment)}
                context={context}
              />
            ))}
          </ul>
          {entries.length > shown ? (
            <button
              type="button"
              className="ni-button ni-json-more"
              onClick={() => setShown(shown + CHILDREN_PAGE)}
            >
              {t('tech.jsonViewer.showMore', { n: entries.length - shown })}
            </button>
          ) : null}
          <div className="ni-json-closing">{isArray ? ']' : '}'}</div>
        </>
      ) : null}
    </li>
  );
};

const JsonViewerPanel = () => {
  const t = useT();
  const pageText = useMemo(readPageJson, []);
  const [text, setText] = useState(pageText ?? '');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const deferredText = useDeferredValue(text);

  const parsed = useMemo(
    () => (deferredText.trim() ? parseJson(deferredText) : null),
    [deferredText],
  );
  const value = parsed?.ok ? parsed.value : undefined;
  const search = useMemo(
    () => (parsed?.ok ? findMatches(parsed.value, query) : null),
    [parsed, query],
  );

  useEffect(() => {
    setOpen(parsed?.ok ? collectContainerPaths(parsed.value, DEFAULT_OPEN_DEPTH) : new Set());
  }, [parsed]);

  useEffect(() => {
    if (search && query.trim()) setOpen(new Set(search.open));
  }, [search, query]);

  const context = useMemo<TreeContext>(
    () => ({
      open,
      matches: search?.matches ?? new Set<string>(),
      toggle: (path) =>
        setOpen((current) => {
          const next = new Set(current);
          if (!next.delete(path)) next.add(path);
          return next;
        }),
    }),
    [open, search],
  );

  const isValid = parsed?.ok === true;

  return (
    <>
      <div className="ni-json-source">
        <textarea
          className="ni-tech-field"
          rows={4}
          spellCheck={false}
          value={text}
          placeholder={t('tech.jsonViewer.paste')}
          aria-label={t('tech.jsonViewer.paste')}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="ni-json-buttons">
          {pageText !== null && text !== pageText ? (
            <button type="button" className="ni-button" onClick={() => setText(pageText)}>
              {t('tech.jsonViewer.usePage')}
            </button>
          ) : null}
          <button
            type="button"
            className="ni-button"
            disabled={!isValid}
            onClick={() => setText(formatJson(value))}
          >
            {t('tech.jsonViewer.format')}
          </button>
          <button
            type="button"
            className="ni-button"
            disabled={!isValid}
            onClick={() => setText(minifyJson(value))}
          >
            {t('tech.jsonViewer.minify')}
          </button>
          <button
            type="button"
            className="ni-button ni-tech-button"
            disabled={!isValid}
            onClick={() => void copyText(formatJson(value), t('tech.jsonViewer.jsonLabel'))}
          >
            <Copy size={13} aria-hidden="true" />
            {t('tech.jsonViewer.copy')}
          </button>
          <button
            type="button"
            className="ni-button ni-tech-button"
            disabled={!isValid}
            onClick={() => downloadText(formatJson(value), 'data.json', 'application/json')}
          >
            <Download size={13} aria-hidden="true" />
            {t('tech.jsonViewer.download')}
          </button>
        </div>
      </div>
      {parsed === null ? (
        <EmptyState
          title={t('tech.jsonViewer.empty.title')}
          hint={t(
            pageText === null ? 'tech.jsonViewer.empty.hint' : 'tech.jsonViewer.empty.hintPage',
          )}
        />
      ) : parsed.ok ? (
        <>
          <div className="ni-tech-bar">
            <input
              type="search"
              className="ni-tech-field"
              value={query}
              placeholder={t('tech.jsonViewer.search')}
              aria-label={t('tech.jsonViewer.search')}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              type="button"
              className="ni-icon-button"
              aria-label={t('tech.jsonViewer.expandAll')}
              title={t('tech.jsonViewer.expandAll')}
              onClick={() => setOpen(collectContainerPaths(parsed.value, EXPAND_ALL_DEPTH))}
            >
              <ChevronsUpDown size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="ni-icon-button"
              aria-label={t('tech.jsonViewer.collapseAll')}
              title={t('tech.jsonViewer.collapseAll')}
              onClick={() => setOpen(new Set([ROOT_PATH]))}
            >
              <ChevronsDownUp size={14} aria-hidden="true" />
            </button>
          </div>
          {search && query.trim() ? (
            <p className="ni-tech-muted ni-json-count" role="status">
              {t(
                search.truncated ? 'tech.jsonViewer.matchesTruncated' : 'tech.jsonViewer.matches',
                {
                  n: search.matches.size,
                },
              )}
            </p>
          ) : null}
          <ul className="ni-json-tree" aria-label={t('tech.jsonViewer.tree')}>
            <JsonNode label={undefined} value={parsed.value} path={ROOT_PATH} context={context} />
          </ul>
        </>
      ) : (
        <EmptyState kind="error" title={t('tech.jsonViewer.invalid')} hint={parsed.message} />
      )}
    </>
  );
};

const jsonViewer: ToolModule = {
  id: 'jsonViewer',
  group: 'tech',
  icon: Braces,
  mode: 'panel',
  Panel: JsonViewerPanel,
};

export default jsonViewer;
