import { createRoot } from 'react-dom/client';
import { registerInspectFonts } from '../../src/lib/fonts';
import { initSettings } from '../../src/lib/settings';
import { OptionsApp } from '../../src/options/OptionsApp';

registerInspectFonts();

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  void initSettings().then(() => root.render(<OptionsApp />));
}
