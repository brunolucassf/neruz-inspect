import { collapseWhitespace, truncate } from '../shared/format';

export type SchemaFormat = 'json-ld' | 'microdata' | 'rdfa';

export type SchemaItem = {
  id: string;
  format: SchemaFormat;
  types: string[];
  data: unknown;
  missing: string[];
  element: Element | null;
};

export type InvalidJsonLd = { id: string; message: string; snippet: string };

export type StructuredDataResult = {
  items: SchemaItem[];
  invalid: InvalidJsonLd[];
  types: string[];
};

const REQUIRED_FIELDS: Record<string, readonly string[]> = {
  Organization: ['name', 'url', 'logo'],
  Product: ['name', 'image', 'description', 'offers'],
  LocalBusiness: ['name', 'address', 'telephone', 'openingHoursSpecification|openingHours'],
  Article: ['headline', 'image', 'datePublished', 'author'],
  BreadcrumbList: ['itemListElement'],
  FAQPage: ['mainEntity'],
};

const FAMILIES: Record<string, readonly string[]> = {
  Article: ['NewsArticle', 'BlogPosting', 'TechArticle', 'ScholarlyArticle', 'Report'],
  LocalBusiness: [
    'Restaurant',
    'Store',
    'Dentist',
    'Physician',
    'MedicalClinic',
    'Hotel',
    'LodgingBusiness',
    'FoodEstablishment',
    'CafeOrCoffeeShop',
    'BarOrPub',
    'Bakery',
    'AutoRepair',
    'BeautySalon',
    'HealthClub',
    'HairSalon',
    'RealEstateAgent',
    'LegalService',
    'ProfessionalService',
    'FinancialService',
    'HomeAndConstructionBusiness',
  ],
  Organization: [
    'Corporation',
    'NGO',
    'OnlineStore',
    'OnlineBusiness',
    'EducationalOrganization',
    'GovernmentOrganization',
    'SportsOrganization',
    'NewsMediaOrganization',
  ],
};

export const stripSchemaPrefix = (type: string): string =>
  type
    .trim()
    .replace(/^https?:\/\/schema\.org\//i, '')
    .replace(/^schema:/i, '');

export const schemaTypesOf = (node: unknown): string[] => {
  if (typeof node !== 'object' || node === null) return [];
  const raw = (node as Record<string, unknown>)['@type'];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.filter((entry): entry is string => typeof entry === 'string').map(stripSchemaPrefix);
};

export const canonicalFamily = (type: string): string | null => {
  if (type in REQUIRED_FIELDS) return type;
  for (const [family, members] of Object.entries(FAMILIES)) {
    if (members.includes(type)) return family;
  }
  return null;
};

const isFilled = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.some(isFilled);
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

export const hasField = (node: Record<string, unknown>, field: string): boolean =>
  field
    .split('|')
    .some((alternative) => isFilled(node[alternative] ?? node[`schema:${alternative}`]));

export const missingFields = (types: readonly string[], node: unknown): string[] => {
  if (typeof node !== 'object' || node === null) return [];
  const record = node as Record<string, unknown>;
  const missing = new Set<string>();
  for (const type of types) {
    const family = canonicalFamily(type);
    if (!family) continue;
    for (const field of REQUIRED_FIELDS[family] ?? []) {
      if (!hasField(record, field)) missing.add(field.split('|')[0] as string);
    }
  }
  return [...missing];
};

export type JsonLdParse =
  | { ok: true; nodes: Record<string, unknown>[] }
  | { ok: false; message: string };

const flattenJsonLd = (value: unknown, into: Record<string, unknown>[]): void => {
  if (Array.isArray(value)) {
    for (const entry of value) flattenJsonLd(entry, into);
    return;
  }
  if (typeof value !== 'object' || value === null) return;
  const record = value as Record<string, unknown>;
  const graph = record['@graph'];
  if (Array.isArray(graph)) {
    for (const entry of graph) flattenJsonLd(entry, into);
    const { '@graph': _graph, ...rest } = record;
    if (Object.keys(rest).some((key) => key !== '@context')) into.push(rest);
    return;
  }
  into.push(record);
};

export const parseJsonLd = (text: string): JsonLdParse => {
  try {
    const nodes: Record<string, unknown>[] = [];
    flattenJsonLd(JSON.parse(text), nodes);
    return { ok: true, nodes };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
};

const addValue = (target: Record<string, unknown>, key: string, value: unknown): void => {
  const current = target[key];
  if (current === undefined) target[key] = value;
  else if (Array.isArray(current)) current.push(value);
  else target[key] = [current, value];
};

const readLiteral = (element: Element, attribute: 'itemprop' | 'property'): string => {
  const tag = element.localName;
  const attr = (name: string): string | null => element.getAttribute(name);
  if (attr('content') !== null && (tag === 'meta' || attribute === 'property')) {
    return attr('content') ?? '';
  }
  if (tag === 'meta') return attr('content') ?? '';
  if (tag === 'a' || tag === 'link' || tag === 'area') {
    return (element as HTMLAnchorElement).href || attr('href') || '';
  }
  if (tag === 'img' || tag === 'source' || tag === 'audio' || tag === 'video' || tag === 'iframe') {
    return (element as HTMLImageElement).src || attr('src') || '';
  }
  if (tag === 'time') return attr('datetime') ?? collapseWhitespace(element.textContent ?? '');
  if (tag === 'data' || tag === 'meter') return attr('value') ?? '';
  return collapseWhitespace(element.textContent ?? '');
};

const readScope = (
  root: Element,
  scopeSelector: string,
  attribute: 'itemprop' | 'property',
  typeAttribute: 'itemtype' | 'typeof',
  depth: number,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  const rawType = root.getAttribute(typeAttribute);
  if (rawType) result['@type'] = rawType.split(/\s+/).map(stripSchemaPrefix).join(' ');
  if (depth > 6) return result;
  for (const prop of root.querySelectorAll(`[${attribute}]`)) {
    if (prop.parentElement?.closest(scopeSelector) !== root) continue;
    const key = (prop.getAttribute(attribute) ?? '').split(/\s+/)[0];
    if (!key) continue;
    const isScope = prop.matches(scopeSelector);
    addValue(
      result,
      stripSchemaPrefix(key),
      isScope
        ? readScope(prop, scopeSelector, attribute, typeAttribute, depth + 1)
        : readLiteral(prop, attribute),
    );
  }
  return result;
};

const MAX_ITEMS = 200;

export const analyzeStructuredData = (doc: Document): StructuredDataResult => {
  const items: SchemaItem[] = [];
  const invalid: InvalidJsonLd[] = [];

  doc.querySelectorAll('script[type="application/ld+json" i]').forEach((script, scriptIndex) => {
    const text = script.textContent ?? '';
    const parsed = parseJsonLd(text);
    if (!parsed.ok) {
      invalid.push({
        id: `invalid-${scriptIndex}`,
        message: parsed.message,
        snippet: truncate(collapseWhitespace(text), 160),
      });
      return;
    }
    parsed.nodes.forEach((node, nodeIndex) => {
      const types = schemaTypesOf(node);
      items.push({
        id: `jsonld-${scriptIndex}-${nodeIndex}`,
        format: 'json-ld',
        types,
        data: node,
        missing: missingFields(types, node),
        element: null,
      });
    });
  });

  Array.from(doc.querySelectorAll('[itemscope]'))
    .filter((element) => !element.hasAttribute('itemprop'))
    .slice(0, MAX_ITEMS)
    .forEach((element, index) => {
      const data = readScope(element, '[itemscope]', 'itemprop', 'itemtype', 0);
      const types = schemaTypesOf(data);
      items.push({
        id: `microdata-${index}`,
        format: 'microdata',
        types,
        data,
        missing: missingFields(types, data),
        element,
      });
    });

  Array.from(doc.querySelectorAll('[typeof]'))
    .filter((element) => !element.parentElement?.closest('[typeof]'))
    .slice(0, MAX_ITEMS)
    .forEach((element, index) => {
      const data = readScope(element, '[typeof]', 'property', 'typeof', 0);
      const types = schemaTypesOf(data);
      items.push({
        id: `rdfa-${index}`,
        format: 'rdfa',
        types,
        data,
        missing: missingFields(types, data),
        element,
      });
    });

  const types = [...new Set(items.flatMap((item) => item.types))].sort();
  return { items, invalid, types };
};
