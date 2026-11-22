import { createRoot } from 'react-dom/client';
import { initSettings } from '../../src/lib/settings';
import { OptionsApp } from '../../src/options/OptionsApp';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  void initSettings().then(() => root.render(<OptionsApp />));
}
