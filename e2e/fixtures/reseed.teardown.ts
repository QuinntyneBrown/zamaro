import { test as teardown } from '@playwright/test';
import { artisan } from './artisan';

// The admin-mutations project's teardown: the seed is idempotent, so running it again puts every
// seeded row the mutating specs changed (a verified check) back as the mocks show it.
teardown('seeds the database again after the mutating specs', () => {
  teardown.setTimeout(120_000);
  artisan(['db:seed', '--force'], 'run');
});
