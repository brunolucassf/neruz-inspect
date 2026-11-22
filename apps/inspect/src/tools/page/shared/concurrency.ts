type PoolOptions<TResult> = {
  signal?: AbortSignal;
  onResult?: (result: TResult, index: number) => void;
};

export const runPool = async <TItem, TResult>(
  items: readonly TItem[],
  concurrency: number,
  worker: (item: TItem, index: number) => Promise<TResult>,
  options: PoolOptions<TResult> = {},
): Promise<void> => {
  let cursor = 0;
  const lane = async (): Promise<void> => {
    while (cursor < items.length) {
      if (options.signal?.aborted) return;
      const index = cursor++;
      const item = items[index] as TItem;
      const result = await worker(item, index);
      if (options.signal?.aborted) return;
      options.onResult?.(result, index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, lane));
};
