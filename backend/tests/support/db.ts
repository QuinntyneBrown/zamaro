import postgres from 'postgres';
import { inject } from 'vitest';

let client: postgres.Sql | undefined;

/** The test database, for reading what the API wrote; queries are postgres.js tagged templates. */
export function testDb(): postgres.Sql {
  client ??= postgres(inject('databaseUrl'), { max: 2 });
  return client;
}
