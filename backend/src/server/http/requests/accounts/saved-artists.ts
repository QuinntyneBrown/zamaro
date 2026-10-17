import { z } from 'zod';
import { optionalQuery } from '../../validation';

export const ListSavedArtistsRequest = z.object({
  /** The booker's most recent search date, or one they picked: "2026-11-14". */
  date: optionalQuery(z.iso.date({ error: 'Pick a date.' })),
});
