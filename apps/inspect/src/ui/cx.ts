export const cx = (...names: readonly (string | false | null | undefined)[]): string =>
  names.filter(Boolean).join(' ');
