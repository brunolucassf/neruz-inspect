import { defineConfig } from 'astro/config';
import { contentSecurityPolicy } from './scripts/contentSecurityPolicy.mjs';

export default defineConfig({
  site: 'https://inspect.neruz.tech',
  output: 'static',
  integrations: [contentSecurityPolicy()],
  i18n: {
    locales: ['pt-BR', 'en', 'es'],
    defaultLocale: 'pt-BR',
    routing: { prefixDefaultLocale: false },
  },
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
