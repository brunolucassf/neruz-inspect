import { SwatchBook } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useT } from '../../../lib/i18n';
import { CopyRow, EmptyState, PanelSection, Swatch, Tabs } from '../../../ui';
import type { ToolModule } from '../../types';
import { CodeBlock } from '../shared/CodeBlock';
import { MAX_SCANNED_ELEMENTS, type ScanHandle, scanPage } from './scan';
import {
  buildDesignTokens,
  type DesignTokens,
  toCssVariables,
  toDesignTokensJson,
  toTailwindTheme,
} from './tokens';
import '../shared/code.css';
import './design-tokens.css';

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning'; ratio: number }
  | { status: 'error' }
  | { status: 'done'; tokens: DesignTokens; limited: boolean };

type ExportTab = 'css' | 'tailwind' | 'json';

const formatPx = (value: number): string => `${Math.round(value * 100) / 100}px`;

const TokensPreview = ({ tokens }: { tokens: DesignTokens }) => {
  const t = useT();
  const maxSpacing = Math.max(1, ...tokens.spacing.map((item) => item.px));
  return (
    <>
      {tokens.colors.length > 0 ? (
        <PanelSection title={t('code.designTokens.section.colors')}>
          {tokens.colors.map((color) => (
            <CopyRow
              key={color.name}
              label={color.name}
              value={color.hex}
              leading={<Swatch color={color.hex} size={16} />}
            />
          ))}
        </PanelSection>
      ) : null}
      {tokens.fontFamilies.length > 0 ? (
        <PanelSection title={t('code.designTokens.section.fonts')}>
          {tokens.fontFamilies.map((family) => (
            <div key={family.name} className="ni-token-font">
              <span className="ni-token-font__sample" style={{ fontFamily: family.stack }}>
                Aa Bb Cc 123
              </span>
              <CopyRow label={family.name} value={family.stack} />
            </div>
          ))}
        </PanelSection>
      ) : null}
      {tokens.typeScale.length > 0 ? (
        <PanelSection title={t('code.designTokens.section.type')}>
          {tokens.typeScale.map((step) => (
            <div key={step.name} className="ni-token-type">
              <span
                className="ni-token-type__sample"
                style={{
                  fontSize: Math.min(step.px, 40),
                  fontFamily: tokens.fontFamilies[0]?.stack,
                }}
              >
                Aa
              </span>
              <CopyRow label={step.name} value={formatPx(step.px)} />
            </div>
          ))}
        </PanelSection>
      ) : null}
      {tokens.spacing.length > 0 ? (
        <PanelSection title={t('code.designTokens.section.spacing')}>
          {tokens.spacing.map((step) => (
            <div key={step.name} className="ni-token-bar">
              <span
                className="ni-token-bar__fill"
                style={{ width: `${Math.max(2, (step.px / maxSpacing) * 100)}%` }}
              />
              <CopyRow label={step.name} value={formatPx(step.px)} />
            </div>
          ))}
        </PanelSection>
      ) : null}
      {tokens.radii.length > 0 ? (
        <PanelSection title={t('code.designTokens.section.radii')}>
          {tokens.radii.map((step) => (
            <div key={step.name} className="ni-token-radius">
              <span
                className="ni-token-radius__box"
                style={{ borderRadius: Math.min(step.px, 20) }}
                aria-hidden="true"
              />
              <CopyRow label={step.name} value={formatPx(step.px)} />
            </div>
          ))}
        </PanelSection>
      ) : null}
      {tokens.shadows.length > 0 ? (
        <PanelSection title={t('code.designTokens.section.shadows')}>
          {tokens.shadows.map((item) => (
            <div key={item.name} className="ni-token-shadow">
              <span
                className="ni-token-shadow__box"
                style={{ boxShadow: item.value }}
                aria-hidden="true"
              />
              <CopyRow label={item.name} value={item.value} />
            </div>
          ))}
        </PanelSection>
      ) : null}
      {tokens.breakpoints.length > 0 ? (
        <PanelSection title={t('code.designTokens.section.breakpoints')}>
          {tokens.breakpoints.map((step) => (
            <CopyRow key={step.name} label={step.name} value={formatPx(step.px)} />
          ))}
        </PanelSection>
      ) : null}
      {tokens.containers.length > 0 ? (
        <PanelSection title={t('code.designTokens.section.containers')}>
          {tokens.containers.map((step) => (
            <CopyRow key={step.name} label={step.name} value={formatPx(step.px)} />
          ))}
        </PanelSection>
      ) : null}
    </>
  );
};

const DesignTokensPanel = () => {
  const t = useT();
  const [state, setState] = useState<ScanState>({ status: 'idle' });
  const [exportTab, setExportTab] = useState<ExportTab>('css');
  const handleRef = useRef<ScanHandle | null>(null);

  useEffect(() => () => handleRef.current?.cancel(), []);

  const startScan = (): void => {
    handleRef.current?.cancel();
    setState({ status: 'scanning', ratio: 0 });
    const handle = scanPage((ratio) => setState({ status: 'scanning', ratio }));
    handleRef.current = handle;
    handle.promise
      .then(({ scan, limited }) => {
        if (handleRef.current !== handle) return;
        setState({ status: 'done', tokens: buildDesignTokens(scan), limited });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return;
        setState({ status: 'error' });
      });
  };

  if (state.status === 'idle') {
    return (
      <EmptyState
        title={t('code.designTokens.idle.title')}
        hint={t('code.designTokens.idle.hint')}
        action={
          <button type="button" className="ni-button ni-button--primary" onClick={startScan}>
            {t('code.designTokens.scan')}
          </button>
        }
      />
    );
  }

  if (state.status === 'scanning') {
    return (
      <EmptyState
        kind="loading"
        title={t('code.designTokens.scanning')}
        hint={`${Math.round(state.ratio * 100)}%`}
      />
    );
  }

  if (state.status === 'error') {
    return (
      <EmptyState
        kind="error"
        title={t('code.designTokens.error.title')}
        hint={t('code.designTokens.error.hint')}
        action={
          <button type="button" className="ni-button" onClick={startScan}>
            {t('code.designTokens.scanAgain')}
          </button>
        }
      />
    );
  }

  const { tokens, limited } = state;
  const isEmpty = tokens.colors.length === 0 && tokens.typeScale.length === 0;
  if (isEmpty) {
    return (
      <EmptyState
        title={t('code.designTokens.nothing.title')}
        hint={t('code.designTokens.nothing.hint')}
        action={
          <button type="button" className="ni-button" onClick={startScan}>
            {t('code.designTokens.scanAgain')}
          </button>
        }
      />
    );
  }

  return (
    <>
      <div className="ni-stack">
        <div className="ni-row">
          <button type="button" className="ni-button" onClick={startScan}>
            {t('code.designTokens.scanAgain')}
          </button>
        </div>
        {limited ? (
          <p className="ni-note ni-note--warning" role="status">
            {t('code.designTokens.limited', { n: MAX_SCANNED_ELEMENTS })}
          </p>
        ) : null}
      </div>
      <TokensPreview tokens={tokens} />
      <PanelSection title={t('code.designTokens.section.export')}>
        <Tabs
          label={t('code.designTokens.export.tabs')}
          value={exportTab}
          onChange={setExportTab}
          items={[
            { id: 'css', label: t('code.designTokens.export.css') },
            { id: 'tailwind', label: 'Tailwind v4' },
            { id: 'json', label: 'JSON' },
          ]}
        >
          <div className="ni-stack">
            {exportTab === 'css' ? (
              <CodeBlock
                code={toCssVariables(tokens)}
                label="CSS"
                filename="tokens.css"
                mime="text/css"
              />
            ) : null}
            {exportTab === 'tailwind' ? (
              <CodeBlock
                code={toTailwindTheme(tokens)}
                label="Tailwind @theme"
                filename="theme.css"
                mime="text/css"
              />
            ) : null}
            {exportTab === 'json' ? (
              <CodeBlock
                code={toDesignTokensJson(tokens)}
                label="JSON"
                filename="tokens.json"
                mime="application/json"
              />
            ) : null}
          </div>
        </Tabs>
      </PanelSection>
    </>
  );
};

const designTokens: ToolModule = {
  id: 'designTokens',
  group: 'code',
  icon: SwatchBook,
  mode: 'panel',
  Panel: DesignTokensPanel,
};

export default designTokens;
