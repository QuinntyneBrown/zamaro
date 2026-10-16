import { describe, expect, it } from 'vitest';
import { api } from '../../support/app';
import { expectContract } from '../../support/contract';

const PLACES = { method: 'get', path: '/places' };

/**
 * L2-004.6: a typed town or a quick-pick city resolves to its centre point. The Discover form
 * sends the coordinates with the search; the label is what the location field shows.
 */
describe('place lookup', () => {
  it('resolves a town to its centre point', async () => {
    const response = await api('/api/v1/places?q=burlington');

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(body).toEqual({
      data: { label: 'Burlington, ON', city: 'Burlington', lat: 43.325, lng: -79.799 },
    });
    expectContract(response, PLACES, body);
  });

  it('resolves every quick-pick city', async () => {
    for (const city of [
      'Toronto',
      'Burlington',
      'Mississauga',
      'Brampton',
      'Hamilton',
      'Markham',
      'Ajax',
      'Oshawa',
      'Barrie',
      'Kitchener',
      'Niagara',
    ]) {
      const response = await api(`/api/v1/places?q=${encodeURIComponent(city)}`);

      expect(response.status, city).toBe(200);
      expect(((await response.json()) as { data: { city: string } }).data.city).toBe(city);
    }
  });

  it('accepts the province suffix the field shows', async () => {
    const response = await api(`/api/v1/places?q=${encodeURIComponent('Burlington, ON')}`);

    expect(response.status).toBe(200);
    expect(((await response.json()) as { data: { city: string } }).data.city).toBe('Burlington');
  });

  it('answers an unknown place with a 404 problem', async () => {
    const response = await api('/api/v1/places?q=Atlantis');

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    expectContract(response, PLACES, await response.json());
  });

  it('refuses an empty query with the form copy', async () => {
    const response = await api('/api/v1/places?q=');

    expect(response.status).toBe(422);
    const body = (await response.json()) as { errors: Record<string, string[]> };
    expect(body.errors.q).toEqual(['Enter your church’s address or town, or pick a city below.']);
    expectContract(response, PLACES, body);
  });
});
