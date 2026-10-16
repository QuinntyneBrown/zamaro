import type { NextRequest } from 'next/server';
import { z, type ZodType } from 'zod';
import { ValidationProblem } from '../support/problems';

/**
 * Request validation (ADR-0027): a Zod schema in the role FormRequests had. A failure is a 422
 * problem whose `errors` are keyed by field with the schema's own messages, in the order the schema
 * reports them. `rename` reports one field's errors under another name (`lat` → `location`).
 */
export interface ValidationOptions {
  rename?: Record<string, string>;
}

/** The query string as one object; a repeated key keeps its first value. */
export function queryObject(request: NextRequest): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of request.nextUrl.searchParams) {
    query[key] ??= value;
  }
  return query;
}

export function validateQuery<T>(
  request: NextRequest,
  schema: ZodType<T>,
  options: ValidationOptions = {},
): T {
  return validate(queryObject(request), schema, options);
}

export function validate<T>(
  input: unknown,
  schema: ZodType<T>,
  options: ValidationOptions = {},
): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  throw new ValidationProblem(errorsOf(result.error, options.rename ?? {}));
}

export function errorsOf(
  error: z.ZodError,
  rename: Record<string, string>,
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '');
    const name = rename[field] ?? field;
    const messages = (errors[name] ??= []);
    if (!messages.includes(issue.message)) messages.push(issue.message);
  }
  return errors;
}

/** An optional query value: absent or blank means not given. */
export function optionalQuery<T extends ZodType>(schema: T): z.ZodOptional<T> {
  return z.preprocess(
    (value) => (value === '' ? undefined : value),
    schema.optional(),
  ) as unknown as z.ZodOptional<T>;
}
