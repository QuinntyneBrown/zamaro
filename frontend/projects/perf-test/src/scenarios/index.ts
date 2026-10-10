import type { Type } from '@angular/core';

export type Scenario = () => Promise<{ default: Type<unknown> }>;

// One entry per scenario file in this folder, keyed by the file name.
export const scenarios: Record<string, Scenario> = {
  Alert: () => import('./Alert'),
  ArtistPoster: () => import('./ArtistPoster'),
  Artwork: () => import('./Artwork'),
  Badge: () => import('./Badge'),
  BookingForm: () => import('./BookingForm'),
  Breadcrumb: () => import('./Breadcrumb'),
  Button: () => import('./Button'),
  ButtonAnchor: () => import('./ButtonAnchor'),
  ButtonLink: () => import('./ButtonLink'),
  Chip: () => import('./Chip'),
  DarkTheme: () => import('./DarkTheme'),
  DateSwap: () => import('./DateSwap'),
  Dialog: () => import('./Dialog'),
  EmptyState: () => import('./EmptyState'),
  ErrorSummary: () => import('./ErrorSummary'),
  FilterGroup: () => import('./FilterGroup'),
  Footer: () => import('./Footer'),
  FormField: () => import('./FormField'),
  Headliner: () => import('./Headliner'),
  HeadlinerSkeleton: () => import('./HeadlinerSkeleton'),
  Icon: () => import('./Icon'),
  Lineup: () => import('./Lineup'),
  Marquee: () => import('./Marquee'),
  Menu: () => import('./Menu'),
  Poster: () => import('./Poster'),
  Rating: () => import('./Rating'),
  Setlist: () => import('./Setlist'),
  Skeleton: () => import('./Skeleton'),
  SkipLink: () => import('./SkipLink'),
  Ticket: () => import('./Ticket'),
  TicketSkeleton: () => import('./TicketSkeleton'),
  TopBar: () => import('./TopBar'),
};
