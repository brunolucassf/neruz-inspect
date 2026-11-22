import { defineBackground } from 'wxt/utils/define-background';

const OVERLAY_SCRIPT = '/content-scripts/overlay.js';
const RESTRICTED_PREFIXES = ['chrome://', 'edge://', 'about:', 'moz-extension://', 'chrome-extension://', 'view-source:'];

const isRestrictedUrl = (url?: string): boolean =>
  !url || RESTRICTED_PREFIXES.some((prefix) => url.startsWith(prefix));

const toggleOverlay = async (tab: chrome.tabs.Tab): Promise<void> => {
  if (tab.id === undefined || isRestrictedUrl(tab.url)) return;
  await browser.scripting.executeScript({ target: { tabId: tab.id }, files: [OVERLAY_SCRIPT] });
};

export default defineBackground(() => {
  browser.action.onClicked.addListener((tab) => {
    void toggleOverlay(tab);
  });
});
