# ACID Compliance Evaluation — DIGITALNOTES Backend

**Date:** 2026-10-04
**Scope:** `C:\workspaces\ITS\DIGITALNOTES\backend` (AdonisJS v6 + Lucid ORM + PostgreSQL via `pg`, Neon serverless Postgres / local Postgres)
**Method:** Static review of `config/database.ts`, all `database/migrations/*`, `database/active-records/*`, `app/controllers/authentication/auth_controller.ts`, `src/kernel/**/application/**/create_*_handler.ts`, `update_*`, `*_note_handler.ts`, `delete_upload_handler.ts`, `*_ar_repository.ts`, storage providers, and unit tests. No live DB fault-injection was run.
**Postgres baseline:** PostgreSQL itself is fully ACID (WAL + MVCC + FK/UNIQUE/CHECK + configurable isolation). The rating below is for **how this application uses it**, not for Postgres/Neon.

## Executive summary

| Property | Verdict | Score |
|---|---|---|
| **Atomicity** | **Partially compliant** — correct transactions only on the password-reset path; all other multi-write flows use manual compensation or no transaction | 2 / 5 |
| **Consistency** | **Largely compliant** — strong schema constraints + validators + domain checks; small gaps (no `price >= 0` CHECK, `uploads.created_by` has no FK, expiry enforced in app only) | 4 / 5 |
| **Isolation** | **Partially compliant** — inherits Postgres `READ COMMITTED`; explicit `SELECT … FOR UPDATE` only in auth flows; no explicit isolation config, no optimistic locking elsewhere → lost-update / double-write races possible | 2 / 5 |
| **Durability** | **Compliant (by inheritance)** — no unlogged tables, no `synchronous_commit=off`, Neon WAL/replication/snapshots; app adds `disableRollbacksInProduction`. Dual-write (DB + object storage) has no outbox, so end-to-end durability is best-effort | 4 / 5 |
| **Overall** | **Conditionally ACID: safe for single-row CRUD and password reset; NOT atomic/isolated for register, employee creation, note creation/update, or any DB+storage flow** | **3.0 / 5** |

> Bottom line: the database can give you ACID, but the application only asks for it in 2 of ~8 multi-statement flows. The rest rely on compensating deletes that fail on process crash and leave orphans / half-written aggregates.

## 1. Architecture relevant to ACID

- Single connection `postgres` defined in `config/database.ts:62-76` with `client: 'pg'`. `DB_DRIVER=neon` uses `DATABASE_URL` + TLS; `DB_DRIVER=postgres` uses discrete `DB_*` vars. No pool tuning, no `isolationLevel` setting — Postgres default (`READ COMMITTED`) applies.
- All writes go through Lucid `BaseModel` (`database/active-records/*`) or `db.from()` in `AuthController`. Repositories (`src/kernel/*/infrastructure/persistence/*_ar_repository.ts`) call `create` / `updateOrCreate` / `delete` **without accepting or propagating a transaction client**.
- Object storage (local / Neon S3 / Railway / Contabo via `src/infrastructure/*_storage_provider.ts`) is a **second durability domain** — it cannot participate in the Postgres transaction. Any `upload to S3 → insert row` flow is distributed by construction.
- Migrations use `naturalSort: true` and `disableRollbacksInProduction: true` (`config/database.ts:69-73`) — good durability hygiene for schema.

## 2. Atomicity — PARTIAL (2/5)

### 2.1 Compliant: password reset flows

| Flow | Evidence | Why it is atomic |
|---|---|---|
| `forgotPassword` | `app/controllers/authentication/auth_controller.ts:149-163` — `db.transaction(async (trx) => { User.query({client: trx}).forUpdate() … PasswordResetToken.query({client: trx}).delete() … PasswordResetToken.create(..., {client: trx}) })` | Single transaction: lock user row, delete unconsumed tokens, insert new token. All-or-nothing. Covered by `tests/unit/app/controllers/authentication/forgot_password.spec.ts:34-174` which asserts work happens inside a transaction. |
| `resetPassword` | `auth_controller.ts:180-207` — one `db.transaction` covering `PasswordResetToken … .forUpdate().first()`, `user.save()`, `resetToken.save()`, delete sibling tokens, `revokeAllTokens(user.id, trx)` | Correct unit of work: consume token + change password + revoke sessions succeed or roll back together. `FOR UPDATE` serialises concurrent redeems of the same token. |

### 2.2 Non-compliant flows (each is a real atomicity bug)

1. **`register` — user + access token not in a transaction** (`auth_controller.ts:40-74`).
   `User.create()` (line 44) then `User.accessTokens.create()` (line 47). On token failure the code does a compensating `User.query().where('id', …).delete()` (line 60). This is **not atomic**: a crash between the two statements, or a failure of the compensating delete itself, leaves an orphan `users` row that blocks retry with the same email/phone (UNIQUE on both). Fix: wrap both in `db.transaction`.
2. **`changePassword` — password change + session revocation not atomic** (`auth_controller.ts:220-243`).
   `user.save()` (line 238) then `revokeAllTokens()` = `delete from auth_access_tokens` (lines 35-37, 240) as two separate implicit transactions. If the delete fails, the password is changed but old tokens stay valid — a security-relevant partial commit. Fix: single `db.transaction`.
3. **`adminResetPassword` — three writes, zero transactions** (`auth_controller.ts:245-262`).
   `user.save()` + `revokeAllTokens()` + `PasswordResetToken.query().delete()` — any subset can persist. Same fix as above.
4. **`CreateEmployeeHandler` — manual saga instead of a transaction** (`src/kernel/employee/application/use-cases/command_handler/create_employee_handler.ts:44-76`).
   `users.save()` then `employees.save()`; on the second failure it calls `users.delete(userId)` (line 70). Crash window + non-transactional compensation = orphan `users` row. The `user_id UNIQUE` on `employees` (`1790000000013_create_employees_table.ts:15-21`) prevents double-linking but does not repair orphans.
5. **`CreateNoteHandler` — N uploads + note + N pages, no DB transaction** (`src/kernel/notes/application/command_handler/create_note_handler.ts:104-148`).
   Loop of `mediaService.uploadFile` (S3) + `upload.save` (DB row), then `repository.save(note)` which itself does `NoteRecord.create` + N× `NotePageRecord.create` (`src/kernel/notes/infrastructure/persistence/note_ar_repository.ts:42-51`) with **no transaction wrapper**. Compensation only covers the upload phase (lines 111-125, best-effort S3 + row deletes, swallowing errors). A failure mid page-insert leaves a `notes` row with a subset of `note_pages`.
6. **`NoteARRepository.save` update path — delete + re-insert not atomic** (`note_ar_repository.ts:26-40`).
   `updateOrCreate` → `delete where note_id = …` → loop `create`. A crash after the delete leaves the note with zero pages. Concurrent updaters can interleave delete/insert. Must be one transaction; ideally with `forUpdate` on the parent note row.
7. **`DeleteUploadHandler` — storage + DB split** (`src/kernel/uploads/application/command_handler/delete_upload_handler.ts:26-30`).
   `mediaManager.deleteFile` then `repository.delete`. If the process dies between them, S3 and Postgres disagree (dangling row or orphan object). This is **inherently non-atomic** across systems — needs an outbox / GC sweeper, not a local transaction. Same applies to every `uploadFile → save` path (`store_upload.handler.ts`, `create_note_handler.ts`).

### Atomicity rule of thumb for this codebase

> If a handler calls `save/create/delete` more than once (or once + a storage call), and you cannot find `db.transaction` in that call chain, it is not atomic. Today that is true everywhere except the two password-reset endpoints.

## 3. Consistency — LARGELY COMPLIANT (4/5)

### 3.1 Strengths (with evidence)

- **Primary keys + NOT NULL everywhere:** every `create_*` migration declares `table.uuid('id').primary().unique().notNullable()` (e.g. users, courses, notes, employees, `password_reset_tokens`, `note_pages`).
- **Referential integrity with deliberate actions:**
  - `notes.course_id → courses.id ON DELETE CASCADE` (`1790000000012:9`); `note_pages.note_id → notes.id CASCADE`, `note_pages.upload_id → uploads.id CASCADE` (`1790000000016:50-51`); `employees.university_id → universities CASCADE`, `employees.user_id → users CASCADE + UNIQUE` (`1790000000013:9-21`); `password_reset_tokens.user_id → users CASCADE` (`1790000000014:9-15`); `auth_access_tokens.tokenable_id → users CASCADE` (`1769145615393:9`); org chain faculties/departments/levels `CASCADE`, courses `RESTRICT` on level/semester (`1790000000011:15-21`) — prevents deleting a level/semester still referenced by courses. `notes.uploaded_by → users SET NULL` (`1790000000012:25`) preserves notes after user deletion.
- **Uniqueness as consistency arbiter:** `users.email UNIQUE`, `users.phone_number UNIQUE NOT NULL` (`1769145615387:11-12`); `password_reset_tokens.token_hash UNIQUE` (`1790000000014:16`); `uploads.url UNIQUE` (via `medias` rename, `1790000000003`); `universities.name/slug UNIQUE` (`1790000000006`); composite `UNIQUE(university_id, slug)`, `UNIQUE(faculty_id, slug)`, `UNIQUE(department_id, name)`, `UNIQUE(department_id, level_id, semester_id, code)`, `UNIQUE(note_id, sort_order)`, `UNIQUE(note_id, upload_id)` (`1790000000007/0008/0009/0011/0016`). Duplicate-registration and duplicate-page races correctly fail at the DB and are mapped (`isUniqueViolation` → 409 in `auth_controller.ts:18-21,66-70`; `UserAlreadyExistsError` in `user_ar_repository.ts:7-10,37-41`).
- **Domain CHECKs:** `notes.status` CHECK over `(DRAFT, CONVERTED, PENDING_REVIEW, PUBLISHED, REJECTED, ARCHIVED)` and `note_type` enum (`1790000000012:15-24`, `1790000000016:73-79`); `users.role` enum (`1769145615387:9`); defaults (`price DEFAULT 0`, `status DEFAULT 'DRAFT'`, `is_archived DEFAULT false`).
- **App-level validation:** Vine validators (`app/validators/*`) + domain guards (e.g. `CreateNoteHandler` rejects empty pages and duplicate `sortOrder`, verifies `course.isVisibleToStudents()`, `create_note_handler.ts:81-102`; ownership checks in `delete_upload_handler.ts:21-24`).

### 3.2 Gaps

| # | Gap | Impact |
|---|---|---|
| C1 | No `CHECK (price >= 0)` on `notes.price` (`1790000000012:19`). Negative prices pass the DB; relies solely on validators. | Low — add CHECK. |
| C2 | `uploads.created_by` is a nullable plain string with only an index (`1790000000003:12-14`, backfill `1790000000001`), **no FK to `users.id`**. Ownership is enforced in app code only. Orphaned creator references possible. | Medium — add FK or document intentional denormalisation. |
| C3 | Token expiry (`expires_at`) and single-use (`used_at`) are **app-query predicates** (`auth_controller.ts:182-186`), not DB constraints/exclusion. Correct today because every access path filters, but a future raw query could honour an expired token. | Low — acceptable; alternatively add partial unique index / scheduled purge. |
| C4 | `updateOrCreate` upserts in all `*_ar_repository.ts` (e.g. `user_ar_repository.ts:31`, `note_ar_repository.ts:28`) bypass optimistic concurrency — no `version` column, so stale writes silently win. | Medium — see Isolation. |

## 4. Isolation — PARTIAL (2/5)

- **Inherited level:** no code sets `SET TRANSACTION ISOLATION LEVEL` or Lucid `isolationLevel`; therefore every transaction runs at **Postgres default `READ COMMITTED` with MVCC**. This is correct for a CRUD app and avoids dirty reads, but allows non-repeatable reads / lost updates unless the app locks.
- **Good (only) example:** `SELECT … FOR UPDATE` on the exact rows being mutated in both password flows (`auth_controller.ts:150`, `:185`). This serialises concurrent `forgotPassword` (token churn) and concurrent `resetPassword` (double-spend of one token). The audit note in `SECURITY_AUDIT_2026-09-27.md:93` confirms the `forUpdate` logic is correct.
- **Missing everywhere else:**
  - No `forUpdate` / `lockForUpdate`, no `SERIALIZABLE`, no advisory locks, no `version`/`updated_at` optimistic check in employee, note, upload, or organisation handlers. Two concurrent `NoteARRepository.save` calls interleave `DELETE pages → INSERT pages`; two concurrent employee creates for the same person rely purely on the UNIQUE violation (safe for correctness, but the second gets a 500-class error instead of a clean 409 unless mapped — `create_employee_handler.ts:72-74` only maps `UserAlreadyExistsError`, not a raw `23505` from the `employees` insert).
  - `User.verifyCredentials` + `accessTokens.create` (login) and `User.create` (register) have no row lock — fine for login, but concurrent double-registration of the same email/phone resolves only via the UNIQUE constraint (correct outcome, error-path UX depends on `isUniqueViolation` mapping, which exists in the controller but not in all repository callers).
  - PgBouncer transaction-mode caveat (documented in `.agents/skills/neon-postgres/SKILL.md:275-280`): session-level `SET` does not survive across pooled transactions. The app currently avoids session state, so no violation — but any future `SET LOCAL` / temp-table / advisory-lock design must use the direct (unpooled) connection or stay inside one transaction.
- **Net:** phantom/lost-update anomalies are **possible** on notes (page replacement), employees (user+employee saga), and uploads. Severity is moderate (no financial ledger), but note publishing (`publish/archive/reject` handlers each do a single `repository.save`) can silently clobber a concurrent edit.

## 5. Durability — COMPLIANT BY INHERITANCE (4/5)

- Postgres/Neon provide WAL, crash recovery, replication, and point-in-time restore; nothing in the codebase weakens this: no `UNLOGGED` tables, no `synchronous_commit = off`, no `fsync = off`, no ephemeral tablespaces. `config/database.ts` enforces TLS (`DB_SSL`, lines 8-10, 22) so commits are not sent in cleartext in prod/stage.
- `disableRollbacksInProduction: true` (`config/database.ts:72`) prevents accidental `migration:rollback` from destroying durable schema/data in prod.
- Client-generated `crypto.randomUUID()` PKs (`database/active-records/*.ts @beforeCreate`) avoid sequence gaps on failover; idempotent migration `1790000000016` uses `createTableIfNotExists` + `IF EXISTS` raw DDL so partial-apply re-runs are safe.
- **Caveats (application-level, not engine-level):**
  1. `register`'s compensating `delete` and `CreateEmployeeHandler`'s `users.delete` are themselves durable once committed, but the **intent** is not durable — a crash before compensation leaves durable orphans. Durability of the wrong state.
  2. DB + object-storage dual-writes have no transactional outbox, no write-ahead intent record, no GC sweeper. A durable DB row can point at a never-uploaded (or already-deleted) S3 key and vice versa. End-to-end durability is therefore best-effort.
  3. No backup/restore runbook or RPO/RTO statement was found in-repo; durability ultimately depends on the Neon project / Postgres host configuration (snapshots, PITR window, retention), which is outside this codebase.

## 6. Transaction inventory (what was checked)

| Flow | Statements | `db.transaction`? | Atomic? |
|---|---|---|---|
| forgot-password | lock user + delete old tokens + insert token | ✅ `auth_controller.ts:149` | ✅ |
| reset-password | lock token + update user + mark token + delete siblings + revoke sessions | ✅ `:180` | ✅ |
| register | insert user + insert access token (− compensating delete) | ❌ | ❌ |
| login | read user + insert access token | ❌ (single insert; acceptable, session-per-login by design) | ⚠️ acceptable |
| change-password | update user + delete sessions | ❌ | ❌ |
| admin-reset-password | update user + delete sessions + delete reset tokens | ❌ | ❌ |
| create-employee (user+employee) | insert user + insert employee (− compensating delete) | ❌ | ❌ |
| create-note (N uploads + note + N pages) | N×(S3 put + insert upload) + insert note + N×insert page | ❌ | ❌ |
| update-note (replace pages) | update note + delete pages + N×insert page | ❌ | ❌ |
| store/delete upload (S3+DB) | storage op + 1 DB op | ❌ (impossible locally) | ❌ needs saga/outbox |
| org CRUD (university/faculty/…) | single-row insert/update/delete | ❌ (single statement = atomic by itself) | ✅ trivially |

## 7. Recommendations (prioritised)

1. **P0 — Wrap every multi-statement DB flow in `db.transaction` and thread the `trx` client through repositories.** Concretely: `register`, `changePassword`, `adminResetPassword`, `CreateEmployeeHandler`, `NoteARRepository.save` (both branches). Repositories must accept an optional `client` (Lucid `TransactionClient`) instead of using the global connection — currently none do, which makes correct transaction propagation impossible for the CQRS handlers.
2. **P0 — Make `CreateNoteHandler` transactional for the DB part and ordered for the storage part:** upload all files first, then do `uploads + notes + note_pages` inserts in one DB transaction; on DB failure, best-effort delete just-uploaded keys (keep current compensation); on S3 failure before the transaction, nothing DB-side exists yet. Record S3 keys in an outbox table inside the same transaction for a background GC of orphans.
3. **P1 — Add the two missing CHECKs/FKs:** `CHECK (price >= 0)` on `notes`; FK (or explicit decision + comment) for `uploads.created_by → users.id`.
4. **P1 — Close the isolation gaps:** `forUpdate()` the parent `notes` row in `NoteARRepository.save` update path; add an optimistic-concurrency `version` column (or at minimum compare `updated_at`) for note edits; map raw `23505` from the `employees` insert to `EmployeeAlreadyExistsError` so concurrent creates return 409, not 500.
5. **P1 — Outbox or sweeper for storage↔DB drift:** periodic job listing `uploads.relative_key` vs S3 inventory (and vice versa) until a proper transactional-outbox is introduced. At minimum log compensation failures instead of swallowing them (`create_note_handler.ts:114-122` empty `catch`).
6. **P2 — Document durability posture:** Neon branch/PITR window, snapshot schedule, RPO/RTO, and which connection (pooled vs direct) migrations and `SET LOCAL` features must use. Pin `disableRollbacksInProduction` (already set) and add a `db:status` CI gate.
7. **P2 — Add concurrency tests:** parallel `resetPassword` with one token (exactly one succeeds), parallel double-register (exactly one 201), parallel note-page replacement (no zero-page / half-page note). The existing `forgot_password.spec.ts` stub pattern (`db.transaction` stub) is a good template — extend it to the flows in §2.2 after fixing them.

## 8. Appendix — key files cited

- `config/database.ts` — connection, TLS enforcement, migration safety.
- `database/migrations/1769145615387_create_users_table.ts`, `1769145615393_create_access_tokens_table.ts`, `1790000000006..0011` (org + courses), `1790000000012_create_notes_table.ts`, `1790000000013_create_employees_table.ts`, `1790000000014_create_password_reset_tokens_table.ts`, `1790000000016_refactor_notes_to_pages.ts`, `1790000000001_backfill_media_created_by.ts`, `1790000000003_rename_medias_to_uploads_table.ts`.
- `database/active-records/user.ts`, `note.ts`, `note_page.ts`, `uploads.ts`.
- `app/controllers/authentication/auth_controller.ts` (all auth flows + `revokeAllTokens` + `isUniqueViolation`).
- `src/kernel/employee/application/use-cases/command_handler/create_employee_handler.ts`.
- `src/kernel/notes/application/command_handler/create_note_handler.ts`; `src/kernel/notes/infrastructure/persistence/note_ar_repository.ts`.
- `src/kernel/uploads/application/command_handler/delete_upload_handler.ts`, `store_upload.handler.ts`.
- `src/kernel/{user,employee,uploads}/infrastructure/persistence/*_ar_repository.ts` (no `trx` propagation).
- `tests/unit/app/controllers/authentication/forgot_password.spec.ts` (transaction assertions).
- `.agents/skills/neon-postgres/SKILL.md` (pooler vs direct guidance).
