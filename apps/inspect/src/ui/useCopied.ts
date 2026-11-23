import { useEffect, useRef, useState } from 'react';
import { copyText } from '../lib/clipboard';

const CONFIRM_MS = 1200;

type CopiedControls = {
  isCopied: boolean;
  copy: (text: string, label: string) => Promise<void>;
};

export const useCopied = (): CopiedControls => {
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (text: string, label: string): Promise<void> => {
    const copied = await copyText(text, label);
    if (!copied) return;
    setIsCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIsCopied(false), CONFIRM_MS);
  };

  return { isCopied, copy };
};
