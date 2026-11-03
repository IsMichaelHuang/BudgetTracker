# Audit blockers: decisions and acceptance criteria

Plan: `docs/plans/audit-blockers.md`.

## Decisions

1. **Scope:** the 6 blockers only. Audit items M1 and m10 stay out.
2. **Branch:** `fix/audit-blockers` from `fix/prod-blockers`, in a worktree.
   One commit per TDD task. This plan and its decisions file are committed on
   the branch, per the SOP.
3. **Frontend tests:** add `vitest`, `@testing-library/react` (with its peer
   `@testing-library/dom`), and `jsdom` as dev dependencies. Root `npm test`
   runs both packages.
4. **Categories (B3, B5):** find categories by ID everywhere. The URL's title
   segment becomes a slug for readability and is never read as data. Duplicate
   titles stay allowed. No database migration.
5. **Usernames (B4):** the URL segment falls back to `user` when the slug is
   empty or `net-worth`. Existing usernames stay valid.
6. **Test database guard (B6):** setup stops before connecting unless the
   database name ends in `_test`. No bypass. An empty `TEST_DATABASE_URL`
   counts as unset.
7. **Static serving (B1, B2):** `STATIC_DIR` stays an optional override, so
   Michael's `.env` value keeps working. The default becomes the frontend
   build. Any non-API GET without a file extension returns `index.html`.
   Missing files still return 404.
8. **Fix tests:** mocks by default. Use the integration harness only for real
   SQL behavior.

## Acceptance criteria

- **AC1 (B1):** With `STATIC_DIR` unset, `GET /` and a built JS asset both
  return 200. A relative or absolute override still works.
- **AC2 (B2):** `GET /alice/<uuid>`, `GET /net-worth`, and
  `GET /alice/<uuid>/food/<uuid>` return `index.html`. A missing asset returns
  404. `/api` paths without a token return 401.
- **AC3 (B3):** A category titled `Rent/Utilities`, `Kids #1`, `Q&A?`,
  `李雷`, `..`, or `100%` opens its own page from the dashboard, showing its
  full title, and its add-charge link opens the charge form. Old URLs with
  a stale title segment still open the right category.
- **AC4 (B4):** After login, a user named `李雷`, `---`, or `Net Worth`
  lands on the dashboard.
- **AC5 (B5):** With two categories titled `Food`, adding or editing a charge
  saves the category the user chose, by ID.
- **AC6 (B6):** A `TEST_DATABASE_URL` that isn't a plain Postgres URL naming a
  `_test` database stops setup before any connection. An empty value uses
  embedded Postgres in both setup and the app pool.
- **AC7:** Full unit and integration suites, types, lint, frontend build, and a
  clean `npm ci` all pass, and existing tests are unchanged.
- **AC8:** Docs describe the new behavior in the same change.

