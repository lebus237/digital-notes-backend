# Testing

The backend uses [Japa](https://japa.dev) through the AdonisJS test runner.
All tests are **functional**: they boot the HTTP server and exercise the API
through real requests, including routing, middleware, validation, the CQRS
handlers, and the database.

## Prerequisites

Functional tests need a PostgreSQL database dedicated to tests. The defaults in
`config/database.ts` match `backend/docker-compose.test.yml`:

| Setting  | Default             |
| -------- | ------------------- |
| host     | `127.0.0.1`         |
| port     | `5433`              |
| user     | `postgres`          |
| password | `postgres`          |
| database | `digitalnotes_test` |

Start the database with Docker:

```sh
npm run test:db:start
npm run test
```

Run a single spec while iterating:

```sh
node ace test --files=register.spec.ts
```

Stop and remove it (including its data) when you are done:

```sh
npm run test:db:stop
```

Any of the values above can be overridden through `DB_HOST`, `DB_PORT`,
`DB_USER`, `DB_PASSWORD`, `DB_DATABASE`, and `DB_SSL` in `.env.test` or the
process environment.

> **Warning:** the suite runs migrations and truncates every table between
> tests. Always point it at the dedicated test database, never at development
> or production data.

## Writing tests

- Place specs under `tests/functional/**/*.spec.ts`.
- Use `test.group(...)` and `group.each.setup(() => testUtils.db().truncate())`
  to get a clean database before each test.
- Seed state through the active records in `#database/active-records/index`
  (or through the API when the test is about that endpoint).
- File storage is replaced by an in-memory provider (see
  `tests/functional/support/in_memory_storage_provider.ts`), so uploads never
  leave the process. Note that the file bytes still go through the real MIME
  sniffing and allowlist checks.
- Shared fixtures live in `tests/functional/support/helpers.ts`.
