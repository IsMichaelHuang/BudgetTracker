# Plan: Phase B — authorization, injection, registration

Parent: `docs/plans/sop-remediation.md`, items 4-6.

## Goal

Every request can only read or change the caller's own data, request
bodies can never inject SQL, and registration is validated and atomic.

## Non-goals

Real-Postgres integration tests (Phase C), rate limiting, helmet, error
middleware (Phase D).

## Acceptance criteria

1. Given user A's token, when A reads, updates, or deletes a category,
   charge, or net-worth item owned by B, then the API returns 404 and
   no row changes.
2. Given A's token, `GET /api/user/:id` and `GET /api/networth/:userId`
   with B's id return 404.
3. Given a create request whose body names another `userId`, the row is
   created for the caller; the body `userId` is ignored.
4. Given a charge create/update whose `categoryId` belongs to another
   user, the API returns 404 and nothing is written.
5. Given a body with an unknown or malformed key (e.g. `"x = 1; --"`),
   the API returns 400 and no SQL runs.
6. Given invalid registration input (bad email, password < 8 chars,
   missing fields, negative totals), `POST /api/public/register`
   returns 400.
7. Given a username that already exists, register returns 409 (was 404),
   including when two registrations race (UNIQUE violation 23505).
8. Registration writes `users` and `user_credentials` in one
   transaction; a failure in either leaves no rows.
9. All existing tests still pass, updated only where the contract
   intentionally changes (404->409 on duplicate username).

## Design

### Identity

- Login signs `{ id, username, userId }` (credential id, username, user
  id). The middleware requires all three string claims and verifies
  with `{ algorithms: ["HS256"] }`. Tokens without `userId` get 401;
  they expire in 2h anyway, so users just log in again.
- `GET /api/auth/userId` keeps its response shape, now answered from
  `req.user.userId` with no DB query.

### Scoping

- Services take `userId` as an explicit argument on every method.
  Controllers pass `req.user.userId`. Nothing reads a user id from the
  body or trusts a path id without comparing it to the token.
- `BaseService.findById/updateById/deleteById` become
  `...(id, userId)` with `WHERE id = $1 AND user_id = $2`.
  `rowCount === 0` means 404.
- `ChargeService.deleteCharge(id, userId)` gets the same predicate.
- Path ids for user-level reads (`/api/user/:id`,
  `/api/networth/:userId`) must equal `req.user.userId`, else 404
  (404 not 403, to avoid confirming the id exists).
- Charge create/update with a `categoryId`: verify with
  `SELECT 1 FROM categories WHERE id = $1 AND user_id = $2` first.

### Input validation and column whitelist

- Add `zod`. One schema per request body in
  `src/validation/*.schema.ts`: category create/update, charge
  create/update, net-worth create/update, register, login.
  Schemas are `.strict()` so unknown keys fail with 400.
- Services map validated camelCase fields to columns through a fixed
  per-table map (`ALLOWED_COLUMNS`). Column names never come from
  request keys. `BaseService` builds SQL only from that map.
- Malformed UUIDs in path params return 400 before any query.

### Registration

- One pooled client: `BEGIN`, insert user, insert credential,
  `COMMIT`; `ROLLBACK` and release in `finally`.
- Drop the SELECT-then-insert check; catch pg `23505` on the username
  constraint and return 409.

## Tasks (TDD: failing test first in each)

1. Auth middleware: require `userId` claim, pin HS256. Tests: missing
   claim -> 401, `alg: none`/HS512 token -> 401, valid -> `req.user`.
2. Login token includes `userId`; `/api/auth/userId` reads the claim.
3. zod schemas + a `validateBody(schema)` middleware and
   `validateUuidParam(name)`; unit tests for each schema.
4. Scope `BaseService` + category routes. Cross-user tests: read,
   update, delete another user's category -> 404; SQL params include
   caller's user id.
5. Scope charges, including `deleteCharge` and the category-ownership
   check.
6. Scope net worth, including `GET /api/networth/:userId`.
7. Scope summary `GET /api/user/:id`.
8. Registration: validation, transaction, 409 on 23505.
9. Injection tests: malicious keys on every create/update route -> 400
   and `pool.query` never called.

Tasks 4-7 touch different files and can run in parallel after 1-3.

## Test plan

All in `packages/backend/src/__tests__/` with the existing pg mock.
The mock proves the right SQL and parameters are sent and the right
status comes back; Phase C proves the SQL executes on real Postgres.

## Risks

- Frontend contract: the frontend sends `userId` in some bodies. With
  `.strict()` schemas that becomes 400. Decision needed: strip
  `userId` silently vs reject. Proposed: schemas accept and ignore
  `userId` (explicit `.omit` after parse) to keep the frontend working;
  all other unknown keys fail.
- Existing sessions are logged out once (tokens lack `userId`).
- Duplicate-username status changes 404 -> 409; the frontend register
  page shows a generic error either way.

## Rollback

Revert the branch; no schema migration is involved.

---

## Review log (7 Sonnet reviewers) — revisions override the above

Lenses: correctness, TDD, security, architecture, API contract, data
integrity, docs. 6 blockers, ~15 majors; all resolved as follows.

### R1. Test tokens (blocker, TDD)
Every suite mints tokens inline without `userId`. New Task 0, before
any behavior change: `helpers.ts` exports
`testToken({ id?, username?, userId? })` returning the token plus the
ids used; migrate every inline `jwt.sign` in the tests to it. Suite
stays green.

### R2. Frontend request shapes (blocker, contract)
PATCH bodies send `_id` and `userId`; PUT bodies send `userId`. Update
and create schemas declare `_id` and `userId` as
`z.unknown().optional()` and the validate middleware strips both after
parse. All other unknown keys fail (`.strict()`). The path `:id` is the
only target id. Register keys are `username`, `email`,
`plainTextPassword`, `userData { totalAmount, totalAllotment }`.
Password `min(8).max(72)` on register only; login just requires
non-empty strings. Dates are `YYYY-MM-DD` strings (check the schema
for nullability; accept `""` only if the column is nullable, as null).
`description` and net-worth `type` may be `""`. Numbers are finite,
non-negative, `<= 9999999999.99` (NUMERIC(12,2)). Derived fields are
accepted and ignored: category `amount`; register `totalAmount` is
forced to 0.

### R3. Category update target (blocker, correctness)
Controller passes `req.params.id`; service no longer reads `body._id`.

### R4. Create is scoped too (major)
`BaseService.create(userId, doc)`; `user_id` always comes from the
token. `BaseService` gets its column map from the constructor (one
source of truth, typed from the zod schema); `fieldToColumn` is
removed. Only mapped columns ever reach SQL text.

### R5. Atomic category ownership (major; no migration)
Charge create: `INSERT INTO charges (...) SELECT ... WHERE EXISTS
(SELECT 1 FROM categories WHERE id = $c AND user_id = $u)`. Charge
update with `categoryId`: same `EXISTS` in the `WHERE`. `rowCount 0`
-> 404. Composite FK is deferred to Phase D (needs a migration).

### R6. Charge partial update (major)
SET clauses only for provided fields; empty update -> 400
(`.refine` at least one field).

### R7. Stop swallowing errors (major)
Remove catch-all `return false` in charge/netWorth/base/summary so DB
errors reach `next(err)`. Map pg `22P02` -> 400 and `23503` -> 404 in
a small error-mapping middleware.

### R8. Router split (major, security)
`credentialRouter` is mounted on both public and auth paths, so
`/api/public/userId` runs with no `req.user` (500). Split into
`publicAuthRouter` (register, login) and `authRouter` (userId).

### R9. Token hardening (major)
Sign and verify with HS256 explicitly. Middleware requires `decoded`
to be an object with string `id`, `username`, and UUID `userId`.
Refuse to boot if `JWT_SECRET` is shorter than 32 chars (tests set a
long secret). A deleted user's token simply sees nothing (all queries
are scoped and rows cascade); accepted.

### R10. Registration transaction (major, data)
Hash first; then `const client = await pool.connect()`; `BEGIN`,
insert user, insert credential, `COMMIT`. In `catch`: `ROLLBACK` in
its own try; release with the error if rollback fails, else release
normally in `finally`. 409 only when `err.code === "23505"` and
`err.constraint === "user_credentials_username_key"`; other errors
rethrow.

### R11. Login timing (minor, security)
Unknown username still runs `bcrypt.compare` against a fixed dummy
hash; one generic 401 message for any login failure.

### R12. Tests must pin the SQL (blocker, TDD)
Status codes alone are not enough under the mock. Every scoped route
test asserts the SQL contains the `user_id = $n` predicate and the
params contain the caller's `userId`; a body naming user B still
writes A. Cross-user and injection tests live in new files
(`authz.*.test.ts`, `validation.test.ts`) so existing files stay under
400 lines. Include: `__proto__` key, malformed UUID path -> 400 with
no query, empty update -> 400, `_id`/`userId` accepted and stripped,
password 7 vs 8 chars, transaction order and rollback/release.
Criteria 1 and 8 ("no row changes") are verified in Phase C against
real Postgres.

### R13. Docs (blocker, SOP)
Same change: `packages/backend/README.md` gains an Auth section (token
claims, HS256, 2h expiry, 404-for-not-owned rule), a status-code table
(400/401/404/409), the net-worth routes, and the validation layer.
Present tense. The full Mongo->Postgres README rewrite stays in
Phase E; do not add new Mongo references.

### Revised task order
0 (tokens) -> 1 (middleware + signing + boot check) -> 2 (router split,
userId claim) -> 3 (schemas, validate + error-mapping middleware) ->
4 (BaseService + categories). Then 5 (charges), 6 (net worth),
7 (summary) in parallel, in separate worktrees. Then 8
(registration + login timing), 9 (injection suite), 10 (docs).

### Deferred (noted, not in this phase)
Frontend `api/*` functions swallow errors, so new 400/404s show as
silent no-ops (Phase F). Register response lacks the `{ token }` the
frontend expects (pre-existing; Phase F). Composite FK, CHECK
constraints, case-insensitive usernames (Phase D migration). Summary
write-on-read (Phase D).

---

## Four questions (after build)

1. **Regressions.** Existing sessions get one 401 (tokens lack
   `userId`) and must log in again. Duplicate username returns 409.
   Category writes no longer touch `amount` (it is derived). Charge and
   net-worth dates must be `YYYY-MM-DD`; `""` returns 400. The frontend
   `api/*` layer swallows errors, so a rejected edit looks like a silent
   no-op until Phase F surfaces errors. Charge `INSERT ... SELECT`
   uses explicit casts that only real Postgres can confirm (Phase C).
2. **Security.** Closed: cross-user access on every route, column-name
   injection, unauthenticated `/api/public/userId` crash, alg
   confusion, weak secrets, login timing oracle, non-atomic
   registration. Open: no rate limiting, helmet, or CORS policy
   (Phase D); the login body is not schema-validated (queries are
   parameterized, so low risk); the token stays in `localStorage`.
3. **Efficiency.** `/api/auth/userId` no longer queries the DB. Charge
   ownership is one statement instead of two. The summary endpoint
   still writes on read (Phase D).
4. **Extra tests before prod.** Run the Phase C integration suite
   against real Postgres, with priority on the charge `INSERT ...
   SELECT` casts, the registration transaction, and the 23505
   constraint name. Add a login schema test when login validation
   lands.

## Result

249 backend tests pass; `tsc --noEmit` clean; frontend unchanged.
