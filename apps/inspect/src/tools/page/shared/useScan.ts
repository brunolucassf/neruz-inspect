import { useCallback, useEffect, useRef, useState } from 'react';

export type ScanState<TData> =
  | { status: 'loading'; round?: number }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: TData };

const START_DELAY_MS = 30;

export const useScan = <TData>(run: () => TData | Promise<TData>) => {
  const [state, setState] = useState<ScanState<TData>>({ status: 'loading' });
  const [round, setRound] = useState(0);
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', round });
    const timer = setTimeout(() => {
      void Promise.resolve()
        .then(() => runRef.current())
        .then((data) => {
          if (!cancelled) setState({ status: 'ready', data });
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setState({
              status: 'error',
              message: error instanceof Error ? error.message : String(error),
            });
          }
        });
    }, START_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [round]);

  const rescan = useCallback(() => setRound((current) => current + 1), []);
  return { state, rescan };
};
