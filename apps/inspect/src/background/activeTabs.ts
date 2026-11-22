import { createSerialQueue } from '@neruz/core';
import { browser } from 'wxt/browser';
import { STORAGE_KEYS } from '../lib/storage-keys';

const queue = createSerialQueue();

const readTabIds = async (): Promise<number[]> => {
  const stored = await browser.storage.session.get(STORAGE_KEYS.activeTabs);
  const value: unknown = stored[STORAGE_KEYS.activeTabs];
  return Array.isArray(value) ? value.filter((id): id is number => typeof id === 'number') : [];
};

const writeTabIds = (ids: readonly number[]): Promise<void> =>
  browser.storage.session.set({ [STORAGE_KEYS.activeTabs]: [...ids] });

export const isOverlayActive = (tabId: number): Promise<boolean> =>
  queue.run(async () => (await readTabIds()).includes(tabId));

export const setOverlayActive = (tabId: number, isActive: boolean): Promise<void> =>
  queue.run(async () => {
    const others = (await readTabIds()).filter((id) => id !== tabId);
    await writeTabIds(isActive ? [...others, tabId] : others);
  });
