import type { DetailRule, Signal, TechCategory, TechSignature } from './types';

const global = (path: string, weight: number, version?: string): Signal => ({
  kind: 'global',
  path,
  weight,
  ...(version ? { version } : {}),
});

const selector = (css: string, weight: number, versionAttr?: string): Signal => ({
  kind: 'selector',
  css,
  weight,
  ...(versionAttr ? { versionAttr } : {}),
});

const domKey = (prefix: string, weight: number): Signal => ({ kind: 'domKey', prefix, weight });

const cssVar = (name: string, weight: number): Signal => ({ kind: 'cssVar', name, weight });

const meta = (name: string, weight: number, pattern?: RegExp): Signal => ({
  kind: 'meta',
  name,
  weight,
  ...(pattern ? { pattern: pattern.source } : {}),
});

const script = (pattern: RegExp, weight: number): Signal => ({
  kind: 'script',
  pattern: pattern.source,
  weight,
});

const asset = (pattern: RegExp, weight: number): Signal => ({
  kind: 'asset',
  pattern: pattern.source,
  weight,
});

const classes = (pattern: RegExp, min: number, weight: number): Signal => ({
  kind: 'class',
  pattern: pattern.source,
  weight,
  min,
});

const header = (name: string, weight: number, pattern?: RegExp): Signal => ({
  kind: 'header',
  name,
  weight,
  ...(pattern ? { pattern: pattern.source } : {}),
});

const worker = (weight: number): Signal => ({ kind: 'serviceWorker', weight });

const assetDetail = (label: 'theme' | 'plugin', pattern: RegExp, max: number): DetailRule => ({
  label,
  source: 'asset',
  pattern: pattern.source,
  max,
});

type Extras = Pick<TechSignature, 'implies' | 'details' | 'versionTemplate'>;

const tech = (
  id: string,
  name: string,
  category: TechCategory,
  website: string,
  signals: readonly Signal[],
  extras: Extras = {},
): TechSignature => ({ id, name, category, website, signals, ...extras });

const TAILWIND_UTILITIES =
  /^(?:(?:sm|md|lg|xl|2xl|hover|focus|dark|group-hover|disabled):[a-z-]+.*|(?:px|py|mx|my|mt|mb|ml|mr|pt|pb|gap|space-x|space-y)-(?:\d+|px)|(?:text|bg|border)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|text-(?:xs|sm|base|lg|xl|[2-9]xl)|rounded(?:-(?:sm|md|lg|xl|2xl|full))?|items-(?:center|start|end)|justify-(?:between|center|end)|font-(?:medium|semibold|bold)|w-full|h-full|min-h-screen|max-w-\w+)$/;

const BOOTSTRAP_CLASSES =
  /^(?:col-(?:sm|md|lg|xl|xxl)-\d+|col-\d+|btn-(?:primary|secondary|success|danger|warning|info|light|dark|outline-\w+)|navbar-expand(?:-\w+)?|container-fluid|d-(?:flex|none|block)|justify-content-\w+|mb-\d|mt-\d|form-control|card-body|nav-link)$/;

const WORDPRESS_THEME = /\/wp-content\/themes\/([^/?#]+)/;
const WORDPRESS_PLUGIN = /\/wp-content\/plugins\/([^/?#]+)/;

const FRAMEWORKS: readonly TechSignature[] = [
  tech('react', 'React', 'framework', 'https://react.dev', [
    global('React', 40, 'React.version'),
    domKey('__reactFiber$', 85),
    domKey('__reactContainer$', 85),
    domKey('_reactRootContainer', 85),
    selector('[data-reactroot]', 70),
    script(/unpkg\.com\/react(?:-dom)?@(\d+\.\d+(?:\.\d+)?)/, 55),
    script(/\/react(?:-dom)?(?:\.production)?(?:\.min)?\.js/, 45),
  ]),
  tech(
    'nextjs',
    'Next.js',
    'framework',
    'https://nextjs.org',
    [
      global('next.version', 85, 'next.version'),
      global('__NEXT_DATA__', 85),
      global('__next_f', 70),
      selector('#__next', 50),
      script(/\/_next\/static\//, 85),
      header('x-powered-by', 70, /next\.js/),
    ],
    { implies: ['react'] },
  ),
  tech('vue', 'Vue.js', 'framework', 'https://vuejs.org', [
    global('Vue', 40, 'Vue.version'),
    domKey('__vue_app__', 85),
    domKey('__vue__', 85),
    selector('[data-v-app]', 70),
    selector('[data-server-rendered]', 55),
    script(/\/vue(?:@|\/)(\d+\.\d+(?:\.\d+)?)/, 55),
    script(/\/vue(?:\.runtime)?(?:\.global)?(?:\.prod)?(?:\.min)?\.js/, 50),
  ]),
  tech(
    'nuxt',
    'Nuxt',
    'framework',
    'https://nuxt.com',
    [global('__NUXT__', 90), global('$nuxt', 80), selector('#__nuxt', 70), script(/\/_nuxt\//, 85)],
    { implies: ['vue'] },
  ),
  tech('svelte', 'Svelte', 'framework', 'https://svelte.dev', [
    domKey('__svelte_meta', 70),
    classes(/^svelte-[a-z0-9]{4,8}$/, 3, 75),
    script(/svelte(?:\.min)?\.js/, 40),
  ]),
  tech(
    'sveltekit',
    'SvelteKit',
    'framework',
    'https://svelte.dev/docs/kit',
    [
      selector('[data-sveltekit-preload-data]', 90),
      selector('[data-sveltekit-hydrate]', 90),
      script(/\/_app\/immutable\//, 85),
    ],
    { implies: ['svelte'] },
  ),
  tech('angular', 'Angular', 'framework', 'https://angular.dev', [
    selector('[ng-version]', 95, 'ng-version'),
    domKey('__ngContext__', 75),
    selector('app-root', 35),
  ]),
  tech('angularjs', 'AngularJS', 'framework', 'https://angularjs.org', [
    global('angular.version.full', 85, 'angular.version.full'),
    selector('[ng-app]', 70),
    selector('[data-ng-app]', 70),
    classes(/^ng-(?:binding|scope|isolate-scope)$/, 1, 60),
  ]),
  tech('astro', 'Astro', 'framework', 'https://astro.build', [
    selector('astro-island', 95),
    meta('generator', 90, /^astro v?(\d+\.\d+(?:\.\d+)?)/),
    classes(/^astro-[a-z0-9]{6,}$/, 1, 80),
    script(/\/_astro\//, 70),
  ]),
  tech(
    'remix',
    'Remix',
    'framework',
    'https://remix.run',
    [global('__remixContext', 90), global('__remixManifest', 90)],
    { implies: ['react'] },
  ),
  tech(
    'gatsby',
    'Gatsby',
    'framework',
    'https://www.gatsbyjs.com',
    [
      selector('#___gatsby', 90),
      meta('generator', 90, /^gatsby (\d+\.\d+(?:\.\d+)?)/),
      asset(/\/page-data\/[^/]+\/page-data\.json|\/page-data\/app-data\.json/, 70),
    ],
    { implies: ['react'] },
  ),
  tech('solid', 'Solid', 'framework', 'https://www.solidjs.com', [
    global('_$HY', 80),
    selector('[data-hk]', 70),
    script(/solid-js/, 40),
  ]),
  tech('qwik', 'Qwik', 'framework', 'https://qwik.dev', [
    selector('[q\\:container]', 95, 'q:version'),
    script(/\/build\/q-[\w-]+\.js/, 60),
  ]),
  tech('alpine', 'Alpine.js', 'framework', 'https://alpinejs.dev', [
    global('Alpine.version', 70, 'Alpine.version'),
    domKey('_x_dataStack', 80),
    selector('[x-data]', 60),
    script(/alpinejs/, 55),
  ]),
  tech('htmx', 'htmx', 'framework', 'https://htmx.org', [
    global('htmx.version', 90, 'htmx.version'),
    selector('[hx-get],[hx-post],[hx-trigger],[hx-swap]', 70),
    script(/htmx(?:\.min)?\.js|htmx\.org/, 55),
  ]),
  tech('preact', 'Preact', 'framework', 'https://preactjs.com', [
    global('__PREACT_DEVTOOLS__', 60),
    script(/preact(?:\.min|\.module)?\.js|\/preact@/, 55),
  ]),
  tech('ember', 'Ember.js', 'framework', 'https://emberjs.com', [
    global('Ember.VERSION', 90, 'Ember.VERSION'),
    selector('.ember-application', 70),
  ]),
  tech('backbone', 'Backbone.js', 'framework', 'https://backbonejs.org', [
    global('Backbone.VERSION', 90, 'Backbone.VERSION'),
  ]),
  tech('lit', 'Lit', 'framework', 'https://lit.dev', [
    global('litElementVersions', 80),
    global('litHtmlVersions', 80),
  ]),
  tech('hotwire', 'Hotwire Turbo', 'framework', 'https://turbo.hotwired.dev', [
    global('Turbo', 55),
    selector('turbo-frame', 85),
    script(/@hotwired\/turbo|turbo(?:\.min)?\.js/, 60),
  ]),
  tech('livewire', 'Laravel Livewire', 'framework', 'https://livewire.laravel.com', [
    global('Livewire', 70),
    selector('[wire\\:id]', 85),
    script(/\/livewire\/livewire(?:\.min)?\.js|livewire\.js/, 70),
  ]),
  tech('inertia', 'Inertia.js', 'framework', 'https://inertiajs.com', [
    selector('#app[data-page]', 80),
  ]),
  tech(
    'docusaurus',
    'Docusaurus',
    'framework',
    'https://docusaurus.io',
    [
      selector('#__docusaurus', 90),
      meta('generator', 90, /^docusaurus(?: v?(\d+\.\d+(?:\.\d+)?))?/),
    ],
    { implies: ['react'] },
  ),
  tech('jekyll', 'Jekyll', 'framework', 'https://jekyllrb.com', [
    meta('generator', 95, /^jekyll v?(\d+\.\d+(?:\.\d+)?)/),
  ]),
  tech('hugo', 'Hugo', 'framework', 'https://gohugo.io', [
    meta('generator', 95, /^hugo (\d+\.\d+(?:\.\d+)?)/),
  ]),
  tech('eleventy', 'Eleventy', 'framework', 'https://www.11ty.dev', [
    meta('generator', 95, /^eleventy v?(\d+\.\d+(?:\.\d+)?)/),
  ]),
  tech('hexo', 'Hexo', 'framework', 'https://hexo.io', [
    meta('generator', 95, /^hexo v?(\d+\.\d+(?:\.\d+)?)/),
  ]),
  tech('vitepress', 'VitePress', 'framework', 'https://vitepress.dev', [
    meta('generator', 95, /^vitepress v?(\d+\.\d+(?:\.\d+)?)/),
  ]),
  tech('vite', 'Vite', 'framework', 'https://vite.dev', [
    asset(/\/@vite\/client/, 90),
    asset(/\/assets\/[\w-]+-[\w-]{8}\.(?:js|css)(?:\?|$)/, 40),
  ]),
  tech('webpack', 'webpack', 'framework', 'https://webpack.js.org', [
    global('webpackJsonp', 70),
    global('__webpack_require__', 60),
    global('__webpack_public_path__', 60),
  ]),
];

const CMS: readonly TechSignature[] = [
  tech(
    'wordpress',
    'WordPress',
    'cms',
    'https://wordpress.org',
    [
      meta('generator', 90, /^wordpress (\d+\.\d+(?:\.\d+)?)/),
      asset(/\/wp-content\//, 70),
      asset(/\/wp-includes\//, 70),
      asset(/wp-emoji-release\.min\.js\?ver=(\d+\.\d+(?:\.\d+)?)/, 25),
      selector('link[rel="https://api.w.org/"]', 60),
      classes(/^(?:wp-block-[\w-]+|wp-image-\d+|page-id-\d+|postid-\d+|wp-singular)$/, 1, 45),
      header('link', 60, /wp-json/),
    ],
    {
      details: [
        assetDetail('theme', WORDPRESS_THEME, 1),
        assetDetail('plugin', WORDPRESS_PLUGIN, 40),
      ],
    },
  ),
  tech('joomla', 'Joomla', 'cms', 'https://www.joomla.org', [
    meta('generator', 90, /^joomla!?(?:\s*-?\s*(\d+\.\d+(?:\.\d+)?))?/),
    global('Joomla', 70),
    asset(/\/media\/(?:system|jui)\/js\//, 60),
  ]),
  tech('drupal', 'Drupal', 'cms', 'https://www.drupal.org', [
    meta('generator', 90, /^drupal (\d+(?:\.\d+)?)/),
    header('x-generator', 90, /^drupal (\d+(?:\.\d+)?)/),
    header('x-drupal-cache', 80),
    global('Drupal', 80),
    global('drupalSettings', 80),
    asset(/\/sites\/(?:default|all)\/files\//, 60),
  ]),
  tech('ghost', 'Ghost', 'cms', 'https://ghost.org', [
    meta('generator', 90, /^ghost (\d+\.\d+(?:\.\d+)?)/),
    asset(/\/ghost\/api\//, 60),
    classes(/^gh-(?:head|content|canvas|viewport)$/, 1, 60),
  ]),
  tech('strapi', 'Strapi', 'cms', 'https://strapi.io', [
    header('x-powered-by', 90, /strapi/),
    meta('generator', 80, /^strapi/),
  ]),
  tech('contentful', 'Contentful', 'cms', 'https://www.contentful.com', [
    asset(/(?:images|assets|downloads|videos)\.ctfassets\.net/, 80),
  ]),
  tech('sanity', 'Sanity', 'cms', 'https://www.sanity.io', [asset(/cdn\.sanity\.io\//, 80)]),
  tech('prismic', 'Prismic', 'cms', 'https://prismic.io', [
    asset(/images\.prismic\.io|static\.cdn\.prismic\.io/, 80),
    global('prismic', 60),
  ]),
  tech('storyblok', 'Storyblok', 'cms', 'https://www.storyblok.com', [
    asset(/a\.storyblok\.com\//, 80),
    global('StoryblokBridge', 70),
  ]),
  tech('craftcms', 'Craft CMS', 'cms', 'https://craftcms.com', [
    header('x-powered-by', 90, /craft cms/),
  ]),
  tech('typo3', 'TYPO3', 'cms', 'https://typo3.org', [
    meta('generator', 90, /^typo3/),
    asset(/\/typo3(?:conf|temp)\//, 80),
  ]),
  tech('blogger', 'Blogger', 'cms', 'https://www.blogger.com', [
    meta('generator', 90, /^blogger/),
    asset(/www\.blogger\.com\/static\//, 70),
  ]),
  tech('umbraco', 'Umbraco', 'cms', 'https://umbraco.com', [
    meta('generator', 90, /^umbraco/),
    asset(/\/umbraco\//, 50),
  ]),
  tech('hubspotcms', 'HubSpot CMS', 'cms', 'https://www.hubspot.com/products/cms', [
    meta('generator', 90, /^hubspot/),
    asset(/\.hs-sites\.com|hubspotusercontent\d*\.net/, 60),
  ]),
  tech('bitrix', 'Bitrix', 'cms', 'https://www.bitrix24.com', [
    asset(/\/bitrix\/(?:js|templates|cache)\//, 85),
  ]),
];

const BUILDERS: readonly TechSignature[] = [
  tech(
    'elementor',
    'Elementor',
    'builder',
    'https://elementor.com',
    [
      meta('generator', 90, /^elementor (\d+\.\d+(?:\.\d+)?)/),
      classes(/^elementor(?:-[\w-]+)?$/, 2, 70),
      asset(/\/wp-content\/plugins\/elementor(?:-pro)?\//, 85),
      global('elementorFrontend', 80),
    ],
    { implies: ['wordpress'] },
  ),
  tech(
    'divi',
    'Divi',
    'builder',
    'https://www.elegantthemes.com/gallery/divi/',
    [
      classes(/^et_pb_[\w-]+$/, 2, 80),
      asset(/\/wp-content\/themes\/divi\//, 80),
      asset(/\/et-cache\/|\/et-core-unified/, 60),
    ],
    { implies: ['wordpress'] },
  ),
  tech(
    'wpbakery',
    'WPBakery',
    'builder',
    'https://wpbakery.com',
    [
      classes(/^(?:vc_row|vc_column|wpb_wrapper|wpb_text_column|vc_column_container)$/, 2, 80),
      asset(/\/plugins\/js_composer\//, 80),
      meta('generator', 90, /^powered by wpbakery/),
    ],
    { implies: ['wordpress'] },
  ),
  tech(
    'beaverbuilder',
    'Beaver Builder',
    'builder',
    'https://www.wpbeaverbuilder.com',
    [classes(/^fl-(?:builder|row|col|module)[\w-]*$/, 2, 80), asset(/\/bb-plugin\//, 85)],
    { implies: ['wordpress'] },
  ),
  tech(
    'bricks',
    'Bricks',
    'builder',
    'https://bricksbuilder.io',
    [classes(/^brxe-[\w-]+$/, 2, 80), asset(/\/themes\/bricks\//, 85)],
    { implies: ['wordpress'] },
  ),
  tech(
    'oxygen',
    'Oxygen',
    'builder',
    'https://oxygenbuilder.com',
    [
      classes(/^ct-(?:section|div-block|text-block|headline|link-button)$/, 2, 80),
      asset(/\/plugins\/oxygen\//, 85),
    ],
    { implies: ['wordpress'] },
  ),
  tech('webflow', 'Webflow', 'builder', 'https://webflow.com', [
    selector('html[data-wf-site]', 95),
    meta('generator', 90, /^webflow/),
    global('Webflow', 75),
    asset(
      /assets-global\.website-files\.com|cdn\.prod\.website-files\.com|uploads-ssl\.webflow\.com/,
      70,
    ),
  ]),
  tech('wix', 'Wix', 'builder', 'https://www.wix.com', [
    meta('generator', 90, /^wix\.com website builder/),
    global('wixBiSession', 70),
    global('wixPerformanceMeasurements', 70),
    asset(/static\.parastorage\.com|static\.wixstatic\.com|wixstatic\.com\/media/, 80),
    header('x-wix-request-id', 90),
    header('server', 80, /pepyaka/),
  ]),
  tech('squarespace', 'Squarespace', 'builder', 'https://www.squarespace.com', [
    meta('generator', 90, /^squarespace/),
    global('Squarespace', 80),
    asset(/static1\.squarespace\.com|assets\.squarespace\.com|sqspcdn\.com/, 80),
    header('server', 80, /squarespace/),
  ]),
  tech('framer', 'Framer', 'builder', 'https://www.framer.com', [
    meta('generator', 90, /^framer (\d+(?:\.\d+)*)/),
    selector('[data-framer-hydrate-v2]', 80),
    selector('[data-framer-name]', 60),
    asset(/framerusercontent\.com|framer\.com\/m\//, 70),
  ]),
  tech('weebly', 'Weebly', 'builder', 'https://www.weebly.com', [
    global('Weebly', 70),
    asset(/editmysite\.com|weeblycloud\.com/, 80),
  ]),
  tech('tilda', 'Tilda', 'builder', 'https://tilda.cc', [
    asset(/tilda(?:cdn|apps)\.com|static\.tildacdn\.(?:com|net)/, 90),
    selector('#allrecords', 60),
  ]),
  tech('kajabi', 'Kajabi', 'builder', 'https://kajabi.com', [
    asset(/kajabi-cdn\.com|kajabi-storefronts-production/, 85),
  ]),
  tech('clickfunnels', 'ClickFunnels', 'builder', 'https://www.clickfunnels.com', [
    asset(/clickfunnels\.com/, 75),
  ]),
  tech('unbounce', 'Unbounce', 'builder', 'https://unbounce.com', [asset(/unbounce\.com/, 75)]),
  tech('leadpages', 'Leadpages', 'builder', 'https://www.leadpages.com', [
    asset(/leadpages\.(?:net|com)/, 80),
  ]),
  tech('hostingerbuilder', 'Hostinger Website Builder', 'builder', 'https://www.hostinger.com', [
    meta('generator', 90, /^hostinger website builder/),
    asset(/zyrosite\.com|builder-assets\.hostinger/, 70),
  ]),
  tech('godaddybuilder', 'GoDaddy Website Builder', 'builder', 'https://www.godaddy.com', [
    meta('generator', 85, /godaddy/),
    asset(/img1\.wsimg\.com/, 55),
  ]),
  tech('jimdo', 'Jimdo', 'builder', 'https://www.jimdo.com', [asset(/jimcdn\.com|jimdo\.com/, 80)]),
];

const ECOMMERCE: readonly TechSignature[] = [
  tech(
    'shopify',
    'Shopify',
    'ecommerce',
    'https://www.shopify.com',
    [
      global('Shopify', 80),
      asset(/cdn\.shopify\.com\//, 80),
      header('x-shopid', 90),
      header('x-shopify-stage', 90),
    ],
    { details: [{ label: 'theme', source: 'global', path: 'Shopify.theme.name' }] },
  ),
  tech(
    'woocommerce',
    'WooCommerce',
    'ecommerce',
    'https://woocommerce.com',
    [
      meta('generator', 90, /^woocommerce (\d+\.\d+(?:\.\d+)?)/),
      global('wc_add_to_cart_params', 80),
      global('woocommerce_params', 80),
      classes(/^woocommerce(?:-[\w-]+)?$/, 1, 70),
      asset(/\/wp-content\/plugins\/woocommerce\//, 90),
    ],
    { implies: ['wordpress'] },
  ),
  tech('nuvemshop', 'Nuvemshop', 'ecommerce', 'https://www.nuvemshop.com.br', [
    global('LS.store', 80),
    asset(
      /d2r9epyceweg5n\.cloudfront\.net|\.mitiendanube\.com|\.lojavirtualnuvem\.com\.br|nuvemshop|tiendanube/,
      80,
    ),
  ]),
  tech('vtex', 'VTEX', 'ecommerce', 'https://vtex.com', [
    global('vtex', 80),
    global('vtexjs', 80),
    asset(
      /\.vtexassets\.com|\.vteximg\.com\.br|vtexcommercestable\.com\.br|vtexcontent\.com\.br|io\.vtex\.com\.br/,
      90,
    ),
    header('x-powered-by', 70, /vtex/),
  ]),
  tech('tray', 'Tray', 'ecommerce', 'https://www.tray.com.br', [
    asset(/tcdn\.com\.br|\.tray\.com\.br|traycdn/, 80),
  ]),
  tech('lojaintegrada', 'Loja Integrada', 'ecommerce', 'https://www.lojaintegrada.com.br', [
    asset(/awsli\.com\.br|lojaintegrada\.com\.br/, 90),
  ]),
  tech('wake', 'Wake Commerce', 'ecommerce', 'https://wake.tech', [
    asset(/fbitsstatic\.net|wake\.tech/, 80),
  ]),
  tech('yampi', 'Yampi', 'ecommerce', 'https://www.yampi.com.br', [
    asset(/yampi\.io|yampi\.com\.br|cdn\.yampi/, 80),
  ]),
  tech('hotmart', 'Hotmart', 'ecommerce', 'https://hotmart.com', [
    asset(/(?:static|pay|checkout)\.hotmart\.com|hotmart\.com\/checkout/, 70),
  ]),
  tech('magento', 'Magento', 'ecommerce', 'https://business.adobe.com/products/magento/', [
    selector('script[type="text/x-magento-init"]', 90),
    global('Mage', 55),
    asset(/\/(?:static\/version\d+|pub\/static)\/frontend\//, 80),
    classes(
      /^(?:page-products|catalog-category-view|cms-index-index|checkout-index-index)$/,
      1,
      50,
    ),
  ]),
  tech('prestashop', 'PrestaShop', 'ecommerce', 'https://prestashop.com', [
    global('prestashop', 90),
    meta('generator', 90, /^prestashop/),
    asset(/\/modules\/ps_[\w-]+\//, 55),
  ]),
  tech('opencart', 'OpenCart', 'ecommerce', 'https://www.opencart.com', [
    asset(/catalog\/view\/(?:javascript|theme)\//, 90),
  ]),
  tech('bigcommerce', 'BigCommerce', 'ecommerce', 'https://www.bigcommerce.com', [
    asset(/cdn\d*\.bigcommerce\.com|bigcommerce\.com\/s-/, 90),
    global('BCData', 70),
  ]),
];

const PAYMENTS: readonly TechSignature[] = [
  tech('stripe', 'Stripe', 'payment', 'https://stripe.com', [
    global('Stripe', 60),
    asset(/js\.stripe\.com/, 90),
  ]),
  tech('paypal', 'PayPal', 'payment', 'https://www.paypal.com', [
    global('paypal', 55),
    asset(/paypal(?:objects)?\.com\/(?:sdk|js)|www\.paypalobjects\.com/, 90),
  ]),
  tech('mercadopago', 'Mercado Pago', 'payment', 'https://www.mercadopago.com.br', [
    global('MercadoPago', 80),
    asset(/sdk\.mercadopago\.com|secure\.mlstatic\.com\/(?:sdk|mercadopago)/, 90),
  ]),
  tech('pagbank', 'PagBank', 'payment', 'https://pagseguro.uol.com.br', [
    asset(/stc\.pagseguro\.uol\.com\.br|assets\.pagseguro\.com\.br|pagbank/, 80),
  ]),
  tech('pagarme', 'Pagar.me', 'payment', 'https://pagar.me', [
    asset(/assets\.pagar\.me|checkout\.pagar\.me/, 90),
  ]),
];

const CSS: readonly TechSignature[] = [
  tech('tailwind', 'Tailwind CSS', 'css', 'https://tailwindcss.com', [
    cssVar('--tw-ring-offset-width', 60),
    cssVar('--tw-border-style', 60),
    classes(TAILWIND_UTILITIES, 6, 70),
    asset(/cdn\.tailwindcss\.com|tailwindcss(?:@|\/)(\d+\.\d+(?:\.\d+)?)/, 90),
    asset(/tailwind(?:\.min)?\.css/, 60),
  ]),
  tech('bootstrap', 'Bootstrap', 'css', 'https://getbootstrap.com', [
    global('bootstrap.Tooltip.VERSION', 70, 'bootstrap.Tooltip.VERSION'),
    global('jQuery.fn.tooltip.Constructor.VERSION', 50, 'jQuery.fn.tooltip.Constructor.VERSION'),
    cssVar('--bs-body-font-family', 70),
    asset(/bootstrap(?:[@/-])v?(\d+\.\d+(?:\.\d+)?)/, 70),
    asset(/bootstrap(?:\.bundle)?(?:\.min)?\.(?:css|js)/, 60),
    classes(BOOTSTRAP_CLASSES, 4, 50),
  ]),
  tech('bulma', 'Bulma', 'css', 'https://bulma.io', [
    asset(/bulma(?:@|\/)(\d+\.\d+(?:\.\d+)?)/, 70),
    asset(/bulma(?:\.min)?\.css/, 80),
    classes(
      /^(?:is-(?:primary|info|success|warning|danger)|navbar-burger|hero-body|has-text-centered|navbar-menu)$/,
      3,
      60,
    ),
  ]),
  tech('foundation', 'Foundation', 'css', 'https://get.foundation', [
    global('Foundation.version', 90, 'Foundation.version'),
    asset(/foundation(?:\.min)?\.(?:css|js)/, 70),
    classes(/^(?:grid-x|grid-container|top-bar|cell)$/, 3, 40),
  ]),
  tech(
    'mui',
    'Material UI',
    'css',
    'https://mui.com',
    [classes(/^Mui[A-Z][A-Za-z]+-[a-zA-Z]+/, 2, 90), cssVar('--mui-palette-primary-main', 70)],
    { implies: ['react'] },
  ),
  tech(
    'chakra',
    'Chakra UI',
    'css',
    'https://chakra-ui.com',
    [classes(/^chakra-[a-z-]+/, 2, 90), cssVar('--chakra-colors-chakra-body-text', 70)],
    { implies: ['react'] },
  ),
  tech('styledcomponents', 'styled-components', 'css', 'https://styled-components.com', [
    selector('style[data-styled]', 90),
    classes(/^sc-[a-zA-Z0-9]{6,}$/, 2, 70),
  ]),
  tech('emotion', 'Emotion', 'css', 'https://emotion.sh', [
    selector('style[data-emotion]', 90),
    classes(/^css-[a-z0-9]{5,8}(?:-[\w-]+)?$/, 3, 50),
  ]),
  tech('antdesign', 'Ant Design', 'css', 'https://ant.design', [classes(/^ant-[a-z-]+/, 3, 90)], {
    implies: ['react'],
  }),
  tech('semanticui', 'Semantic UI', 'css', 'https://semantic-ui.com', [
    asset(/semantic(?:\.min)?\.(?:css|js)|semantic-ui/, 80),
  ]),
  tech('uikit', 'UIkit', 'css', 'https://getuikit.com', [
    global('UIkit.version', 90, 'UIkit.version'),
    classes(/^uk-[a-z-]+/, 3, 80),
    asset(/uikit(?:\.min)?\.(?:css|js)/, 70),
  ]),
  tech('materialize', 'Materialize', 'css', 'https://materializecss.com', [
    asset(/materialize(?:\.min)?\.(?:css|js)/, 80),
    classes(/^(?:materialize-red|waves-effect|collection-item)$/, 2, 60),
  ]),
  tech('daisyui', 'daisyUI', 'css', 'https://daisyui.com', [
    asset(/daisyui/, 90),
    classes(
      /^(?:modal-box|drawer-side|btn-accent|btn-neutral|tabs-boxed|stat-value|chat-bubble|mockup-code|collapse-title|menu-title)$/,
      2,
      70,
    ),
  ]),
  tech(
    'radix',
    'Radix UI',
    'css',
    'https://www.radix-ui.com',
    [
      selector('[data-radix-popper-content-wrapper]', 70),
      selector('[data-radix-scroll-area-viewport]', 70),
    ],
    { implies: ['react'] },
  ),
  tech('animatecss', 'Animate.css', 'css', 'https://animate.style', [
    classes(/^animate__[\w-]+$/, 1, 80),
    asset(/animate(?:\.min)?\.css/, 60),
  ]),
];

const LIBRARIES: readonly TechSignature[] = [
  tech('jquery', 'jQuery', 'library', 'https://jquery.com', [
    global('jQuery.fn.jquery', 90, 'jQuery.fn.jquery'),
    global('jQuery', 40),
    script(/jquery(?:[-@/.](\d+\.\d+(?:\.\d+)?))?(?:\.slim)?(?:\.min)?\.js/, 60),
  ]),
  tech('jqueryui', 'jQuery UI', 'library', 'https://jqueryui.com', [
    global('jQuery.ui.version', 90, 'jQuery.ui.version'),
    script(/jquery-ui(?:[-.@/](\d+\.\d+(?:\.\d+)?))?(?:\.custom)?(?:\.min)?\.js/, 70),
  ]),
  tech('gsap', 'GSAP', 'library', 'https://gsap.com', [
    global('gsap.version', 95, 'gsap.version'),
    global('TweenMax', 60, 'TweenMax.version'),
    global('TweenLite', 50),
    script(/gsap(?:[@/](\d+\.\d+(?:\.\d+)?))?[\w./-]*\.js|\/TweenMax(?:\.min)?\.js/, 70),
  ]),
  tech('scrolltrigger', 'ScrollTrigger', 'library', 'https://gsap.com/scrolltrigger/', [
    global('ScrollTrigger.version', 90, 'ScrollTrigger.version'),
    script(/ScrollTrigger(?:\.min)?\.js/, 80),
  ]),
  tech('lenis', 'Lenis', 'library', 'https://lenis.darkroom.engineering', [
    classes(/^lenis(?:-smooth|-scrolling|-stopped)?$/, 1, 90),
    global('Lenis', 70),
    script(/@studio-freight\/lenis|@darkroom\.engineering\/lenis|lenis(?:\.min)?\.js/, 70),
  ]),
  tech(
    'locomotive',
    'Locomotive Scroll',
    'library',
    'https://locomotivemtl.github.io/locomotive-scroll/',
    [
      classes(/^has-scroll-(?:smooth|init|scrolling)$/, 1, 90),
      global('LocomotiveScroll', 80),
      script(/locomotive-scroll/, 80),
    ],
  ),
  tech(
    'three',
    'Three.js',
    'library',
    'https://threejs.org',
    [
      selector('canvas[data-engine*="three.js"]', 95, 'data-engine'),
      global('THREE.REVISION', 90, 'THREE.REVISION'),
      script(/three(?:\.module|\.min)?\.js|\/three\/build\//, 55),
    ],
    { versionTemplate: 'r{v}' },
  ),
  tech('babylon', 'Babylon.js', 'library', 'https://www.babylonjs.com', [
    global('BABYLON.Engine.Version', 90, 'BABYLON.Engine.Version'),
    script(/babylon(?:js)?(?:\.max)?(?:\.min)?\.js|cdn\.babylonjs\.com/, 70),
  ]),
  tech('lodash', 'Lodash', 'library', 'https://lodash.com', [
    global('_.chunk', 50),
    global('_.VERSION', 50, '_.VERSION'),
    script(/lodash(?:\.min|\.core)?\.js|lodash(?:@|\/)(\d+\.\d+\.\d+)/, 70),
  ]),
  tech('underscore', 'Underscore.js', 'library', 'https://underscorejs.org', [
    script(/underscore(?:-min|-umd-min)?\.js|underscore@/, 80),
  ]),
  tech('moment', 'Moment.js', 'library', 'https://momentjs.com', [
    global('moment.version', 90, 'moment.version'),
    script(/moment(?:-with-locales)?(?:\.min)?\.js/, 70),
  ]),
  tech('dayjs', 'Day.js', 'library', 'https://day.js.org', [
    global('dayjs', 60),
    script(/dayjs(?:\.min)?\.js|dayjs@/, 80),
  ]),
  tech('axios', 'Axios', 'library', 'https://axios-http.com', [
    global('axios.defaults', 60),
    script(/axios(?:\.min)?\.js|axios@/, 80),
  ]),
  tech('swiper', 'Swiper', 'library', 'https://swiperjs.com', [
    global('Swiper', 70),
    classes(/^swiper(?:-wrapper|-slide|-container|-button-next|-pagination)?$/, 2, 80),
    script(/swiper(?:-bundle)?(?:\.min)?\.js|swiper@(\d+\.\d+(?:\.\d+)?)/, 60),
  ]),
  tech('slick', 'Slick', 'library', 'https://kenwheeler.github.io/slick/', [
    classes(/^slick-(?:slider|slide|track|list|initialized)$/, 2, 90),
    script(/slick(?:\.min)?\.js|slick-carousel/, 60),
  ]),
  tech('owlcarousel', 'Owl Carousel', 'library', 'https://owlcarousel2.github.io/OwlCarousel2/', [
    classes(/^owl-(?:carousel|stage|item|dots)$/, 2, 90),
  ]),
  tech('splide', 'Splide', 'library', 'https://splidejs.com', [
    classes(/^splide(?:__[\w-]+)?$/, 2, 90),
  ]),
  tech('flickity', 'Flickity', 'library', 'https://flickity.metafizzy.co', [
    classes(/^flickity-(?:enabled|viewport|slider)$/, 1, 90),
    global('Flickity', 70),
  ]),
  tech('aos', 'AOS', 'library', 'https://michalsnik.github.io/aos/', [
    selector('[data-aos]', 70),
    global('AOS', 70),
    classes(/^aos-(?:init|animate)$/, 1, 80),
  ]),
  tech('animejs', 'Anime.js', 'library', 'https://animejs.com', [
    global('anime.version', 90, 'anime.version'),
    script(/anime(?:\.min)?\.js|animejs/, 70),
  ]),
  tech('lottie', 'Lottie', 'library', 'https://airbnb.io/lottie/', [
    global('lottie', 70),
    global('bodymovin', 70),
    selector('lottie-player', 90),
    asset(/lottie(?:-player|\.min)?\.js|lottiefiles/, 70),
  ]),
  tech('d3', 'D3', 'library', 'https://d3js.org', [
    global('d3.version', 90, 'd3.version'),
    script(/d3(?:\.v\d+)?(?:\.min)?\.js|d3@\d+/, 60),
  ]),
  tech('chartjs', 'Chart.js', 'library', 'https://www.chartjs.org', [
    global('Chart.version', 90, 'Chart.version'),
    script(/chart(?:\.umd)?(?:\.min)?\.js|chart\.js/, 60),
  ]),
  tech('highcharts', 'Highcharts', 'library', 'https://www.highcharts.com', [
    global('Highcharts.version', 95, 'Highcharts.version'),
    classes(/^highcharts-[\w-]+$/, 2, 70),
  ]),
  tech('leaflet', 'Leaflet', 'library', 'https://leafletjs.com', [
    global('L.version', 80, 'L.version'),
    classes(/^leaflet-[\w-]+$/, 2, 90),
  ]),
  tech('mapbox', 'Mapbox GL', 'library', 'https://www.mapbox.com', [
    global('mapboxgl.version', 95, 'mapboxgl.version'),
    classes(/^mapboxgl-[\w-]+$/, 1, 90),
  ]),
  tech('googlemaps', 'Google Maps', 'library', 'https://developers.google.com/maps', [
    global('google.maps.version', 80, 'google.maps.version'),
    asset(/maps\.googleapis\.com\/maps\/api\/js|maps\.google\.com\/maps/, 90),
  ]),
  tech('fancybox', 'Fancybox', 'library', 'https://fancyapps.com/fancybox/', [
    global('Fancybox', 70),
    classes(/^fancybox(?:__[\w-]+|-[\w-]+)?$/, 1, 80),
  ]),
  tech('popper', 'Popper', 'library', 'https://popper.js.org', [
    script(/popper(?:\.min)?\.js|@popperjs/, 60),
  ]),
  tech('modernizr', 'Modernizr', 'library', 'https://modernizr.com', [
    global('Modernizr._version', 90, 'Modernizr._version'),
    script(/modernizr/, 70),
  ]),
  tech('videojs', 'Video.js', 'library', 'https://videojs.com', [
    global('videojs.VERSION', 95, 'videojs.VERSION'),
    classes(/^video-js$/, 1, 90),
  ]),
  tech('plyr', 'Plyr', 'library', 'https://plyr.io', [
    global('Plyr', 70),
    classes(/^plyr(?:__[\w-]+)?$/, 2, 90),
  ]),
  tech('youtube', 'YouTube embed', 'library', 'https://www.youtube.com', [
    selector('iframe[src*="youtube.com/embed"],iframe[src*="youtube-nocookie.com/embed"]', 90),
  ]),
  tech('vimeo', 'Vimeo embed', 'library', 'https://vimeo.com', [
    selector('iframe[src*="player.vimeo.com"]', 90),
  ]),
];

const ANALYTICS: readonly TechSignature[] = [
  tech(
    'ga4',
    'Google Analytics 4',
    'analytics',
    'https://marketingplatform.google.com/about/analytics/',
    [
      script(/googletagmanager\.com\/gtag\/js\?id=G-/, 90),
      global('gtag', 40),
      global('google_tag_data', 40),
    ],
  ),
  tech(
    'universalanalytics',
    'Google Analytics (analytics.js)',
    'analytics',
    'https://marketingplatform.google.com/about/analytics/',
    [
      global('GoogleAnalyticsObject', 90),
      script(/google-analytics\.com\/(?:analytics|ga)\.js/, 90),
    ],
  ),
  tech('gtm', 'Google Tag Manager', 'analytics', 'https://tagmanager.google.com', [
    script(/googletagmanager\.com\/gtm\.js/, 90),
    global('google_tag_manager', 70),
    selector('iframe[src*="googletagmanager.com/ns.html"]', 80),
  ]),
  tech('hotjar', 'Hotjar', 'analytics', 'https://www.hotjar.com', [
    global('_hjSettings', 90),
    global('hj', 50),
    script(/static\.hotjar\.com\/c\/hotjar-/, 90),
  ]),
  tech('clarity', 'Microsoft Clarity', 'analytics', 'https://clarity.microsoft.com', [
    global('clarity', 70),
    script(/clarity\.ms\/tag\//, 90),
  ]),
  tech('mixpanel', 'Mixpanel', 'analytics', 'https://mixpanel.com', [
    global('mixpanel', 70),
    script(/cdn\.mxpnl\.com|mixpanel(?:\.min)?\.js/, 80),
  ]),
  tech('segment', 'Segment', 'analytics', 'https://segment.com', [
    global('analytics.initialize', 60),
    script(/cdn\.segment\.(?:com|io)/, 90),
  ]),
  tech('amplitude', 'Amplitude', 'analytics', 'https://amplitude.com', [
    global('amplitude', 60),
    script(/cdn\.amplitude\.com/, 90),
  ]),
  tech('heap', 'Heap', 'analytics', 'https://www.heap.io', [
    global('heap', 60),
    script(/cdn\.heapanalytics\.com/, 90),
  ]),
  tech('plausible', 'Plausible', 'analytics', 'https://plausible.io', [
    script(/plausible\.io\/js\//, 95),
    global('plausible', 70),
  ]),
  tech('matomo', 'Matomo', 'analytics', 'https://matomo.org', [
    global('Matomo', 80),
    global('_paq', 70),
    script(/matomo\.js|piwik\.js/, 90),
  ]),
  tech('fathom', 'Fathom', 'analytics', 'https://usefathom.com', [
    script(/cdn\.usefathom\.com/, 95),
    global('fathom', 70),
  ]),
  tech('posthog', 'PostHog', 'analytics', 'https://posthog.com', [
    global('posthog', 70),
    script(/(?:us|eu)-assets\.i\.posthog\.com|posthog(?:\.com)?\/(?:static|array)/, 90),
  ]),
  tech(
    'adobeanalytics',
    'Adobe Analytics / Launch',
    'analytics',
    'https://business.adobe.com/products/analytics/adobe-analytics.html',
    [
      global('AppMeasurement', 80),
      global('s_gi', 60),
      script(/assets\.adobedtm\.com|omniture|AppMeasurement/, 80),
    ],
  ),
  tech('yandexmetrika', 'Yandex Metrika', 'analytics', 'https://metrica.yandex.com', [
    global('Ya.Metrika', 80),
    script(/mc\.yandex\.ru\/metrika/, 95),
  ]),
  tech('vwo', 'VWO', 'analytics', 'https://vwo.com', [
    global('_vwo_code', 90),
    script(/dev\.visualwebsiteoptimizer\.com/, 95),
  ]),
  tech('optimizely', 'Optimizely', 'analytics', 'https://www.optimizely.com', [
    global('optimizely', 80),
    script(/cdn\.optimizely\.com/, 95),
  ]),
];

const MARKETING: readonly TechSignature[] = [
  tech(
    'metapixel',
    'Meta Pixel',
    'marketing',
    'https://www.facebook.com/business/tools/meta-pixel',
    [
      global('fbq', 70),
      global('_fbq', 60),
      script(/connect\.facebook\.net\/[\w_]+\/fbevents\.js/, 95),
    ],
  ),
  tech('googleads', 'Google Ads', 'marketing', 'https://ads.google.com', [
    script(/googletagmanager\.com\/gtag\/js\?id=AW-|googleadservices\.com\/pagead/, 90),
    global('google_trackConversion', 70),
  ]),
  tech('tiktokpixel', 'TikTok Pixel', 'marketing', 'https://ads.tiktok.com', [
    global('ttq', 80),
    script(/analytics\.tiktok\.com\/i18n\/pixel/, 95),
  ]),
  tech(
    'linkedininsight',
    'LinkedIn Insight Tag',
    'marketing',
    'https://business.linkedin.com/marketing-solutions/insight-tag',
    [
      global('_linkedin_data_partner_ids', 90),
      global('lintrk', 80),
      script(/snap\.licdn\.com\/li\.lms-analytics/, 95),
    ],
  ),
  tech('pinteresttag', 'Pinterest Tag', 'marketing', 'https://business.pinterest.com', [
    global('pintrk', 90),
    script(/s\.pinimg\.com\/ct\/core\.js/, 95),
  ]),
  tech('taboola', 'Taboola Pixel', 'marketing', 'https://www.taboola.com', [
    global('_tfa', 80),
    script(/cdn\.taboola\.com\/libtrc\//, 95),
  ]),
  tech('rdstation', 'RD Station', 'marketing', 'https://www.rdstation.com', [
    global('RdIntegration', 90),
    script(/d335luupugsy2\.cloudfront\.net\/js\/(?:loader-scripts|integration)|rdstation\.com/, 90),
  ]),
  tech('kwai', 'Kwai Pixel', 'marketing', 'https://ads.kwai.com', [
    global('kwaiq', 90),
    script(/kwai(?:-?static)?\.com.*(?:pixel|events)/, 70),
  ]),
  tech('hubspot', 'HubSpot', 'marketing', 'https://www.hubspot.com', [
    global('_hsq', 80),
    script(/js\.hs-scripts\.com|js\.hsforms\.net|js\.hs-analytics\.net/, 90),
  ]),
  tech('mailchimp', 'Mailchimp', 'marketing', 'https://mailchimp.com', [
    asset(/chimpstatic\.com|list-manage\.com/, 90),
  ]),
  tech('activecampaign', 'ActiveCampaign', 'marketing', 'https://www.activecampaign.com', [
    asset(/trackcmp\.net|activehosted\.com/, 90),
  ]),
  tech('klaviyo', 'Klaviyo', 'marketing', 'https://www.klaviyo.com', [
    global('klaviyo', 80),
    asset(/static\.klaviyo\.com|a\.klaviyo\.com/, 90),
  ]),
  tech('onesignal', 'OneSignal', 'marketing', 'https://onesignal.com', [
    global('OneSignal', 80),
    asset(/cdn\.onesignal\.com/, 95),
  ]),
  tech('intercom', 'Intercom', 'marketing', 'https://www.intercom.com', [
    global('Intercom', 80),
    asset(/widget\.intercom\.io|js\.intercomcdn\.com/, 90),
  ]),
  tech('drift', 'Drift', 'marketing', 'https://www.drift.com', [
    global('drift', 70),
    asset(/js\.driftt\.com/, 90),
  ]),
  tech('zendesk', 'Zendesk Chat', 'marketing', 'https://www.zendesk.com', [
    global('zE', 70),
    asset(/static\.zdassets\.com|v2\.zopim\.com/, 90),
  ]),
  tech('tawk', 'Tawk.to', 'marketing', 'https://www.tawk.to', [
    global('Tawk_API', 90),
    asset(/embed\.tawk\.to/, 95),
  ]),
  tech('crisp', 'Crisp', 'marketing', 'https://crisp.chat', [
    global('$crisp', 90),
    asset(/client\.crisp\.chat/, 95),
  ]),
  tech('jivochat', 'JivoChat', 'marketing', 'https://www.jivochat.com', [
    global('jivo_api', 90),
    asset(/code\.jivosite\.com/, 90),
  ]),
  tech('tidio', 'Tidio', 'marketing', 'https://www.tidio.com', [
    global('tidioChatApi', 90),
    asset(/code\.tidio\.co/, 95),
  ]),
];

const SECURITY: readonly TechSignature[] = [
  tech('recaptcha', 'reCAPTCHA', 'security', 'https://www.google.com/recaptcha/', [
    global('grecaptcha', 70),
    classes(/^grecaptcha-badge$/, 1, 90),
    asset(/google\.com\/recaptcha\/|gstatic\.com\/recaptcha\//, 90),
  ]),
  tech('hcaptcha', 'hCaptcha', 'security', 'https://www.hcaptcha.com', [
    global('hcaptcha', 80),
    asset(/hcaptcha\.com\/1\/api\.js/, 90),
  ]),
  tech(
    'turnstile',
    'Cloudflare Turnstile',
    'security',
    'https://www.cloudflare.com/products/turnstile/',
    [global('turnstile', 70), asset(/challenges\.cloudflare\.com\/turnstile/, 90)],
  ),
  tech('onetrust', 'OneTrust', 'security', 'https://www.onetrust.com', [
    global('OneTrust', 80),
    global('OptanonWrapper', 80),
    asset(/cdn\.cookielaw\.org|onetrust\.com/, 90),
  ]),
  tech('cookiebot', 'Cookiebot', 'security', 'https://www.cookiebot.com', [
    global('Cookiebot', 90, 'Cookiebot.version'),
    asset(/consent\.cookiebot\.com|cookiebot\.com\/uc\.js/, 90),
  ]),
  tech('cookieyes', 'CookieYes', 'security', 'https://www.cookieyes.com', [
    asset(/cdn-cookieyes\.com|cookieyes\.com/, 90),
  ]),
];

const FONTS: readonly TechSignature[] = [
  tech('googlefonts', 'Google Fonts', 'fonts', 'https://fonts.google.com', [
    asset(/fonts\.googleapis\.com|fonts\.gstatic\.com/, 95),
  ]),
  tech('adobefonts', 'Adobe Fonts', 'fonts', 'https://fonts.adobe.com', [
    asset(/use\.typekit\.net|fonts\.adobe\.com/, 95),
  ]),
  tech('bunnyfonts', 'Bunny Fonts', 'fonts', 'https://fonts.bunny.net', [
    asset(/fonts\.bunny\.net/, 95),
  ]),
  tech('fontshare', 'Fontshare', 'fonts', 'https://www.fontshare.com', [
    asset(/api\.fontshare\.com/, 95),
  ]),
  tech('fontawesome', 'Font Awesome', 'fonts', 'https://fontawesome.com', [
    global('FontAwesome', 60),
    asset(
      /(?:font-?awesome|fontawesome)(?:[@/-]v?(\d+\.\d+(?:\.\d+)?))?|kit\.fontawesome\.com/,
      80,
    ),
    classes(/^(?:fa|fas|far|fab|fal|fad|fa-solid|fa-brands|fa-regular)$/, 2, 60),
  ]),
  tech('materialicons', 'Material Icons', 'fonts', 'https://fonts.google.com/icons', [
    classes(/^material-(?:icons|symbols)(?:-\w+)?$/, 1, 90),
    asset(/fonts\.googleapis\.com\/(?:icon|css2?\?family=Material\+(?:Icons|Symbols))/, 90),
  ]),
];

const CDN: readonly TechSignature[] = [
  tech('cloudflare', 'Cloudflare', 'cdn', 'https://www.cloudflare.com', [
    header('cf-ray', 90),
    header('server', 80, /cloudflare/),
  ]),
  tech('vercel', 'Vercel', 'cdn', 'https://vercel.com', [
    header('x-vercel-id', 95),
    header('server', 80, /^vercel/),
  ]),
  tech('netlify', 'Netlify', 'cdn', 'https://www.netlify.com', [
    header('x-nf-request-id', 95),
    header('server', 80, /^netlify/),
  ]),
  tech('hostinger', 'Hostinger', 'cdn', 'https://www.hostinger.com', [
    header('platform', 90, /hostinger/),
    header('server', 70, /^hcdn$/),
  ]),
  tech('cloudfront', 'Amazon CloudFront', 'cdn', 'https://aws.amazon.com/cloudfront/', [
    header('x-amz-cf-id', 90),
    header('via', 80, /cloudfront/),
    header('server', 60, /cloudfront/),
  ]),
  tech('s3', 'Amazon S3', 'cdn', 'https://aws.amazon.com/s3/', [
    header('server', 90, /^amazons3$/),
  ]),
  tech('fastly', 'Fastly', 'cdn', 'https://www.fastly.com', [
    header('x-fastly-request-id', 95),
    header('x-served-by', 50, /cache-/),
    header('via', 40, /varnish/),
  ]),
  tech('akamai', 'Akamai', 'cdn', 'https://www.akamai.com', [
    header('server', 80, /akamaighost|akamainetstorage/),
    header('x-akamai-transformed', 90),
  ]),
  tech('bunnycdn', 'Bunny CDN', 'cdn', 'https://bunny.net', [header('server', 90, /bunnycdn/)]),
  tech('sucuri', 'Sucuri', 'cdn', 'https://sucuri.net', [
    header('x-sucuri-id', 95),
    header('server', 80, /sucuri/),
  ]),
  tech('imperva', 'Imperva', 'cdn', 'https://www.imperva.com', [
    header('x-iinfo', 90),
    header('x-cdn', 60, /imperva|incapsula/),
  ]),
  tech('azure', 'Azure Front Door', 'cdn', 'https://azure.microsoft.com/products/frontdoor', [
    header('x-azure-ref', 90),
  ]),
  tech('githubpages', 'GitHub Pages', 'cdn', 'https://pages.github.com', [
    header('server', 80, /^github\.com$/),
    header('x-github-request-id', 70),
  ]),
  tech(
    'firebasehosting',
    'Firebase Hosting',
    'cdn',
    'https://firebase.google.com/products/hosting',
    [asset(/\/__\/firebase\/[\d.]+\/|\/__\/firebase\/init\.js/, 90)],
  ),
  tech('googlecloud', 'Google Cloud', 'cdn', 'https://cloud.google.com', [
    header('server', 75, /^google frontend$|^gws$|^esf$/),
  ]),
  tech('heroku', 'Heroku', 'cdn', 'https://www.heroku.com', [header('via', 80, /vegur/)]),
  tech('render', 'Render', 'cdn', 'https://render.com', [
    header('x-render-origin-server', 95),
    header('rndr-id', 90),
  ]),
  tech('flyio', 'Fly.io', 'cdn', 'https://fly.io', [
    header('fly-request-id', 95),
    header('server', 70, /^fly\.io/),
  ]),
  tech('wpengine', 'WP Engine', 'cdn', 'https://wpengine.com', [
    header('x-powered-by', 90, /wp engine/),
  ]),
  tech('kinsta', 'Kinsta', 'cdn', 'https://kinsta.com', [header('x-kinsta-cache', 95)]),
  tech('pantheon', 'Pantheon', 'cdn', 'https://pantheon.io', [
    header('x-pantheon-styx-hostname', 95),
  ]),
  tech('jsdelivr', 'jsDelivr', 'cdn', 'https://www.jsdelivr.com', [
    asset(/cdn\.jsdelivr\.net/, 90),
  ]),
  tech('cdnjs', 'cdnjs', 'cdn', 'https://cdnjs.com', [asset(/cdnjs\.cloudflare\.com/, 90)]),
  tech('unpkg', 'unpkg', 'cdn', 'https://unpkg.com', [asset(/unpkg\.com/, 90)]),
  tech('cloudinary', 'Cloudinary', 'cdn', 'https://cloudinary.com', [
    asset(/res\.cloudinary\.com/, 90),
  ]),
  tech('imgix', 'imgix', 'cdn', 'https://imgix.com', [asset(/\.imgix\.net/, 90)]),
];

const SERVERS: readonly TechSignature[] = [
  tech('nginx', 'nginx', 'server', 'https://nginx.org', [
    header('server', 95, /^nginx(?:\/(\d+\.\d+(?:\.\d+)?))?/),
  ]),
  tech('apache', 'Apache', 'server', 'https://httpd.apache.org', [
    header('server', 95, /^apache(?:\/(\d+\.\d+(?:\.\d+)?))?/),
  ]),
  tech('litespeed', 'LiteSpeed', 'server', 'https://www.litespeedtech.com', [
    header('server', 95, /^litespeed/),
    header('x-litespeed-cache', 90),
    header('x-turbo-charged-by', 90, /litespeed/),
  ]),
  tech('iis', 'Microsoft IIS', 'server', 'https://www.iis.net', [
    header('server', 95, /^microsoft-iis(?:\/(\d+\.\d+(?:\.\d+)?))?/),
  ]),
  tech('openresty', 'OpenResty', 'server', 'https://openresty.org', [
    header('server', 95, /^openresty(?:\/(\d+\.\d+(?:\.\d+)?))?/),
  ]),
  tech('caddy', 'Caddy', 'server', 'https://caddyserver.com', [header('server', 95, /^caddy/)]),
  tech('gunicorn', 'Gunicorn', 'server', 'https://gunicorn.org', [
    header('server', 95, /^gunicorn(?:\/(\d+\.\d+(?:\.\d+)?))?/),
  ]),
  tech(
    'kestrel',
    'Kestrel',
    'server',
    'https://learn.microsoft.com/aspnet/core/fundamentals/servers/kestrel',
    [header('server', 95, /^kestrel/)],
  ),
  tech('express', 'Express', 'server', 'https://expressjs.com', [
    header('x-powered-by', 95, /^express/),
  ]),
  tech('php', 'PHP', 'server', 'https://www.php.net', [
    header('x-powered-by', 95, /^php(?:\/(\d+\.\d+(?:\.\d+)?))?/),
  ]),
  tech('aspnet', 'ASP.NET', 'server', 'https://dotnet.microsoft.com/apps/aspnet', [
    header('x-aspnet-version', 95, /(\d+\.\d+(?:\.\d+)*)/),
    header('x-powered-by', 90, /asp\.net/),
    selector('input[name="__VIEWSTATE"]', 80),
  ]),
  tech('rails', 'Ruby on Rails', 'server', 'https://rubyonrails.org', [
    meta('csrf-param', 80, /authenticity_token/),
    header('x-runtime', 35),
  ]),
  tech('django', 'Django', 'server', 'https://www.djangoproject.com', [
    selector('input[name="csrfmiddlewaretoken"]', 80),
  ]),
];

const PWA: readonly TechSignature[] = [
  tech('pwa', 'PWA / Service worker', 'pwa', 'https://web.dev/progressive-web-apps/', [
    worker(70),
    selector('link[rel="manifest"]', 50),
  ]),
  tech('workbox', 'Workbox', 'pwa', 'https://developer.chrome.com/docs/workbox', [
    global('workbox', 90),
    script(/workbox(?:-[\w.]+)?\.js|storage\.googleapis\.com\/workbox/, 80),
  ]),
];

export const SIGNATURES: readonly TechSignature[] = [
  ...FRAMEWORKS,
  ...CMS,
  ...BUILDERS,
  ...ECOMMERCE,
  ...PAYMENTS,
  ...CSS,
  ...LIBRARIES,
  ...ANALYTICS,
  ...MARKETING,
  ...SECURITY,
  ...FONTS,
  ...CDN,
  ...SERVERS,
  ...PWA,
];
