export type Severity = 'error' | 'warning' | 'info';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export const SEVERITY_ORDER: readonly Severity[] = ['error', 'warning', 'info'];

export const severityTone = (severity: Severity): BadgeTone =>
  severity === 'error' ? 'danger' : severity === 'warning' ? 'warning' : 'neutral';

export const countBySeverity = (
  items: readonly { severity: Severity }[],
): Record<Severity, number> => {
  const counts: Record<Severity, number> = { error: 0, warning: 0, info: 0 };
  for (const item of items) counts[item.severity] += 1;
  return counts;
};
