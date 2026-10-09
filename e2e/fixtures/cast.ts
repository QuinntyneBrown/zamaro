// The cast from docs/mocks/README.md. Specs state intent in these terms; page objects own the DOM.
export const cast = {
  today: '2026-10-09',
  search: { date: '2026-11-14', city: 'Burlington', kind: 'Worship night', radiusKm: 120 },
  booker: { name: 'Naomi Fraser', church: 'Riverside Community Church' },
  artists: {
    headliner: { name: 'Abigail Mensah', slug: 'abigail-mensah', city: 'Brampton', km: 44, rating: 4.9, churches: 38 },
    closest: { name: 'Marcus Bell Trio', city: 'Hamilton', km: 14, rating: 4.6, churches: 17 },
    empty: { name: 'Miriam Haile', city: 'Etobicoke' },
  },
} as const;
