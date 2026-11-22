import { useState } from 'react';
import { useT } from '../../../lib/i18n';
import { PanelSection } from '../../../ui';
import { safeHost, truncate } from '../shared/format';
import type { SeoResult } from './analyzeSeo';

type PreviewFields = {
  title: string;
  description: string;
  image: string;
  host: string;
  url: string;
};

export const buildPreviewFields = (seo: SeoResult): PreviewFields => {
  const { openGraph, twitter } = seo;
  const rawImage = openGraph['og:image'] || twitter['twitter:image'] || '';
  let image = '';
  try {
    image = rawImage ? new URL(rawImage, seo.url).href : '';
  } catch {
    image = '';
  }
  return {
    title: openGraph['og:title'] || twitter['twitter:title'] || seo.title,
    description: openGraph['og:description'] || twitter['twitter:description'] || seo.description,
    image,
    host: safeHost(seo.url),
    url: seo.url,
  };
};

const CardImage = ({ src }: { src: string }) => {
  const t = useT();
  const [failed, setFailed] = useState(false);
  return (
    <div className="ni-pg-card__image">
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span>{t('page.seoMeta.preview.noImage')}</span>
      )}
    </div>
  );
};

const GoogleResult = ({ fields }: { fields: PreviewFields }) => {
  let crumbs = fields.host;
  try {
    const segments = new URL(fields.url).pathname.split('/').filter(Boolean).slice(0, 3);
    crumbs = [fields.host, ...segments].join(' › ');
  } catch {}
  return (
    <div className="ni-pg-serp">
      <span className="ni-pg-serp__url">{crumbs}</span>
      <span className="ni-pg-serp__title">{truncate(fields.title, 60)}</span>
      <span className="ni-pg-serp__desc">{truncate(fields.description, 160)}</span>
    </div>
  );
};

const SocialCard = ({
  variant,
  fields,
  twitterCard,
}: {
  variant: 'whatsapp' | 'linkedin' | 'x';
  fields: PreviewFields;
  twitterCard?: string;
}) => {
  const showDescription = variant !== 'linkedin';
  const smallCard = variant === 'x' && twitterCard === 'summary';
  return (
    <div className={`ni-pg-card ni-pg-card--${variant}`}>
      {smallCard ? null : <CardImage src={fields.image} />}
      <div className="ni-pg-card__body">
        {variant === 'x' ? null : <span className="ni-pg-card__domain">{fields.host}</span>}
        <span className="ni-pg-card__title">{fields.title}</span>
        {showDescription ? <span className="ni-pg-card__desc">{fields.description}</span> : null}
        {variant === 'x' ? <span className="ni-pg-card__domain">{fields.host}</span> : null}
      </div>
    </div>
  );
};

export const SeoPreviews = ({ seo }: { seo: SeoResult }) => {
  const t = useT();
  const fields = buildPreviewFields(seo);
  return (
    <>
      <PanelSection title={t('page.seoMeta.preview.google')}>
        <GoogleResult fields={fields} />
      </PanelSection>
      <PanelSection title={t('page.seoMeta.preview.whatsapp')}>
        <SocialCard variant="whatsapp" fields={fields} />
      </PanelSection>
      <PanelSection title={t('page.seoMeta.preview.linkedin')}>
        <SocialCard variant="linkedin" fields={fields} />
      </PanelSection>
      <PanelSection title={t('page.seoMeta.preview.x')}>
        <SocialCard variant="x" fields={fields} twitterCard={seo.twitter['twitter:card']} />
      </PanelSection>
      <p className="ni-hint">{t('page.seoMeta.preview.hint')}</p>
    </>
  );
};
