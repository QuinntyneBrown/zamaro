import { test as teardown } from '@playwright/test';
import { createBooker, RUTH } from './accounts';
import { cli } from './cli';

// The mutating projects' teardown: the database is reset and seeded again, so every row the
// mutating specs changed or added (a verified check, a blocked date, a declined request) is back as
// the mocks show it, with Ruth made again as global-setup does.
teardown('resets the database after the mutating specs', () => {
  teardown.setTimeout(180_000);
  cli(['db:reset'], 'run');
  createBooker(RUTH);
});
