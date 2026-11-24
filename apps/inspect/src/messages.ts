import { defineEvent, defineRequest, EmptySchema } from '@neruz/core';
import * as v from 'valibot';
import { PROBE_NAMES, TOOL_IDS } from './tools/types';

export const MAX_FETCH_BYTES = 2 * 1024 * 1024;
export const MAX_REPORT_BYTES = 2 * 1024 * 1024;

const HttpUrlSchema = v.pipe(
  v.string(),
  v.maxLength(4096),
  v.url(),
  v.check((value) => /^https?:\/\//i.test(value), 'only http and https are allowed'),
);

const ReportDataSchema = v.pipe(
  v.record(v.string(), v.unknown()),
  v.check((value) => JSON.stringify(value).length <= MAX_REPORT_BYTES, 'report data is too large'),
);

export const probeRequest = defineRequest(
  'ni.probe',
  v.object({
    name: v.picklist(PROBE_NAMES),
    args: v.optional(v.array(v.unknown()), []),
  }),
  v.object({ result: v.unknown() }),
  15_000,
);

export const captureRequest = defineRequest(
  'ni.capture',
  EmptySchema,
  v.object({ dataUrl: v.string() }),
  10_000,
);

export const fetchRequest = defineRequest(
  'ni.fetch',
  v.object({ url: HttpUrlSchema, method: v.optional(v.picklist(['GET', 'HEAD']), 'GET') }),
  v.object({
    status: v.number(),
    ok: v.boolean(),
    url: v.string(),
    headers: v.record(v.string(), v.string()),
    text: v.string(),
    truncated: v.boolean(),
  }),
  20_000,
);

export const openReportRequest = defineRequest(
  'ni.openReport',
  v.object({ data: ReportDataSchema }),
  v.object({ opened: v.boolean() }),
);

export const overlayStateEvent = defineEvent('ni.overlayState', v.object({ open: v.boolean() }));

export const toolOpenedEvent = defineEvent(
  'ni.toolOpened',
  v.object({ toolId: v.picklist(TOOL_IDS) }),
);
