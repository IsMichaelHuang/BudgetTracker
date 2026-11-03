# Split PR #5 Into Focused PRs

## Why

PR #5 changes 1,081 lines, excluding the lockfile, across four unrelated fixes.
The SOP now requires one concern per PR, and a split above about 400 changed
lines. Michael asked to break it up on the remote.

## Goal and non-goals

**Goal:** replace PR #5 with 5 focused PRs that together contain the same
changes, then close it.

**Non-goals:**
- Any new behavior, code changes, or test changes.
- Fixing the flaky test, or audit items M1 and m10.
- A path for `fix/prod-blockers` to reach `main`. It has 8,079 added lines and
  no PR. Flagged as the next thing to deal with.

## Decisions

1. **Shape:** 5 PRs. Frontend test tooling ships with the username fix, the
   first tests that need it, and that PR says why.
2. **Plan docs:** their own docs PR, stating why it's over 400 lines.
3. **PR #5:** closed with a comment linking the new PRs. Its remote branch stays
   until the new PRs merge. No force-push.
4. **Base branch:** left alone.

## Acceptance criteria

- **AC1:** Given each code PR, its diff is about 400 lines or fewer, excluding
  `package-lock.json`, and covers one concern.
- **AC2:** Given all 5 branches merged together in a scratch branch, its tree
  equals `fix/audit-blockers`, apart from the new split plan file.
- **AC3:** Given each branch on its own, the unit tests, integration tests,
  types, frontend lint, and frontend build all pass.
- **AC4:** Given any new commit, its subject is imperative, its body says why,
  and no fix-up commit remains.
- **AC5:** Given each PR, its description has Why, Impact, How it was verified,
  and Risk and rollback. The title states an outcome. The new dependencies'
  reason is stated.
- **AC6:** Given the finished split, PR #5 is closed with links, its branch
  still exists, `fix/prod-blockers` hasn't moved, and nothing was force-pushed.

## Design: PR breakdown

Commits come from `fix/audit-blockers` by cherry-pick, so no code is rewritten.

Lines exclude `package-lock.json`. Bases are `fix/prod-blockers`, except PR 4.

1. `fix/test-database-guard`, about 140 lines, from `4d9614d`.
   Title: Integration tests can no longer wipe a non-test database
2. `fix/production-static-serving`, about 160 lines, from `63ae21f`.
   Title: Production serves the app, with working refresh and deep links
3. `fix/username-routing`, about 165 lines, from `5dabe03`, `95b3609`, and the
   `README.md` part of `02bb46b`.
   Title: Every username reaches the dashboard after login
4. `fix/categories-by-id`, about 230 lines, from `9800f24`. Base: PR 3's branch.
   Title: Category links and charges always find the right category
5. `docs/audit-blockers-plan`, about 590 lines, from `f8e304a`, the plan part
   of `02bb46b`, and this plan.
   Title: Record the audit blockers plan and PR split

PR 3's three sources squash into one commit, so the fix-ups disappear. Its
Node minimum and testing README lines stay in it, because `jsdom` and the new
root `npm test` make the old text false. PR 4 stacks because it needs
`categorySlug`, `summaryWith`, and the test setup. PRs 1, 2, 3, and 5 can merge
in any order. PR 5 adds nothing to `audit-blockers.md`, which is at the 400-line
limit.

## Task breakdown

The main agent does these, under the SOP's allowance for integration work,
since no code or tests are written. A conflict that needs more than taking both
sides stops the work and goes back to Michael. Each task depends on the one
before it.

### Task 1: Create the branches

Files: `docs/plans/audit-blockers-prs.md` (this plan), plus cherry-picked files.
Tests: none new.

1. Add a worktree, `split-wt`, in the session scratchpad. `blockers-wt` stays
   as the fallback.
2. Create `docs/audit-blockers-plan` first, per the SOP, and save this plan.
3. `02bb46b` must be split by path. A plain cherry-pick conflicts, because
   `audit-blockers.md` doesn't exist on the other branches. On PR 3, apply only
   its Node hunk: `git show 02bb46b | git apply --include=README.md`. Never
   check out the whole file, since that pulls in PR 2's `STATIC_DIR` lines. On
   PR 5, `git checkout 02bb46b -- docs/plans/audit-blockers.md` is safe.
4. Create each other branch. Keep each source commit's subject, and amend its
   body to say why. PR 3's squashed commit uses the `5dabe03` subject. The tree
   of each commit stays as cherry-picked.
5. Keep the `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` trailer.

### Task 2: Verify each branch and the combined result

1. On each branch, run `npm ci`, `npm test`,
   `env -u TEST_DATABASE_URL npm run test:integration`, `tsc` for both packages,
   frontend lint, and frontend build. Keep full logs, so a repeat of the flaky
   test keeps its error text.
2. Run the audit's `limits.sh` on files each branch adds. Check changed lines in
   modified files. Older wide lines stay, per audit M12.
3. Merge all 5 into a scratch branch, and check AC2 with
   `git diff fix/audit-blockers <scratch>`. Expected: only
   `docs/plans/audit-blockers-prs.md`. Run the same full gates there, since
   backend tests move to `vitest` 4.1.12 once PR 3 merges. Delete the scratch
   branch.
4. Self-review each branch's full diff.
5. Write the four answers below.

### Task 3: Hand off, then publish

1. Report to Michael, and stop. The SOP requires his go-ahead before pushing.
2. After go-ahead, re-sync and re-run the suite if any base moved. Push the 5
   branches without force. Open the PRs with these descriptions. Set PR 4's
   base to PR 3's branch.
3. Close PR #5 with a comment linking the new PRs. Keep its branch.

## Test plan

No new tests, because no code changes. AC3 runs the existing suites on each
branch. AC2 proves nothing was lost or added. Tests move with the fix they
cover: 16 static, 15 guard, 12 username, and 14 category.

## Risks

- **Lost change:** a hunk could land on the wrong branch or vanish. AC2 catches
  both.
- **Standalone failure:** a branch may depend on an earlier one by accident.
  AC3 catches it. PR 1 and PR 2 run on `vitest` 4.0.18, and PR 3 bumps it.
- **Merge conflicts later:** `README.md` and `packages/backend/README.md` are
  edited by more than one PR, in separate sections. The AC2 merge tests this.
- **Stacked PR:** when PR 3 merges, PR 4 must be retargeted before PR 3's
  branch is deleted.
- **Flaky test:** the failure from the earlier run remains unexplained.
- **Remote reach:** the PRs can't reach `main` until `fix/prod-blockers` does.

## Rollback

Before go-ahead, everything is local: delete the branches. After go-ahead,
close the new PRs, delete their branches, and reopen PR #5, whose branch stays.

## Review log

Two Sonnet reviewers (git procedure, SOP compliance), plus one second pass.

- **Fixed, blocker:** wide table rows. The table is now a list.
- **Fixed, major:** PR 5's line count was wrong. It's about 590.
- **Fixed, major:** checking out all of `README.md` would pull PR 2's lines into
  PR 3. Only the Node hunk is applied now.
- **Fixed, minor:** `02bb46b` splits by path; commit subjects stated; the
  combined tree runs the full gates; PR 3's count; integration allowance cited.
- **Rejected, major:** moving the Node and testing lines out of PR 3. PR 3's own
  changes make the old text false, so they belong with it.
- **Rejected, minor:** changing the trailer to Sonnet. This session's
  attribution is Opus 5.5.

## Four questions

1. **Regressions:** none found. Merged together, the branches match
   `fix/audit-blockers` apart from this file, and each passes alone. PR 3 is
   the only one that changes the lockfile, with dev-only version changes.
2. **Security flaws:** none found. No code changed from PR #5. Pushing adds new
   commit messages and this plan, and no secrets.
3. **More efficient:** none found. Splitting the tooling from PR 3 needs a new
   starter test, which adds work and no safety.
4. **Extra tests:** none found beyond PR #5: a browser pass of category and
   username routing, and the unexplained integration failure if it recurs.
