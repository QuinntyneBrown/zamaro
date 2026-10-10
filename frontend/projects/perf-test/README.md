# perf-test

Renders one `zm-*` component scenario many times in Chromium so the runner in `e2e/perf-test/` can profile it.

## Add a scenario

1. Create `src/scenarios/<Name>.ts` whose default export is a standalone component rendering one realistic
   instance, using the cast and copy from `docs/mocks/README.md`.
2. Register it in `src/scenarios/index.ts`: `<Name>: () => import('./<Name>'),`.
3. If it renders in much less than 100 ms or much more than 300 ms, tune its iterations in
   `e2e/perf-test/config/scenario-iterations.mjs`.

## URL parameters

`?scenario=<Name>&iterations=<n>&renderType=mount|rerender`

- `mount` creates, checks and destroys the component `n` times.
- `rerender` creates it once and runs change detection `n` times.

The timing is published on `window.__perfResult`.

## Run it

```bash
cd frontend
NG_BUILD_MANGLE=0 npx ng build perf-test
cd ../e2e
npm run perf-test -- --baseline <base-branch dist> --fail-on-regression   # --scenarios Button,Ticket to narrow
```
