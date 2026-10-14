# backend

The backend is being rebuilt as a Next.js application on Node.js ([ADR-0027](../docs/adr/0027-nextjs-backend.md)).
The Laravel API, worker and scheduler have been removed. What remains is data that does not depend on
the backend's language, and which the Next.js backend keeps at the same paths:

- `resources/i18n/en/` — the translation catalogues the API served at `/api/v1/i18n/{locale}`
- `database/seeders/media/` — the sample media files the seeders copied to the media disk
- `docker/postgres/init.sql` — creates the extra databases; `docker-compose.yml` mounts it into Postgres
