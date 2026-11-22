export const RECENT_COLOR_LIMIT = 12;

export const pushRecentColor = (
  list: readonly string[],
  hex: string,
  limit: number = RECENT_COLOR_LIMIT,
): string[] => [hex, ...list.filter((item) => item !== hex)].slice(0, limit);

let sessionColors: readonly string[] = [];

export const getSessionColors = (): readonly string[] => sessionColors;

export const rememberSessionColor = (hex: string): readonly string[] => {
  sessionColors = pushRecentColor(sessionColors, hex);
  return sessionColors;
};
