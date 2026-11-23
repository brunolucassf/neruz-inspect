import type { Finding } from '../tools/page/report/reportTypes';

const SEO_RECOMMENDATION_ALIAS: Readonly<Record<string, string>> = {
  titleMissing: 'title',
  titleShort: 'title',
  titleLong: 'title',
  descriptionMissing: 'description',
  descriptionShort: 'description',
  descriptionLong: 'description',
  ogTitleMissing: 'socialTags',
  twitterCardMissing: 'socialTags',
  h1Missing: 'h1',
  h1Multiple: 'h1',
  headingSkip: 'headings',
  headingEmpty: 'headings',
};

export const findingTitleKey = (finding: Finding): string => {
  if (finding.area === 'seo') return `page.seoMeta.alert.${finding.id}`;
  if (finding.area === 'a11y') return `page.a11y.rule.${finding.id}`;
  return `page.report.find.${finding.area}.${finding.id}`;
};

export const recommendationKey = (finding: Finding): string => {
  const id =
    finding.area === 'seo' ? (SEO_RECOMMENDATION_ALIAS[finding.id] ?? finding.id) : finding.id;
  return `page.report.rec.${finding.area}.${id}`;
};

export const uniqueRecommendations = (findings: readonly Finding[]): Finding[] => {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = recommendationKey(finding);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
