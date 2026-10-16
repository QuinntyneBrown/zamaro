import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NextRequest } from 'next/server';
import { problemResponse, httpError } from '@/server/support/problems';

/**
 * Requests to the API as a client would send them, answered in-process (ADR-0028): the path is
 * matched to a `route.ts` module as Next.js matches it, and the exported method runs through the
 * request pipeline. Cookies and redirects are the caller's; the host is the test APP_URL.
 */
type Handler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[] | undefined>> },
) => Promise<Response> | Response;

interface Route {
  segments: { kind: 'static' | 'param' | 'rest'; name: string }[];
  file: string;
}

const app = fileURLToPath(new URL('../../src/app/', import.meta.url));
const ORIGIN = 'http://localhost:8000';

const routes: Route[] = readdirSync(app, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name === 'route.ts')
  .map((entry) => {
    const folder = relative(app, entry.parentPath)
      .split(sep)
      .filter((part) => part !== '');
    return {
      file: join(entry.parentPath, entry.name),
      segments: folder.map((part) => {
        const rest = /^\[\.\.\.(.+)\]$/.exec(part);
        if (rest?.[1] !== undefined) return { kind: 'rest' as const, name: rest[1] };
        const param = /^\[(.+)\]$/.exec(part);
        if (param?.[1] !== undefined) return { kind: 'param' as const, name: param[1] };
        return { kind: 'static' as const, name: part };
      }),
    };
  })
  // Static segments win over params, which win over catch-alls, as in Next.js.
  .sort((a, b) => score(b) - score(a));

export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(path, ORIGIN);
  const parts = url.pathname.split('/').filter((part) => part !== '');
  const matched = match(parts);
  if (matched === undefined) {
    return new Response('<!doctype html>Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  const method = (init.method ?? 'GET').toUpperCase();
  const routeModule = (await import(pathToFileURL(matched.route.file).href)) as Record<
    string,
    unknown
  >;
  const handler = (routeModule[method] ?? (method === 'HEAD' ? routeModule.GET : undefined)) as
    Handler | undefined;
  if (handler === undefined) {
    return problemResponse(httpError(405, 'Method Not Allowed'));
  }
  const request = new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1]);
  return handler(request, { params: Promise.resolve(matched.params) });
}

function match(
  parts: string[],
): { route: Route; params: Record<string, string | string[]> } | undefined {
  for (const route of routes) {
    const params: Record<string, string | string[]> = {};
    let matched = true;
    for (const [index, segment] of route.segments.entries()) {
      const part = parts[index];
      if (segment.kind === 'rest') {
        const rest = parts.slice(index);
        if (rest.length === 0) matched = false;
        params[segment.name] = rest.map(decodeURIComponent);
        break;
      }
      if (part === undefined || (segment.kind === 'static' && part !== segment.name)) {
        matched = false;
        break;
      }
      if (segment.kind === 'param') params[segment.name] = decodeURIComponent(part);
    }
    const consumesAll =
      route.segments.at(-1)?.kind === 'rest' || route.segments.length === parts.length;
    if (matched && consumesAll) return { route, params };
  }
  return undefined;
}

function score(route: Route): number {
  return route.segments.reduce(
    (total, segment) =>
      total * 4 + (segment.kind === 'static' ? 3 : segment.kind === 'param' ? 2 : 1),
    0,
  );
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
