import { Pipette } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { captureTab } from '../../../lib/bridge';
import { type Color, parseCssColor, toHex } from '../../../lib/color';
import { useT } from '../../../lib/i18n';
import { toast } from '../../../lib/toast';
import { EmptyState, PanelSection, Swatch } from '../../../ui';
import type { ToolModule } from '../../types';
import { ColorReadout } from '../shared/ColorReadout';
import '../shared/tools.css';
import { openLoupe } from './loupe';
import { getSessionColors, rememberSessionColor } from './recentColors';

type NativeEyeDropper = { open: () => Promise<{ sRGBHex: string }> };

type EyeDropperConstructor = new () => NativeEyeDropper;

const getNativeEyeDropper = (): EyeDropperConstructor | undefined =>
  (window as unknown as { EyeDropper?: EyeDropperConstructor }).EyeDropper;

type Phase = 'idle' | 'capturing' | 'picking' | 'failed';

const EyedropperPanel = () => {
  const t = useT();
  const EyeDropperApi = getNativeEyeDropper();
  const [current, setCurrent] = useState<Color | null>(() => {
    const [latest] = getSessionColors();
    return latest ? parseCssColor(latest) : null;
  });
  const [recent, setRecent] = useState<readonly string[]>(getSessionColors);
  const [phase, setPhase] = useState<Phase>('idle');
  const closeLoupe = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      closeLoupe.current?.();
      closeLoupe.current = null;
    },
    [],
  );

  const accept = useCallback((color: Color) => {
    setCurrent(color);
    setRecent(rememberSessionColor(toHex(color)));
    setPhase('idle');
  }, []);

  const pickNative = useCallback(
    async (Constructor: EyeDropperConstructor) => {
      setPhase('picking');
      try {
        const { sRGBHex } = await new Constructor().open();
        const color = parseCssColor(sRGBHex);
        if (color) accept(color);
        else setPhase('idle');
      } catch {
        setPhase('idle');
      }
    },
    [accept],
  );

  const pickWithLoupe = useCallback(async () => {
    setPhase('capturing');
    try {
      const dataUrl = await captureTab();
      closeLoupe.current?.();
      closeLoupe.current = await openLoupe({
        dataUrl,
        hint: t('color.eyedropper.loupeHint'),
        onPick: (color) => {
          closeLoupe.current = null;
          accept(color);
        },
        onCancel: () => {
          closeLoupe.current = null;
          setPhase('idle');
        },
      });
      setPhase('picking');
    } catch {
      setPhase('failed');
      toast(t('color.eyedropper.captureFailed'), 'error');
    }
  }, [accept, t]);

  const start = (): void => {
    if (EyeDropperApi) void pickNative(EyeDropperApi);
    else void pickWithLoupe();
  };

  const busy = phase === 'capturing' || phase === 'picking';

  return (
    <>
      <div className="ni-tool-pad">
        <button
          type="button"
          className="ni-button ni-button--primary"
          onClick={start}
          disabled={busy}
        >
          {t(busy ? 'color.eyedropper.picking' : 'color.eyedropper.start')}
        </button>
        {EyeDropperApi ? null : <p className="ni-notice">{t('color.eyedropper.fallbackHint')}</p>}
      </div>
      {phase === 'failed' ? (
        <EmptyState
          kind="error"
          title={t('color.eyedropper.captureFailed')}
          hint={t('color.eyedropper.captureFailedHint')}
        />
      ) : null}
      {current ? (
        <PanelSection title={t('color.eyedropper.section.color')}>
          <ColorReadout color={current} />
        </PanelSection>
      ) : (
        <EmptyState
          title={t('color.eyedropper.empty.title')}
          hint={t('color.eyedropper.empty.hint')}
        />
      )}
      {recent.length > 0 ? (
        <PanelSection title={t('color.eyedropper.section.recent')}>
          <div className="ni-chips">
            {recent.map((hex) => (
              <button
                key={hex}
                type="button"
                className="ni-chip"
                aria-label={hex}
                title={hex}
                onClick={() => setCurrent(parseCssColor(hex))}
              >
                <Swatch color={hex} size={26} />
              </button>
            ))}
          </div>
        </PanelSection>
      ) : null}
    </>
  );
};

const eyedropper: ToolModule = {
  id: 'eyedropper',
  group: 'color',
  icon: Pipette,
  mode: 'panel',
  Panel: EyedropperPanel,
};

export default eyedropper;
