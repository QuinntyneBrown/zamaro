import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { expect } from 'vitest';
import { buildDocument } from '@/server/http/openapi/document';
import { operations } from '@/server/http/openapi/operations';

/**
 * L2-095.3: every API response must match the OpenAPI 3.1 document generated from the code
 * (ADR-0006), built here from the same operations `openapi:export` writes.
 */
interface Contract {
  ajv: Ajv2020;
  document: { paths: Record<string, Record<string, unknown>> };
}

let contract: Contract | undefined;

function validator(): Contract {
  if (contract === undefined) {
    const document = buildDocument(operations);
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    addFormats(ajv);
    ajv.addSchema(document, 'openapi');
    contract = { ajv, document };
  }
  return contract;
}

/** Checks the operation, status and content type are documented and the body matches the schema. */
export function expectContract(
  response: Response,
  operation: { method: string; path: string },
  body: unknown,
): void {
  const method = operation.method.toLowerCase();
  const { ajv, document } = validator();
  const documented = document.paths[operation.path]?.[method] as
    { responses: Record<string, { content?: Record<string, unknown> }> } | undefined;
  expect(documented, `OpenAPI documents no ${method} ${operation.path}.`).toBeDefined();
  const status = String(response.status);
  const spec = documented?.responses[status];
  expect(
    spec,
    `OpenAPI documents no ${status} response for ${method} ${operation.path}.`,
  ).toBeDefined();

  const contentType = (response.headers.get('content-type') ?? '').split(';')[0] ?? '';
  if (spec?.content === undefined) {
    expect(
      contentType,
      `OpenAPI documents no body for ${status} on ${method} ${operation.path}.`,
    ).toBe('');
    return;
  }
  expect(
    Object.keys(spec.content),
    `OpenAPI documents no ${contentType} body for ${status}.`,
  ).toContain(contentType);
  const pointer = `openapi#/paths/${escape(operation.path)}/${method}/responses/${status}/content/${escape(contentType)}/schema`;
  const validate: ValidateFunction = ajv.compile({ $ref: pointer });
  const valid = validate(body);
  expect(
    valid,
    `The ${status} body for ${method} ${operation.path} does not match OpenAPI:\n${JSON.stringify(validate.errors, null, 2)}`,
  ).toBe(true);
}

function escape(segment: string): string {
  return encodeURIComponent(segment.replace(/~/g, '~0').replace(/\//g, '~1'));
}
