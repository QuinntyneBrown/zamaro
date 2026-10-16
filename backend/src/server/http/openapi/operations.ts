import { z } from 'zod';
import { GatheringKind, SearchSort, valuesOf } from '@/server/enums';
import { AlternativesResource } from '../resources/discovery/alternatives';
import { LineupResource } from '../resources/discovery/lineup';
import { PlaceResource } from '../resources/discovery/place';
import { FeaturesResource } from '../resources/operations/features';
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
    path: '/features',
    summary: 'Which unfinished features this environment has turned on',
    responses: {
      200: { description: 'The flags', content: FeaturesResource },
    },
  },
];
