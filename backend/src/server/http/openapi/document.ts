import { z, type ZodType } from 'zod';
import { PUBLIC_ROUTES } from '@/app/api/v1/public';

/**
 * The OpenAPI 3.1 document, built from the Zod schemas the route handlers use (L2-095.3, ADR-0006 as
 * amended by ADR-0027). Each slice registers its operations in operations.ts; the test suite checks
 * every response against this document, and CI exports it.
 */
export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header';
  schema: ZodType;
  required?: boolean;
  description?: string;
}

export interface ResponseSpec {
  description: string;
  /** The JSON body, `'problem'` for application/problem+json, `'svg'` for an image, or `null` for no body. */
  content: ZodType | 'problem' | 'svg' | null;
}

export interface Operation {
  method: Method;
  /** Under the `/api/v1` server, e.g. `/i18n/{locale}`. */
  path: string;
  /** The route's name, as its route file gives the pipeline and src/app/api/v1/public.ts lists it. */
  name: string;
  summary: string;
  parameters?: Parameter[];
  requestBody?: ZodType;
  /** `multipart/form-data` or a chunk type for an upload route; JSON otherwise. */
  requestBodyType?: string;
  responses: Record<number, ResponseSpec>;
}

/** RFC 9457 problem details as the pipeline renders them (ADR-0005); extensions are allowed. */
export const ProblemSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.number().int(),
    detail: z.string(),
    requestId: z.string().optional(),
    errors: z.record(z.string(), z.array(z.string())).optional(),
  })
  .loose();

export interface OpenApiDocument {
  openapi: '3.1.0';
  info: { title: string; version: string };
  servers: { url: string }[];
  paths: Record<string, Record<string, unknown>>;
  components: { schemas: Record<string, unknown> };
}

const PROBLEM = 'application/problem+json';
const MUTATING: Method[] = ['post', 'put', 'patch', 'delete'];

/** The answers the request pipeline gives on every route (ADR-0027), unless the operation says otherwise. */
function pipelineResponses(operation: Operation): Record<number, ResponseSpec> {
  const responses: Record<number, ResponseSpec> = {
    429: { description: 'Over the API rate limit; Retry-After says when', content: 'problem' },
    500: { description: 'Something went wrong on our side', content: 'problem' },
  };
  if (operation.name.startsWith('admin.')) {
    responses[404] = {
      description: 'Not an administrator signed in with a code: the same 404 as an unknown address',
      content: 'problem',
    };
  } else if (!PUBLIC_ROUTES.has(operation.name)) {
    responses[401] = { description: 'No one is signed in', content: 'problem' };
    responses[409] = {
      description: 'The current terms must be accepted first (terms-acceptance-required)',
      content: 'problem',
    };
  }
  if (MUTATING.includes(operation.method)) {
    responses[419] = { description: 'The CSRF token is missing or stale', content: 'problem' };
  }
  if (operation.requestBody !== undefined) {
    responses[413] = { description: 'The body is over 1 MB', content: 'problem' };
    responses[415] = { description: 'The body is not JSON', content: 'problem' };
  }
  return responses;
}

export function buildDocument(operations: Operation[]): OpenApiDocument {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const operation of operations) {
    const responses: Record<string, unknown> = {};
    const specs = { ...pipelineResponses(operation), ...operation.responses };
    for (const [status, spec] of Object.entries(specs)) {
      responses[status] =
        spec.content === null
          ? { description: spec.description }
          : spec.content === 'problem'
            ? {
                description: spec.description,
                content: { [PROBLEM]: { schema: { $ref: '#/components/schemas/Problem' } } },
              }
            : spec.content === 'svg'
              ? {
                  description: spec.description,
                  content: { 'image/svg+xml': { schema: { type: 'string' } } },
                }
              : {
                  description: spec.description,
                  content: { 'application/json': { schema: jsonSchema(spec.content) } },
                };
    }
    const entry: Record<string, unknown> = { summary: operation.summary, responses };
    if (operation.parameters !== undefined) {
      entry.parameters = operation.parameters.map((parameter) => ({
        name: parameter.name,
        in: parameter.in,
        required: parameter.required ?? parameter.in === 'path',
        ...(parameter.description !== undefined && { description: parameter.description }),
        schema: jsonSchema(parameter.schema),
      }));
    }
    if (operation.requestBody !== undefined) {
      entry.requestBody = {
        required: true,
        content: {
          [operation.requestBodyType ?? 'application/json']: {
            schema: jsonSchema(operation.requestBody),
          },
        },
      };
    }
    paths[operation.path] = { ...paths[operation.path], [operation.method]: entry };
  }
  return {
    openapi: '3.1.0',
    info: { title: 'Zamaro API', version: '1' },
    servers: [{ url: '/api/v1' }],
    paths,
    components: { schemas: { Problem: jsonSchema(ProblemSchema) } },
  };
}

function jsonSchema(schema: ZodType): unknown {
  const generated = z.toJSONSchema(schema, {
    target: 'draft-2020-12',
    unrepresentable: 'any',
    io: 'output',
  }) as Record<string, unknown>;
  delete generated.$schema;
  return generated;
}
