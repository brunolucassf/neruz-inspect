const LENGTH_PATTERN = /^(-?[\d.]+)(.*)$/;

export const splitLength = (text: string): { value: string; unit: string } => {
  const match = LENGTH_PATTERN.exec(text);
  return match ? { value: match[1] ?? text, unit: match[2] ?? '' } : { value: text, unit: '' };
};
