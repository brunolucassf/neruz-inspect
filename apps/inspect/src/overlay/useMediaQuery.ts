import { useSyncExternalStore } from 'react';

export const NARROW_QUERY = '(max-width: 767px)';
export const COMPACT_QUERY = '(max-width: 1023px)';
export const COMPACT_WITH_PANEL_QUERY = '(max-width: 1379px)';

export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', notify);
      return () => list.removeEventListener('change', notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
