# Security Audit — Digital Notes Backend

**Date:** 2026-09-27
**Scope:** Full codebase security audit (follow-up to `SECURITY_REPORT.md` dated 2026-09-15)
**Framework:** AdonisJS v6 (TypeScript, ESM)
**Stack:** PostgreSQL / Neon Postgres, Lucid ORM, AdonisJS Auth v9 (OAT), Drive v3, VineJS, @adonisjs/limiter
**Method:** Static code review, config review, secret-scan (`git ls-files` + grep for `oat_|npg_|nak_live|nsk_live`), `npm audit --json`, `npm run typecheck`, `node ace test`
**Verification:** `tsc --noEmit` passes; test suite: **82 passed**

---

## Executive Summary

The remediation since the 2026-09-15 report is substantial. Of the 6 prior Criticals, **5 are fully fixed and 1 is partially fixed** (see §1). Auth hardening (throttle, `POST /logout` + `auth`, `authenticate()`, forced `student` role, password-reset + change-password with token revocation), CORS allowlisting, bodyparser tightening, `created_by` ownership with admin bypass, pagination clamping, and debug-query gating are all in place and covered by unit tests.

One **new Critical** was introduced with the password-reset feature: `POST /api/forgot-password` returns the single-use reset token in the JSON response, defeating the generic-message anti-enumeration control and letting anyone mint a reset token for any account. A second production-transport issue (`DB_SSL=false` documented default) and several High-severity upload/supply-chain issues remain.

**Finding counts (this audit):**

| Severity | Count |
| -------- | ----- |
| Critical | 1     |
| High     | 9     |
| Medium   | 10    |
| Low      | 5     |
| **Total**| **25** |

Prior report had 29 findings (6 Critical, 8 High, 10 Medium, 5 Low). Net: −4, with 1 new Critical replacing 6 old ones.

> Do not deploy to public production until C1 is fixed and H1/H2/H3 are dispositioned.

---

## 1. Regression Check Against 2026-09-15 Report

| Old ID | Subject | Status 2026-09-27 | Evidence |
| ------ | ------- | ----------------- | -------- |
| C1 | Credentials committed | **Fixed** | `.env.example:5`, `.env.production:5` are placeholders; `git ls-files` shows `.env.local` (live Neon creds) is **untracked/gitignored**; `grep oat_\|tid__\|tsec_ bruno/` returns nothing |
| C2 | Raw `response.abort({error})` | **Fixed** | `app/controllers/authentication/auth_controller.ts:64,210` log server-side, return generic message |
| C3 | IDOR on media delete | **Fixed** | `app/controllers/uploads/upload_controller.ts:48-54` threads `user.id` + `user.role`; `src/kernel/uploads/application/command_handler/delete_upload_handler.ts:21-24` enforces owner-or-admin |
| C4 | No rate limiting | **Fixed (partial gap, see H8)** | `start/limiter.ts:14-23` (auth 5/min + 5-min block, store 20/min, destroy 30/min); wired in `start/routes.ts:28-38,46-47`; disabled in `test` env |
| C5 | CORS `origin:true` + credentials | **Fixed** | `config/cors.ts:19` allowlist callback against `CORS_ORIGINS`; empty env = deny-by-default |
| C6 | `created_by` never populated | **Fixed** | `store_upload.handler.ts:54` passes `command.actorId`; `upload_ar_repository.ts:20,52` persists/maps it; `findById` uses `find()` → `null` (`upload_ar_repository.ts:33-38`) |
| H1 | Unguarded `GET /logout` | **Fixed** | `start/routes.ts:35` is now `POST /logout` + `middleware.auth()`; controller returns `204` (`auth_controller.ts:121-124`) |
| H2 | Stack leakage (`debug=!inProduction`) | **Fixed** | `app/exceptions/handler.ts:24` is `app.inDev` |
| H3/H4 | Internal error details / wrong 404→422 | **Largely fixed, residual oracle (see H7)** | Category-based statuses (`handler.ts:6-13`), generic `Media not found` messages; but `details` still echoed (`handler.ts:43`) and `MEDIA_NOT_OWNED→403` vs `MEDIA_NOT_FOUND→404` remain distinguishable |
| H5 | No password reset | **Implemented, but introduces C1** | `forgotPassword`/`resetPassword`/`changePassword`/`adminResetPassword` exist (`auth_controller.ts:126-263`) with hashing, expiry, revocation — but reset token is returned in-band |
| H6 | No email verification | **Still open (M8)** | No verification endpoint, token, or mailer flow found |
| H7 | No RBAC | **Minimal RBAC shipped** | `app/middleware/role_middleware.ts`, `start/kernel.ts:46`, `/api/v1/admin` group guarded (`routes.ts:92`); `DeleteUploadCommand` carries `actorRole` |
| H8 | `auth.check()` in `/me` | **Fixed** | `auth_controller.ts:103-106` uses `authenticate()` + non-null assertion |
| M3 | Weak password (min 8) | **Improved, still basic** | `app/validators/auth_validator.ts:3-6`: min 10 + lower/upper/digit; no special-char, length-max, or breach-list check |
| M6 | Pagination unvalidated | **Fixed** | `src/shared/application/read-model/pagination.ts:8-13` coerces + clamps `page>=1`, `1<=limit<=100` |
| M7 | `prettyPrintDebugQueries:true` | **Fixed** | `config/database.ts:59` is `nodeEnv === 'development'` |
| M8 | `DB_PASSWORD` optional | **Still open (M3)** | `start/env.ts:35` still `.optional()`; fail-closed only via runtime check in `config/database.ts:43-53` for `postgres` driver |
| M9 | 20 MB multipart | **Fixed** | `config/bodyparser.ts:4-6,50` reads `MAX_FILE_SIZE_MB` (default 2), hard-capped at 10 MB |
| M10 | `csp-report` as JSON | **Fixed** | `config/bodyparser.ts:27-30` JSON types no longer include it |
| L5 | No HTTPS/HSTS | **Still open (L1)** | No app-layer redirect or `Strict-Transport-Security`; relies on proxy (unchanged, accepted only if proxy is guaranteed) |

---

## 2. Architecture Overview (Current)

```
Request
 → server middleware (ContainerBindings, ForceJsonResponse, CORS allowlist)
 → router middleware (Bodyparser [2 MB default], InitializeAuth)
 → named middleware (auth, role, throttle)
 → Controller → VineJS validate → Command/Query bus → Handler → Repository + MediaManager → Drive (fs|s3|contabo|neon|neon_docs)
 → JSON response | AppError → sanitized handler (dev-only debug)
```

- **Auth:** Opaque Access Tokens (`oat_`, 50-byte secret, 7-day expiry, hashed at rest) — `database/active-records/user.ts:65-71`. scrypt hasher.
- **Routes:** legacy versionless `/api` (auth + uploads) and versioned `/api/v1` (org, employees, notes, admin). Admin group requires `auth` + `role:administrator` (`routes.ts:92`).
- **Uploads:** `UploadController.store/destroy` → `StoreUploadCommand(actorId, file, …)` / `DeleteUploadCommand(actorId, id, actorRole)` → `MediaUploadService(FileValidator)` → provider (`local|railway|contabo|neon`).
- **Notes:** `NoteController.store` threads `user.id` as `uploadedBy`; `index/show` are public; `update/publish/reject/archive` are admin-only.
- **Throttle:** `start/limiter.ts` memory store; `authThrottle` on register/login/forgot/reset/change + admin reset; `uploadStoreThrottle`/`uploadDestroyThrottle` on uploads + note store.
- **Errors:** `AppError(code, message, category, details?)` → `CATEGORY_STATUS` map; VineJS 422 keeps `details`; everything else falls to `super.handle`.

---

## 3. Critical Findings

### C1 — Password-Reset Token Returned in API Response (NEW)

**File:** `app/controllers/authentication/auth_controller.ts:146-171`

```ts
const token = generateResetToken()
// ... store sha256(token), 1h expiry ...
return response.ok({ data: { message, resetToken: token, expiresAt: ... } })
```

The endpoint returns the generic anti-enumeration `message` ("If an account exists…") but then attaches the live single-use token for any valid account. There is no email/SMS delivery in the codebase — the token is only obtainable from this response. Anyone can `POST /api/forgot-password {email: victim}` and immediately `POST /api/reset-password {token, password}` to take over the account. The hashing/expiry/single-use/`forUpdate` logic is otherwise correct, which makes this purely a disclosure bug with maximum impact.

**Risk:** Full account takeover for any account with a known email/phone (both are low-entropy identifiers). Throttle (5/min) does not help — one request per victim suffices.

**Recommendation (P0):**

1. Stop returning `resetToken`. Return only `{ message }` in both branches.
2. Deliver the token out-of-band (email via mailer; SMS for phone). Until a mailer exists, gate the route behind admin invocation or feature-flag it off in production — do not ship in-band disclosure.
3. Add a regression test asserting the response body never contains `resetToken`/`token`.
4. Rotate any tokens issued through this endpoint and notify affected users.

---

## 4. High-Severity Findings

### H1 — Production Documents Plaintext DB Connection (`DB_SSL=false`)

**Files:** `.env.production:11-15`, `.env.example:13-17`, `config/database.ts:55`

Production defaults to `DB_SSL=false` (no TLS) with discrete `DB_*`_Postgres. On any network where app↔DB traffic leaves the host (Railway public Postgres, Coolify remote DB), credentials and PII traverse the wire unencrypted. The commented-out `DB_PASSWORD` lines further suggest the shipped file cannot boot against `postgres` driver (fail-closed is good), but the documented default steers operators toward insecure config.

**Recommendation:** Default `DB_SSL=true`; require `DB_SSL` explicitly in `start/env.ts`; document `no-verify` as self-signed-only escape hatch. Enforce TLS in staging and verify with a boot check.

### H2 — Signed URLs Valid for 30 Days

**File:** `src/infrastructure/local_storage_provider.ts:93-97` (`expiresIn || 60*60*24*30`)

Every upload response includes a `signedUrl` valid for a month. A leaked URL (logs, chat, referer, shared screenshot) grants a month of access. S3/Neon providers should be audited for the same default.

**Recommendation:** Shorten to 15 min–1 h for private media; issue fresh URLs on `show`/detail reads instead of at `store` time. Make TTL env-configurable (`SIGNED_URL_TTL_SECONDS`).

### H3 — Stored XSS via SVG Upload

**Files:** `src/shared/application/services/upload/types.ts:11-17` (`ImageFormat.SVG`), `config/drive.ts:17-23` (`fs` disk `serveFiles:true, visibility:'public'`)

SVG is an allowed image MIME and local-disk files are served publicly without `Content-Security-Policy` or `Content-Disposition: attachment`. An attacker uploads `<svg onload=…>` and shares the public URL; victims opening it execute script in the storage origin (cookie theft if cookies are ever scoped there, defacement, malware delivery).

**Recommendation:** Remove `image/svg+xml` from allowed formats (or serve with `Content-Type: image/svg+xml` + `Content-Security-Policy: script-src 'none'` + `Content-Disposition: attachment`); prefer raster/thumbnail serving. Apply the same to S3/Neon `ContentDisposition` metadata.

### H4 — Client-Supplied MIME Only; No Content Sniffing

**Files:** `src/shared/domain/app_file.ts:27-29` (`type/subtype` from multipart headers), `src/core/application/services/media-upload/validator.ts:28-49`

`FileValidator.validate(mimeType, size)` trusts the multipart `Content-Type`. No magic-byte (`file-type`) check, no extension↔MIME consistency check. Polyglot/mislabeled binaries (e.g., HTML masquerading as `image/png`) pass validation; downstream `getMediaType` then misclassifies.

**Recommendation:** Verify bytes server-side (`file-type` or `sharp` metadata for images, `%PDF` header for PDFs), reject mismatches, and set `Content-Type` from verified bytes on serve. Add validator-level `vine.file({ size, extnames })` constraints as defense-in-depth.

### H5 — Vulnerable `@adonisjs/bodyparser` (DoS + Prototype Pollution)

**Evidence:** `npm audit`: `@adonisjs/bodyparser <=10.1.2` — GHSA-xx9g-fh25-4q64 (unrestricted memory buffering in `PartHandler`, CVSS 7.5) and GHSA-f5x2-vj4h-vg4c (prototype pollution, CVSS 7.2). Current tree pulls the vulnerable range transitively via `@adonisjs/core`.

**Recommendation:** Upgrade `@adonisjs/core`/`@adonisjs/bodyparser` past the fixed release, re-run `npm audit`, and add Dependabot/Renovate + CI `npm audit --audit-level=high` gate.

### H6 — Vulnerable `lodash` (Code Injection + Prototype Pollution)

**Evidence:** `npm audit`: `lodash <=4.17.23` — GHSA-r5fr-rjxr-66jc (`_.template` code injection, CVSS 8.1) and GHSA-f23m-r3pf-42rh / GHSA-xxjr-mmjv-4gpg (proto pollution via `_.unset`/`_.omit`). Declared directly in `package.json:75` as `^4.17.23` and imported in `src/shared/user_interface/controller/app_abstract_controller.ts:7`.

**Recommendation:** Upgrade `lodash` (or replace uses with native helpers), audit `_.template`/`_.merge`/`_.unset`/`_.omit` call sites, and pin with `npm audit` CI gate. Same applies to transitive `lodash-es`.

### H7 — Error Oracle: `details` Echoed + Distinct Not-Found vs Not-Owned

**Files:** `app/exceptions/handler.ts:38-46`, `src/kernel/uploads/domain/errors/upload_not_found_error.ts:6` (`details: {uploadId}`), `src/kernel/uploads/domain/errors/upload_not_owned_error.ts:6` (`MEDIA_NOT_OWNED`, `FORBIDDEN→403`)

Two issues combine: (a) any `AppError.details` is sent to clients, so `uploadId` (and `InfrastructureError` `cause`) leak; (b) missing vs not-owned are distinguishable by both `code` and status (404 vs 403), giving an existence oracle for UUID enumeration despite the generic "Media not found" message.

**Recommendation:** Strip `details` from client payloads (log server-side only); use a single code (`MEDIA_NOT_FOUND`) and single status (404) for both branches.

### H8 — No Throttle on Public Reads and Most Admin Writes

**File:** `start/routes.ts:53-89`

Public `GET /universities|faculties|departments|levels|semesters|courses|notes` have no throttle (scraping, enumeration, cache-busting DoS). Admin `store/update/archive/publish/reject` (except `adminResetPassword` and note `store`) likewise have only `auth`+`role`. Authenticated-attacker cost amplification remains.

**Recommendation:** Apply a permissive global throttle (e.g., 120/min/IP) plus stricter per-route limits on writes (20–30/min as with uploads). Keep `test`-env bypass.

### H9 — Temporary Admin Password Has 48 Bits of Entropy and No Expiry

**File:** `app/controllers/authentication/auth_controller.ts:31-33,245-262`

`generateTemporaryPassword()` uses 6 random bytes (`base64url` + `A1a` suffix for policy compliance ≈ 48-bit). The temp password is returned in-band, never expires, and is only rotated on next login/password change. It also bypasses the `passwordRule` shape expectations downstream.

**Recommendation:** Generate ≥16 bytes, force change-on-next-login (add `must_change_password` flag or expire sessions), deliver out-of-band, and log the admin action with actor + target IDs.

---

## 5. Medium-Severity Findings

### M1 — CORS `methods` Omits `PATCH`; Browsers Block Admin Edits

**File:** `config/cors.ts:20` — `['GET','HEAD','POST','PUT','DELETE']`, but `PATCH /api/v1/admin/courses/:id` and `PATCH /api/v1/admin/notes/:id` exist (`routes.ts:74,86`). Cross-origin PATCH preflights fail.

**Fix:** Add `'PATCH'` (and `'OPTIONS'` implicitly handled) or derive from route table.

### M2 — `LIMITER_STORE` Is Dead Config; Memory Store Only

**Files:** `.env.example:63`, `.env.local:40`, `config/limiter.ts:9-14`, `start/limiter.ts:4-12`

Docs promise a pluggable store, but code hardcodes `memory`. Multi-instance production (Railway horizontal scale) lets attackers rotate IPs/instances past per-process buckets. The code comment acknowledges Redis but no wiring exists.

**Fix:** Read `LIMITER_STORE` in `config/limiter.ts`; add Redis store option; document sticky-session vs shared-store requirement.

### M3 — `DB_PASSWORD` Still Optional in Env Schema

**File:** `start/env.ts:35`. Fail-closed runtime check (`config/database.ts:43-53`) only covers `DB_DRIVER=postgres` outside `test`. `neon` mode and `test` mode accept empty passwords silently.

**Fix:** Make `DB_PASSWORD` required when `DB_DRIVER=postgres` (conditional validation) or required outright in `production`/`stage`.

### M4 — File-Size Limits Disagree Across Layers

`FileValidator.DEFAULT_MAX_SIZE` is 10 MB (`validator.ts:15`), bodyparser defaults to `MAX_FILE_SIZE_MB=2` capped at 10 (`bodyparser.ts:4-6`), and `vine.file()` in `upload_schema.ts:9` / `note_validator.ts:11` sets no size/ext constraints. Behavior depends on which layer trips first; error shapes differ (413 vs 422 vs service error).

**Fix:** Single source of truth (env), validator-level `vine.file({ size: '2mb', extnames })`, service-level check kept as backstop.

### M5 — Local Filename Extension Unsanitized; Public Serve

**File:** `src/infrastructure/local_storage_provider.ts:107-112` — `originalName.split('.').pop()` used verbatim as extension; no allowlist, length cap, or `..`/`/` strip. Combined with `serveFiles:true` (`config/drive.ts:19`), a crafted extension could confuse content-type handling or tooling.

**Fix:** Derive extension from verified MIME (`getExtensionFromMimeType`), allowlist `jpg|png|webp|pdf|…`, lowercase + truncate.

### M6 — Orphan DB Rows When Storage File Is Missing

**File:** `src/kernel/uploads/application/command_handler/delete_upload_handler.ts:26-30` — if `fileExists()` is false, neither storage nor DB delete runs; the record becomes undeletable through the API (repeat 204 never happens, no error surfaced).

**Fix:** Delete the DB row regardless (log the storage miss), or return a distinct `already-gone` result.

### M7 — `repository.delete()` Can Throw Unmapped Lucid Error

**File:** `src/kernel/uploads/infrastructure/persistence/upload_ar_repository.ts:57` — `findOrFail` throws `E_ROW_NOT_FOUND`, which is not an `AppError` and falls to `super.handle` (stack in dev, generic 500 in prod). Race between `findById` and `delete` surfaces as 500 instead of 404.

**Fix:** Use `find()` + null check → `UploadNotFoundError`, matching `findById`.

### M8 — Still No Email Verification / MFA / Session Inventory

No verification token/mailer, no TOTP/WebAuthn, no `GET /api/tokens` list/revoke. Password reset (C1) and change-password revocation (`auth_controller.ts:240,204,258` — good) partially compensate, but stolen tokens remain valid up to 7 days with no user-visible session list.

**Fix (roadmap):** Email verification on register; optional TOTP for admin; token inventory with per-session revoke.

### M9 — Dev Log Committed (`log.txt`)

`log.txt` is tracked and contains boot banners, SQL with bind order, and error dumps — useful for attackers mapping schema and internals. It also guarantees noisy diffs.

**Fix:** `git rm --cached log.txt`, add `*.log`/`log.txt` to `.gitignore`, rotate anything sensitive that appeared in history.

### M10 — Test Credentials in Tracked Bruno Fixture

`bruno/digital-notes/Authentication/Login.bru` (staged diff) contains `phoneNumber` + `NewPassword123`-style password. Low risk (test account), but tracked secrets normalize the pattern that caused the original C1.

**Fix:** Replace with `{{phoneNumber}}`/`{{password}}` vault placeholders; keep the `bruno/*/environments/` gitignore rule (` .gitignore:31`) and extend to any fixture bodies if needed.

---

## 6. Low-Severity Findings

### L1 — No App-Layer Security Headers

No Helmet/HSTS/CSP/`X-Frame-Options`/`Referrer-Policy` middleware found. Relies entirely on Railway/Coolify edge. Self-hosted or misconfigured edges serve without HSTS.

**Fix:** Add a lightweight headers middleware (or edge config-as-code) and assert headers in tests.

### L2 — Inconsistent API Versioning

Auth/uploads live under versionless `/api` while org/notes/employees live under `/api/v1` (`routes.ts:25,52`). Clients must handle two schemes; future breaking changes have no clean path for `/api`.

**Fix:** Freeze `/api` as legacy, route all new development under `/api/v1`, publish a sunset plan.

### L3 — Predictable `oat_` Token Prefix

`database/active-records/user.ts:67`. Minor information disclosure (token-type oracle); accepted industry practice for DB lookup routing. No action beyond noting.

### L4 — Phone Number Validation Is Length-Only

`app/validators/auth_validator.ts:26-28` (`maxLength(12)`, unique). No E.164/format check; inconsistent international numbers can create duplicate-identity edge cases.

**Fix:** Normalize to E.164 with a regex or `libphonenumber-js` validator on register + login.

### L5 — Role Checked From JWT Session Object Without Re-fetch

`app/middleware/role_middleware.ts:10-12` trusts `ctx.auth.user.role` from the token session. Mid-session demotion (admin → student) takes effect only on next login.

**Fix (optional):** Re-fetch role on admin routes or shorten token TTL for privileged roles.

---

## 7. Positive Findings (What Got Better)

| Area | Detail |
| ---- | ------ |
| Secrets hygiene | `.env.example`/`.env.production` are placeholders; `.env.local` with live Neon creds is untracked; `bruno/environments/` gitignored; token grep clean |
| Error handling | Sanitized `abort({message})`, `debug=app.inDev`, category→status map, no `console.*` in `app/`, no `exec/eval/raw` queries |
| AuthZ | Owner-or-admin on upload delete; `createdBy` persisted; admin group behind `role`; `POST /logout` guarded |
| AuthN | `authenticate()` in `/me`+`changePassword`; forced `student` role; scrypt; OAT hashed at rest; 7-day expiry |
| Throttle | Auth 5/min+5-min block, uploads 20/30/min, `test` bypass so suite stays green |
| Transport/config | CORS allowlist (deny by default), multipart env-driven ≤10 MB, `csp-report` removed, debug queries dev-only |
| Crypto hygiene | Reset tokens: 256-bit, sha256-at-rest, 1 h expiry, single-use, `FOR UPDATE` + sibling cleanup, revocation on reset/change/admin-reset |
| Quality gates | `typecheck` clean, **82/82 tests pass**, pagination/validator/middleware/handler specs present |

---

## 8. Remediation Priority Matrix

| Priority | Action | Addresses |
| -------- | ------ | --------- |
| **P0** | Stop returning `resetToken` from `forgot-password`; deliver out-of-band; add regression test | C1 |
| **P0** | Upgrade `@adonisjs/bodyparser`+`core` past GHSA-xx9g/GHSA-f5x2; upgrade `lodash`; gate CI on `npm audit` | H5, H6 |
| **P1** | Default `DB_SSL=true`; require password/TLS in prod/stage | H1, M3 |
| **P1** | Shorten signed-URL TTL to ≤1 h; re-issue on read | H2 |
| **P1** | Block SVG (or sandbox + `attachment`); add magic-byte MIME verification | H3, H4 |
| **P1** | Strip `details` from client errors; unify not-found/not-owned code+status | H7 |
| **P1** | Throttle public reads + remaining admin writes | H8 |
| **P1** | Strengthen temp password (≥128-bit), expire, deliver out-of-band | H9 |
| **P2** | Add `PATCH` to CORS; wire `LIMITER_STORE`/Redis; unify file-size limits; sanitize extensions | M1, M2, M4, M5 |
| **P2** | Fix delete-orphan + `findOrFail`→`find` null path | M6, M7 |
| **P2** | Untrack `log.txt`; vault Bruno credentials | M9, M10 |
| **P3** | Email verification, MFA option, session inventory; E.164 phones; headers; versioning | M8, L1, L2, L4, L5 |

---

## 9. Appendix

### A. `npm audit` (2026-09-27)

`30 vulnerabilities: 0 critical, 13 high, 17 moderate` across 731 deps. Load-bearing items: `@adonisjs/bodyparser` (GHSA-xx9g-fh25-4q64, GHSA-f5x2-vj4h-vg4c), `lodash`/`lodash-es` (GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh), plus transitive `qs`, `js-yaml`, `fast-xml-parser`, `form-data`, `flatted`, `minimatch`, `picomatch`, `browserslist`, `brace-expansion`, `ajv`, `@humanfs/node`, `@faker-js/faker` (dev). Full JSON available via `npm audit --json`.

### B. Files Reviewed (selection)

`start/routes.ts`, `start/kernel.ts`, `start/env.ts`, `start/limiter.ts`, `config/cors.ts|database.ts|bodyparser.ts|drive.ts|limiter.ts|app.ts`, `app/exceptions/handler.ts`, `app/middleware/*`, `app/controllers/authentication/auth_controller.ts`, `app/controllers/uploads/upload_controller.ts`, `app/controllers/notes/note_controller.ts`, `app/controllers/employee/employee_controller.ts`, `app/validators/*`, `src/shared/domain/errors/*`, `src/shared/application/read-model/pagination.ts`, `src/shared/user_interface/controller/app_abstract_controller.ts`, `src/kernel/uploads/**`, `src/kernel/notes/application/command_handler/upload_note_handler.ts`, `src/core/application/services/media-upload/*`, `src/infrastructure/*`, `database/active-records/user.ts|password_reset_token.ts`, `.env.example|.local|.test|.production`, `.gitignore`, `bruno/**`, `package.json`, `log.txt`.

### C. How to Verify Fixes

```bash
# 1. Reset token must not leak
curl -s -X POST localhost:3333/api/forgot-password -H 'Content-Type: application/json' \
  -d '{"email":"victim@example.com"}' | grep -i token && echo FAIL || echo PASS
# 2. Cross-user delete → 404, owner delete → 204 (see delete_upload_handler.spec.ts)
# 3. 6 rapid logins → 429 with Retry-After
# 4. Unlisted Origin gets no Access-Control-Allow-Origin; PATCH preflight succeeds for allowed origins
# 5. npm audit --audit-level=high passes; tsc + 82 tests green
```

---

_Report generated by static analysis + config/dependency review on 2026-09-27. Findings reflect the tree at audit time; re-run after P0/P1 fixes and before public launch._
