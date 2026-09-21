# Security Mitigation — Structural Migration & Update Plan

**Source findings:** `SECURITY_REPORT.md` (6 Critical, 8 High, 10 Medium, 5 Low)
**Scope decisions (confirmed):** `@adonisjs/limiter` for rate limiting · email flows deferred (hooks only) · minimal RBAC · legacy shims hardened in place
**Non-goals:** No full Bouncer policies, no mailer provider setup, no legacy route removal, no API versioning.
**Project copy:** mirror this plan into the project at `docs/security-migration-mitigation.md` during implementation (see Phase 0, step 0) — addresses review comment on §4/password rule to keep a copy in the current project.

---

## 1. Target Architecture (What Changes Structurally)

| Layer | Current | Target |
|---|---|---|
| Routes (`start/routes.ts`, `start/kernel.ts`) | `auth` guard only; logout via unguarded GET; no throttle | `auth` + `throttle` + new `role` named middleware; `POST /api/logout` guarded |
| Controllers | No `auth.user` passed to commands; raw `response.abort({error})` in auth; `auth.check()` in `me` | Controllers extract `auth.user.id` as `actorId`, pass into commands; sanitized errors only; `auth.authenticate()` |
| Commands | `StoreMediaCommand(file,title,desc)`, `DeleteMediaCommand(id)` — no actor | Add `actorId: string` (+ `actorRole?: UserRole`) to all 6 media commands (unified + legacy image/document) |
| Domain entity (`src/kernel/medias/domain/media.ts`) | `createdBy?: any`, no getter | `createdBy: string \| null` + `getCreatedBy()` + `isOwnedBy(actorId)` helper |
| Handlers | No ownership check; `throw new Error()` on upload failure | Ownership enforcement on delete (owner or administrator); throw `ApplicationError` with safe codes |
| Repository (`media_ar_repository.ts` + image/document equivalents) | `save()` drops `createdBy`; `findById` uses `findOrFail` (leaks Lucid 404) | Persist `createdBy`; `findById` uses `find()` → returns `null` → handler throws sanitized `MediaNotFoundError` |
| Error pipeline (`app/exceptions/handler.ts`) | `debug = !app.inProduction`; missing `MEDIA/DOCUMENT_NOT_FOUND`; default 422; echoes `error.message/details` | `debug = app.inDev`; full code→status map; default 500; sanitized client messages + server-side log |
| Config | CORS `origin:true`; multipart `20mb`; `csp-report` JSON; `prettyPrintDebugQueries:true`; `DB_PASSWORD` optional | CORS allowlist from env; multipart aligned to `MAX_FILE_SIZE_MB`; strict JSON types; debug queries off in prod; `DB_PASSWORD` required in prod |
| Validators (`auth_validator.ts`) | `password: minLength(8)`; no role default | Stronger password rule; register sets default `UserRole.STUDENT` server-side (never from client) |
| Secrets | Real values in `.env.example`, live tokens in `bruno/*/environments/*.bru` | Placeholders only; `bruno/` gitignored or vaulted (operational rotation done separately) |
| Pagination (`pagination.ts`, `app_abstract_controller.ts`) | Unvalidated `page/limit` passthrough | `parseQueryPagination` coerces + clamps (`page>=1`, `1<=limit<=100`) |

---

## 2. Phase 0 — Secrets Rotation (Operational, Before Code Lands)

> Code fix alone is insufficient — exposed secrets must be rotated. Do this first, out-of-band.

- [ ] **0. Copy this plan into the project:** write a verbatim mirror to `docs/security-migration-mitigation.md` in the backend repo (create `docs/` if missing) so the plan lives alongside the code under implementation. Keep this canonical copy at `~/.commandcode/plans/security-migration-mitigation.md` as source of truth; re-sync the project mirror whenever the plan changes. (Plan mode cannot write outside `~/.commandcode/plans/`, so this copy happens as the first implementation step.)
- [ ] Rotate `APP_KEY` (via `node ace generate:key`), `DB_PASSWORD`, Railway S3 keypair, all `oat_*` tokens.
- [ ] Replace `.env.example` values with placeholders (see Phase 7).
- [ ] Scrub `bruno/digital-notes/environments/local_dev.bru` + `stage.bru` tokens → `access_token: <paste-at-runtime>` + add `bruno/digital-notes/environments/` to `.gitignore` (keep `*.bru` request files, ignore environment files) **or** move to Bruno vault.
- [ ] Verify: `grep -ri "oat_\|tid__\|tsec_" --include="*.bru" --include=".env.example"` returns nothing sensitive.

---

## 3. Phase 1 — Error-Handling Hardening (C2, H2, H3, H4, M4, M5)

**File:** `app/exceptions/handler.ts`

1. Change `protected debug = !app.inProduction` → `protected debug = app.inDev`.
2. Rework `handle()` Domain/Application branch to return **sanitized** payloads:
   ```ts
   const SERVER_MESSAGE: Record<number,string> = { 404:'Resource not found', 409:'Conflict', 422:'Unprocessable entity', 500:'Internal server error' }
   // send: { status:'error', error:{ code: error.code, message: SERVER_MESSAGE[status] } }
   // log full error via ctx.logger.error({ err: error, code: error.code })
   ```
   Keep `details: error.messages` **only** for the VineJS 422 branch.
3. Expand `resolveStatus()` to cover every domain code actually thrown: `MEDIA_NOT_FOUND`, `IMAGE_NOT_FOUND`, `DOCUMENT_NOT_FOUND`, `RESOURCE_NOT_FOUND` → 404; keep existing 409s; add `MEDIA_NOT_OWNED`/`PRODUCT_IMAGE_NOT_OWNED` → 403 (new ownership error, see Phase 4); change `default` → 500.
4. Ensure `report()` logs via `ctx.logger` (already delegates to super — keep).

**File:** `app/controllers/authentication/auth_controller.ts` (`register`)
- Replace `return response.abort({ error })` with logger + generic abort:
  ```ts
  catch (error) { ctx.logger.error({ err: error }, 'auth.register failed'); return response.abort({ message: 'Registration failed' }) }
  ```
  Needs `logger` from `HttpContext` (add to destructure).

**Files:** `src/kernel/medias/domain/errors/media_not_found_error.ts` (+ image/document equivalents)
- Change message to generic `'Media not found'` while keeping `{ mediaId }` **out** of client payload (details still available server-side via log; handler no longer echoes details).

**Verify:** trigger 404/422/500 manually; assert responses contain only `{code, message}` with no stack, no IDs, no handler names; `NODE_ENV=stage` returns no stack.

---

## 4. Phase 2 — Auth Routes & Validators (H1, H8, M3, H7-partial)

**File:** `start/routes.ts`
- `router.post('/logout', [AuthController,'logout']).use(middleware.auth())` — replaces unguarded `GET /logout`. (Breaking change for Bruno `Logout.bru` — update it to POST.)
- Wrap auth group with throttle (Phase 3 wiring lands here; see below).

**File:** `app/controllers/authentication/auth_controller.ts`
- `me()`: replace `await auth.check()` + `as User` cast with:
  ```ts
  await auth.authenticate()  // throws 401 via handler
  const user = auth.user!
  ```
- `register()`: force server-side role — `User.create({ ...payload, role: UserRole.STUDENT })`. Never accept `role` from client. Import `UserRole` from `#kernel/user/domain/types/user_role`.
- `logout()`: keep `invalidateToken()`, add `return response.noContent()`.

**File:** `app/validators/auth_validator.ts`
- Strengthen: `password: vine.string().minLength(10).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)` (message: must include upper, lower, digit). Keep `minLength(8)`→ bump to 10 as agreed minimal uplift.
- No `role` field added (intentional — role is server-assigned).

**File:** `start/env.ts`
- `DB_PASSWORD: Env.schema.string()` (required). If Railway injects empty locally, use `.env` override — schema must not permit production without password.

**Verify:** `GET /api/logout` → 404/405; `POST /api/logout` without token → 401; with token → 204; `POST /api/register` ignores injected `role`; weak password → 422.

---

## 5. Phase 3 — Rate Limiting via `@adonisjs/limiter` (C4)

1. `npm i @adonisjs/limiter` + `node ace configure @adonisjs/limiter` (memory store default; document Redis swap for multi-instance prod).
2. **File:** `start/kernel.ts` — register named `throttle` middleware:
   ```ts
   export const middleware = router.named({
     auth: () => import('#middleware/auth_middleware'),
     throttle: () => import('@adonisjs/limiter/limiter_middleware'),
   })
   ```
3. **File:** `start/routes.ts` — apply:
   - Auth group: `.use(middleware.throttle({ maxAttempts: 5, duration: '1m', blockDuration: '5m' }))` on `login`/`register` (per-IP key default).
   - Media store: `throttle({ maxAttempts: 20, duration: '1m' })`; destroy: `throttle({ maxAttempts: 30, duration: '1m' })`. Apply via `.use()` on the resource groups (Adonis resource `.use('*', ...)` supports stacking — chain `.use('*', middleware.auth()).use('*', middleware.throttle({...}))` or per-route groups).
4. Confirm429 shape is JSON (ForceJsonResponse already covers it).

**Verify:** 6 rapid logins → 429 with `Retry-After`; valid login after window succeeds; media flood throttled.

---

## 6. Phase 4 — Media Ownership / IDOR Fix (C3, C6) — Core Structural Change

### 6a. Domain + commands (6 files + entity)

- `src/kernel/medias/domain/media.ts`: type `createdBy: string | null`, add `getCreatedBy(): string | null` + `isOwnedBy(actorId: string): boolean`.
- `StoreMediaCommand` / `DeleteMediaCommand` (+ legacy `StoreImageCommand`, `DeleteImageCommand`, `StoreDocumentCommand`, `DeleteDocumentCommand`): add `public readonly actorId: string` as first constructor arg. Update `timestamp` unchanged.
- New error `src/kernel/medias/domain/errors/media_not_owned_error.ts` (mirror for image/document or reuse one code):
  ```ts
  export class MediaNotOwnedError extends DomainError {
    constructor() { super('MEDIA_NOT_OWNED', 'Media not found', undefined) } // message intentionally generic to avoid oracle
  }
  ```
  Map `MEDIA_NOT_OWNED` → **404** (not 403) in handler to avoid existence oracle — return "not found" whether missing or not-owned.

### 6b. Controllers pass actor (3 unified + legacy files)

- `medias_controller.ts` (+ `image_medias_controller.ts`, `document_medias_controller.ts`):
  ```ts
  async store({ auth, request, response }: HttpContext) {
    const userId = auth.user!.id as string
    // ... new StoreMediaCommand(userId, new AppFile(file), ...)
  }
  async destroy({ auth, request, response }: HttpContext) {
    const userId = auth.user!.id as string
    await this.handleCommand(new DeleteMediaCommand(userId, AppId.fromString(params.id)))
  }
  ```
  Routes already enforce `auth()` so `auth.user` is set.

### 6c. Handlers enforce (6 handler files)

- `store_media.handler.ts` (+ image/document): pass `command.actorId` into `new Media(..., upload.key, command.actorId)` instead of `null`.
- `delete_media_handler.ts` (+ image/document):
  ```ts
  const media = await this.repository.findById(command.id.value)
  if (!media) throw new MediaNotFoundError(command.id.value)
  const isAdmin = (command as any).actorRole === UserRole.ADMINISTRATOR // only if role threaded; else omit
  if (!isAdmin && !media.isOwnedBy(command.actorId)) throw new MediaNotOwnedError()
  // ... existing file+db delete
  ```

### 6d. Repository persists `createdBy` (+ 3 AR files)

- `media_ar_repository.ts` (+ image/document AR repos): include `createdBy: entity.getCreatedBy()` in `save()` object; keep mapping `media.createdBy` in `findById`/`findByUrl`.
- Change `findById` from `findOrFail` → `find`; return `null` when missing so handler controls the error shape (avoids Lucid `E_ROW_NOT_FOUND` leaking through default handler).

### 6e. Migration — backfill + enforce

- New migration `database/migrations/<ts>_backfill_media_created_by.ts`:
  - `medias.created_by` stays nullable (legacy rows have no owner); create index on `created_by` for ownership lookups.
  - Same for `image_medias`/`document_medias` if those tables have the column (check; if not, skip).
  - No `NOT NULL` enforcement yet (would break legacy rows) — document as follow-up once backfill strategy agreed.

**Verify:** user A creates media → `created_by = A`; user B `DELETE` → 404; user A `DELETE` → 204; admin `DELETE` (after Phase 5) → 204; legacy image/document flows identical.

---

## 7. Phase 5 — Minimal RBAC (H7)

1. **Migration:** `database/migrations/<ts>_default_user_role.ts` — `alterTable('users').string('role').defaultTo('student').alter()` (keeps `NOT NULL` enum). New rows default even if controller omits role.
2. **Middleware:** `app/middleware/role_middleware.ts`:
   ```ts
   // usage: middleware.role({ roles: ['administrator'] })
   export default class RoleMiddleware {
     async handle(ctx, next, options: { roles: string[] }) {
       const user = ctx.auth.user as User | undefined
       if (!user || !options.roles.includes(user.role)) return ctx.response.forbidden({ status:'error', error:{ code:'FORBIDDEN', message:'Forbidden' } })
       return next()
     }
   }
   ```
   Register as `role` in `start/kernel.ts` named middleware.
3. Thread `actorRole` into `DeleteMediaCommand` (optional 2nd param) so admin bypass works; controller reads `(auth.user as User).role`.
4. No Bouncer, no per-resource policies in this migration.

**Verify:** admin deletes foreign media → 204; student deletes foreign media → 404; `role` middleware rejects non-admin on a probe admin route (add test-only route or unit-test middleware directly).

---

## 8. Phase 6 — Config & Transport Hardening (C5, M7, M9, M10, L5)

| File | Change |
|---|---|
| `config/cors.ts` | `origin: (origin, cb) => allowlist check` against new `CORS_ORIGINS` env (comma-separated); `credentials:true` kept; add `PUT,PATCH` to methods only if frontend needs it |
| `start/env.ts` | Add `CORS_ORIGINS: Env.schema.string.optional()`; document format in `.env.example` |
| `.env.example` | Replace ALL secrets with placeholders; add `CORS_ORIGINS=http://localhost:3000`, `MAX_FILE_SIZE_MB=2`, `LOCAL_STORAGE_PATH`, `LOCAL_STORAGE_URL` (required by `start/env.ts` but missing from example) |
| `config/bodyparser.ts` | Remove `'application/csp-report'` from JSON types; `multipart.limit` → read from env (`MAX_FILE_SIZE_MB`, default `2mb`, hard cap comment `≤10mb`) |
| `config/database.ts` | `prettyPrintDebugQueries: env.get('NODE_ENV') === 'development'` |
| Transport (L5) | No code change — confirm Railway/Coolify terminates TLS + sends HSTS; document in README/ops note. If self-hosted, add reverse-proxy HSTS rule (out of scope for app code). |

**Verify:** cross-origin from unlisted origin gets no `Access-Control-Allow-Origin`; `csp-report` POST → 415/400; multipart over limit → 413; `stage` env shows no SQL pretty-print.

---

## 9. Phase 7 — Pagination + Legacy Shim Hardening (M6, L-shims)

- `src/shared/application/query-options/pagination.ts`: coerce in constructor:
  ```ts
  this.page = Math.max(1, Number.parseInt(String(page)) || 1)
  this.limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number.parseInt(String(limit)) || DEFAULT_PAGE_LIMIT))
  ```
- `app_abstract_controller.ts`: `parseQueryPagination` passes raw through (Pagination now self-sanitizes) — no signature change.
- Legacy `image_medias_controller.ts` / `document_medias_controller.ts`: apply identical actor-threading + ownership + error-shape changes as unified controller (copy the 6b/6c pattern; do not refactor to shared base — keep diff surgical).
- Update `bruno/` requests for new logout POST + throttled retry expectations.

---

## 10. Phase 8 — Tests & Verification

| Area | Tests to add (`tests/`) |
|---|---|
| Error shape | Handler spec: VineJS→422 `{code,message}` only; `MEDIA_NOT_FOUND`→404 generic; unknown code→500 generic; `stage` env → no stack |
| Auth | `register` ignores `role` injection; weak password 422; `me` without token 401; `POST /logout` 204 + token invalidated; `GET /logout` 404/405 |
| Throttle | 6th rapid login → 429; suite uses isolated IP keys or disables throttle in test env |
| Ownership | A-create → B-delete 404, A-delete 204; `created_by` persisted; legacy image/document same matrix |
| RBAC | Admin deletes foreign media 204; student 404; role middleware unit spec |
| Config | CORS unlisted origin blocked; oversize upload 413; pagination `?page=-1&limit=abc` clamps to `1/10` |

**Execution order:** implement Phases 1→7 sequentially (each is independently testable); run `npm run typecheck && npm run lint && node ace test` after every phase. Manual smoke: register → login → upload → cross-user delete (404) → owner delete (204) → logout.

---

## 11. File Touch List (Authoritative)

```
start/routes.ts, start/kernel.ts, start/env.ts
app/middleware/role_middleware.ts (new)
app/controllers/authentication/auth_controller.ts
app/controllers/media/medias_controller.ts, image_medias_controller.ts, document_medias_controller.ts
app/exceptions/handler.ts
app/validators/auth_validator.ts
config/cors.ts, config/bodyparser.ts, config/database.ts
.env.example, .gitignore (bruno envs), bruno/** (logout POST, scrubbed tokens)
docs/security-migration-mitigation.md (new — verbatim project mirror of this plan, created in Phase 0)
src/kernel/medias/domain/media.ts, domain/errors/media_not_owned_error.ts (new), domain/errors/* (message only)
src/kernel/medias/application/command/* (6 files: +actorId), command_handler/* (6 files: ownership)
src/kernel/medias/infrastructure/persistence/* (3 AR repos: createdBy + find())
src/shared/application/query-options/pagination.ts
database/migrations/<new>_backfill_media_created_by.ts, <new>_default_user_role.ts
```

**Deliberately untouched:** storage providers, CQRS bus wiring, `User` model token config, mailer (deferred), Bouncer (deferred), API versioning (deferred).

---

## 12. Rollout Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `POST /logout` breaks existing clients | Ship with 301/308 redirect note + update Bruno + changelog; keep GET for one release returning `410 Gone` with migration hint (optional, cheap) |
| Throttle locks out test suite | Disable/raise limits when `NODE_ENV=test` |
| Legacy `created_by=NULL` rows undeletable by anyone except admin | Admin bypass covers cleanup; backfill script assigns service-account owner where known |
| CORS allowlist blocks legit preview deploys | Support comma-separated list + document adding preview URLs |
| Stronger password rule rejects existing users on login | Only enforced on register/change, never retroactively on login |
