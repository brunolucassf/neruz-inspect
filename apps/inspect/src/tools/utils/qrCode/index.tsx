import { Download, QrCode } from 'lucide-react';
import { useMemo, useState } from 'react';
import { contrastWcag, parseCssColor } from '../../../lib/color';
import { downloadBlob, downloadText } from '../../../lib/download';
import { useT } from '../../../lib/i18n';
import { toast } from '../../../lib/toast';
import { Card, EmptyState, type TabItem, Tabs } from '../../../ui';
import type { ToolModule } from '../../types';
import '../utils.css';
import { encodeQr, QR_QUIET_ZONE, type QrMatrix, toPathData, toSvg } from './qr';

type SourceMode = 'page' | 'text';

const SIZES = [192, 256, 384, 512, 1024] as const;
const MIN_CONTRAST = 3;

type EncodeResult = { ok: true; matrix: QrMatrix } | { ok: false };

const encodeSafely = (content: string): EncodeResult => {
  try {
    return { ok: true, matrix: encodeQr(content) };
  } catch {
    return { ok: false };
  }
};

const readContrast = (foreground: string, background: string): number => {
  const fg = parseCssColor(foreground);
  const bg = parseCssColor(background);
  return fg && bg ? contrastWcag(fg, bg) : MIN_CONTRAST;
};

const isInverted = (foreground: string, background: string): boolean => {
  const fg = parseCssColor(foreground);
  const bg = parseCssColor(background);
  if (!fg || !bg) return false;
  const brightness = (color: { r: number; g: number; b: number }): number =>
    color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
  return brightness(fg) > brightness(bg);
};

const renderPng = (
  matrix: QrMatrix,
  foreground: string,
  background: string,
  size: number,
): void => {
  const total = matrix.size + QR_QUIET_ZONE * 2;
  const scale = Math.max(1, Math.floor(size / total));
  const canvas = document.createElement('canvas');
  canvas.width = total * scale;
  canvas.height = total * scale;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = foreground;
  matrix.modules.forEach((row, y) => {
    row.forEach((isDark, x) => {
      if (isDark) {
        context.fillRect((x + QR_QUIET_ZONE) * scale, (y + QR_QUIET_ZONE) * scale, scale, scale);
      }
    });
  });
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, 'qrcode.png');
  }, 'image/png');
};

const QrCodePanel = () => {
  const t = useT();
  const [mode, setMode] = useState<SourceMode>('page');
  const [text, setText] = useState('');
  const [foreground, setForeground] = useState('#000000');
  const [background, setBackground] = useState('#ffffff');
  const [size, setSize] = useState<number>(256);

  const content = mode === 'page' ? location.href : text;
  const result = useMemo(() => (content ? encodeSafely(content) : null), [content]);
  const pathData = useMemo(() => (result?.ok ? toPathData(result.matrix) : ''), [result]);

  const tabs: readonly TabItem<SourceMode>[] = [
    { id: 'page', label: t('utils.qrCode.source.page') },
    { id: 'text', label: t('utils.qrCode.source.text') },
  ];

  const lowContrast = readContrast(foreground, background) < MIN_CONTRAST;
  const inverted = isInverted(foreground, background);

  const handleSvg = (matrix: QrMatrix): void => {
    downloadText(toSvg(matrix, { foreground, background }), 'qrcode.svg', 'image/svg+xml');
    toast(t('utils.qrCode.downloaded'), 'success');
  };

  const handlePng = (matrix: QrMatrix): void => {
    renderPng(matrix, foreground, background, size);
    toast(t('utils.qrCode.downloaded'), 'success');
  };

  return (
    <div className="ni-ut-body">
      <Tabs label={t('utils.qrCode.source.label')} items={tabs} value={mode} onChange={setMode}>
        {mode === 'page' ? (
          <p className="ni-ut-muted">{content}</p>
        ) : (
          <textarea
            className="ni-ut-field"
            rows={3}
            value={text}
            placeholder={t('utils.qrCode.text.placeholder')}
            aria-label={t('utils.qrCode.text.placeholder')}
            onChange={(event) => setText(event.target.value)}
          />
        )}
      </Tabs>

      {result === null ? (
        <EmptyState title={t('utils.qrCode.empty.title')} hint={t('utils.qrCode.empty.hint')} />
      ) : result.ok ? (
        <div className="ni-ut-qr">
          <svg
            role="img"
            aria-label={t('utils.qrCode.alt')}
            viewBox={`0 0 ${result.matrix.size + QR_QUIET_ZONE * 2} ${result.matrix.size + QR_QUIET_ZONE * 2}`}
            width={Math.min(size, 280)}
            height={Math.min(size, 280)}
            shapeRendering="crispEdges"
          >
            <rect width="100%" height="100%" fill={background} />
            <path d={pathData} fill={foreground} />
          </svg>
        </div>
      ) : (
        <EmptyState
          kind="error"
          title={t('utils.qrCode.tooLong.title')}
          hint={t('utils.qrCode.tooLong.hint')}
        />
      )}

      <Card variant="padded" className="ni-ut-grid">
        <label className="ni-ut-label">
          {t('utils.qrCode.foreground')}
          <input
            type="color"
            className="ni-ut-field"
            value={foreground}
            onChange={(event) => setForeground(event.target.value)}
          />
        </label>
        <label className="ni-ut-label">
          {t('utils.qrCode.background')}
          <input
            type="color"
            className="ni-ut-field"
            value={background}
            onChange={(event) => setBackground(event.target.value)}
          />
        </label>
        <label className="ni-ut-label">
          {t('utils.qrCode.size')}
          <select
            className="ni-ut-field"
            value={size}
            onChange={(event) => setSize(Number(event.target.value))}
          >
            {SIZES.map((value) => (
              <option key={value} value={value}>
                {value} px
              </option>
            ))}
          </select>
        </label>
      </Card>

      {lowContrast || inverted ? (
        <p className="ni-ut-muted" role="status">
          {t(lowContrast ? 'utils.qrCode.lowContrast' : 'utils.qrCode.inverted')}
        </p>
      ) : null}

      <div className="ni-actions">
        <button
          type="button"
          className="ni-button ni-button--primary ni-ut-button"
          disabled={!result?.ok}
          onClick={() => result?.ok && handlePng(result.matrix)}
        >
          <Download size={14} aria-hidden="true" />
          PNG
        </button>
        <button
          type="button"
          className="ni-button ni-ut-button"
          disabled={!result?.ok}
          onClick={() => result?.ok && handleSvg(result.matrix)}
        >
          <Download size={14} aria-hidden="true" />
          SVG
        </button>
      </div>
      <p className="ni-ut-muted">{t('utils.qrCode.note')}</p>
    </div>
  );
};

const qrCode: ToolModule = {
  id: 'qrCode',
  group: 'utils',
  icon: QrCode,
  mode: 'panel',
  Panel: QrCodePanel,
};

export default qrCode;
