import { ChevronDown, ChevronRight, Cookie, Copy, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { copyText } from '../../../lib/clipboard';
import { useT } from '../../../lib/i18n';
import { toast } from '../../../lib/toast';
import { Badge, EmptyState, Tabs } from '../../../ui';
import type { ToolModule } from '../../types';
import '../tech.css';
import './storage-viewer.css';
import {
  byteLength,
  cookieDeletionStrings,
  filterEntries,
  formatBytes,
  formatJsonValue,
  parseCookieString,
  STORAGE_AREAS,
  type StorageArea,
  type StorageEntry,
} from './storage';

type AreaResult = { ok: true; entries: StorageEntry[] } | { ok: false };

type Snapshot = Record<StorageArea, AreaResult>;

const readWebStorage = (storage: () => Storage): AreaResult => {
  try {
    const target = storage();
    const entries: StorageEntry[] = [];
    for (let index = 0; index < target.length; index += 1) {
      const name = target.key(index);
      if (name === null) continue;
      entries.push({ name, value: target.getItem(name) ?? '' });
    }
    return { ok: true, entries };
  } catch {
    return { ok: false };
  }
};

const readSnapshot = (): Snapshot => {
  let cookies: AreaResult;
  try {
    cookies = { ok: true, entries: parseCookieString(document.cookie) };
  } catch {
    cookies = { ok: false };
  }
  return {
    cookies,
    local: readWebStorage(() => localStorage),
    session: readWebStorage(() => sessionStorage),
  };
};

const removeEntry = (area: StorageArea, name: string): boolean => {
  try {
    if (area === 'local') localStorage.removeItem(name);
    else if (area === 'session') sessionStorage.removeItem(name);
    else {
      for (const expiry of cookieDeletionStrings(name, location.hostname, location.pathname)) {
        // biome-ignore lint/suspicious/noDocumentCookie: cookieStore is not available in every supported browser
        document.cookie = expiry;
      }
      return !document.cookie.split(';').some((part) => part.trim().startsWith(`${name}=`));
    }
    return true;
  } catch {
    return false;
  }
};

type RowProps = {
  area: StorageArea;
  entry: StorageEntry;
  onRemoved: () => void;
};

const EntryRow = ({ area, entry, onRemoved }: RowProps) => {
  const t = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const formatted = useMemo(() => formatJsonValue(entry.value), [entry.value]);
  const displayName = entry.name || t('tech.storageViewer.unnamed');

  useEffect(() => {
    if (!isConfirming) return;
    const timer = setTimeout(() => setIsConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [isConfirming]);

  const handleRemove = (): void => {
    const removed = removeEntry(area, entry.name);
    toast(
      t(removed ? 'tech.storageViewer.removed' : 'tech.storageViewer.removeFailed', {
        name: displayName,
      }),
      removed ? 'success' : 'error',
    );
    onRemoved();
  };

  return (
    <li className="ni-store-row">
      <div className="ni-store-row__line">
        <button
          type="button"
          className="ni-icon-button"
          aria-expanded={isOpen}
          aria-label={t(isOpen ? 'tech.storageViewer.collapse' : 'tech.storageViewer.expand', {
            name: displayName,
          })}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <ChevronDown size={14} aria-hidden="true" />
          ) : (
            <ChevronRight size={14} aria-hidden="true" />
          )}
        </button>
        <div className="ni-store-row__text">
          <span className="ni-store-row__name" title={displayName}>
            {displayName}
          </span>
          <span className="ni-store-row__value" title={entry.value}>
            {entry.value || t('tech.storageViewer.emptyValue')}
          </span>
        </div>
        <Badge>{formatBytes(byteLength(entry.name) + byteLength(entry.value))}</Badge>
        {isConfirming ? (
          <>
            <button type="button" className="ni-button ni-store-danger" onClick={handleRemove}>
              {t('tech.storageViewer.confirmDelete')}
            </button>
            <button type="button" className="ni-button" onClick={() => setIsConfirming(false)}>
              {t('tech.storageViewer.cancel')}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="ni-icon-button"
              aria-label={t('core.copy.aria', { label: displayName })}
              title={t('core.copy.aria', { label: displayName })}
              onClick={() => void copyText(entry.value, displayName, { remember: false })}
            >
              <Copy size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="ni-icon-button"
              aria-label={t('tech.storageViewer.delete', { name: displayName })}
              title={t('tech.storageViewer.delete', { name: displayName })}
              onClick={() => setIsConfirming(true)}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {isOpen ? (
        <pre className="ni-tech-pre">
          {formatted ?? (entry.value || t('tech.storageViewer.emptyValue'))}
        </pre>
      ) : null}
    </li>
  );
};

const AreaList = ({
  area,
  result,
  query,
  onChanged,
}: {
  area: StorageArea;
  result: AreaResult;
  query: string;
  onChanged: () => void;
}) => {
  const t = useT();
  if (!result.ok) {
    return (
      <EmptyState
        kind="error"
        title={t('tech.storageViewer.blocked.title')}
        hint={t('tech.storageViewer.blocked.hint')}
      />
    );
  }
  const entries = filterEntries(result.entries, query);
  if (entries.length === 0) {
    return (
      <EmptyState
        title={t(query ? 'tech.storageViewer.noMatch' : 'tech.storageViewer.empty')}
        hint={query ? undefined : t(`tech.storageViewer.emptyHint.${area}`)}
      />
    );
  }
  return (
    <ul className="ni-store-list">
      {entries.map((entry) => (
        <EntryRow
          key={`${area}:${entry.name}:${entry.value}`}
          area={area}
          entry={entry}
          onRemoved={onChanged}
        />
      ))}
    </ul>
  );
};

const StorageViewerPanel = () => {
  const t = useT();
  const [snapshot, setSnapshot] = useState<Snapshot>(readSnapshot);
  const [area, setArea] = useState<StorageArea>('cookies');
  const [query, setQuery] = useState('');

  const refresh = (): void => setSnapshot(readSnapshot());

  const count = (key: StorageArea): number => {
    const result = snapshot[key];
    return result.ok ? result.entries.length : 0;
  };

  return (
    <>
      <div className="ni-tech-bar">
        <input
          type="search"
          className="ni-tech-field"
          value={query}
          placeholder={t('tech.storageViewer.search')}
          aria-label={t('tech.storageViewer.search')}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          type="button"
          className="ni-icon-button"
          aria-label={t('tech.storageViewer.refresh')}
          title={t('tech.storageViewer.refresh')}
          onClick={refresh}
        >
          <RefreshCw size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="ni-store-tabs">
        <Tabs
          label={t('tech.storageViewer.areas')}
          items={STORAGE_AREAS.map((id) => ({
            id,
            label: `${t(`tech.storageViewer.area.${id}`)} ${count(id)}`,
          }))}
          value={area}
          onChange={setArea}
        >
          {area === 'cookies' ? (
            <p className="ni-tech-muted ni-store-note">{t('tech.storageViewer.httpOnly')}</p>
          ) : null}
          <AreaList area={area} result={snapshot[area]} query={query} onChanged={refresh} />
        </Tabs>
      </div>
    </>
  );
};

const storageViewer: ToolModule = {
  id: 'storageViewer',
  group: 'tech',
  icon: Cookie,
  mode: 'panel',
  Panel: StorageViewerPanel,
};

export default storageViewer;
