import { z } from 'zod';
import { GatheringKind, SearchSort, valuesOf } from '@/server/enums';
import {
  AvailabilityResource,
  SitemapResource,
  TourDatesResource,
} from '../resources/artist-profiles/dates';
import { ArtistProfileResource } from '../resources/artist-profiles/profile';
import { AlternativesResource } from '../resources/discovery/alternatives';
import { LineupResource } from '../resources/discovery/lineup';
import { PlaceResource } from '../resources/discovery/place';
import { FeaturesResource } from '../resources/operations/features';
import { ReviewPageResource } from '../resources/reviews/review';
import { CatalogueResource } from '../resources/user-experience/catalogue';
import type { Operation } from './document';

/** Every documented operation, one entry per route handler; each slice adds its own here. */
export const operations: Operation[] = [
  {
    method: 'get',
    path: '/i18n/{locale}',
    summary: 'The translation catalogue for one locale, with English filling any missing key',
    parameters: [{ name: 'locale', in: 'path', schema: z.string() }],
    responses: {
      200: {
        description: 'The catalogue; revalidate with If-None-Match',
        content: CatalogueResource,
      },
      304: { description: 'The catalogue has not changed', content: null },
      404: { description: 'No catalogue for the locale', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/search',
    summary: 'Artists free on the date who will drive to the event location',
    parameters: [
      {
        name: 'date',
        in: 'query',
        schema: z.string(),
        required: true,
        description: 'YYYY-MM-DD, 3 days to 18 months ahead',
      },
      { name: 'kind', in: 'query', schema: z.enum(valuesOf(GatheringKind)), required: true },
      { name: 'lat', in: 'query', schema: z.number(), required: true },
      { name: 'lng', in: 'query', schema: z.number(), required: true },
      {
        name: 'radius',
        in: 'query',
        schema: z.number().int(),
        required: true,
        description: '40, 80, 120 or 200',
      },
      { name: 'sort', in: 'query', schema: z.enum(valuesOf(SearchSort)) },
      {
        name: 'styles',
        in: 'query',
        schema: z.string(),
        description: 'Comma-separated style slugs',
      },
      { name: 'price', in: 'query', schema: z.literal('under-800') },
      { name: 'cursor', in: 'query', schema: z.string() },
    ],
    responses: {
      200: { description: 'One page of the lineup', content: LineupResource },
      422: { description: 'The search cannot run; errors are keyed by field', content: 'problem' },
      429: { description: 'More than 30 searches a minute', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/search/alternatives',
    summary: 'Ways forward when a search finds nobody',
    parameters: [
      { name: 'date', in: 'query', schema: z.string(), required: true },
      { name: 'kind', in: 'query', schema: z.enum(valuesOf(GatheringKind)), required: true },
      { name: 'lat', in: 'query', schema: z.number(), required: true },
      { name: 'lng', in: 'query', schema: z.number(), required: true },
      { name: 'radius', in: 'query', schema: z.number().int(), required: true },
      { name: 'styles', in: 'query', schema: z.string() },
      { name: 'price', in: 'query', schema: z.literal('under-800') },
    ],
    responses: {
      200: {
        description: 'Nearby dates, a wider radius and whether filters apply',
        content: AlternativesResource,
      },
      422: { description: 'The search cannot run; errors are keyed by field', content: 'problem' },
      429: { description: 'More than 30 searches a minute', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/places',
    summary: 'The centre point of a typed town or a quick-pick city',
    parameters: [{ name: 'q', in: 'query', schema: z.string(), required: true }],
    responses: {
      200: { description: 'The place', content: PlaceResource },
      404: { description: 'No place matches that name', content: 'problem' },
      422: { description: 'The query is missing', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/artists/{slug}',
    summary:
      "An artist's public profile; 301 for a retired slug, 404 with similar artists when missing",
    parameters: [
      { name: 'slug', in: 'path', schema: z.string() },
      { name: 'date', in: 'query', schema: z.string(), description: 'The carried search date' },
      { name: 'kind', in: 'query', schema: z.enum(valuesOf(GatheringKind)) },
      { name: 'lat', in: 'query', schema: z.number() },
      { name: 'lng', in: 'query', schema: z.number() },
      { name: 'radius', in: 'query', schema: z.number().int() },
    ],
    responses: {
      200: {
        description: 'The profile; revalidate with If-None-Match',
        content: ArtistProfileResource,
      },
      301: { description: 'The artist has a new address (Location)', content: null },
      304: { description: 'The profile has not changed', content: null },
      404: {
        description: 'No viewable artist has the address; carries similarArtists',
        content: 'problem',
      },
      422: { description: 'The carried search is malformed', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/artists/{slug}/reviews',
    summary: "An artist's visible reviews, newest first, 10 at a time",
    parameters: [
      { name: 'slug', in: 'path', schema: z.string() },
      { name: 'cursor', in: 'query', schema: z.string() },
    ],
    responses: {
      200: { description: 'One page of reviews', content: ReviewPageResource },
      301: { description: 'The artist has a new address (Location)', content: null },
      404: { description: 'No viewable artist has the address', content: 'problem' },
      422: { description: 'The cursor does not decode', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/artists/{slug}/tour-dates',
    summary: "The artist's next 6 free or booked dates",
    parameters: [
      { name: 'slug', in: 'path', schema: z.string() },
      {
        name: 'from',
        in: 'query',
        schema: z.string(),
        description: 'YYYY-MM-DD; 3 days from today without one',
      },
    ],
    responses: {
      200: { description: 'The dates; revalidate with If-None-Match', content: TourDatesResource },
      301: { description: 'The artist has a new address (Location)', content: null },
      304: { description: 'The dates have not changed', content: null },
      404: { description: 'No viewable artist has the address', content: 'problem' },
      422: { description: 'The from date is not a date', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/artists/{slug}/availability',
    summary: 'Whether the artist is free on one date',
    parameters: [
      { name: 'slug', in: 'path', schema: z.string() },
      { name: 'date', in: 'query', schema: z.string(), required: true },
    ],
    responses: {
      200: {
        description: 'The answer; revalidate with If-None-Match',
        content: AvailabilityResource,
      },
      301: { description: 'The artist has a new address (Location)', content: null },
      304: { description: 'The answer has not changed', content: null },
      404: { description: 'No viewable artist has the address', content: 'problem' },
      422: { description: 'The date is outside the booking window', content: 'problem' },
    },
  },
  {
    method: 'get',
    path: '/sitemap',
    summary: 'Every published profile and when it last changed',
    responses: {
      200: { description: 'The profiles', content: SitemapResource },
      304: { description: 'The list has not changed', content: null },
    },
  },
  {
    method: 'get',
    path: '/features',
    summary: 'Which unfinished features this environment has turned on',
    responses: {
      200: { description: 'The flags', content: FeaturesResource },
    },
  },
];
