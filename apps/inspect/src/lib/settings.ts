import { LOCALE_PREFERENCES } from '@neruz/i18n';
import * as v from 'valibot';
import { browser } from 'wxt/browser';
import { create } from 'zustand';
import { COLOR_FORMATS } from './color';
import { STORAGE_KEYS } from './storage-keys';

export const LENGTH_UNITS = ['px', 'rem'] as const;
export const DOCK_SIDES = ['left', 'right'] as const;

export type DockSide = (typeof DOCK_SIDES)[number];

const PositionSchema = v.object({ x: v.number(), y: v.number() });

const SettingsSchema = v.object({
  locale: v.fallback(v.picklist(LOCALE_PREFERENCES), 'auto'),
  colorFormat: v.fallback(v.picklist(COLOR_FORMATS), 'hex'),
  unit: v.fallback(v.picklist(LENGTH_UNITS), 'px'),
  dock: v.fallback(v.picklist(DOCK_SIDES), 'right'),
  toolbarPosition: v.fallback(v.nullable(PositionSchema), null),
  analytics: v.fallback(v.boolean(), true),
});

export type Settings = v.InferOutput<typeof SettingsSchema>;

export const parseSettings = (raw: unknown): Settings =>
  v.parse(SettingsSchema, typeof raw === 'object' && raw !== null ? raw : {});

export const DEFAULT_SETTINGS: Settings = parseSettings({});

export const useSettingsStore = create<Settings>(() => DEFAULT_SETTINGS);

export const initSettings = async (): Promise<() => void> => {
  const stored = await browser.storage.local.get(STORAGE_KEYS.settings);
  useSettingsStore.setState(parseSettings(stored[STORAGE_KEYS.settings]), true);
  const handleChange = (changes: Record<string, { newValue?: unknown }>, area: string): void => {
    const change = changes[STORAGE_KEYS.settings];
    if (area !== 'local' || !change) return;
    useSettingsStore.setState(parseSettings(change.newValue), true);
  };
  browser.storage.onChanged.addListener(handleChange);
  return () => browser.storage.onChanged.removeListener(handleChange);
};

export const updateSettings = async (patch: Partial<Settings>): Promise<void> => {
  const next = parseSettings({ ...useSettingsStore.getState(), ...patch });
  useSettingsStore.setState(next, true);
  await browser.storage.local.set({ [STORAGE_KEYS.settings]: next });
};
