import { Lock } from 'lucide-react';
import { useT } from '../../../lib/i18n';
import { getElementLabel } from '../../../lib/picker';
import { Badge, CodeChip } from '../../../ui';
import { PanelMeta } from '../../../ui/PanelSlots';

type ElementMetaProps = { element: Element | null; isLocked: boolean };

export const ElementMeta = ({ element, isLocked }: ElementMetaProps) => {
  const t = useT();
  if (!element) return null;
  const label = getElementLabel(element);
  const tag = element.localName;
  return (
    <PanelMeta>
      <CodeChip accent={tag}>{label.slice(tag.length)}</CodeChip>
      {isLocked ? (
        <Badge tone="accent" icon={<Lock size={12} aria-hidden="true" />}>
          {t('layout.meta.locked')}
        </Badge>
      ) : null}
    </PanelMeta>
  );
};
