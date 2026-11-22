import { useT } from '../../../lib/i18n';
import { Badge } from '../../../ui';
import { type Severity, severityTone } from './severity';
import './page.css';

type AlertProps = {
  severity: Severity;
  message: string;
  onSelect?: () => void;
};

export const Alert = ({ severity, message, onSelect }: AlertProps) => {
  const t = useT();
  const content = (
    <>
      <Badge tone={severityTone(severity)}>{t(`page.common.severity.${severity}`)}</Badge>
      <span className="ni-pg-alert__text">{message}</span>
    </>
  );
  return onSelect ? (
    <button type="button" className="ni-pg-alert ni-pg-row--button" onClick={onSelect}>
      {content}
    </button>
  ) : (
    <div className="ni-pg-alert">{content}</div>
  );
};
