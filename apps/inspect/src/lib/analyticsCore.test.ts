import { describe, expect, it } from 'vitest';
import {
  buildEndpoint,
  buildPageViewParams,
  buildPayload,
  canSendAnalytics,
  isValidEventName,
  resolveSession,
  SESSION_TIMEOUT_MS,
} from './analyticsCore';

const allowed = {
  apiSecret: 'secret',
  isEnabled: true,
  isFirefox: false,
  hasFirefoxPermission: false,
};

describe('buildPayload', () => {
  it('builds a GA4 body with extension and session params', () => {
    const body = buildPayload({
      clientId: 'client',
      sessionId: '123',
      name: 'tool_open',
      version: '0.2.0',
      params: { tool_id: 'ruler' },
    });
    expect(body.client_id).toBe('client');
    expect(body.events).toHaveLength(1);
    expect(body.events[0]?.name).toBe('tool_open');
    expect(body.events[0]?.params).toMatchObject({
      tool_id: 'ruler',
      session_id: '123',
      extension_name: 'neruz-inspect',
      extension_version: '0.2.0',
    });
  });

  it('rejects names that are not snake_case or exceed 40 characters', () => {
    expect(isValidEventName('overlay_open')).toBe(true);
    expect(isValidEventName('Overlay-Open')).toBe(false);
    expect(isValidEventName('a'.repeat(41))).toBe(false);
    expect(() =>
      buildPayload({ clientId: 'c', sessionId: 's', name: 'Bad Name', version: '1' }),
    ).toThrow();
  });

  it('uses a virtual page location without the extension id', () => {
    expect(buildPageViewParams('options')).toEqual({
      page_title: 'options',
      page_location: 'extension://neruz-inspect/options',
    });
  });

  it('puts the measurement id and secret in the endpoint', () => {
    expect(buildEndpoint('abc')).toContain('measurement_id=G-M4TF52T81Q&api_secret=abc');
  });
});

describe('canSendAnalytics', () => {
  it('sends when enabled with a secret on Chromium', () => {
    expect(canSendAnalytics(allowed)).toBe(true);
  });

  it('does not send when the setting is off', () => {
    expect(canSendAnalytics({ ...allowed, isEnabled: false })).toBe(false);
  });

  it('does not send without a secret', () => {
    expect(canSendAnalytics({ ...allowed, apiSecret: undefined })).toBe(false);
    expect(canSendAnalytics({ ...allowed, apiSecret: '' })).toBe(false);
  });

  it('does not send on Firefox without the data permission', () => {
    expect(canSendAnalytics({ ...allowed, isFirefox: true })).toBe(false);
    expect(canSendAnalytics({ ...allowed, isFirefox: true, hasFirefoxPermission: true })).toBe(
      true,
    );
  });
});

describe('resolveSession', () => {
  it('keeps the session inside 30 minutes and renews after', () => {
    const start = resolveSession(undefined, 1000);
    expect(resolveSession(start, 1000 + SESSION_TIMEOUT_MS - 1).sessionId).toBe(start.sessionId);
    expect(resolveSession(start, 1000 + SESSION_TIMEOUT_MS).sessionId).not.toBe(start.sessionId);
  });
});
