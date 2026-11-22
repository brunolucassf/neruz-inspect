import { createRoot, type Root } from 'react-dom/client';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { notifyOverlayState } from '../../src/lib/bridge';
import { clearHighlights } from '../../src/lib/highlight';
import { OVERLAY_HOST_TAG } from '../../src/lib/picker';
import { initSettings } from '../../src/lib/settings';
import { OverlayApp } from '../../src/overlay/OverlayApp';

const MOUNT_FLAG = '__neruzInspectOverlay__';

type OverlayHandle = { remove: () => void };
type FlaggedWindow = Window & { [MOUNT_FLAG]?: OverlayHandle };

export default defineContentScript({
  registration: 'runtime',
  cssInjectionMode: 'ui',
  async main(ctx) {
    const host = window as FlaggedWindow;
    const existing = host[MOUNT_FLAG];
    if (existing) {
      existing.remove();
      return;
    }

    const stopSettingsSync = await initSettings();

    let root: Root | undefined;
    const ui = await createShadowRootUi(ctx, {
      name: OVERLAY_HOST_TAG,
      position: 'overlay',
      zIndex: 2147483647,
      onMount(container) {
        root = createRoot(container);
        root.render(<OverlayApp onClose={() => host[MOUNT_FLAG]?.remove()} />);
        return root;
      },
      onRemove() {
        root?.unmount();
        clearHighlights();
        stopSettingsSync();
        host[MOUNT_FLAG] = undefined;
        void notifyOverlayState(false);
      },
    });

    ui.mount();
    host[MOUNT_FLAG] = { remove: () => ui.remove() };
    ctx.onInvalidated(() => ui.remove());
    void notifyOverlayState(true);
  },
});
