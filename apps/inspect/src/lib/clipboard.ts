import * as v from 'valibot';
import { browser } from 'wxt/browser';
import { t } from './i18n';
import { STORAGE_KEYS } from './storage-keys';
import { toast } from './toast';

export const CLIPBOARD_HISTORY_LIMIT = 50;

const HistorySchema = v.fallback(
  v.array(v.object({ text: v.string(), label: v.string(), at: v.number() })),
  [],
);

export type ClipboardEntry = v.InferOutput<typeof HistorySchema>[number];

export const getClipboardHistory = async (): Promise<ClipboardEntry[]> => {
  const stored = await browser.storage.local.get(STORAGE_KEYS.clipboardHistory);
  return v.parse(HistorySchema, stored[STORAGE_KEYS.clipboardHistory]);
};

export const clearClipboardHistory = async (): Promise<void> => {
  await browser.storage.local.remove(STORAGE_KEYS.clipboardHistory);
};

const pushHistory = async (entry: ClipboardEntry): Promise<void> => {
  const current = await getClipboardHistory();
  const next = [entry, ...current.filter((item) => item.text !== entry.text)].slice(
    0,
    CLIPBOARD_HISTORY_LIMIT,
  );
  await browser.storage.local.set({ [STORAGE_KEYS.clipboardHistory]: next });
};

const writeWithSelection = (text: string): boolean => {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
  document.documentElement.append(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  return copied;
};

const writeText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return writeWithSelection(text);
  }
};

export const copyText = async (
  text: string,
  label: string,
  { remember = true }: { remember?: boolean } = {},
): Promise<boolean> => {
  const copied = await writeText(text);
  if (!copied) {
    toast(t('core.copy.failed'), 'error');
    return false;
  }
  toast(t('core.copy.done', { label }), 'success');
  if (remember) void pushHistory({ text, label, at: Date.now() }).catch(() => undefined);
  return true;
};
