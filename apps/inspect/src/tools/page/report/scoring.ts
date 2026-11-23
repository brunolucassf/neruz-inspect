import {
  type AreaId,
  type AreaScore,
  type Finding,
  type Light,
  type OverallScore,
  SCORED_AREAS,
} from './reportTypes';

const SEVERITY_PENALTY = { error: 22, warning: 8, info: 2 } as const;

export const GOOD_FROM = 80;
export const ATTENTION_FROM = 50;

const clamp = (value: number): number => Math.max(0, Math.min(100, value));

export const penaltyOf = (finding: Finding): number =>
  SEVERITY_PENALTY[finding.severity] * (1 + Math.min(Math.log10(Math.max(finding.count, 1)), 1));

export const scoreFindings = (findings: readonly Finding[]): number =>
  clamp(Math.round(100 - findings.reduce((sum, finding) => sum + penaltyOf(finding), 0)));

export const lightFor = (score: number, hasError: boolean): Light => {
  if (score < ATTENTION_FROM) return 'critical';
  if (score < GOOD_FROM || hasError) return 'attention';
  return 'good';
};

export const scoreArea = (
  area: AreaId,
  measured: boolean,
  findings: readonly Finding[],
): AreaScore => {
  const own = findings.filter((finding) => finding.area === area);
  if (!measured) {
    return { area, measured: false, score: null, light: 'unmeasured', findingCount: 0 };
  }
  const score = scoreFindings(own);
  return {
    area,
    measured: true,
    score,
    light: lightFor(
      score,
      own.some((finding) => finding.severity === 'error'),
    ),
    findingCount: own.length,
  };
};

export const scoreOverall = (areas: readonly AreaScore[]): OverallScore => {
  const measured = areas.filter((area) => area.measured && area.score !== null);
  const totalAreas = SCORED_AREAS.length;
  if (measured.length === 0) {
    return { score: null, light: 'unmeasured', measuredAreas: 0, totalAreas };
  }
  const score = Math.round(
    measured.reduce((sum, area) => sum + (area.score ?? 0), 0) / measured.length,
  );
  const everyAreaGood = measured.every((area) => area.light === 'good');
  const baseLight = lightFor(score, false);
  const light = baseLight === 'good' && !everyAreaGood ? 'attention' : baseLight;
  return { score, light, measuredAreas: measured.length, totalAreas };
};

const SEVERITY_RANK = { error: 0, warning: 1, info: 2 } as const;

export const sortFindings = (findings: readonly Finding[]): Finding[] =>
  [...findings].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || penaltyOf(b) - penaltyOf(a),
  );
