import type { Type } from '@angular/core';

export type Scenario = () => Promise<{ default: Type<unknown> }>;

// One entry per scenario file in this folder, keyed by the file name.
export const scenarios: Record<string, Scenario> = {
  Footer: () => import('./Footer'),
  Icon: () => import('./Icon'),
  SkipLink: () => import('./SkipLink'),
  TopBar: () => import('./TopBar'),
};
