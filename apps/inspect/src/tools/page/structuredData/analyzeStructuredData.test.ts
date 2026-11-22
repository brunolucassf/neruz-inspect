import { describe, expect, it } from 'vitest';
import {
  canonicalFamily,
  missingFields,
  parseJsonLd,
  schemaTypesOf,
  stripSchemaPrefix,
} from './analyzeStructuredData';

describe('parseJsonLd', () => {
  it('flattens @graph and arrays', () => {
    const parsed = parseJsonLd(
      JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [{ '@type': 'WebSite' }, { '@type': 'Organization', name: 'A' }],
      }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.nodes).toHaveLength(2);
  });

  it('reports invalid JSON', () => {
    const parsed = parseJsonLd('{"@type": "Product",}');
    expect(parsed.ok).toBe(false);
  });
});

describe('types', () => {
  it('normalizes schema.org prefixes and arrays', () => {
    expect(stripSchemaPrefix('https://schema.org/Product')).toBe('Product');
    expect(schemaTypesOf({ '@type': ['schema:Article', 'Thing'] })).toEqual(['Article', 'Thing']);
  });

  it('maps subtypes to the checked families', () => {
    expect(canonicalFamily('BlogPosting')).toBe('Article');
    expect(canonicalFamily('Restaurant')).toBe('LocalBusiness');
    expect(canonicalFamily('Person')).toBeNull();
  });
});

describe('missingFields', () => {
  it('lists common fields absent from a Product', () => {
    expect(missingFields(['Product'], { name: 'x', image: [] })).toEqual([
      'image',
      'description',
      'offers',
    ]);
  });

  it('accepts either alternative for opening hours', () => {
    const base = { name: 'a', address: 'b', telephone: 'c' };
    expect(missingFields(['LocalBusiness'], base)).toEqual(['openingHoursSpecification']);
    expect(missingFields(['LocalBusiness'], { ...base, openingHours: 'Mo-Fr 9-18' })).toEqual([]);
  });

  it('ignores unknown types', () => {
    expect(missingFields(['Person'], {})).toEqual([]);
  });
});
