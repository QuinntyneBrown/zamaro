import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { buildDocument } from '@/server/http/openapi/document';
import { operations } from '@/server/http/openapi/operations';

/**
 * `npm run openapi:export [--check] [--out path]`: writes the OpenAPI 3.1 document (L2-095.3) to
 * storage/openapi.json. With --check, every documented schema must also compile, so a malformed
 * contract fails CI (ADR-0006).
 */
const args = process.argv.slice(2);
const out = args.includes('--out')
  ? (args[args.indexOf('--out') + 1] ?? '')
  : 'storage/openapi.json';
const document = buildDocument(operations);

if (args.includes('--check')) {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(document, 'openapi');
  for (const [path, methods] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const responses = (operation as { responses: Record<string, unknown> }).responses;
      for (const [status, response] of Object.entries(responses)) {
        const content =
          (response as { content?: Record<string, { schema: unknown }> }).content ?? {};
        for (const [type, body] of Object.entries(content)) {
          if (!ajv.validateSchema(body.schema as object)) {
            console.error(`${method.toUpperCase()} ${path} ${status} ${type}: invalid schema`);
            process.exitCode = 1;
          }
        }
      }
    }
  }
}

const target = resolve(out);
mkdirSync(resolve(target, '..'), { recursive: true });
writeFileSync(target, JSON.stringify(document, null, 2) + '\n');
console.log(`${String(Object.keys(document.paths).length)} paths written to ${out}`);
