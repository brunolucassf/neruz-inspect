import { useLocale, useT } from '../lib/i18n';
import { CREDITS_URL } from '../overlay/Credits';
import {
  type AreaId,
  type Collected,
  type Finding,
  type ReportData,
  type ReportSectionId,
  SCORED_AREAS,
} from '../tools/page/report/reportTypes';
import { uniqueRecommendations } from './findingText';
import { DocSection, FailedNote, FindingsTable, LightBadge, ScoreRing, SubTitle } from './parts';
import {
  A11yView,
  AssetsView,
  DesignView,
  LinksView,
  PerformanceView,
  SeoView,
  StructuredView,
  TagsView,
  TechView,
} from './sections';

const MAX_PRIORITIES = 10;

const isIncluded = (data: ReportData, section: ReportSectionId): boolean =>
  data.included.includes(section);

const findingsOf = (data: ReportData, ...areas: AreaId[]): Finding[] =>
  data.findings.filter((finding) => areas.includes(finding.area));

const okData = <TData,>(collected: Collected<TData> | undefined): TData | null =>
  collected?.status === 'ok' ? collected.data : null;

const Cover = ({ data }: { data: ReportData }) => {
  const t = useT();
  const locale = useLocale();
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(data.generatedAt);
  const showScore = isIncluded(data, 'summary');
  return (
    <header className="ni-doc__cover">
      <p className="ni-doc__kicker">{t('page.report.doc.kicker')}</p>
      <h1 className="ni-doc__title">{data.title || data.host}</h1>
      <p className="ni-doc__url">{data.url}</p>

      {data.thumbnail ? (
        <img
          className="ni-doc__thumb"
          src={data.thumbnail}
          alt={t('page.report.doc.thumbAlt')}
          width={640}
        />
      ) : null}

      <dl className="ni-doc__meta">
        {data.preparedFor ? (
          <div>
            <dt>{t('page.report.doc.preparedFor')}</dt>
            <dd>{data.preparedFor}</dd>
          </div>
        ) : null}
        {data.preparedBy ? (
          <div>
            <dt>{t('page.report.doc.preparedBy')}</dt>
            <dd>{data.preparedBy}</dd>
          </div>
        ) : null}
        <div>
          <dt>{t('page.report.doc.date')}</dt>
          <dd>{date}</dd>
        </div>
      </dl>

      {showScore ? (
        <div className="ni-doc__overall">
          <ScoreRing score={data.overall.score} light={data.overall.light} />
          <div>
            <p className="ni-doc__overall-label">{t('page.report.doc.overall')}</p>
            <LightBadge light={data.overall.light} />
            <p className="ni-doc__muted">
              {data.overall.score === null
                ? t('page.report.doc.overallNone')
                : t('page.report.doc.overallBasis', {
                    n: data.overall.measuredAreas,
                    total: data.overall.totalAreas,
                  })}
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
};

const Summary = ({ data }: { data: ReportData }) => {
  const t = useT();
  const priorities = uniqueRecommendations(data.findings).slice(0, MAX_PRIORITIES);
  return (
    <DocSection id="summary" title={t('page.report.doc.summaryTitle')}>
      <SubTitle>{t('page.report.doc.areasTitle')}</SubTitle>
      <ul className="ni-doc__areas">
        {SCORED_AREAS.map((area) => {
          const entry = data.areas.find((candidate) => candidate.area === area);
          if (!entry) return null;
          return (
            <li key={area} className="ni-doc__area" data-light={entry.light}>
              <ScoreRing score={entry.score} light={entry.light} size="small" />
              <div>
                <strong>{t(`page.report.doc.area.${area}`)}</strong>
                <LightBadge light={entry.light} />
                {entry.score !== null ? (
                  <span className="ni-doc__muted">
                    {t('page.report.doc.outOf', { n: entry.score })}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <SubTitle>{t('page.report.doc.prioritiesTitle')}</SubTitle>
      {priorities.length === 0 ? (
        <p>{t('page.report.doc.noFindings')}</p>
      ) : (
        <FindingsTable findings={priorities} />
      )}
      <p className="ni-doc__note">{t('page.report.doc.scoringNote')}</p>
      <p className="ni-doc__note">{t('page.report.doc.localNote')}</p>
    </DocSection>
  );
};

const Footer = () => {
  const t = useT();
  return (
    <footer className="ni-doc__footer">
      <span>{t('page.report.footer')}</span>
      <a href={CREDITS_URL} target="_blank" rel="noopener noreferrer">
        fontedev.com
      </a>
    </footer>
  );
};

export const ReportDocument = ({ data }: { data: ReportData }) => {
  const seo = okData(data.seo);
  const indexing = okData(data.indexing);
  const structured = okData(data.structured);
  const performance = okData(data.performance);
  const a11y = okData(data.a11y);
  const assets = okData(data.assets);
  const links = okData(data.links);
  const tech = okData(data.tech);
  const tags = okData(data.tags);
  const design = okData(data.design);

  return (
    <article className="ni-doc">
      <Cover data={data} />
      {isIncluded(data, 'summary') ? <Summary data={data} /> : null}

      {data.tech ? tech ? <TechView data={tech} /> : <FailedSection id="tech" /> : null}
      {data.tags ? tags ? <TagsView data={tags} /> : <FailedSection id="tags" /> : null}
      {data.seo ? (
        seo ? (
          <SeoView
            seo={seo}
            indexing={indexing}
            indexingFailed={data.indexing?.status === 'failed'}
            findings={findingsOf(data, 'seo', 'indexing')}
            url={data.url}
          />
        ) : (
          <FailedSection id="seo" />
        )
      ) : null}
      {data.structured ? (
        structured ? (
          <StructuredView data={structured} findings={findingsOf(data, 'structured')} />
        ) : (
          <FailedSection id="structured" />
        )
      ) : null}
      {data.performance ? (
        performance ? (
          <PerformanceView data={performance} findings={findingsOf(data, 'performance')} />
        ) : (
          <FailedSection id="performance" />
        )
      ) : null}
      {data.a11y ? (
        a11y ? (
          <A11yView data={a11y} findings={findingsOf(data, 'a11y')} />
        ) : (
          <FailedSection id="a11y" />
        )
      ) : null}
      {data.assets ? (
        assets ? (
          <AssetsView data={assets} findings={findingsOf(data, 'assets')} />
        ) : (
          <FailedSection id="assets" />
        )
      ) : null}
      {data.links ? (
        links ? (
          <LinksView data={links} findings={findingsOf(data, 'links')} />
        ) : (
          <FailedSection id="links" />
        )
      ) : null}
      {data.design ? design ? <DesignView data={design} /> : <FailedSection id="design" /> : null}

      <Footer />
    </article>
  );
};

const FailedSection = ({ id }: { id: ReportSectionId }) => {
  const t = useT();
  return (
    <DocSection id={`failed-${id}`} title={t(`page.report.section.${id}`)}>
      <FailedNote />
    </DocSection>
  );
};
