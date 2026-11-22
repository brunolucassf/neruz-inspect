import { Activity, Pause, Play, StepBack, StepForward } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { runProbe } from '../../../lib/bridge';
import {
  getViewportRect,
  type HighlightItem,
  useHighlights,
  useViewportVersion,
} from '../../../lib/highlight';
import { useT } from '../../../lib/i18n';
import type { MotionProbeResult } from '../../../probes/motion';
import { Badge, CopyRow, EmptyState } from '../../../ui';
import type { ToolModule } from '../../types';
import {
  type AnimationInfo,
  createSpeedController,
  type SpeedController,
  snapshotSignature,
  takeSnapshot,
} from './animations';
import { EasingCurve } from './EasingCurve';
import { formatDuration } from './easing';
import './motion-inspector.css';

const SPEEDS = [
  { value: 0.1, label: '0,1×' },
  { value: 0.25, label: '0,25×' },
  { value: 0.5, label: '0,5×' },
  { value: 1, label: '1×' },
] as const;

const REFRESH_MS = 400;

type ProbeState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; result: MotionProbeResult };

const kindKey = (kind: AnimationInfo['kind']): string => `motion.motionInspector.kind.${kind}`;

const MotionInspectorPanel = () => {
  const t = useT();
  const [speed, setSpeed] = useState<number>(1);
  const [paused, setPaused] = useState(false);
  const [items, setItems] = useState<AnimationInfo[]>([]);
  const [probe, setProbe] = useState<ProbeState>({ status: 'loading' });
  const [appliedLibraries, setAppliedLibraries] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<Element | null>(null);
  const controllerRef = useRef<SpeedController | null>(null);
  const signatureRef = useRef('');
  useViewportVersion();

  const runMotionProbe = useCallback(async (action?: string, value?: number) => {
    try {
      const args = action === undefined ? [] : value === undefined ? [action] : [action, value];
      const result = await runProbe<MotionProbeResult>('motion', args);
      setProbe({ status: 'ready', result });
      if (action) setAppliedLibraries(result.applied);
    } catch {
      setProbe({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    const controller = createSpeedController();
    controllerRef.current = controller;
    const refresh = (): void => {
      const snapshot = takeSnapshot();
      const signature = snapshotSignature(snapshot);
      if (signature === signatureRef.current) return;
      signatureRef.current = signature;
      setItems(snapshot);
    };
    refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    void runMotionProbe();
    return () => {
      window.clearInterval(timer);
      controller.dispose();
      controllerRef.current = null;
      void runProbe('motion', ['restore']).catch(() => undefined);
    };
  }, [runMotionProbe]);

  const chooseSpeed = (next: number): void => {
    setSpeed(next);
    controllerRef.current?.setSpeed(next);
    void runMotionProbe('speed', next);
  };

  const togglePause = (): void => {
    const next = !paused;
    setPaused(next);
    controllerRef.current?.setPaused(next);
    void runMotionProbe(next ? 'pause' : 'resume');
  };

  const highlights: HighlightItem[] = highlighted
    ? [{ kind: 'box', rect: getViewportRect(highlighted) }]
    : [];
  useHighlights(highlights);

  const libraries = probe.status === 'ready' ? probe.result.libraries : [];

  return (
    <>
      <div className="ni-motion-stack">
        <p className="ni-motion-label">{t('motion.motionInspector.libraries')}</p>
        {probe.status === 'loading' ? (
          <p className="ni-motion-note">{t('core.state.loading')}</p>
        ) : null}
        {probe.status === 'error' ? (
          <p className="ni-motion-note">{t('motion.motionInspector.probeError')}</p>
        ) : null}
        {probe.status === 'ready' && libraries.length === 0 ? (
          <p className="ni-motion-note">{t('motion.motionInspector.noLibraries')}</p>
        ) : null}
        {libraries.length > 0 ? (
          <div className="ni-motion-libs">
            {libraries.map((library) => (
              <Badge key={library.name} tone="accent">
                {library.version ? `${library.name} ${library.version}` : library.name}
              </Badge>
            ))}
          </div>
        ) : null}
        {libraries
          .filter((library) => library.detail)
          .map((library) => (
            <p key={library.name} className="ni-motion-note">
              {library.name}: {library.detail}
            </p>
          ))}
      </div>

      <div className="ni-motion-stack">
        <fieldset className="ni-motion-fieldset">
          <legend className="ni-motion-label">{t('motion.motionInspector.speed')}</legend>
          <div className="ni-motion-group">
            {SPEEDS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="ni-button"
                aria-pressed={speed === option.value}
                onClick={() => chooseSpeed(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="ni-motion-group">
          <button type="button" className="ni-button" aria-pressed={paused} onClick={togglePause}>
            {paused ? (
              <Play size={13} aria-hidden="true" />
            ) : (
              <Pause size={13} aria-hidden="true" />
            )}{' '}
            {t(paused ? 'motion.motionInspector.resume' : 'motion.motionInspector.pause')}
          </button>
          <button
            type="button"
            className="ni-button"
            disabled={!paused}
            aria-label={t('motion.motionInspector.stepBack')}
            onClick={() => controllerRef.current?.stepFrame(-1)}
          >
            <StepBack size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="ni-button"
            disabled={!paused}
            aria-label={t('motion.motionInspector.stepForward')}
            onClick={() => controllerRef.current?.stepFrame(1)}
          >
            <StepForward size={13} aria-hidden="true" />
          </button>
        </div>
        {appliedLibraries.length > 0 ? (
          <p className="ni-motion-note">
            {t('motion.motionInspector.appliedTo', { list: appliedLibraries.join(', ') })}
          </p>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={t('motion.motionInspector.empty.title')}
          hint={t('motion.motionInspector.empty.hint')}
        />
      ) : (
        <ul className="ni-motion-list">
          {items.map((item) => (
            <li
              key={item.key}
              className="ni-motion-item"
              onPointerEnter={() => setHighlighted(item.target)}
              onPointerLeave={() => setHighlighted(null)}
            >
              <div className="ni-motion-item__head">
                <Badge tone={item.kind === 'css-transition' ? 'success' : 'accent'}>
                  {t(kindKey(item.kind))}
                </Badge>
                <span className="ni-motion-item__target" title={item.targetLabel}>
                  {item.targetLabel}
                </span>
              </div>
              <div className="ni-motion-item__curve">
                <EasingCurve
                  easing={item.easing}
                  label={`${t('motion.motionInspector.easing')} ${item.easing}`}
                />
              </div>
              <dl className="ni-motion-item__facts">
                <div>
                  <dt>{t('motion.motionInspector.name.label')}</dt>
                  <dd>{item.name}</dd>
                </div>
                <div>
                  <dt>{t('motion.motionInspector.duration')}</dt>
                  <dd>
                    {item.isScrollDriven
                      ? t('motion.motionInspector.scroll')
                      : formatDuration(item.duration)}
                  </dd>
                </div>
                <div>
                  <dt>{t('motion.motionInspector.delay')}</dt>
                  <dd>{formatDuration(item.delay)}</dd>
                </div>
                <div>
                  <dt>{t('motion.motionInspector.iterations')}</dt>
                  <dd>{Number.isFinite(item.iterations) ? item.iterations : '∞'}</dd>
                </div>
              </dl>
              <div className="ni-motion-item__easing">
                <CopyRow label={t('motion.motionInspector.easing')} value={item.easing} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="ni-hint">{t('motion.motionInspector.note')}</p>
    </>
  );
};

const motionInspector: ToolModule = {
  id: 'motionInspector',
  group: 'motion',
  icon: Activity,
  mode: 'panel',
  Panel: MotionInspectorPanel,
};

export default motionInspector;
