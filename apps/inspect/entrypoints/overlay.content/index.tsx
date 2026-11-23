import { createRoot, type Root } from 'react-dom/client';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { notifyOverlayState } from '../../src/lib/bridge';
import { clearHighlights } from '../../src/lib/highlight';
import { OVERLAY_MOUNT_FLAG, type OverlayHandle } from '../../src/lib/overlayMountFlag';
import { OVERLAY_HOST_TAG } from '../../src/lib/picker';
import { initSettings } from '../../src/lib/settings';
import { OverlayApp } from '../../src/overlay/OverlayApp';

const SHADOW_MODE = import.meta.env.VITE_NI_E2E === 'true' ? 'open' : 'closed';

type FlaggedWindow = Window & { [OVERLAY_MOUNT_FLAG]?: OverlayHandle };

export default defineContentScript({
  registration: 'runtime',
  matches: ['http://*/*', 'https://*/*'], // preenche web_accessible_resources do CSS do overlay
  cssInjectionMode: 'ui',
  async main(ctx) {
    const host = window as FlaggedWindow;
    const existing = host[OVERLAY_MOUNT_FLAG];
    if (existing) {
      existing.remove();
      return;
    }

    const stopSettingsSync = await initSettings();

    let root: Root | undefined;
    const ui = await createShadowRootUi(ctx, {
      name: OVERLAY_HOST_TAG,
      mode: SHADOW_MODE,
      position: 'overlay',
      zIndex: 2147483647,
      onMount(container) {
        root = createRoot(container);
        root.render(<OverlayApp onClose={() => host[OVERLAY_MOUNT_FLAG]?.remove()} />);
        return root;
      },
      onRemove() {
        root?.unmount();
        clearHighlights();
        stopSettingsSync();
        host[OVERLAY_MOUNT_FLAG] = undefined;
        void notifyOverlayState(false);
      },
    });

    ui.mount();
    host[OVERLAY_MOUNT_FLAG] = { remove: () => ui.remove() };
    void notifyOverlayState(true);
  },
});
