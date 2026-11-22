import { browser } from 'wxt/browser';
import { isRestrictedUrl } from './restricted';

const OVERLAY_SCRIPT = '/content-scripts/overlay.js';
const BADGE_ACTIVE_COLOR = '#2f9e5b';
const BADGE_WARNING_COLOR = '#d97706';
const WARNING_VISIBLE_MS = 4000;

const defaultTitle = (): string => browser.i18n.getMessage('extName');

export const clearBadge = async (tabId: number): Promise<void> => {
  await browser.action.setBadgeText({ tabId, text: '' }).catch(() => undefined);
  await browser.action.setTitle({ tabId, title: defaultTitle() }).catch(() => undefined);
};

export const showActiveBadge = async (tabId: number): Promise<void> => {
  await browser.action.setBadgeBackgroundColor({ tabId, color: BADGE_ACTIVE_COLOR });
  await browser.action.setBadgeText({ tabId, text: 'ON' });
};

export const showRestrictedWarning = async (tabId: number): Promise<void> => {
  await browser.action.setBadgeBackgroundColor({ tabId, color: BADGE_WARNING_COLOR });
  await browser.action.setBadgeText({ tabId, text: '!' });
  await browser.action.setTitle({ tabId, title: browser.i18n.getMessage('restrictedPage') });
  setTimeout(() => void clearBadge(tabId), WARNING_VISIBLE_MS);
};

export const toggleOverlay = async (tab: { id?: number; url?: string }): Promise<void> => {
  if (tab.id === undefined) return;
  if (isRestrictedUrl(tab.url)) {
    await showRestrictedWarning(tab.id);
    return;
  }
  try {
    await browser.scripting.executeScript({ target: { tabId: tab.id }, files: [OVERLAY_SCRIPT] });
  } catch {
    await showRestrictedWarning(tab.id);
  }
};
