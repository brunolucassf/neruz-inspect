import * as v from 'valibot';

export const NI_ERROR_CODES = [
  'NI-TIMEOUT',
  'NI-INVALID-MESSAGE',
  'NI-BAD-REQUEST',
  'NI-VERSION-MISMATCH',
  'NI-FORBIDDEN-SENDER',
  'NI-RESTRICTED-PAGE',
  'NI-PERMISSION-MISSING',
  'NI-PERMISSION-DENIED',
  'NI-INJECT-FAILED',
  'NI-CAPTURE-RATE',
  'NI-CAPTURE-FAILED',
  'NI-ELEMENT-NOT-FOUND',
  'NI-EYEDROPPER-UNSUPPORTED',
  'NI-STORAGE-INVALID',
  'NI-ABORTED',
  'NI-UNKNOWN',
] as const;

export type NiErrorCode = (typeof NI_ERROR_CODES)[number];

const RETRYABLE_CODES: ReadonlySet<NiErrorCode> = new Set([
  'NI-TIMEOUT',
  'NI-INJECT-FAILED',
  'NI-CAPTURE-RATE',
  'NI-CAPTURE-FAILED',
]);

export const NiErrorSchema = v.object({
  code: v.picklist(NI_ERROR_CODES),
  message: v.pipe(v.string(), v.maxLength(1000)),
  retryable: v.boolean(),
  details: v.optional(v.record(v.string(), v.union([v.string(), v.number(), v.boolean()]))),
});

export type NiError = v.InferOutput<typeof NiErrorSchema>;
export type NiErrorDetails = NonNullable<NiError['details']>;

const isRetryable = (code: NiErrorCode): boolean => RETRYABLE_CODES.has(code);

export const createNiError = (
  code: NiErrorCode,
  message: string,
  details?: NiErrorDetails,
): NiError => ({
  code,
  message,
  retryable: isRetryable(code),
  ...(details ? { details } : {}),
});

export class NiException extends Error {
  readonly error: NiError;

  constructor(code: NiErrorCode, message: string, details?: NiErrorDetails) {
    super(`${code}: ${message}`);
    this.name = 'NiException';
    this.error = createNiError(code, message, details);
  }
}

export const isNiError = (value: unknown): value is NiError =>
  v.safeParse(NiErrorSchema, value).success;

export const toNiError = (cause: unknown): NiError => {
  if (cause instanceof NiException) return cause.error;
  const message = cause instanceof Error ? cause.message : String(cause);
  return createNiError('NI-UNKNOWN', message.slice(0, 500));
};
