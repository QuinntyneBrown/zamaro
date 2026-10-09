# Definition of done

The standing bar every increment clears before it is committed as done.

- [ ] The change has a requirement, a detailed design and (for UI) a mock, and they agree with the code.
- [ ] Its acceptance test was written first and seen to fail for the expected reason.
- [ ] Backend: `docker compose exec api php artisan test` passes.
- [ ] Frontend: `npm run lint`, `npm run format:check` and `npx ng build zamaro` pass in `frontend/`.
- [ ] E2E: `npx playwright test` passes in `e2e/` (Chromium only); visual baselines changed only for an
      intentional design change.
- [ ] A new or changed `zm-*` component has a perf-test scenario and passes
      `--fail-on-regression` against the base branch.
- [ ] No selector appears in a test; page objects own the DOM.
- [ ] No architecture tests were added.
- [ ] Tokens are read by role, never by value.
- [ ] Docs and ADRs touched by a resolved conflict are updated in the same change.
- [ ] The change is committed with a descriptive message.
