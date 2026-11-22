import { createRoot } from 'react-dom/client';
import { initSettings } from '../../src/lib/settings';
import { ReportApp } from '../../src/report/ReportApp';

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  void initSettings().then(() => root.render(<ReportApp />));
}
