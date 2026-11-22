import {
  type AnyMessageDefinition,
  createNiError,
  createRateLimiter,
  type DataOf,
  errorReply,
  NiException,
  okReply,
  type PayloadOf,
  parseEnvelope,
  type Reply,
  readEnvelopeHead,
  toNiError,
  withTimeout,
} from '@neruz/core';
import { type Browser, browser } from 'wxt/browser';
import { STORAGE_KEYS } from '../lib/storage-keys';
import {
  captureRequest,
  fetchRequest,
  MAX_FETCH_BYTES,
  openReportRequest,
  overlayStateEvent,
  probeRequest,
} from '../messages';
import { isOverlayActive, setOverlayActive } from './activeTabs';
import { PROBES } from './probes';
import { clearBadge, showActiveBadge } from './toggle';

type SenderContext = { tabId: number; windowId: number | undefined };

type Route = {
  definition: AnyMessageDefinition;
  requiresActiveOverlay: boolean;
  handle: (payload: unknown, sender: SenderContext) => Promise<unknown>;
};

const defineRoute = <TDefinition extends AnyMessageDefinition>(
  definition: TDefinition,
  requiresActiveOverlay: boolean,
  handle: (payload: PayloadOf<TDefinition>, sender: SenderContext) => Promise<DataOf<TDefinition>>,
): Route => ({
  definition,
  requiresActiveOverlay,
  handle: (payload, sender) => handle(payload as PayloadOf<TDefinition>, sender),
});

const CAPTURES_PER_SECOND = 2;
const FETCH_TIMEOUT_MS = 15_000;
const captureLimiter = createRateLimiter(CAPTURES_PER_SECOND);

const readLimitedText = async (
  response: Response,
): Promise<{ text: string; truncated: boolean }> => {
  const reader = response.body?.getReader();
  if (!reader) return { text: '', truncated: false };
  const decoder = new TextDecoder();
  let text = '';
  let received = 0;
  let truncated = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_FETCH_BYTES) {
      truncated = true;
      await reader.cancel();
      break;
    }
    text += decoder.decode(value, { stream: true });
  }
  return { text: text + decoder.decode(), truncated };
};

const probeRoute = defineRoute(probeRequest, true, async ({ name, args }, { tabId }) => {
  try {
    const [injection] = await browser.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: PROBES[name],
      args: args as never[],
    });
    return { result: injection?.result ?? null };
  } catch (cause) {
    throw new NiException('NI-INJECT-FAILED', toNiError(cause).message, { probe: name });
  }
});

const captureRoute = defineRoute(captureRequest, true, async (_payload, { windowId }) => {
  if (!captureLimiter.tryAcquire()) {
    throw new NiException('NI-CAPTURE-RATE', 'capture limited to 2 per second');
  }
  try {
    const dataUrl = await browser.tabs.captureVisibleTab(
      windowId ?? browser.windows.WINDOW_ID_CURRENT,
      {
        format: 'png',
      },
    );
    return { dataUrl };
  } catch (cause) {
    throw new NiException('NI-CAPTURE-FAILED', toNiError(cause).message);
  }
});

const fetchRoute = defineRoute(fetchRequest, true, async ({ url, method }) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await withTimeout(
      fetch(url, { method, credentials: 'omit', redirect: 'follow', signal: controller.signal }),
      FETCH_TIMEOUT_MS,
      'fetch',
    );
    const headers: Record<string, string> = {};
    response.headers.forEach((value, name) => {
      headers[name] = value;
    });
    const { text, truncated } =
      method === 'HEAD' ? { text: '', truncated: false } : await readLimitedText(response);
    return {
      status: response.status,
      ok: response.ok,
      url: response.url,
      headers,
      text,
      truncated,
    };
  } catch (cause) {
    if (cause instanceof NiException) throw cause;
    throw new NiException('NI-PERMISSION-MISSING', 'request blocked or failed', {
      origin: new URL(url).origin,
    });
  } finally {
    clearTimeout(timer);
  }
});

const openReportRoute = defineRoute(openReportRequest, true, async ({ data }) => {
  await browser.storage.session.set({
    [STORAGE_KEYS.report]: { data, openedAt: Date.now() },
  });
  await browser.tabs.create({ url: browser.runtime.getURL('/report.html') });
  return { opened: true };
});

const overlayStateRoute = defineRoute(overlayStateEvent, false, async ({ open }, { tabId }) => {
  await setOverlayActive(tabId, open);
  if (open) await showActiveBadge(tabId);
  else await clearBadge(tabId);
  return {};
});

const ROUTES: readonly Route[] = [
  probeRoute,
  captureRoute,
  fetchRoute,
  openReportRoute,
  overlayStateRoute,
];

const toSenderContext = (sender: Browser.runtime.MessageSender): SenderContext | null => {
  const tabId = sender.tab?.id;
  const isTrusted = sender.id === browser.runtime.id && sender.frameId === 0;
  if (!isTrusted || tabId === undefined) return null;
  return { tabId, windowId: sender.tab?.windowId };
};

const answer = async (
  route: Route,
  seq: number,
  raw: unknown,
  sender: Browser.runtime.MessageSender,
): Promise<Reply<unknown>> => {
  const context = toSenderContext(sender);
  if (!context) return errorReply(seq, createNiError('NI-FORBIDDEN-SENDER', 'untrusted sender'));
  if (route.requiresActiveOverlay && !(await isOverlayActive(context.tabId))) {
    return errorReply(
      seq,
      createNiError('NI-FORBIDDEN-SENDER', 'overlay is not active on this tab'),
    );
  }
  const parsed = parseEnvelope(route.definition, raw);
  if (!parsed.ok) return errorReply(seq, parsed.error);
  try {
    return okReply(seq, await route.handle(parsed.envelope.payload, context));
  } catch (cause) {
    return errorReply(seq, toNiError(cause));
  }
};

export const handleRuntimeMessage = (
  raw: unknown,
  sender: Browser.runtime.MessageSender,
): Promise<Reply<unknown>> | undefined => {
  const head = readEnvelopeHead(raw);
  if (!head) return undefined;
  const route = ROUTES.find((candidate) => candidate.definition.type === head.type);
  if (!route) return undefined;
  return answer(route, head.seq, raw, sender);
};
