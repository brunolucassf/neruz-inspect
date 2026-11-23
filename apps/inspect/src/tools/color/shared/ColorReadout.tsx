import {
  COLOR_FORMATS,
  type Color,
  type ColorFormat,
  formatColor,
  toHex,
} from '../../../lib/color';
import { useSettingsStore } from '../../../lib/settings';
import { Card, CopyRow, Swatch } from '../../../ui';

type ColorReadoutProps = { color: Color };

const orderFormats = (preferred: ColorFormat): ColorFormat[] => [
  preferred,
  ...COLOR_FORMATS.filter((format) => format !== preferred),
];

export const ColorReadout = ({ color }: ColorReadoutProps) => {
  const preferred = useSettingsStore((state) => state.colorFormat);
  return (
    <Card variant="rows">
      {orderFormats(preferred).map((format, index) => (
        <CopyRow
          key={format}
          label={format.toUpperCase()}
          value={formatColor(color, format)}
          leading={index === 0 ? <Swatch color={toHex(color)} size={20} /> : undefined}
        />
      ))}
    </Card>
  );
};
