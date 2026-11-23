# Chrome Web Store · Privacy practices tab · Neruz Inspect

Paste each block into the matching field of the "Privacy practices" tab. Based on the real manifest (apps/inspect/wxt.config.ts): `permissions: storage, scripting, activeTab` · `optional_permissions: clipboardWrite` · `optional_host_permissions: http://*/*, https://*/*`. No `<all_urls>`, `tabs`, `cookies`, `webRequest`, `debugger` or `history`.

## Single purpose description
```
Neruz Inspect inspects the design and technology of the web page the user opens it on: colors, fonts, layout and spacing, CSS and components, animations, detected technologies and tags, SEO, performance and accessibility, with an optional PDF report of that page. It runs only on the tab where the user clicks the icon or presses the shortcut, and everything happens locally in the browser.
```

## Permission justification

### activeTab
```
When the user clicks the toolbar icon or presses Alt+Shift+I, activeTab grants temporary access to that tab only, so the extension can open its inspection toolbar there. The extension has no access to other tabs and does not read pages in the background.
```

### scripting
```
Used with activeTab to inject the extension's own bundled scripts into the tab the user activated: the toolbar UI and read-only probes that detect technologies, analytics tags, animations and performance metrics in the page context. Scripts run only after the user's action. All code ships in the package; nothing is downloaded or evaluated at runtime.
```

### storage
```
Stores, locally in the browser: user preferences (language, color format, unit), the toolbar position, the history of values the user copied, and temporary data for the PDF report page (storage.session). Nothing is synced to a server or sent anywhere, and the user can clear it at any time.
```

### clipboardWrite (optional permission)
```
Requested only when the user clicks a copy button, to place the value they chose (a color, CSS, HTML, a token) on the clipboard. The extension never reads the clipboard.
```

### Host permissions: http://*/*, https://*/* (optional host permissions)
```
Optional and requested only after a user click, never at install. Used by page-analysis features that need to read URLs the page itself cannot reach because of CORS: the link checker (GET/HEAD requests without cookies to the links found on the current page, to report broken ones), the robots.txt and sitemap reader, file-size checks, and the asset/icon downloader for images and SVGs hosted on other domains. Results are shown only in the extension panel and are not stored or transmitted. The user can revoke this access at any time in the browser's extension settings.
```

## Remote code
Select: **No, I am not using remote code.**
```
All JavaScript and Wasm is bundled in the package. There is no eval, no remotely hosted script and no dynamic import from external URLs. The extension pages use the CSP "script-src 'self'". The only external resource is a Google Fonts stylesheet that the Font tester adds to the inspected page when the user picks a font to preview; it is CSS and font files, not code, and it is never loaded into the extension's own context.
```

## Data usage
Check **none** of the data categories (personally identifiable information, health, financial and payment, authentication, personal communications, location, web history, user activity, website content). The extension reads page content only to display it locally; nothing is collected or transmitted to the developer or third parties.

Check the three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Privacy policy URL
```
https://inspect.neruz.tech/en/privacy/
```
(pt: https://inspect.neruz.tech/privacy/ · es: https://inspect.neruz.tech/es/privacy/)

## Firefox AMO · notes to reviewer
```
Neruz Inspect runs only on the tab the user activates (activeTab + scripting). No data collection (data_collection_permissions: none), no telemetry, no server. Optional host permissions are requested on a user click for the link checker and asset downloads (GET/HEAD, no credentials). Built with pnpm + WXT, not obfuscated, no eval. Source code (MIT): https://github.com/brunolucassf/neruz-inspect. Build steps: BUILD-FIREFOX.md at the root of the attached source archive (pnpm install --frozen-lockfile, pnpm build:ext:firefox; output is byte-identical).
```
