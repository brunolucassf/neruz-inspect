import { defineBackground } from 'wxt/utils/define-background';
import { setOverlayActive } from '../src/background/activeTabs';
import { handleRuntimeMessage } from '../src/background/routes';
import { clearBadge, toggleOverlay } from '../src/background/toggle';
import { track } from '../src/lib/analytics';

export default defineBackground(() => {
  if (import.meta.env.VITE_NI_E2E === 'true') {
    Object.assign(globalThis, { niToggleOverlay: toggleOverlay });
  }

  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') void track('extension_install');
    if (reason === 'update') void track('extension_update');
  });

  browser.action.onClicked.addListener((tab) => {
    void toggleOverlay(tab);
  });

  browser.runtime.onMessage.addListener((message, sender) => handleRuntimeMessage(message, sender));

  browser.tabs.onRemoved.addListener((tabId) => {
    void setOverlayActive(tabId, false);
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status !== 'loading') return;
    void setOverlayActive(tabId, false);
    void clearBadge(tabId);
  });
});
