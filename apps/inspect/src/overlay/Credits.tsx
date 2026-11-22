import { useT } from '../lib/i18n';

export const CREDITS_URL = 'https://fontedev.com';

export const Credits = () => {
  const t = useT();
  return (
    <footer className="ni-credits">
      <span>{t('core.credits.prefix')} </span>
      <a href={CREDITS_URL} target="_blank" rel="noopener noreferrer">
        {t('core.credits.name')}
      </a>
    </footer>
  );
};
