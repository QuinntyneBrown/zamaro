import { z } from 'zod';
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
