import { PencilLine } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { parseCssColor } from '../../../lib/color';
import {
  getViewportRect,
  type HighlightItem,
  useHighlights,
  useViewportVersion,
} from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import { getElementLabel, useElementPicker } from '../../../lib/picker';
import { toast } from '../../../lib/toast';
import { EmptyState, PanelSection, Tabs } from '../../../ui';
import type { ToolModule } from '../../types';
import { CodeBlock } from '../shared/CodeBlock';
import {
  colorToInputValue,
  formatStyleChangesCss,
  formatTextChanges,
  parsePxInput,
  readUniformPx,
} from './editLive';
import { EditSession } from './editSession';
import '../shared/code.css';

type TabId = 'text' | 'style';

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

type ColorFieldProps = {
  label: string;
  value: string;
  onCommit: (value: string) => void;
};

const ColorField = ({ label, value, onCommit }: ColorFieldProps) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className="ni-field">
      <span>{label}</span>
      <span className="ni-field__controls">
        <input
          type="color"
          className="ni-color-input"
          aria-label={label}
          value={colorToInputValue(value)}
          onChange={(event) => onCommit(event.target.value)}
        />
        <input
          type="text"
          className="ni-input"
          spellCheck={false}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (parseCssColor(event.target.value)) onCommit(event.target.value);
          }}
        />
      </span>
    </label>
  );
};

type PxFieldProps = {
  label: string;
  value: number | null;
  mixedLabel: string;
  onCommit: (px: number) => void;
};

const PxField = ({ label, value, mixedLabel, onCommit }: PxFieldProps) => (
  <label className="ni-field">
    <span>{label}</span>
    <span className="ni-field__controls">
      <input
        type="number"
        min={0}
        step={1}
        className="ni-input"
        placeholder={value === null ? mixedLabel : undefined}
        value={value ?? ''}
        onChange={(event) => {
          const parsed = parsePxInput(event.target.value);
          if (parsed !== null) onCommit(parsed);
        }}
      />
      <span aria-hidden="true">px</span>
    </span>
  </label>
);

const StyleControls = ({ element, session }: { element: HTMLElement; session: EditSession }) => {
  const t = useT();
  const style = getComputedStyle(element);
  const padding = readUniformPx(SIDES.map((side) => style.getPropertyValue(`padding-${side}`)));
  const margin = readUniformPx(SIDES.map((side) => style.getPropertyValue(`margin-${side}`)));
  return (
    <div className="ni-stack">
      <ColorField
        label={t('code.editLive.field.color')}
        value={style.color}
        onCommit={(value) => session.setStyle(element, 'color', value)}
      />
      <ColorField
        label={t('code.editLive.field.background')}
        value={style.backgroundColor}
        onCommit={(value) => session.setStyle(element, 'background-color', value)}
      />
      <PxField
        label={t('code.editLive.field.fontSize')}
        value={readUniformPx([style.fontSize])}
        mixedLabel={t('code.editLive.mixed')}
        onCommit={(px) => session.setStyle(element, 'font-size', `${px}px`)}
      />
      <PxField
        label="Padding"
        value={padding}
        mixedLabel={t('code.editLive.mixed')}
        onCommit={(px) => session.setStyle(element, 'padding', `${px}px`)}
      />
      <PxField
        label="Margin"
        value={margin}
        mixedLabel={t('code.editLive.mixed')}
        onCommit={(px) => session.setStyle(element, 'margin', `${px}px`)}
      />
      <PxField
        label={t('code.editLive.field.radius')}
        value={readUniformPx([style.borderTopLeftRadius])}
        mixedLabel={t('code.editLive.mixed')}
        onCommit={(px) => session.setStyle(element, 'border-radius', `${px}px`)}
      />
    </div>
  );
};

const EditLivePanel = () => {
  const t = useT();
  const [session] = useState(() => new EditSession());
  const [tab, setTab] = useState<TabId>('text');
  const [textEditing, setTextEditing] = useState(false);
  const { hovered, locked } = useElementPicker({ enabled: tab === 'style' });
  useViewportVersion();

  useEffect(() => () => session.dispose(), [session]);

  useEffect(() => {
    session.setTextEditing(textEditing && tab === 'text');
  }, [session, textEditing, tab]);

  useSyncExternalStore(
    (listener) => session.subscribe(listener),
    () => session.snapshotVersion,
  );

  const target = tab === 'style' ? (locked ?? hovered) : null;
  const highlights: HighlightItem[] = target
    ? [
        { kind: 'box', rect: getViewportRect(target) },
        { kind: 'label', rect: getViewportRect(target), text: getElementLabel(target) },
      ]
    : [];
  useHighlights(highlights);

  const styleCss = formatStyleChangesCss(session.getStyleChanges());
  const textChanges = session.getTextChanges();
  const textReport = formatTextChanges(textChanges);
  const hasChanges = styleCss !== '' || textChanges.length > 0;

  const handleUndo = (): void => {
    session.undoAll();
    toast(t('code.editLive.resetDone'), 'success');
  };

  return (
    <>
      <Tabs
        label={t('code.editLive.tabs')}
        value={tab}
        onChange={setTab}
        items={[
          { id: 'text', label: t('code.editLive.tab.text') },
          { id: 'style', label: t('code.editLive.tab.style') },
        ]}
      >
        {tab === 'text' ? (
          <div className="ni-stack">
            <button
              type="button"
              className={`ni-button${textEditing ? ' ni-button--toggled' : ''}`}
              aria-pressed={textEditing}
              onClick={() => setTextEditing((current) => !current)}
            >
              {t(textEditing ? 'code.editLive.text.on' : 'code.editLive.text.off')}
            </button>
            <p className="ni-note">{t('code.editLive.text.hint')}</p>
          </div>
        ) : locked instanceof HTMLElement ? (
          <StyleControls element={locked} session={session} />
        ) : (
          <EmptyState
            title={t('code.editLive.style.empty.title')}
            hint={t('code.editLive.style.empty.hint')}
          />
        )}
      </Tabs>
      <PanelSection
        title={t('code.editLive.section.changes')}
        actions={
          <button type="button" className="ni-button" disabled={!hasChanges} onClick={handleUndo}>
            {t('code.editLive.undo')}
          </button>
        }
      >
        {hasChanges ? (
          <div className="ni-stack">
            {styleCss ? (
              <CodeBlock code={styleCss} label="CSS" filename="edited.css" mime="text/css" />
            ) : null}
            {textChanges.length > 0 ? (
              <CodeBlock
                code={textReport}
                label={t('code.editLive.texts')}
                filename="edited-texts.txt"
              />
            ) : null}
          </div>
        ) : (
          <p className="ni-note">{t('code.editLive.noChanges')}</p>
        )}
      </PanelSection>
      <p className="ni-hint">{t('code.editLive.note')}</p>
    </>
  );
};

const editLive: ToolModule = {
  id: 'editLive',
  group: 'code',
  icon: PencilLine,
  mode: 'panel',
  Panel: EditLivePanel,
};

export default editLive;
