import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const POLICY_PLACEHOLDER = '__CONTENT_SECURITY_POLICY__';
const HTML_ENTITIES = {
  '&quot;': '"',
  '&#34;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
};
const EXECUTABLE_SCRIPT_TYPES = new Set([
  '',
  'text/javascript',
  'application/javascript',
  'module',
]);

const TRACKING_SCRIPT_SOURCES = ['https://www.googletagmanager.com', 'https://connect.facebook.net'];
const TRACKING_CONNECT_SOURCES = [
  'https://www.google-analytics.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://www.googletagmanager.com',
  'https://www.facebook.com',
];
const TRACKING_IMAGE_SOURCES = [
  'https://www.google-analytics.com',
  'https://*.google-analytics.com',
  'https://www.googletagmanager.com',
  'https://www.facebook.com',
];

const hashOf = (content) =>
  `'sha256-${createHash('sha256').update(content, 'utf8').digest('base64')}'`;

const decodeEntities = (value) =>
  value.replace(/&(?:quot|apos|lt|gt|amp|#34|#39);/g, (entity) => HTML_ENTITIES[entity]);

const ATTRIBUTE_PATTERNS = {
  src: /(?:^|\s)src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,
  type: /(?:^|\s)type\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,
};

const readAttribute = (attributes, name) => {
  const match = ATTRIBUTE_PATTERNS[name].exec(attributes);
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
};

export const collectInlineHashes = (html) => {
  const scripts = new Set();
  const styles = new Set();
  const styleAttributes = new Set();

  for (const [, attributes, content] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const isExternal = readAttribute(attributes, 'src') !== null;
    const type = (readAttribute(attributes, 'type') ?? '').toLowerCase();
    if (!isExternal && content.trim() !== '' && EXECUTABLE_SCRIPT_TYPES.has(type))
      scripts.add(hashOf(content));
  }
  for (const [, , content] of html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi)) {
    if (content.trim() !== '') styles.add(hashOf(content));
  }
  for (const [, doubleQuoted, singleQuoted] of html.matchAll(
    /\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
  )) {
    styleAttributes.add(hashOf(decodeEntities(doubleQuoted ?? singleQuoted)));
  }
  return { scripts, styles, styleAttributes };
};

export const buildContentSecurityPolicy = (htmlDocuments) => {
  const scripts = new Set();
  const styles = new Set();
  for (const html of htmlDocuments) {
    const found = collectInlineHashes(html);
    for (const hash of found.scripts) scripts.add(hash);
    for (const hash of found.styles) styles.add(hash);
    for (const hash of found.styleAttributes) styles.add(hash);
  }
  const hasStyleAttributes = htmlDocuments.some(
    (html) => collectInlineHashes(html).styleAttributes.size > 0,
  );
  const styleSources = ["'self'", ...(hasStyleAttributes ? ["'unsafe-hashes'"] : []), ...styles];
  return [
    "default-src 'self'",
    `script-src ${["'self'", ...scripts, ...TRACKING_SCRIPT_SOURCES].join(' ')}`,
    `style-src ${styleSources.join(' ')}`,
    `img-src ${["'self'", 'data:', ...TRACKING_IMAGE_SOURCES].join(' ')}`,
    "font-src 'self'",
    `connect-src ${["'self'", ...TRACKING_CONNECT_SOURCES].join(' ')}`,
    "frame-ancestors 'self' https://fontedev.com https://*.fontedev.com",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
  ].join('; ');
};

const listHtmlFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return listHtmlFiles(path);
      return entry.name.endsWith('.html') ? [path] : [];
    }),
  );
  return nested.flat();
};

export const writeHtaccessWithPolicy = async (distDirectory) => {
  const documents = await Promise.all(
    (await listHtmlFiles(distDirectory)).map((file) => readFile(file, 'utf8')),
  );
  const policy = buildContentSecurityPolicy(documents);
  const htaccessPath = join(distDirectory, '.htaccess');
  const template = await readFile(htaccessPath, 'utf8');
  if (!template.includes(POLICY_PLACEHOLDER))
    throw new Error('.htaccess sem o marcador da política CSP');
  await writeFile(htaccessPath, template.replace(POLICY_PLACEHOLDER, policy));
  return policy;
};

export const contentSecurityPolicy = () => ({
  name: 'content-security-policy',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      await writeHtaccessWithPolicy(fileURLToPath(dir));
    },
  },
});
