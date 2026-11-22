import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScanProgress } from './scan';

export type ScanOutcome<TResult> = { result: TResult; truncated: boolean };

export type ScanState<TResult> =
  | { status: 'scanning'; progress: ScanProgress }
  | { status: 'done'; result: TResult; truncated: boolean }
  | { status: 'error' };

export type ScanRunner<TResult> = (
  signal: AbortSignal,
  onProgress: (progress: ScanProgress) => void,
) => Promise<ScanOutcome<TResult>>;

const INITIAL_PROGRESS: ScanProgress = { scanned: 0, total: 0 };

export const useScan = <TResult>(
  runner: ScanRunner<TResult>,
): { state: ScanState<TResult>; rescan: () => void } => {
  const [state, setState] = useState<ScanState<TResult>>({
    status: 'scanning',
    progress: INITIAL_PROGRESS,
  });
  const [round, setRound] = useState(0);
  const runnerRef = useRef(runner);
  runnerRef.current = runner;

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new round restarts the scan on demand
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'scanning', progress: INITIAL_PROGRESS });
    runnerRef
      .current(controller.signal, (progress) => {
        if (!controller.signal.aborted) setState({ status: 'scanning', progress });
      })
      .then((outcome) => {
        if (!controller.signal.aborted) setState({ status: 'done', ...outcome });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [round]);

  const rescan = useCallback(() => setRound((current) => current + 1), []);
  return { state, rescan };
};
