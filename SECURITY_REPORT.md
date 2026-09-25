# Security Report — Digital Notes Backend

**Date:** 2026-09-15
**Scope:** Full codebase security audit
**Framework:** AdonisJS v6 (TypeScript, ESM)
**Stack:** PostgreSQL, Lucid ORM, AdonisJS Auth v9, AdonisJS Drive v3, VineJS

---

## Executive Summary

The Digital Notes backend implements a CQRS/DDD architecture with opaque access token authentication (OAT) and scrypt password hashing. The **cryptographic foundations are solid** — token hashing, password hashing, and UUID primary keys are well-implemented. However, the application has **significant gaps in authorization, rate limiting, secrets management, and error handling** that leave it vulnerable to credential brute-force, IDOR attacks, and information disclosure. Immediate remediation is required for the 6 Critical findings before production use.

**Finding Counts:**

| Severity  | Count  |
| --------- | ------ |
| Critical  | 6      |
| High      | 8      |
| Medium    | 10     |
| Low       | 5      |
| **Total** | **29** |

---

## Architecture Overview

```
HTTP Request
  → Global Middleware (ContainerBindings, ForceJsonResponse, CORS)
  → Router Middleware (BodyParser, InitializeAuth)
  → Named Middleware (auth — per route)
  → Controller → CommandBus → Handler → Repository + StorageProvider
  → Response (JSON enforced)
```

- **Auth guard:** Opaque Access Tokens (OAT), not JWT
- **Password hashing:** scrypt (cost=16384, blockSize=8, parallelization=1, maxMemory=32MB)
- **Token storage:** Hashed in `auth_access_tokens` table, 7-day expiry, 50-byte secret
- **File storage:** Strategy pattern — Local FS / Railway S3 / Contabo S3
- **Validation:** VineJS schemas at request boundary

---

## Critical Findings

### C1 — Credentials Committed to Version Control

**Files:**

- `.env.example` (lines 5, 10, 19–21)
- `bruno/digital-notes/environments/local_dev.bru` (line 3)
- `bruno/digital-notes/environments/stage.bru` (line 2)

**Evidence:**
`.env.example` contained a real `APP_KEY`, database password, and Railway S3 access key pair. Bruno environment files contained live `oat_` access tokens. Those values have been removed from the tree and must be rotated out of band; they are intentionally not repeated here.

**Risk:** Anyone with repo access can decrypt app data, access the database, interact with S3 storage, and impersonate users.

**Recommendation:**

- Rotate ALL exposed credentials immediately (APP_KEY, DB_PASSWORD, Railway S3 keys, all access tokens).
- Replace `.env.example` values with placeholders (`APP_KEY=<generate-with-adonis-generate-key>`).
- Add `bruno/` to `.gitignore` or use Bruno's environment variable vault.
- Consider using a secrets manager (Vault, Railway variables, Doppler).

---

### C2 — Raw Error Object Returned to Clients

**File:** `app/controllers/authentication/auth_controller.ts` (line 20)

```typescript
} catch (error) {
  return response.abort({ error })
}
```

`response.abort()` serializes the entire JavaScript `Error` object — including the stack trace, constructor name, internal properties, and any attached metadata — and sends it as a 500 response.

**Risk:** Full stack traces and internal implementation details are exposed to any API consumer. Attackers can map the codebase structure, file paths, and internal module names.

**Recommendation:**

```typescript
} catch (error) {
  // Log the full error server-side
  logger.error({ err: error }, 'Registration failed')
  // Return a generic message to the client
  return response.abort({ message: 'Registration failed' })
}
```

---

### C3 — IDOR: No Ownership Check on Media Deletion

**Files:**

- `app/controllers/media/medias_controller.ts` (lines 39–44)
- `app/controllers/media/image_medias_controller.ts` (lines 44–49)
- `app/controllers/media/document_medias_controller.ts` (lines 44–49)
- All 3 `delete_*_handler.ts` files

```typescript
async destroy({ request, response }: HttpContext) {
    const params = request.params()
    await this.handleCommand<void>(new DeleteMediaCommand(AppId.fromString(params.id)))
    return response.noContent()
}
```

Any authenticated user can delete any media record by providing its UUID. There is no ownership verification — the handler looks up the record by ID and deletes it regardless of who requested it.

**Risk:** Data destruction by any authenticated user. Combined with UUID predictability (sequential time-based generation), this is exploitable at scale.

**Recommendation:**

- Populate `created_by` on media creation (currently always `null`).
- Add ownership verification in the delete handler: compare `media.createdBy` against the authenticated user ID.
- Add an admin bypass for `administrator` role once RBAC is implemented.

---

### C4 — No Rate Limiting on Any Endpoint

**Evidence:** No `@adonisjs/throttle` or equivalent package in `package.json`. No custom rate limiting middleware found. No token bucket, sliding window, or IP-based throttling anywhere in the codebase.

**Vulnerable Endpoints:**

| Endpoint                | Attack Vector                              |
| ----------------------- | ------------------------------------------ |
| `POST /api/register`    | Mass account creation, resource exhaustion |
| `POST /api/login`       | Credential brute-force (no lockout)        |
| `POST /api/media`       | Storage flooding, cost amplification       |
| `DELETE /api/media/:id` | Enumeration and mass deletion              |

**Recommendation:**

- Install `@adonisjs/throttle` and apply to all endpoints.
- Apply strict limits to auth endpoints (e.g., 5 login attempts per minute per IP).
- Apply moderate limits to media upload (e.g., 20 per minute per user).
- Add account lockout after N failed login attempts.

---

### C5 — CORS Allows All Origins with Credentials

**File:** `config/cors.ts` (line 11)

```typescript
origin: true,
credentials: true,
```

`origin: true` reflects any `Origin` header back in the response. Combined with `credentials: true`, this means any website can make authenticated cross-origin requests to the API using the user's stored access token.

**Risk:** Cross-site request attacks from any malicious website. An attacker can craft a page that makes authenticated API calls on behalf of any visitor who has a valid session.

**Recommendation:**

```typescript
origin: [
  'https://your-frontend.com',
  'https://staging.your-frontend.com',
],
```

In development, use a specific localhost origin or environment-gated wildcard.

---

### C6 — `created_by` Never Populated on Media Records

**Files:**

- `src/kernel/medias/application/command_handler/store_media.handler.ts`
- `src/kernel/medias/application/command_handler/store_image.handler.ts`
- `src/kernel/medias/application/command_handler/store_document.handler.ts`

The `Media` entity and DB schema have a `created_by` column, but the handler never sets it. The authenticated user's ID is available in the controller's `HttpContext` but is never passed to the command.

**Risk:** No ownership tracking means authorization checks are impossible. All media records are ownerless, making IDOR defense and audit trails infeasible.

**Recommendation:**

- Pass the authenticated user ID through the command to the handler.
- Set `createdBy` during `Media` entity construction.
- Make `created_by` non-nullable in a future migration.

---

## High-Severity Findings

### H1 — Logout Endpoint Not Protected by Auth Middleware

**File:** `start/routes.ts` (line 26)

```typescript
router.get('/logout', [AuthController, 'logout'])
```

The logout route lacks `middleware.auth()`. The controller calls `auth.use('api').invalidateToken()` without verifying the request is authenticated first. Unauthenticated requests will hit this endpoint and either error or behave unexpectedly.

Additionally, using GET for logout is a CSRF vector — `<img src="/api/logout">` on any page would trigger it.

**Recommendation:**

- Change to `router.post('/logout', [AuthController, 'logout']).use(middleware.auth())`.

---

### H2 — Stack Trace Leakage in Non-Production Environments

**File:** `app/exceptions/handler.ts` (line 12)

```typescript
protected debug = !app.inProduction
```

When `NODE_ENV` is anything other than `production` (including `stage`), full stack traces are rendered in error responses. The environment validation schema allows `stage` as a valid value.

**Recommendation:** Set `debug` to `false` explicitly, or gate it only on `development`:

```typescript
protected debug = app.inDev
```

---

### H3 — Internal Architecture Details Exposed in Error Messages

**Files:**

- `src/kernel/medias/domain/errors/media_not_found_error.ts`
- `src/kernel/medias/domain/errors/image_not_found_error.ts`
- `src/kernel/medias/domain/errors/document_not_found_error.ts`
- `src/shared/infrastructure/bus/errors/handler_not_registered_error.ts`

Domain errors include internal IDs and handler names in their messages and detail objects:

```
"Media record for id: \"abc-123\" not found"
"No handler registered for command: StoreMediaCommand"
```

**Recommendation:** Return generic 404/500 messages to clients. Log detailed error info server-side only.

---

### H4 — Missing Status Code Mappings in Exception Handler

**File:** `app/exceptions/handler.ts` (lines 46–63)

`MEDIA_NOT_FOUND` and `DOCUMENT_NOT_FOUND` are not in the `resolveStatus()` switch statement. They fall through to `default: 422`, returning a misleading "Unprocessable Entity" for what should be a `404 Not Found`.

**Recommendation:** Add all domain error codes to the switch, with a fallback of `500` (not `422`).

---

### H5 — No Password Reset Mechanism

There is no password reset endpoint, token generation, or email flow. Users who forget their passwords have no recovery path.

**Recommendation:** Implement a time-limited, single-use password reset token sent via email.

---

### H6 — No Email Verification

Users can register with any email address and immediately receive an access token. There is no confirmation step.

**Recommendation:** Implement email verification. Consider gating token issuance or restricting actions until the email is verified.

---

### H7 — No Role-Based Access Control

The `UserRole` enum (`student`, `administrator`, `contributor`) and `role` column exist in the schema, but **zero enforcement** exists anywhere. All authenticated users have identical access. The `registerSchema` does not include `role`, so it may default or fail (column is `NOT NULL`).

**Recommendation:**

- Set a default role (e.g., `student`) during registration.
- Implement policies or middleware to enforce role-based access.
- Protect admin-only endpoints (user management, if added) behind role checks.

---

### H8 — `auth.check()` vs `auth.authenticate()` in `/me` Endpoint

**File:** `app/controllers/authentication/auth_controller.ts` (lines 44–47)

```typescript
async me({ auth, response }: HttpContext) {
    await auth.check()
    const user = auth.user as User
```

`auth.check()` returns a boolean without throwing on failure. If the token is invalid/missing, `auth.user` is `null`, and the `as User` cast silently produces a null reference that will crash downstream.

**Recommendation:** Use `auth.authenticate()` (throws on failure) or check the boolean return and respond with 401.

---

## Medium-Severity Findings

### M1 — No Token Revocation on Password Change

There is no password change endpoint. If one is added, it must invalidate all existing tokens for the user. Currently, even if the password changes, all previously issued tokens remain valid for their 7-day lifetime.

### M2 — No Multi-Token / Session Management

Users cannot see or revoke active sessions/tokens. No endpoint exists to list or invalidate tokens.

### M3 — Weak Password Policy

`registerSchema` requires only `minLength(8)`. No uppercase, digit, special character, or dictionary check.

**Recommendation:** Require at least 3 of: uppercase, lowercase, digit, special character. Consider checking against breached password lists.

### M4 — `MEDIA_NOT_FOUND` Error Exposes Internal IDs

The error message includes the database UUID, which helps attackers enumerate valid records.

### M5 — Default 422 Status for Unmapped Error Codes

**File:** `app/exceptions/handler.ts` (line 61)

The `resolveStatus()` default case returns `422` instead of `500`. Internal errors (DB failures, unhandled exceptions) that pass through `DomainError`/`ApplicationError` will get a misleading status code.

### M6 — Pagination Parameters Not Validated

**File:** `src/shared/user_interface/controller/app_abstract_controller.ts` (lines 31–35)

```typescript
const page = query.page || query['page[offset]']
const limit = query.limit || query['page[limit]']
```

No `parseInt()` or bounds checking. Negative values and `NaN` propagate to the query builder. The `MAX_PAGE_LIMIT = 100` cap exists but no minimum is enforced.

### M7 — Debug Queries Enabled in Database Config

**File:** `config/database.ts` (line 5)

```typescript
prettyPrintDebugQueries: true,
```

SQL queries are pretty-printed in logs, potentially exposing schema details in log aggregation systems.

### M8 — `DB_PASSWORD` Is Optional in Environment Validation

**File:** `start/env.ts` (line 29)

```typescript
DB_PASSWORD: Env.schema.string.optional(),
```

An empty database password is allowed by the schema. In production, this could lead to an unauthenticated database connection if the `.env` is misconfigured.

### M9 — 20 MB Multipart Upload Limit

**File:** `config/bodyparser.ts` (line 50)

The 20 MB limit is generous. Combined with no rate limiting, this enables storage exhaustion attacks. The `MAX_FILE_SIZE_MB` env var (0.5 MB) is only enforced in the `FileValidator` service, not at the body parser level.

### M10 — `application/csp-report` Accepted as JSON Content-Type

**File:** `config/bodyparser.ts` (line 28)

This is an unusual content type to accept as JSON. It could be abused to bypass content-type validation if downstream logic doesn't re-check.

---

## Low-Severity Findings

### L1 — Deprecated Endpoints Remain Active Without Sunset Headers

`image-media` and `document-media` routes are marked `@deprecated` in code comments but remain fully operational with no `Sunset` or `Deprecation` response headers.

### L2 — No API Versioning

All routes are under `/api/` with no version prefix. Breaking changes have no clean migration path.

### L3 — Token Prefix `oat_` Is Predictable

The access token prefix reveals the token type, aiding pattern recognition.

### L4 — Media `relativeKey` and `metadata` Exposed in Model

The `Media` ActiveRecord has no `serializeAs: null` on internal fields. Currently mitigated by the command returning only `{ id, url, signedUrl, type }`, but direct model serialization would leak storage paths.

### L5 — No HTTPS Enforcement or HSTS Headers

No middleware forces HTTPS or sets `Strict-Transport-Security` headers. Relies entirely on the reverse proxy (Railway/Coolify) for TLS termination.

---

## Positive Findings

| Area                   | Detail                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| Password hashing       | scrypt with strong parameters (memory-hard, GPU-resistant)                                       |
| Token storage          | Opaque tokens, hashed in DB, raw token returned only once                                        |
| Token entropy          | 50-byte secret length provides strong resistance to brute-force                                  |
| Primary keys           | UUIDs (non-sequential, resistant to enumeration — though `crypto.randomUUID()` is time-based v4) |
| Password serialization | `password_hash` excluded via `serializeAs: null`                                                 |
| Email normalization    | Lowercased on registration                                                                       |
| Environment validation | Critical env vars validated at boot via `Env.create()`                                           |
| Forced JSON responses  | `ForceJsonResponseMiddleware` prevents HTML error pages                                          |
| Input validation       | VineJS schemas validate at request boundary                                                      |
| No SQL injection       | Lucid ORM used exclusively, no raw queries found                                                 |
| No command injection   | No `exec()`, `eval()`, `Function()` found in source                                              |
| No XSS vectors         | API-only backend with JSON responses, no HTML rendering                                          |
| S3 visibility          | Storage configured as `private` (requires signed URLs for access)                                |
| No console.log leaks   | No `console.log/error/warn` statements found in source                                           |
| `.gitignore` coverage  | `.env`, `.env.local`, `.env.production.local` excluded                                           |

---

## Recommendations Priority Matrix

| Priority             | Action                                                                    | Addresses |
| -------------------- | ------------------------------------------------------------------------- | --------- |
| **P0 — Immediate**   | Rotate all exposed credentials, scrub `.env.example` and Bruno files      | C1        |
| **P0 — Immediate**   | Replace `response.abort({ error })` with sanitized error response         | C2        |
| **P0 — Immediate**   | Add ownership check to media deletion                                     | C3        |
| **P1 — Urgent**      | Install rate limiting on all endpoints (especially `/login`, `/register`) | C4        |
| **P1 — Urgent**      | Restrict CORS origins to known frontends                                  | C5        |
| **P1 — Urgent**      | Populate `created_by` and enforce media ownership                         | C6        |
| **P1 — Urgent**      | Protect logout with auth middleware, change to POST                       | H1        |
| **P1 — Urgent**      | Fix error handler debug mode and missing status mappings                  | H2, H4    |
| **P2 — Short-term**  | Implement RBAC with role enforcement                                      | H7        |
| **P2 — Short-term**  | Add password reset and email verification flows                           | H5, H6    |
| **P2 — Short-term**  | Fix `auth.check()` to `auth.authenticate()` in `/me`                      | H8        |
| **P2 — Short-term**  | Sanitize domain error messages for client responses                       | H3        |
| **P3 — Medium-term** | Strengthen password policy                                                | M3        |
| **P3 — Medium-term** | Add pagination validation, reduce multipart limit                         | M6, M9    |
| **P3 — Medium-term** | Disable debug queries, require DB password                                | M7, M8    |
| **P3 — Medium-term** | Add HTTPS enforcement and security headers                                | L5        |
| **P4 — Low**         | Add API versioning, deprecation headers, sunset timeline                  | L1, L2    |

---

_Report generated by automated codebase analysis. Findings are based on static analysis of the source code and configuration files at the time of the audit._
