# Zamaro Web

The Angular workspace for Zamaro. It is an empty scaffold: projects are in place, and
features land slice by slice. See `AGENTS.md` for the target layout and conventions.

| Project      | Type              | Purpose                                             |
| ------------ | ----------------- | --------------------------------------------------- |
| `zamaro`     | Application (SSR) | Public site, booker and artist areas                |
| `admin`      | Application       | Administrator area under `/admin`                   |
| `perf-test`  | Application       | Component render scenarios for the perf test        |
| `components` | Library           | Every `zm-*` component, shared by both applications |
| `api`        | Library           | HTTP access, contracts and injection tokens         |

## Requirements

Node.js `^22.22.3`, `^24.15.0` or `>=26`, as required by Angular 22.

## Commands

```bash
npm install          # also installs the husky git hooks at the repository root
npm start            # serve zamaro at http://localhost:4200/
npx ng serve admin   # serve another application
npm run build        # build every project
npm run lint         # angular-eslint
npm run lint:fix
npm run format       # Prettier
npm run format:check
```

## Pre-commit hook

`.husky/pre-commit` at the repository root runs `lint-staged` in this folder. It runs
`eslint --fix` and `prettier --write` on staged frontend files and re-stages the result.
The rules are in the `lint-staged` field of `package.json`.
