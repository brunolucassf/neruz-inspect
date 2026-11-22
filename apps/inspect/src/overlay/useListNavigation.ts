import { type KeyboardEvent, useCallback, useEffect, useState } from 'react';

type ListNavigation = {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  handleKeyDown: (event: KeyboardEvent) => void;
};

export const useListNavigation = (
  count: number,
  onChoose: (index: number) => void,
): ListNavigation => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(count - 1, 0)));
  }, [count]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (count === 0) return;
      if (event.key === 'ArrowDown') setActiveIndex((current) => (current + 1) % count);
      else if (event.key === 'ArrowUp') setActiveIndex((current) => (current - 1 + count) % count);
      else if (event.key === 'Home') setActiveIndex(0);
      else if (event.key === 'End') setActiveIndex(count - 1);
      else if (event.key === 'Enter') onChoose(activeIndex);
      else return;
      event.preventDefault();
    },
    [count, activeIndex, onChoose],
  );

  return { activeIndex, setActiveIndex, handleKeyDown };
};
