import { z, type ZodType } from 'zod';

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
  /** The JSON body, `'problem'` for application/problem+json, or `null` for no body. */
  content: ZodType | 'problem' | null;
}

export interface Operation {
  method: Method;
  /** Under the `/api/v1` server, e.g. `/i18n/{locale}`. */
  path: string;
  summary: string;
  parameters?: Parameter[];
  requestBody?: ZodType;
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

export function buildDocument(operations: Operation[]): OpenApiDocument {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const operation of operations) {
    const responses: Record<string, unknown> = {};
    for (const [status, spec] of Object.entries(operation.responses)) {
      responses[status] =
        spec.content === null
          ? { description: spec.description }
          : spec.content === 'problem'
            ? {
                description: spec.description,
                content: { [PROBLEM]: { schema: { $ref: '#/components/schemas/Problem' } } },
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
        content: { 'application/json': { schema: jsonSchema(operation.requestBody) } },
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
