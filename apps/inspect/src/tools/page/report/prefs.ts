import * as v from 'valibot';
import { browser } from 'wxt/browser';

export const DEFAULT_PREPARED_BY = 'Fonte Dev · Bruno Lucas';

const REPORT_PREFS_KEY = 'ni.reportPrefs';

const PrefsSchema = v.object({
  preparedBy: v.fallback(v.pipe(v.string(), v.maxLength(120)), DEFAULT_PREPARED_BY),
});

export type ReportPrefs = v.InferOutput<typeof PrefsSchema>;

export const parsePrefs = (raw: unknown): ReportPrefs =>
  v.parse(PrefsSchema, typeof raw === 'object' && raw !== null ? raw : {});

export const loadPrefs = async (): Promise<ReportPrefs> => {
  try {
    const stored = await browser.storage.local.get(REPORT_PREFS_KEY);
    return parsePrefs(stored[REPORT_PREFS_KEY]);
  } catch {
    return parsePrefs({});
  }
};

export const savePrefs = async (prefs: ReportPrefs): Promise<void> => {
  try {
    await browser.storage.local.set({ [REPORT_PREFS_KEY]: parsePrefs(prefs) });
  } catch {}
};
