import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react';
import { useT } from '../../../lib/i18n';
import { EmptyState, PanelSection } from '../../../ui';
import type { ToolModule } from '../../types';
import '../shared/layout-tools.css';
import {
  centerLeft,
  clampDimension,
  clampOpacity,
  DEFAULT_OPACITY,
  isImageFile,
  type Size,
  scaleByFactor,
  scaleToWidth,
} from './figma';

type LoadedImage = { bitmap: ImageBitmap; name: string };
type Position = { x: number; y: number };
type LoadState = 'idle' | 'loading' | 'error';

const OVERLAY_Z_INDEX = '2147483646';

const useDesignCanvas = (
  image: LoadedImage | null,
  position: Position,
  size: Size,
  opacity: number,
  locked: boolean,
  difference: boolean,
  onMove: (next: Position) => void,
): void => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const positionRef = useRef(position);
  positionRef.current = position;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    canvas.width = image.bitmap.width;
    canvas.height = image.bitmap.height;
    canvas.getContext('2d')?.drawImage(image.bitmap, 0, 0);
    canvas.setAttribute('aria-hidden', 'true');
    canvas.dataset.neruzDesignOverlay = '';
    let origin: { pointer: Position; start: Position } | null = null;

    const handleDown = (event: PointerEvent): void => {
      if (lockedRef.current || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      canvas.setPointerCapture(event.pointerId);
      origin = {
        pointer: { x: event.clientX, y: event.clientY },
        start: positionRef.current,
      };
    };
    const handleMove = (event: PointerEvent): void => {
      if (!origin) return;
      onMoveRef.current({
        x: Math.round(origin.start.x + event.clientX - origin.pointer.x),
        y: Math.round(origin.start.y + event.clientY - origin.pointer.y),
      });
    };
    const handleUp = (event: PointerEvent): void => {
      origin = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };
    canvas.addEventListener('pointerdown', handleDown);
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerup', handleUp);
    canvas.addEventListener('pointercancel', handleUp);
    document.documentElement.append(canvas);
    canvasRef.current = canvas;
    return () => {
      canvas.remove();
      canvasRef.current = null;
    };
  }, [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const apply = (property: string, value: string): void =>
      canvas.style.setProperty(property, value, 'important');
    apply('position', 'absolute');
    apply('left', `${position.x}px`);
    apply('top', `${position.y}px`);
    apply('width', `${size.width}px`);
    apply('height', `${size.height}px`);
    apply('max-width', 'none');
    apply('max-height', 'none');
    apply('margin', '0');
    apply('padding', '0');
    apply('border', '0');
    apply('z-index', OVERLAY_Z_INDEX);
    apply('opacity', String(opacity / 100));
    apply('mix-blend-mode', difference ? 'difference' : 'normal');
    apply('pointer-events', locked ? 'none' : 'auto');
    apply('cursor', locked ? 'default' : 'move');
    apply('touch-action', 'none');
    apply('user-select', 'none');
  }, [image, position, size, opacity, locked, difference]);
};

const readNumber = (event: ChangeEvent<HTMLInputElement>, fallback: number): number => {
  const parsed = Number.parseFloat(event.target.value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const FigmaOverlayPanel = () => {
  const t = useT();
  const fileInput = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [locked, setLocked] = useState(false);
  const [difference, setDifference] = useState(false);

  useDesignCanvas(image, position, size, opacity, locked, difference, setPosition);

  useEffect(
    () => () => {
      image?.bitmap.close();
    },
    [image],
  );

  const natural: Size | null = image
    ? { width: image.bitmap.width, height: image.bitmap.height }
    : null;

  const loadFile = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    if (!isImageFile(file)) {
      setLoadState('error');
      return;
    }
    setLoadState('loading');
    try {
      const bitmap = await createImageBitmap(file);
      setImage({ bitmap, name: file.name });
      setSize({ width: bitmap.width, height: bitmap.height });
      setPosition({ x: 0, y: 0 });
      setLoadState('idle');
    } catch {
      setLoadState('error');
    }
  };

  const handleDrop = (event: DragEvent<HTMLFieldSetElement>): void => {
    event.preventDefault();
    setIsDragOver(false);
    void loadFile(event.dataTransfer.files[0]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    void loadFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const removeImage = (): void => {
    setImage(null);
    setLoadState('idle');
  };

  const fileField = (
    <input
      ref={fileInput}
      type="file"
      accept="image/*"
      className="ni-visually-hidden"
      tabIndex={-1}
      onChange={handleFileChange}
    />
  );

  if (!image || !natural) {
    return (
      <>
        {loadState === 'loading' ? (
          <EmptyState kind="loading" title={t('layout.figmaOverlay.loading.title')} />
        ) : (
          <fieldset
            className="ni-lt-drop"
            aria-label={t('layout.figmaOverlay.drop.title')}
            data-over={isDragOver}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <p className="ni-lt-drop__title">{t('layout.figmaOverlay.drop.title')}</p>
            <p className="ni-lt-drop__hint">{t('layout.figmaOverlay.drop.hint')}</p>
            <button
              type="button"
              className="ni-button ni-button--primary"
              onClick={() => fileInput.current?.click()}
            >
              {t('layout.figmaOverlay.choose')}
            </button>
          </fieldset>
        )}
        {loadState === 'error' ? (
          <EmptyState
            kind="error"
            title={t('layout.figmaOverlay.error.title')}
            hint={t('layout.figmaOverlay.error.hint')}
          />
        ) : null}
        {fileField}
      </>
    );
  }

  const viewportWidth = document.documentElement.clientWidth;

  return (
    <>
      <PanelSection
        title={t('layout.figmaOverlay.section.image')}
        actions={
          <button
            type="button"
            className="ni-icon-button"
            aria-label={t('layout.figmaOverlay.remove')}
            onClick={removeImage}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        }
      >
        <p className="ni-hint">{`${image.name} · ${natural.width}×${natural.height}`}</p>
      </PanelSection>

      <div className="ni-lt-field">
        <label htmlFor="ni-fig-opacity">{t('layout.figmaOverlay.opacity')}</label>
        <input
          id="ni-fig-opacity"
          className="ni-lt-range"
          type="range"
          min={0}
          max={100}
          value={opacity}
          onChange={(event) => setOpacity(clampOpacity(Number(event.target.value)))}
        />
        <span className="ni-lt-field__value">{`${opacity}%`}</span>
      </div>

      <label className="ni-lt-check">
        <input
          type="checkbox"
          checked={difference}
          onChange={(event) => setDifference(event.target.checked)}
        />
        {t('layout.figmaOverlay.difference')}
      </label>
      <label className="ni-lt-check">
        <input
          type="checkbox"
          checked={locked}
          onChange={(event) => setLocked(event.target.checked)}
        />
        {t('layout.figmaOverlay.lock')}
      </label>

      <PanelSection title={t('layout.figmaOverlay.section.position')}>
        <div className="ni-lt-field">
          <label htmlFor="ni-fig-x">X</label>
          <input
            id="ni-fig-x"
            className="ni-lt-input"
            type="number"
            value={position.x}
            onChange={(event) =>
              setPosition((current) => ({ ...current, x: readNumber(event, current.x) }))
            }
          />
          <span />
        </div>
        <div className="ni-lt-field">
          <label htmlFor="ni-fig-y">Y</label>
          <input
            id="ni-fig-y"
            className="ni-lt-input"
            type="number"
            value={position.y}
            onChange={(event) =>
              setPosition((current) => ({ ...current, y: readNumber(event, current.y) }))
            }
          />
          <span />
        </div>
        <div className="ni-lt-field">
          <label htmlFor="ni-fig-width">{t('layout.figmaOverlay.width')}</label>
          <input
            id="ni-fig-width"
            className="ni-lt-input"
            type="number"
            min={1}
            value={Math.round(size.width)}
            onChange={(event) =>
              setSize(
                scaleToWidth(natural, clampDimension(readNumber(event, size.width), size.width)),
              )
            }
          />
          <span />
        </div>
      </PanelSection>

      <div className="ni-lt-actions">
        <button
          type="button"
          className="ni-button"
          onClick={() => setPosition((current) => ({ ...current, y: 0 }))}
        >
          {t('layout.figmaOverlay.align.top')}
        </button>
        <button
          type="button"
          className="ni-button"
          onClick={() =>
            setPosition((current) => ({ ...current, x: centerLeft(size.width, viewportWidth) }))
          }
        >
          {t('layout.figmaOverlay.align.center')}
        </button>
        <button
          type="button"
          className="ni-button"
          onClick={() => {
            setSize(scaleToWidth(natural, viewportWidth));
            setPosition((current) => ({ ...current, x: 0 }));
          }}
        >
          {t('layout.figmaOverlay.fit')}
        </button>
        <button
          type="button"
          className="ni-button"
          onClick={() => setSize(scaleByFactor(natural, 0.5))}
        >
          {t('layout.figmaOverlay.half')}
        </button>
        <button type="button" className="ni-button" onClick={() => setSize(natural)}>
          {t('layout.figmaOverlay.natural')}
        </button>
        <button type="button" className="ni-button" onClick={() => fileInput.current?.click()}>
          {t('layout.figmaOverlay.choose')}
        </button>
      </div>
      <p className="ni-hint">{t('layout.figmaOverlay.hint')}</p>
      {fileField}
    </>
  );
};

const figmaOverlay: ToolModule = {
  id: 'figmaOverlay',
  group: 'layout',
  icon: ImageIcon,
  mode: 'action',
  Panel: FigmaOverlayPanel,
};

export default figmaOverlay;
