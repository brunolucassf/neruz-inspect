import {
  type AnyMessageDefinition,
  createEnvelope,
  createSeqCounter,
  type DataOf,
  type PayloadOf,
  unwrapReply,
  withTimeout,
} from '@neruz/core';
import { browser } from 'wxt/browser';
import {
  captureRequest,
  fetchRequest,
  openReportRequest,
  overlayStateEvent,
  probeRequest,
} from '../messages';
import type { ProbeName } from '../tools/types';

const nextSeq = createSeqCounter();

const sendRequest = async <TDefinition extends AnyMessageDefinition>(
  definition: TDefinition,
  payload: PayloadOf<TDefinition>,
): Promise<DataOf<TDefinition>> => {
  const seq = nextSeq();
  const reply: unknown = await withTimeout(
    browser.runtime.sendMessage(createEnvelope(definition, payload, seq)),
    definition.timeoutMs,
    definition.type,
  );
  return unwrapReply(definition, reply, seq);
};

export const runProbe = async <TResult = unknown>(
  name: ProbeName,
  args: readonly unknown[] = [],
): Promise<TResult> => {
  const { result } = await sendRequest(probeRequest, { name, args: [...args] });
  return result as TResult;
};

export const captureTab = async (): Promise<string> => {
  const { dataUrl } = await sendRequest(captureRequest, {});
  return dataUrl;
};

export type FetchInit = { method?: 'GET' | 'HEAD' };

export const fetchViaBackground = (url: string, init: FetchInit = {}) =>
  sendRequest(fetchRequest, { url, method: init.method ?? 'GET' });

export const openReport = async (data: Record<string, unknown>): Promise<void> => {
  await sendRequest(openReportRequest, { data });
};

export const notifyOverlayState = async (open: boolean): Promise<void> => {
  await browser.runtime
    .sendMessage(createEnvelope(overlayStateEvent, { open }, nextSeq()))
    .catch(() => undefined);
};
