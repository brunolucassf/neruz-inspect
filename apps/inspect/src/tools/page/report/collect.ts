import { captureTab, fetchViaBackground, runProbe } from '../../../lib/bridge';
import { scanPage as scanDesignTokens } from '../../code/designTokens/scan';
import { buildDesignTokens } from '../../code/designTokens/tokens';
import { analyzeTags, buildTagsProbeArgs, type TagsProbeResult } from '../../tech/tagsPixels/tags';
import { buildProbeArgs, detectTechnologies } from '../../tech/techStack/detect';
import type { TechSnapshot } from '../../tech/techStack/types';
import { analyzeA11y } from '../a11y/analyzeA11y';
import { analyzeAssets } from '../assets/analyzeAssets';
import { analyzeLinks, uniqueCheckableUrls } from '../links/analyzeLinks';
import { analyzeRobotsSitemap } from '../robotsSitemap/analyzeRobotsSitemap';
import { analyzeSeo } from '../seoMeta/analyzeSeo';
import { runPool } from '../shared/concurrency';
import { readStatus, readText } from '../shared/readers';
import { analyzeStructuredData } from '../structuredData/analyzeStructuredData';
import { analyzeVitals } from '../vitals/analyzeVitals';
import {
  assembleReport,
  buildA11yPart,
  buildAssetsPart,
  buildDesignPart,
  buildIndexingPart,
  buildLinksPart,
  buildPerformancePart,
  buildSeoPart,
  buildStructuredPart,
  buildTagsPart,
  buildTechPart,
  type Part,
  type ReportParts,
  statusMapFrom,
} from './buildReport';
import type { ReportData, ReportSectionId, TagsSection, TechSection } from './reportTypes';

export type CollectStep = ReportSectionId | 'thumbnail';

export type CollectOptions = {
  sections: readonly ReportSectionId[];
  preparedFor: string;
  preparedBy: string;
  includeThumbnail: boolean;
  onProgress: (step: CollectStep, done: number, total: number) => void;
};

const LINK_CHECK_CONCURRENCY = 6;
const THUMBNAIL_WIDTH = 640;
const THUMBNAIL_FALLBACK_MAX_CHARS = 400_000;

const failed = <TData>(): Part<TData> => ({ status: 'failed' });

const attempt = async <TData>(
  run: () => Promise<Part<TData>> | Part<TData>,
): Promise<Part<TData>> => {
  try {
    return await run();
  } catch {
    return failed();
  }
};

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header = '', payload = ''] = dataUrl.split(',');
  const mime = /^data:([^;]+)/.exec(header)?.[1] ?? 'image/png';
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mime });
};

export const shrinkCapture = async (dataUrl: string): Promise<string | null> => {
  try {
    const bitmap = await createImageBitmap(dataUrlToBlob(dataUrl));
    const width = Math.min(THUMBNAIL_WIDTH, bitmap.width);
    const height = Math.round((bitmap.height * width) / bitmap.width);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return dataUrl.length <= THUMBNAIL_FALLBACK_MAX_CHARS ? dataUrl : null;
  }
};

const collectThumbnail = async (): Promise<string | null> => {
  try {
    return await shrinkCapture(await captureTab());
  } catch {
    return null;
  }
};

const collectTech = () =>
  attempt<TechSection>(async () => {
    const [probe, head] = await Promise.allSettled([
      runProbe<TechSnapshot | null>('tech', [buildProbeArgs()]),
      fetchViaBackground(location.href, { method: 'HEAD' }),
    ]);
    if (probe.status === 'rejected' || !probe.value) return failed();
    const headersAvailable = head.status === 'fulfilled';
    return buildTechPart(
      detectTechnologies(probe.value, headersAvailable ? head.value.headers : {}),
      headersAvailable,
    );
  });

const collectTags = () =>
  attempt<TagsSection>(async () => {
    const raw = await runProbe<TagsProbeResult | null>('tags', [buildTagsProbeArgs()]);
    return raw ? buildTagsPart(analyzeTags(raw)) : failed();
  });

const collectDesign = () =>
  attempt(async () => {
    const { scan, scannedElements, limited } = await scanDesignTokens(() => undefined).promise;
    return buildDesignPart(buildDesignTokens(scan), scannedElements, limited);
  });

const collectLinks = (onFraction: (fraction: number) => void) =>
  attempt(async () => {
    const { items, truncated } = analyzeLinks(document);
    const targets = uniqueCheckableUrls(items);
    const results: { url: string; status: number | null }[] = [];
    await runPool(
      targets,
      LINK_CHECK_CONCURRENCY,
      async (url) => ({ url, status: (await readStatus(url)).status }),
      {
        onResult: (result) => {
          results.push(result);
          onFraction(results.length / Math.max(targets.length, 1));
        },
      },
    );
    return buildLinksPart(items, truncated, statusMapFrom(results));
  });

export const collectReport = async (options: CollectOptions): Promise<ReportData> => {
  const wanted = new Set(options.sections);
  const steps: CollectStep[] = [
    ...(options.includeThumbnail ? (['thumbnail'] as const) : []),
    ...options.sections.filter((section) => section !== 'summary'),
  ];
  let completed = 0;
  const finish = (step: CollectStep): void => {
    completed += 1;
    options.onProgress(step, completed, steps.length);
  };

  const thumbnail = options.includeThumbnail ? await collectThumbnail() : null;
  if (options.includeThumbnail) finish('thumbnail');

  const parts: ReportParts = {};

  if (wanted.has('seo')) {
    parts.seo = await attempt(() => buildSeoPart(analyzeSeo(document)));
    parts.indexing = await attempt(async () =>
      buildIndexingPart(await analyzeRobotsSitemap(document, readText)),
    );
    finish('seo');
  }
  if (wanted.has('structured')) {
    parts.structured = await attempt(() => buildStructuredPart(analyzeStructuredData(document)));
    finish('structured');
  }
  if (wanted.has('performance')) {
    parts.performance = await attempt(async () =>
      buildPerformancePart(await analyzeVitals(document)),
    );
    finish('performance');
  }
  if (wanted.has('a11y')) {
    parts.a11y = await attempt(() => buildA11yPart(analyzeA11y(document)));
    finish('a11y');
  }
  if (wanted.has('assets')) {
    parts.assets = await attempt(() => buildAssetsPart(analyzeAssets(document)));
    finish('assets');
  }
  if (wanted.has('tech')) {
    parts.tech = await collectTech();
    finish('tech');
  }
  if (wanted.has('tags')) {
    parts.tags = await collectTags();
    finish('tags');
  }
  if (wanted.has('design')) {
    parts.design = await collectDesign();
    finish('design');
  }
  if (wanted.has('links')) {
    parts.links = await collectLinks((fraction) =>
      options.onProgress('links', completed + fraction, steps.length),
    );
    finish('links');
  }

  return assembleReport(
    {
      url: location.href,
      title: document.title,
      generatedAt: Date.now(),
      preparedFor: options.preparedFor.trim(),
      preparedBy: options.preparedBy.trim(),
      thumbnail,
      included: [...options.sections],
    },
    parts,
  );
};
