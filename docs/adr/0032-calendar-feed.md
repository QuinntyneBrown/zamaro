# ADR-0032: The calendar feed is a secret link with no off switch, written by hand

**Date:** 2026-10-19
**Category:** backend
**Status:** Accepted
**Deciders:** Project owner

## Context

L2-058 gives an artist a secret iCalendar URL of their Confirmed bookings and lets them regenerate it,
after which the old URL answers 404. The design (`artist-availability/publish-calendar-feed`) left five
things open: whether the artist can also turn the feed off, whether the feed should be served from a
separate host, how long an event lasts when a booking stores only a start time, whether Completed
bookings stay in the feed, and which library writes the RFC 5545 text.

## Decision

1. **No off switch.** The feed stays on once enabled; "Make a new link" is the remedy for a leaked
   link, since it retires the old one at once. One fewer state in the dialog and nothing a calendar
   application has to notice beyond a 404.
2. **Served under `/api/v1/calendar-feeds/{token}.ics` on the API host.** The token is a 32-byte
   random value in base64url; only its SHA-256 is stored for lookup, with an application-encrypted copy
   so the dialog can show the link again. The route is anonymous, rate-limited like every anonymous
   call, answers `text/calendar`, `Cache-Control: private, no-store` and `X-Robots-Tag: noindex`, and the
   request log records the route's shape, never the token. The link names `APP_URL`; the e2e suite
   reaches it through the site's `/api` proxy.
3. **Two hours from the start time; all day without one.** Bookings carry no start time until requests
   land (journey 3), so every event is all-day for now and gains its hours then.
4. **Confirmed and Completed bookings are events; Cancelled ones drop off** on the next poll, as the
   design says. A past booking that stays in the calendar is what artists expect of a calendar.
5. **A hand-written writer** (`services/artist-availability/icalendar.ts`): a `VCALENDAR` with the
   Toronto `VTIMEZONE`, one `VEVENT` per booking with `UID {number}@zamaro.ca`, text escaping and 75-octet
   folding. A dozen properties did not justify a dependency.

## Consequences

- Making a new link is the only way to cut off a subscriber, and it cuts off every subscriber; the
  dialog says so before it does it.
- The feed is the one non-JSON answer under `/api/v1`; the OpenAPI document lists it with no body schema.
- Journey 3 adds `DTSTART;TZID=America/Toronto` times and the church address to events when bookings
  carry them.
