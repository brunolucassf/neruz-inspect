const SYMBOL_STROKE = 'M16 76V36L36 16H80V28H40.9706L28 40.9706V76Z';

export const BrandMark = ({ size = 22 }: { size?: number }) => (
  <svg
    className="ni-brand-mark"
    width={size}
    height={size}
    viewBox="12 12 104 104"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <path d={SYMBOL_STROKE} />
    <path d={SYMBOL_STROKE} transform="rotate(180 64 64)" />
    <path d="M64 52L76 64L64 76L52 64Z" />
  </svg>
);
