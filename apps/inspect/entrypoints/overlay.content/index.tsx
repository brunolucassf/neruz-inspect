import { createRoot, type Root } from 'react-dom/client';
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { OverlayApp } from '../../src/overlay/OverlayApp';
import './overlay.css';

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
      host[MOUNT_FLAG] = undefined;
      return;
    }

    let root: Root | undefined;
    const ui = await createShadowRootUi(ctx, {
      name: 'neruz-inspect',
      position: 'overlay',
      zIndex: 2147483647,
      onMount(container) {
        root = createRoot(container);
        root.render(<OverlayApp onClose={() => host[MOUNT_FLAG]?.remove()} />);
        return root;
      },
      onRemove() {
        root?.unmount();
        host[MOUNT_FLAG] = undefined;
      },
    });

    ui.mount();
    host[MOUNT_FLAG] = { remove: () => ui.remove() };
  },
});
