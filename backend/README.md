# backend

The Laravel API, worker and scheduler have been removed. What remains is data that does not depend on
the backend's language:

- `resources/i18n/en/` — the translation catalogues the API served at `/api/v1/i18n/{locale}`
- `database/seeders/media/` — the sample media files the seeders copied to the media disk
- `docker/postgres/init.sql` — creates the extra databases; `docker-compose.yml` mounts it into Postgres
