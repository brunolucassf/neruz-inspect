# Store listing · Neruz Inspect · en (default locale)

Sources: apps/inspect/src/i18n (real tool names), apps/inspect/wxt.config.ts, .equipe/dossie-neruz-inspect.md.
Rules: no tool count, user count, ratings or testimonials; no competitor names.

## Name
Neruz Inspect

## Short summary (Chrome: read from the manifest, `extDescription` in `_locales/en`)
Proposal (111/132 characters):

```
See how any website is built: colors, fonts, spacing, tech stack and SEO. Free, open source, no data collected.
```

Current text in the package (84/132): "Pick colors, identify fonts, measure spacing and detect the tech behind any website." Also works. To use the proposal, `extDescription` must change in `_locales` before the build (the Chrome Web Store reads the summary from the manifest).

## AMO summary (≤250, approx. 200)
```
See how any website is built from a toolbar on top of the page: eyedropper, fonts, ruler, design tokens, slow-motion animations, tech stack, pixels, SEO and a PDF report. Free, open source (MIT), no data collected.
```

## Long description (plain text; Chrome ≤16000, approx. 2,400)
```
See how any website is built and take what you need. Neruz Inspect opens a dark toolbar on top of the page with tools for color, typography, layout, code, motion, tech and page analysis. No DevTools, no juggling extensions.

COLOR
• Eyedropper: grab any pixel's color and copy it as HEX, RGB, HSL or OKLCH
• Page palette: every color on the site, grouped and counted
• Contrast checker: WCAG and APCA scores, plus a color that passes
• Color converter, gradients and shadows, color blindness simulator

TYPOGRAPHY
• Font finder: hover any text to see its font, weight, size, line height and color
• Page fonts: where each font appears and where it loads from
• Font tester: swap the site's font for another and see the result right away
• Type scale: the site's text sizes in order, with the ratio between them

LAYOUT
• Ruler: the distance in pixels between any two elements
• Box model: content, padding and margin drawn on the page
• Grid and Flexbox, z-index map, breakpoints read from the CSS, and outlines
• Overflow finder: find the element that makes the page scroll sideways

CODE
• Copy styles: an element's CSS ready to paste, with a Tailwind version too
• Copy component: a whole block as HTML and CSS, Tailwind or JSX
• Extract design system: colors, fonts, spacing and radii as CSS, Tailwind or JSON
• Live edit: change text and styles, then export the edited CSS
The Tailwind output is an approximation; review it before shipping.

MOTION
• Motion inspector: animations in slow motion, with duration, easing and the library used, when it shows up on the page
• Page toggles: turn off CSS, animations or images to see what's left

TECH
• Tech stack: framework, CMS, site builder and libraries, with the version when it's exposed
• Pixels and tags: Meta Pixel, GA4, Google Tag Manager and others, with the events they fire
• Cookies and storage, JSON viewer

PAGE
• SEO and meta tags, with a preview of the shared link
• Structured data, robots.txt and sitemap
• Link checker: internal and external links, and which ones are broken
• Assets, icons and favicons to download
• Core Web Vitals: LCP, INP and CLS measured in this tab, on your machine
• Accessibility: missing alt text, heading order, labels and low contrast
• PDF report: SEO, tech, performance and accessibility in one file to share

UTILITIES
• px, rem, em and % converter, lorem ipsum, form filler with fake data, a QR code for the page and your copy history

WHO IT'S FOR
Front-end developers, designers, agencies, paid traffic managers and anyone who studies reference sites.

YOUR DATA STAYS IN YOUR BROWSER
• No server, no account, no data collection
• Runs only on the tab where you click the icon
• Changes to the page show only on your screen; reloading undoes them
• Access to other sites is optional, requested only when you check links or download files, and can be removed anytime
• Open source (MIT): read every line on GitHub

HOW TO USE
1. Open a site and click the Neruz Inspect icon (or press Alt+Shift+I)
2. Pick a tool from the toolbar or press / to search
3. Esc exits the tool; Esc again closes everything

Good to know: browsers don't let extensions run on internal pages, the extension store or the PDF viewer. The Font tester loads the font you choose from Google Fonts into the open page.

Code: https://github.com/brunolucassf/neruz-inspect
Privacy: https://inspect.neruz.tech/en/privacy/
Free, with no paid version. Part of the Neruz Extensions family. Desenvolvido por Fonte Dev · Bruno Lucas (https://fontedev.com).
```

## Suggested category
- Chrome Web Store: Productivity > Developer Tools
- Firefox AMO: Web Development

## AMO tags (pick only those in AMO's fixed tag list)
web development, design, colors, fonts, accessibility, seo, productivity

## Screenshots (6 scenes, 1280x800)
Chrome accepts at most 5 screenshots: use 1, 2, 3, 4 and 6. AMO takes all 6. On AMO the caption goes in the screenshot field; on Chrome the title and support line go into the artwork.

| # | Scene | Title | Support line |
|---|---|---|---|
| 1 | Toolbar + color/palette | Grab any color and see the site's palette | Eyedropper in HEX, RGB, HSL or OKLCH, with WCAG and APCA contrast. |
| 2 | Typography | Hover to find the font | Font, weight, size, line height and where it loads from. |
| 3 | Measure/inspect | Measure distances, see margin and padding | Ruler and box model drawn right on the page. |
| 4 | Tech + SEO | See what the site is built with | Framework, CMS, pixels and tags, plus SEO and link preview. |
| 5 | Performance/accessibility | Check performance and accessibility | LCP, INP and CLS measured in your tab, plus common accessibility issues. |
| 6 | PDF report | Export a PDF report of the site | SEO, tech, performance and accessibility in one file to share. |

## Promo art (≤6 words)
- Main: See how any website is built (6)
- Alternative: Colors, fonts, spacing and tech (5)
