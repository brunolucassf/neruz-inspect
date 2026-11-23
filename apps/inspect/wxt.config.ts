import { defineConfig } from 'wxt';
import { FONT_DIRECTORY, INSPECT_FONTS } from './src/lib/fontFiles';

declare const process: { env: Record<string, string | undefined> };

const GECKO_ID = 'neruz-inspect@fontedev.com';
const PAGE_MATCHES = ['http://*/*', 'https://*/*'];
const FONT_SOURCE_DIR = '../../packages/ui/src/fonts';
const FONT_FILES = [...new Set(INSPECT_FONTS.map((font) => font.file))];

export default defineConfig({
  manifestVersion: 3,
  outDir: process.env.NI_OUT_DIR ?? '.output',
  manifest: ({ browser }) => {
    const isFirefox = browser === 'firefox';
    return {
      name: '__MSG_extName__',
      description: '__MSG_extDescription__',
      default_locale: 'en',
      version: '0.1.0',
      action: { default_title: '__MSG_extName__' },
      commands: {
        _execute_action: {
          suggested_key: { default: 'Alt+Shift+I' },
          description: '__MSG_commandToggle__',
        },
      },
      permissions: ['storage', 'scripting', 'activeTab'],
      optional_permissions: ['clipboardWrite'],
      optional_host_permissions: PAGE_MATCHES,
      web_accessible_resources: [
        {
          resources: FONT_FILES.map((file) => `${FONT_DIRECTORY}/${file}`),
          matches: PAGE_MATCHES,
        },
      ],
      content_security_policy: {
        extension_pages:
          "script-src 'self'; object-src 'self'; base-uri 'none'; form-action 'none'",
      },
      ...(isFirefox
        ? {
            browser_specific_settings: {
              gecko: {
                id: GECKO_ID,
                strict_min_version: '128.0',
                data_collection_permissions: { required: ['none'] },
              },
            },
          }
        : {}),
    };
  },
  hooks: {
    'build:publicAssets': (wxt, files) => {
      for (const file of FONT_FILES) {
        files.push({
          absoluteSrc: `${wxt.config.root}/${FONT_SOURCE_DIR}/${file}`,
          relativeDest: `${FONT_DIRECTORY}/${file}`,
        });
      }
    },
  },
});
