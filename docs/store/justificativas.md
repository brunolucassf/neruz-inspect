# Chrome Web Store · Privacy practices tab · Neruz Inspect

Paste each block into the matching field of the "Privacy practices" tab. Based on the real manifest (apps/inspect/wxt.config.ts): `permissions: storage, scripting, activeTab` · `optional_permissions: clipboardWrite` · `optional_host_permissions: http://*/*, https://*/*`. No `<all_urls>`, `tabs`, `cookies`, `webRequest`, `debugger` or `history`.

## Single purpose description
```
Neruz Inspect inspects the design and technology of the web page the user opens it on: colors, fonts, layout and spacing, CSS and components, animations, detected technologies and tags, SEO, performance and accessibility, with an optional PDF report of that page. It runs only on the tab where the user clicks the icon or presses the shortcut, and the page analysis happens locally in the browser.
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
Stores, locally in the browser: user preferences (language, color format, unit), the toolbar position, the history of values the user copied, the setting for anonymous usage statistics, a random identifier generated at installation for those statistics, and temporary data for the PDF report page (storage.session). Nothing is synced to a server. Only the random identifier, the extension version and usage events are sent, as described in the privacy policy, and the user can turn that off in the options and clear the stored data at any time.
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
All JavaScript and Wasm is bundled in the package. There is no eval, no remotely hosted script and no dynamic import from external URLs. The extension pages use the CSP "script-src 'self'". The only external resource is a Google Fonts stylesheet that the Font tester adds to the inspected page when the user picks a font to preview; it is CSS and font files, not code, and it is never loaded into the extension's own context. The usage statistics are a data-only HTTPS POST to Google Analytics; no script is downloaded from it.
```

## Data usage
Check only **User activity**. Leave the other eight unchecked (personally identifiable information, health information, financial and payment information, authentication information, personal communications, location, web history, website content).

Why User activity: the extension now sends events about how the user interacts with the extension itself (which tool or action was used, in categories, and when the toolbar/popup/options open), tied to a random installation identifier. That is data about user actions, so the conservative choice is to disclose it. Why not the others: no page URL or domain is sent (so not web history), no page content, captures or copied text (so not website content), and no name, email or other identifier a person would recognize (so not PII). This is my reading of the form's category names; the dashboard's own wording for "User activity" was not retrievable, so reread the tooltip when filling in and, if in doubt, keep it checked. [requires validation by Bruno in the dashboard]

Check the three certifications (Limited Use):
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
Neruz Inspect runs only on the tab the user activates (activeTab + scripting). It has no server of its own and does not send page URLs, page content, captures or copied text. It sends anonymous usage statistics to Google Analytics 4 through the Measurement Protocol (one POST from the extension, no remote script, no cookies, no host permission): a random client_id generated at install, a session id, the extension name and version, and events such as install/update, opening the toolbar/popup/panel/options and which tool or action was used. The manifest declares data_collection_permissions required: none and optional: technicalAndInteraction; the extension sends nothing until the user accepts that optional permission, and can turn it on or off in its options. Optional host permissions are requested on a user click for the link checker and asset downloads (GET/HEAD, no credentials). Built with pnpm + WXT, not obfuscated, no eval. Source code (MIT): https://github.com/brunolucassf/neruz-inspect. Build steps: BUILD-FIREFOX.md at the root of the attached source archive (pnpm install --frozen-lockfile, pnpm build:ext:firefox; output is byte-identical).
```
