import type { Type } from '@angular/core';

export type Scenario = () => Promise<{ default: Type<unknown> }>;

// One entry per scenario file in this folder, keyed by the file name.
export const scenarios: Record<string, Scenario> = {
  Artwork: () => import('./Artwork'),
  BookingForm: () => import('./BookingForm'),
  Button: () => import('./Button'),
  Chip: () => import('./Chip'),
  DarkTheme: () => import('./DarkTheme'),
  Dialog: () => import('./Dialog'),
  Footer: () => import('./Footer'),
  FormField: () => import('./FormField'),
  Icon: () => import('./Icon'),
  Lineup: () => import('./Lineup'),
  Marquee: () => import('./Marquee'),
  Menu: () => import('./Menu'),
  Poster: () => import('./Poster'),
  Rating: () => import('./Rating'),
  SkipLink: () => import('./SkipLink'),
  Ticket: () => import('./Ticket'),
  TopBar: () => import('./TopBar'),
};
