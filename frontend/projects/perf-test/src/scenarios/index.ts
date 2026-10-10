import type { Type } from '@angular/core';

export type Scenario = () => Promise<{ default: Type<unknown> }>;

// One entry per scenario file in this folder, keyed by the file name.
export const scenarios: Record<string, Scenario> = {
  Button: () => import('./Button'),
  DarkTheme: () => import('./DarkTheme'),
  Dialog: () => import('./Dialog'),
  Footer: () => import('./Footer'),
  Icon: () => import('./Icon'),
  Menu: () => import('./Menu'),
  SkipLink: () => import('./SkipLink'),
  TopBar: () => import('./TopBar'),
};
