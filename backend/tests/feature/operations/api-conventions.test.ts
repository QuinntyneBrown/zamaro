import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { api, UUID } from '../../support/app';
import { captureLogs } from '../../support/logs';

const PROBLEM = 'application/problem+json';

/**
 * L2-093.1: request IDs and structured request logs.
 * L2-095.2: RFC 9457 problem details for every error.
 * CORS: only Zamaro Web's origins may call the API with credentials (ZAMARO_WEB_ORIGINS, ADR-0015).
 */
describe('API conventions', () => {
  let logs: ReturnType<typeof captureLogs>;

  beforeAll(() => {
    logs = captureLogs();
  });

  afterAll(() => {
    logs.restore();
  });

  it('a request without an id gets a generated uuid', async () => {
    const response = await api('/health/live');

    expect(response.headers.get('x-request-id')).toMatch(UUID);
  });

  it('a well-formed inbound request id is echoed', async () => {
    const id = randomUUID();

    const response = await api('/health/live', { headers: { 'X-Request-Id': id } });

    expect(response.headers.get('x-request-id')).toBe(id);
  });

  it('a malformed inbound request id is replaced', async () => {
    const response = await api('/health/live', { headers: { 'X-Request-Id': 'not-a-uuid' } });

    const id = response.headers.get('x-request-id');
    expect(id).not.toBe('not-a-uuid');
    expect(id).toMatch(UUID);
  });

  it('an unknown api route returns a 404 problem carrying the request id', async () => {
    const response = await api('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe(PROBLEM);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.type).toMatch(/\/problems\/not-found$/);
    expect(typeof body.title).toBe('string');
    expect(body.status).toBe(404);
    expect(typeof body.detail).toBe('string');
    expect(body.requestId).toBe(response.headers.get('x-request-id'));
  });

  it('an unhandled exception returns a generic 500 problem without internals', async () => {
    const response = await api('/api/v1/test-boom');

    expect(response.status).toBe(500);
    expect(response.headers.get('content-type')).toBe(PROBLEM);
    const text = await response.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(body.status).toBe(500);
    expect(body.requestId).toBe(response.headers.get('x-request-id'));
    expect(body).not.toHaveProperty('trace');
    expect(body).not.toHaveProperty('exception');
    expect(text).not.toContain('hunter2');
  });

  it('a wrong method returns a 405 problem of type about:blank', async () => {
    const response = await api('/health/live', { method: 'POST' });

    expect(response.status).toBe(405);
    expect(response.headers.get('content-type')).toBe(PROBLEM);
    expect(await response.json()).toMatchObject({
      type: 'about:blank',
      title: 'Method Not Allowed',
      status: 405,
    });
  });

  it('a preflight from a zamaro web origin may send credentials', async () => {
    const response = await api('/api/v1/session', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:4200',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-xsrf-token',
      },
    });

    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:4200');
    expect(response.headers.get('access-control-allow-credentials')).toBe('true');
    expect(response.headers.get('access-control-allow-headers')?.toLowerCase()).toContain(
      'x-xsrf-token',
    );
  });

  it('a zamaro web origin may read an api answer, including a problem', async () => {
    const response = await api('/api/v1/does-not-exist', {
      headers: { Origin: 'http://localhost:4200' },
    });

    expect(response.status).toBe(404);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:4200');
    expect(response.headers.get('access-control-expose-headers')?.toLowerCase()).toContain(
      'x-request-id',
    );
  });

  it('another origin gets no cors permission', async () => {
    const preflight = await api('/api/v1/session', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' },
    });
    const read = await api('/api/v1/does-not-exist', {
      headers: { Origin: 'https://evil.example', Accept: 'application/json' },
    });

    expect(preflight.headers.get('access-control-allow-origin')).toBeNull();
    expect(read.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('every request writes one json log line carrying the request id', async () => {
    const response = await api('/api/v1/does-not-exist');
    const requestId = response.headers.get('x-request-id');

    const lines = logs
      .lines()
      .filter((line) => line.msg === 'request' && line.requestId === requestId);

    expect(lines).toHaveLength(1);
    const line = lines[0] ?? {};
    expect(line.method).toBe('GET');
    expect(line.status).toBe(404);
    expect(line.release).toBe('test-release');
    expect(typeof line.route).toBe('string');
    expect(Number.isInteger(line.durationMs)).toBe(true);
  });
});
