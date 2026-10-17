# zamaro-api: the Zamaro API, Worker and Scheduler (ADR-0027).
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# Development: the repository's backend/ is bind-mounted over /app and node_modules lives in a named
# volume; the entrypoint installs dependencies when the volume is empty.
FROM base AS dev
ENV NODE_ENV=development
COPY docker/dev-entrypoint.sh /usr/local/bin/dev-entrypoint
RUN chmod +x /usr/local/bin/dev-entrypoint
ENTRYPOINT ["dev-entrypoint"]
CMD ["npm", "run", "dev"]

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production: Next.js standalone output plus the worker and scheduler bundles.
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8000 HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/resources ./resources
EXPOSE 8000
USER node
CMD ["node", "server.js"]
