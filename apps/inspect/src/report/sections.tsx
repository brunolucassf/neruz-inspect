import { useT } from '../lib/i18n';
import type {
  A11ySection,
  AssetsSection,
  DesignSection,
  Finding,
  IndexingSection,
  LinksSection,
  PerformanceSection,
  SeoSection,
  StructuredSection,
  TagsSection,
  TechSection,
  VitalName,
} from '../tools/page/report/reportTypes';
import { DESCRIPTION_RANGE, rateLength, TITLE_RANGE } from '../tools/page/seoMeta/analyzeSeo';
import { formatBytes, safeHost } from '../tools/page/shared/format';
import { formatVital } from '../tools/page/vitals/vitalsMath';
import { DocSection, FindingsTable, Note, SubTitle } from './parts';

const HTTP_URL = /^https?:\/\//i;
const HEX_COLOR = /^#[0-9a-f]{3,8}$/i;
const MAX_HEADINGS_SHOWN = 40;

const LENGTH_FLAG: Record<ReturnType<typeof rateLength>, 'ok' | 'warn' | 'bad'> = {
  empty: 'bad',
  short: 'warn',
  good: 'ok',
  long: 'warn',
};

export const TechView = ({ data }: { data: TechSection }) => {
  const t = useT();
  return (
    <DocSection
      id="tech"
      title={t('page.report.doc.tech.title')}
      intro={t('page.report.doc.tech.intro')}
    >
      {data.list.length === 0 ? (
        <p>{t('page.report.doc.tech.empty')}</p>
      ) : (
        <table className="ni-doc__table">
          <thead>
            <tr>
              <th scope="col">{t('page.report.doc.tech.col.name')}</th>
              <th scope="col">{t('page.report.doc.tech.col.category')}</th>
              <th scope="col">{t('page.report.doc.tech.col.version')}</th>
              <th scope="col">{t('page.report.doc.tech.col.confidence')}</th>
            </tr>
          </thead>
          <tbody>
            {data.list.map((item) => (
              <tr key={item.name}>
                <td>
                  <strong>{item.name}</strong>
                </td>
                <td>{t(`tech.techStack.cat.${item.category}`)}</td>
                <td>{item.version || '–'}</td>
                <td>{t(`tech.techStack.confidence.${item.confidence}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Note>{t('tech.techStack.note')}</Note>
      {data.headersAvailable ? null : <Note>{t('tech.techStack.headersUnavailable')}</Note>}
    </DocSection>
  );
};

export const TagsView = ({ data }: { data: TagsSection }) => {
  const t = useT();
  return (
    <DocSection
      id="tags"
      title={t('page.report.doc.tags.title')}
      intro={t('page.report.doc.tags.intro')}
    >
      {data.platforms.length === 0 ? (
        <p>{t('page.report.doc.tags.empty')}</p>
      ) : (
        <table className="ni-doc__table">
          <thead>
            <tr>
              <th scope="col">Tag</th>
              <th scope="col">{t('page.report.doc.tags.ids')}</th>
              <th scope="col">{t('page.report.doc.tags.events')}</th>
            </tr>
          </thead>
          <tbody>
            {data.platforms.map((platform) => (
              <tr key={platform.name}>
                <td>
                  <strong>{platform.name}</strong>
                  <br />
                  <span className="ni-doc__muted">
                    {platform.active
                      ? t('page.report.doc.tags.active')
                      : t('page.report.doc.tags.notLoaded')}
                  </span>
                </td>
                <td className="ni-doc__mono">
                  {platform.ids.length > 0
                    ? platform.ids.join(', ')
                    : t('page.report.doc.tags.noId')}
                </td>
                <td>
                  {platform.events.length > 0
                    ? platform.events
                        .map(
                          (event) =>
                            `${event.name || '–'}${event.count > 1 ? ` ×${event.count}` : ''}`,
                        )
                        .join(', ')
                    : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Note>{t('tech.tagsPixels.note')}</Note>
    </DocSection>
  );
};

const SocialPreview = ({ seo, url }: { seo: SeoSection; url: string }) => {
  const t = useT();
  const image = seo.openGraph['og:image'] ?? '';
  const title = seo.openGraph['og:title'] || seo.title;
  const description = seo.openGraph['og:description'] || seo.description;
  return (
    <figure className="ni-doc__social">
      {HTTP_URL.test(image) ? (
        <img
          className="ni-doc__social-image"
          src={image}
          alt=""
          width={1200}
          height={630}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="ni-doc__social-image ni-doc__social-image--none">
          {t('page.report.doc.seo.noImage')}
        </div>
      )}
      <figcaption className="ni-doc__social-text">
        <span className="ni-doc__muted">{safeHost(url).toUpperCase()}</span>
        <strong>{title || t('page.seoMeta.none')}</strong>
        <span>{description}</span>
      </figcaption>
    </figure>
  );
};

export const SeoView = ({
  seo,
  indexing,
  indexingFailed,
  findings,
  url,
}: {
  seo: SeoSection;
  indexing: IndexingSection | null;
  indexingFailed: boolean;
  findings: readonly Finding[];
  url: string;
}) => {
  const t = useT();
  const none = t('page.seoMeta.none');
  const rows: [string, string, 'ok' | 'warn' | 'bad' | null][] = [
    [
      t('page.seoMeta.field.title'),
      seo.title
        ? `${seo.title} (${t('page.seoMeta.chars', { n: seo.title.length, ...TITLE_RANGE })})`
        : none,
      LENGTH_FLAG[rateLength(seo.title.length, TITLE_RANGE)],
    ],
    [
      t('page.seoMeta.field.description'),
      seo.description
        ? `${seo.description} (${t('page.seoMeta.chars', { n: seo.description.length, ...DESCRIPTION_RANGE })})`
        : none,
      LENGTH_FLAG[rateLength(seo.description.length, DESCRIPTION_RANGE)],
    ],
    [t('page.seoMeta.field.canonical'), seo.canonical || none, null],
    [t('page.seoMeta.field.robots'), seo.robots || none, null],
    [t('page.seoMeta.field.lang'), seo.lang || none, null],
    [t('page.seoMeta.field.viewport'), seo.viewport || none, null],
  ];
  const shownHeadings = seo.headings.slice(0, MAX_HEADINGS_SHOWN);
  return (
    <DocSection
      id="seo"
      title={t('page.report.doc.seo.title')}
      intro={t('page.report.doc.seo.intro')}
    >
      <SubTitle>{t('page.report.doc.seo.basics')}</SubTitle>
      <dl className="ni-doc__facts">
        {rows.map(([label, value, flag]) => (
          <div key={label} className="ni-doc__fact" data-flag={flag ?? undefined}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {seo.hreflangCount > 0 ? (
        <Note>{t('page.report.doc.seo.hreflang', { n: seo.hreflangCount })}</Note>
      ) : null}

      <SubTitle>{t('page.report.doc.seo.social')}</SubTitle>
      <p className="ni-doc__muted">{t('page.report.doc.seo.socialHint')}</p>
      <SocialPreview seo={seo} url={url} />

      <SubTitle>{t('page.report.doc.seo.headings')}</SubTitle>
      {shownHeadings.length === 0 ? (
        <p>{t('page.seoMeta.headings.none')}</p>
      ) : (
        <ul className="ni-doc__headings">
          {shownHeadings.map((heading, index) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: headings repeat and have no id
              key={index}
              style={{ paddingInlineStart: `${(heading.level - 1) * 14}px` }}
            >
              <span className="ni-doc__tag">H{heading.level}</span>{' '}
              {heading.text || t('page.seoMeta.headings.emptyText')}
            </li>
          ))}
        </ul>
      )}
      <Note>{t('page.report.doc.seo.headingsTotal', { n: seo.headingsTotal })}</Note>

      <SubTitle>{t('page.report.doc.seo.indexing')}</SubTitle>
      {indexingFailed || indexing === null ? (
        <p>{t('page.report.doc.notMeasured')}</p>
      ) : (
        <ul className="ni-doc__list">
          <li>
            {indexing.robotsFound
              ? t('page.report.doc.seo.robotsFound')
              : indexing.robotsStatus === null
                ? t('page.report.doc.seo.robotsUnknown')
                : t('page.report.doc.seo.robotsMissing')}
          </li>
          {indexing.pathBlockedForAll === null ? null : (
            <li>
              {indexing.pathBlockedForAll
                ? t('page.report.doc.seo.pathBlocked')
                : t('page.report.doc.seo.pathAllowed')}
            </li>
          )}
          {indexing.sitemaps.map((sitemap) => (
            <li key={sitemap.url}>
              <span className="ni-doc__mono">{sitemap.url}</span>:{' '}
              {sitemap.kind === 'gzip'
                ? t('page.report.doc.seo.sitemapGzip')
                : sitemap.kind === 'index'
                  ? t('page.robotsSitemap.indexCount', { n: sitemap.entries })
                  : sitemap.kind === 'urlset'
                    ? t('page.robotsSitemap.urlCount', { n: sitemap.entries })
                    : t('page.report.doc.seo.sitemapNone')}
            </li>
          ))}
        </ul>
      )}

      {findings.length > 0 ? (
        <>
          <SubTitle>{t('page.report.doc.seo.findings')}</SubTitle>
          <FindingsTable findings={findings} />
        </>
      ) : null}
    </DocSection>
  );
};

export const StructuredView = ({
  data,
  findings,
}: {
  data: StructuredSection;
  findings: readonly Finding[];
}) => {
  const t = useT();
  return (
    <DocSection
      id="structured"
      title={t('page.report.doc.structured.title')}
      intro={t('page.report.doc.structured.intro')}
    >
      {data.itemTotal === 0 ? (
        <p>{t('page.structuredData.empty.title')}</p>
      ) : (
        <>
          <SubTitle>{t('page.report.doc.structured.types')}</SubTitle>
          <p>{data.types.join(', ') || t('page.structuredData.untyped')}</p>
          <table className="ni-doc__table">
            <thead>
              <tr>
                <th scope="col">{t('page.report.doc.structured.col.format')}</th>
                <th scope="col">{t('page.report.doc.structured.col.type')}</th>
                <th scope="col">{t('page.report.doc.structured.col.missing')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: items have no stable id
                <tr key={index}>
                  <td>{t(`page.structuredData.format.${item.format}`)}</td>
                  <td>{item.types.join(', ') || t('page.structuredData.untyped')}</td>
                  <td>{item.missing.join(', ') || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.itemTotal > data.items.length ? (
            <Note>
              {t('page.report.doc.structured.more', {
                shown: data.items.length,
                total: data.itemTotal,
              })}
            </Note>
          ) : null}
        </>
      )}
      {data.invalidCount > 0 ? (
        <Note>{t('page.report.doc.structured.invalid', { n: data.invalidCount })}</Note>
      ) : null}
      {findings.length > 0 ? <FindingsTable findings={findings} /> : null}
    </DocSection>
  );
};

const VITAL_ORDER: readonly VitalName[] = ['lcp', 'cls', 'inp', 'fcp', 'ttfb'];

export const PerformanceView = ({
  data,
  findings,
}: {
  data: PerformanceSection;
  findings: readonly Finding[];
}) => {
  const t = useT();
  return (
    <DocSection id="performance" title={t('page.report.doc.perf.title')}>
      <Note>{t('page.report.doc.localNote')}</Note>
      <table className="ni-doc__table">
        <thead>
          <tr>
            <th scope="col">{t('page.report.doc.perf.col.metric')}</th>
            <th scope="col">{t('page.report.doc.perf.col.value')}</th>
            <th scope="col">{t('page.report.doc.perf.col.rating')}</th>
          </tr>
        </thead>
        <tbody>
          {VITAL_ORDER.map((metric) => {
            const reading = data.vitals.find((entry) => entry.metric === metric);
            const value = reading?.value ?? null;
            return (
              <tr key={metric}>
                <td>
                  <strong>{metric.toUpperCase()}</strong>{' '}
                  <span className="ni-doc__muted">{t(`page.vitals.metric.${metric}`)}</span>
                </td>
                <td>
                  {value === null
                    ? metric === 'inp'
                      ? t('page.report.doc.needsInteraction')
                      : t('page.report.doc.notMeasuredShort')
                    : formatVital(metric, value)}
                </td>
                <td>
                  {reading?.rating ? (
                    <span className="ni-doc__rating" data-rating={reading.rating}>
                      {t(`page.vitals.rating.${reading.rating}`)}
                    </span>
                  ) : (
                    '–'
                  )}
                </td>
              </tr>
            );
          })}
          <tr>
            <td>
              <strong>{t('page.report.doc.perf.dom')}</strong>
            </td>
            <td>{data.domNodes}</td>
            <td>
              <span className="ni-doc__rating" data-rating={data.domRating}>
                {t(`page.vitals.rating.${data.domRating}`)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {data.resources.length > 0 ? (
        <>
          <SubTitle>{t('page.report.doc.perf.resources')}</SubTitle>
          <table className="ni-doc__table">
            <thead>
              <tr>
                <th scope="col">{t('page.report.doc.perf.col.resource')}</th>
                <th scope="col">{t('page.report.doc.perf.col.requests')}</th>
                <th scope="col">{t('page.report.doc.perf.col.size')}</th>
              </tr>
            </thead>
            <tbody>
              {data.resources.map((resource) => (
                <tr key={resource.group}>
                  <td>{t(`page.vitals.resource.${resource.group}`)}</td>
                  <td>{resource.count}</td>
                  <td>{formatBytes(resource.bytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            {t('page.report.doc.perf.total', {
              n: data.totalRequests,
              size: formatBytes(data.totalBytes),
            })}
          </p>
          <Note>{t('page.report.doc.perf.sizeNote')}</Note>
        </>
      ) : null}

      {findings.length > 0 ? (
        <>
          <SubTitle>{t('page.report.doc.seo.findings')}</SubTitle>
          <FindingsTable findings={findings} />
        </>
      ) : null}
    </DocSection>
  );
};

export const A11yView = ({
  data,
  findings,
}: {
  data: A11ySection;
  findings: readonly Finding[];
}) => {
  const t = useT();
  return (
    <DocSection
      id="a11y"
      title={t('page.report.doc.a11y.title')}
      intro={t('page.report.doc.a11y.intro')}
    >
      <p>{t('page.report.doc.a11y.scanned', { n: data.scanned })}</p>
      {data.truncated ? <Note>{t('page.common.limit5000')}</Note> : null}
      {findings.length === 0 ? (
        <p>{t('page.report.doc.a11y.empty')}</p>
      ) : (
        <>
          <FindingsTable findings={findings} />
          <table className="ni-doc__table">
            <thead>
              <tr>
                <th scope="col">{t('page.report.doc.a11y.col.rule')}</th>
                <th scope="col">{t('page.report.doc.col.count')}</th>
                <th scope="col">{t('page.report.doc.a11y.col.example')}</th>
              </tr>
            </thead>
            <tbody>
              {data.rules.map((rule) => (
                <tr key={rule.rule}>
                  <td>{t(`page.a11y.rule.${rule.rule}`)}</td>
                  <td>{rule.count}</td>
                  <td className="ni-doc__mono">{rule.example || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <Note>{t('page.a11y.note')}</Note>
    </DocSection>
  );
};

export const AssetsView = ({
  data,
  findings,
}: {
  data: AssetsSection;
  findings: readonly Finding[];
}) => {
  const t = useT();
  return (
    <DocSection
      id="assets"
      title={t('page.report.doc.assets.title')}
      intro={t('page.report.doc.assets.intro')}
    >
      <ul className="ni-doc__list">
        <li>{t('page.report.doc.assets.total', { n: data.total })}</li>
        <li>{t('page.report.doc.assets.withProblems', { n: data.withProblems })}</li>
        {data.knownBytes > 0 ? (
          <li>{t('page.report.doc.assets.known', { size: formatBytes(data.knownBytes) })}</li>
        ) : null}
        {data.byCategory.map((entry) => (
          <li key={entry.category}>
            {t(`page.report.doc.assets.cat.${entry.category}`)}: {entry.count}
          </li>
        ))}
      </ul>
      {data.truncated ? <Note>{t('page.common.limit5000')}</Note> : null}
      {findings.length === 0 ? (
        <p>{t('page.report.doc.assets.empty')}</p>
      ) : (
        <FindingsTable findings={findings} />
      )}
    </DocSection>
  );
};

export const LinksView = ({
  data,
  findings,
}: {
  data: LinksSection;
  findings: readonly Finding[];
}) => {
  const t = useT();
  return (
    <DocSection
      id="links"
      title={t('page.report.doc.links.title')}
      intro={t('page.report.doc.links.intro')}
    >
      <ul className="ni-doc__list">
        <li>{t('page.report.doc.links.total', { n: data.total })}</li>
        <li>{t('page.report.doc.links.internal', { n: data.internal })}</li>
        <li>{t('page.report.doc.links.external', { n: data.external })}</li>
        <li>{t('page.report.doc.links.contact', { n: data.contact })}</li>
        <li>{t('page.report.doc.links.nofollow', { n: data.nofollow })}</li>
      </ul>
      {data.truncated ? <Note>{t('page.links.truncated')}</Note> : null}
      {data.statusChecked ? (
        <>
          <p>
            {t('page.report.doc.links.checked', {
              n: data.checkedCount,
              ok: data.okCount,
              broken: data.brokenTotal,
            })}
          </p>
          {data.restrictedCount > 0 ? (
            <Note>{t('page.report.doc.links.restricted', { n: data.restrictedCount })}</Note>
          ) : null}
          {data.unreachableCount > 0 ? (
            <Note>{t('page.report.doc.links.unreachable', { n: data.unreachableCount })}</Note>
          ) : null}
          <SubTitle>{t('page.report.doc.links.brokenTitle')}</SubTitle>
          {data.broken.length === 0 ? (
            <p>{t('page.report.doc.links.noBroken')}</p>
          ) : (
            <>
              <table className="ni-doc__table">
                <thead>
                  <tr>
                    <th scope="col">{t('page.report.doc.links.col.url')}</th>
                    <th scope="col">{t('page.report.doc.links.col.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.broken.map((link) => (
                    <tr key={link.url}>
                      <td className="ni-doc__mono">{link.url}</td>
                      <td>{link.status ?? '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.brokenTotal > data.broken.length ? (
                <Note>
                  {t('page.report.doc.links.moreBroken', {
                    shown: data.broken.length,
                    total: data.brokenTotal,
                  })}
                </Note>
              ) : null}
            </>
          )}
        </>
      ) : (
        <Note>{t('page.report.doc.links.notChecked')}</Note>
      )}
      {findings.length > 0 ? <FindingsTable findings={findings} /> : null}
    </DocSection>
  );
};

const ScaleList = ({ items }: { items: { name: string; px: number; count: number }[] }) => (
  <ul className="ni-doc__chips">
    {items.map((item) => (
      <li key={item.name}>
        <strong>{item.name}</strong> {Math.round(item.px * 100) / 100}px
      </li>
    ))}
  </ul>
);

export const DesignView = ({ data }: { data: DesignSection }) => {
  const t = useT();
  const empty = data.colors.length === 0 && data.fonts.length === 0 && data.typeScale.length === 0;
  const largestSize = Math.max(1, ...data.typeScale.map((step) => step.px));
  return (
    <DocSection
      id="design"
      title={t('page.report.doc.design.title')}
      intro={t('page.report.doc.design.intro')}
    >
      {empty ? <p>{t('page.report.doc.design.empty')}</p> : null}
      {data.colors.length > 0 ? (
        <>
          <SubTitle>{t('page.report.doc.design.colors')}</SubTitle>
          <ul className="ni-doc__palette">
            {data.colors.map((color) => (
              <li key={color.name} className="ni-doc__swatch">
                <span
                  className="ni-doc__swatch-chip"
                  style={HEX_COLOR.test(color.hex) ? { background: color.hex } : undefined}
                />
                <strong>{color.name}</strong>
                <span className="ni-doc__mono">{color.hex}</span>
                <span className="ni-doc__muted">
                  {t('page.report.doc.design.uses', { n: color.count })}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {data.fonts.length > 0 ? (
        <>
          <SubTitle>{t('page.report.doc.design.fonts')}</SubTitle>
          <table className="ni-doc__table">
            <tbody>
              {data.fonts.map((font) => (
                <tr key={font.name}>
                  <td>
                    <strong>{font.name}</strong>
                  </td>
                  <td className="ni-doc__mono">{font.stack}</td>
                  <td>{t('page.report.doc.design.uses', { n: font.count })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
      {data.typeScale.length > 0 ? (
        <>
          <SubTitle>{t('page.report.doc.design.scale')}</SubTitle>
          <ul className="ni-doc__scale">
            {data.typeScale.map((step) => (
              <li key={step.name}>
                <span className="ni-doc__scale-name">{step.name}</span>
                <span className="ni-doc__scale-bar">
                  <span style={{ width: `${Math.max(4, (step.px / largestSize) * 100)}%` }} />
                </span>
                <span className="ni-doc__mono">{Math.round(step.px * 100) / 100}px</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {data.spacing.length > 0 ? (
        <>
          <SubTitle>{t('page.report.doc.design.spacing')}</SubTitle>
          <ScaleList items={data.spacing} />
        </>
      ) : null}
      {data.radii.length > 0 ? (
        <>
          <SubTitle>{t('page.report.doc.design.radii')}</SubTitle>
          <ScaleList items={data.radii} />
        </>
      ) : null}
      <Note>{t('page.report.doc.design.scanned', { n: data.scanned })}</Note>
      {data.limited ? <Note>{t('page.common.limit5000')}</Note> : null}
    </DocSection>
  );
};
