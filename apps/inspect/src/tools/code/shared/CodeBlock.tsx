import { copyText } from '../../../lib/clipboard';
import { downloadText } from '../../../lib/download';
import { useT } from '../../../lib/i18n';
import { toast } from '../../../lib/toast';
import './code.css';

type CodeBlockProps = {
  code: string;
  label: string;
  filename?: string;
  mime?: string;
};

export const CodeBlock = ({ code, label, filename, mime }: CodeBlockProps) => {
  const t = useT();
  const handleDownload = (): void => {
    if (!filename) return;
    downloadText(code, filename, mime);
    toast(t('code.shared.downloaded'), 'success');
  };
  return (
    <div className="ni-codeblock">
      <pre className="ni-codeblock__pre">
        <code>{code}</code>
      </pre>
      <div className="ni-codeblock__actions">
        <button
          type="button"
          className="ni-button ni-button--primary"
          onClick={() => void copyText(code, label)}
        >
          {t('code.shared.copy')}
        </button>
        {filename ? (
          <button type="button" className="ni-button" onClick={handleDownload}>
            {t('code.shared.download')}
          </button>
        ) : null}
      </div>
    </div>
  );
};
