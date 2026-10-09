import type { Type } from '@angular/core';

export type Scenario = () => Promise<{ default: Type<unknown> }>;

// One entry per scenario file in this folder, keyed by the file name:
//   Button: () => import('./Button'),
export const scenarios: Record<string, Scenario> = {};
