# Plan: bring BudgetTracker up to the SOP

Source: an audit against `~/.claude/PLANNING.md` by three Sonnet
reviewers (tests, security/regressions, docs/limits/efficiency). Findings
marked (verified) were re-checked by hand against the code.

Work these in order. Each phase is its own PRD cycle under the SOP.

---

## Phase A — Stop the bleeding (do first, small)

1. **Plaintext password logged** (verified).
   `services/credential.service.ts:60` runs
   `console.log(username, plainTextPassword)`. Delete it.
   `index.ts:3` logs the whole dotenv result; delete that too.
2. **Unblock `npm install`.** Root `package.json` pins `express ^5` plus
   `mongo`, `mongodb`, `mongoose`; backend pins `express ^4`. The
   conflict crashes npm. Remove the root runtime deps and the bogus
   `main`, keep workspaces only.
3. **Get the gates green.**
   - Backend `tsc --noEmit`: 7 `TS2345` errors from `req.params`
     typing in the category, charge, netWorth and summary controllers.
   - Frontend `tsc -b`: add `src/vite-env.d.ts` with
     `/// <reference types="vite/client" />` (fixes the `*.css` errors).
   - Frontend ESLint: 5 errors (conditional hook call in `App.tsx:96`,
     unused `err` in Login/Register pages, `todo/` files).

## Phase B — Authorization and injection (critical)

4. **Every query must be scoped to the caller** (verified).
   `BaseService.findById/updateById/deleteById` and
   `charge.service.ts:53` use `WHERE id = $1` only.
   `GET /api/user/:id` and `GET /api/networth/:userId` return any
   user's data for any id. Creates accept `userId` from the body.
   Fix: put the user id in the JWT (or resolve it from the credential
   id once in middleware), ignore body/param user ids, add
   `AND user_id = $n` everywhere, and check a charge's `categoryId`
   belongs to the caller.
5. **SQL injection via column names** (verified).
   `base.service.ts:48-53,81` and `charge.service.ts:24` build column
   lists from request-body keys. Whitelist columns per table and
   validate bodies with a schema (e.g. zod).
6. **Registration:** validate input, do both inserts in one transaction,
   use the UNIQUE constraint instead of check-then-insert, return 409 on
   a duplicate username.

TDD: write the cross-user tests first ("user B cannot read, update or
delete user A's category/charge/net worth") — several should fail
today.

## Phase C — Prove the Postgres migration

The 52 backend tests pass, but every one mocks `pool.query`, so no SQL
ever runs. The migration is unverified.

7. Add an integration harness against a real Postgres (Testcontainers or
   a local `PG_*` DB) that applies `db/migrations/001_create_schema.sql`.
8. Integration tests for: charge CRUD with `NUMERIC` amounts and dates,
   camelCase/snake_case mapping, `$n` placeholder numbering, the summary
   transaction (including rollback and client release), and credential
   register/login with real bcrypt.
9. `NUMERIC` comes back from `pg` as a string. Add
   `types.setTypeParser(1700, parseFloat)` or cast in SQL, with a test.

## Phase D — Hardening and regressions

10. Add `helmet`, `express-rate-limit` on auth routes, an explicit CORS
    policy, a JSON body size limit, and a final error middleware that
    hides stack traces and maps bad UUIDs (pg `22P02`) to 400.
11. `jwt.verify` with `{ algorithms: ["HS256"] }`; enforce a minimum
    secret length at startup.
12. SPA deep links 404 on refresh: `app.ts` only serves `index.html`
    for `/api` paths. Add a non-`/api` catch-all and align the static
    directory with `frontend/dist`.
13. Make `GET /api/user/:id` read-only. It currently runs two UPDATEs
    per request to recompute totals (and never recomputes
    `total_allotment`). Compute totals with `SUM ... GROUP BY` in one
    joined query.
14. Pool config: `max`, timeouts, and a `pool.on("error")` handler.
15. Schema: drop the duplicate username index, add
    `charges(user_id, date DESC)`, make `email` UNIQUE, add CHECKs on
    amounts if they must be non-negative.

## Phase E — Evergreen docs and file limits

16. Rewrite both READMEs for PostgreSQL: `DATABASE_URL`/`PG_*`, running
    migrations, how tests work. Remove every MongoDB reference, including
    code comments (`category.controller.ts:50`, `useSummary.ts:16`,
    `charges.ts:73`, the migration header).
17. Delete dead code: `packages/frontend/todo/`,
    `backend/src/common/mock*.ts`, `backend/src/requests.http`.
18. Decide on `.planning/`, `.ralph/`, `CODEBASE_REPORT.md`: they are
    point-in-time snapshots, not evergreen docs. Delete or gitignore.
19. File limits: nothing exceeds 400 lines, but ~45 files have lines
    over 80 chars. Add Prettier (`printWidth: 80`, `proseWrap:
    "always"`) and ESLint `max-len: 80`, `max-lines: 400`, run one
    formatting commit, and add `npm run lint` at the root.

## Phase F — Frontend tests

20. The frontend has no tests or test runner. Add Vitest + React Testing
    Library; start with the API layer and the form pages.

---

## Closing questions (current state)

1. **Regressions:** SPA refresh 404s; `NUMERIC` amounts arrive as
   strings; the summary GET mutates data. All covered above.
2. **Security:** cross-user access on nearly every route, column-name
   injection, plaintext password in logs, no rate limiting. Phases A-B.
3. **Efficiency:** write-on-read summary with ~6 round trips; full
   summary refetch after every mutation, no pagination or code
   splitting. Phase D, then frontend caching later.
4. **Extra tests before prod:** cross-user isolation, real-Postgres
   integration, malicious body keys, duplicate-username race, JWT
   tamper/expiry. Phases B-C.
