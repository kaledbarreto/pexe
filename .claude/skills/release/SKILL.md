---
name: release
description: Cut a new pexe-bot release — bump package.json with `npm version`, commit it on main, create the annotated semver tag (vX.Y.Z), and push both to origin, which triggers the GitHub Release workflow and the server's deployer. Use when the user says "release", "new release", "cut a release", "tag a version", "bump version", or invokes /release. Accepts an optional argument: patch | minor | major | an explicit version like v0.4.0.
---

# Release

Pushing a `v*` tag is the whole release process here:

1. `.github/workflows/release.yml` creates the GitHub Release with generated notes.
2. The `deployer` container on the server (`deploy/release-watcher.sh`) polls the latest release, checks out the tag, and rebuilds `bot`.

So a pushed tag **goes to production**. Treat it as irreversible and outward-facing.

The version bump is done deterministically by `npm version`, which updates `package.json` + `package-lock.json`, commits them, and creates the annotated tag in one step.

## Inputs

`$ARGUMENTS` may be:
- `patch` / `minor` / `major` — bump from the latest tag.
- An explicit version (`v0.4.0` or `0.4.0`) — normalize to `vX.Y.Z`.
- Empty — infer the bump from commits since the last tag (see Step 3) and propose it.

## Steps

### 1. Preflight (stop on any failure, report it)

```bash
git fetch origin --tags --prune
git status --porcelain            # must be empty
git rev-parse --abbrev-ref HEAD   # must be "main"
git rev-parse HEAD origin/main    # must be equal
```

- Working tree must be clean (`npm version` also refuses a dirty tree).
- Must be on local branch `main`. If detached at the same commit as `origin/main`, `git checkout main` is fine; otherwise stop and ask.
- Local `main` must equal `origin/main`. If behind, `git pull --ff-only`; if ahead or diverged, stop and tell the user — don't push unrelated commits as part of a release.

### 2. Find the latest tag

```bash
git tag -l 'v*' --sort=-v:refname | head -n1
```

If none exists, the base is `v0.0.0`. The latest **tag** is the source of truth for the current version, not `package.json` (they may have drifted).

### 3. Determine the new version

- Explicit arg → use it.
- `patch|minor|major` → bump the latest tag accordingly (reset lower parts to 0).
- Empty → inspect `git log <latest>..origin/main --oneline`:
  - any `!:` or `BREAKING CHANGE` → major (while `0.x`, use minor instead)
  - any `feat:` → minor
  - otherwise → patch

Always resolve to an explicit `X.Y.Z` here — never pass `patch|minor|major` to `npm version`, since it would bump from `package.json` rather than the tag.

Validate:
- Matches `^v[0-9]+\.[0-9]+\.[0-9]+$`.
- Greater than the latest tag.
- Not already present locally or remotely: `git ls-remote --tags origin "refs/tags/<tag>"` returns nothing.
- There is at least one commit since the latest tag; if not, stop — nothing to release.

### 4. Confirm with the user

Show, then ask for explicit confirmation (AskUserQuestion) before changing anything:
- Previous tag → new tag (and current `package.json` version → new)
- Commits included (`git log <latest>..origin/main --oneline`)
- What will be pushed: a `chore(release): vX.Y.Z` commit on `main` + tag `vX.Y.Z`
- Reminder: pushing deploys to production via the deployer.

Do not proceed without a yes. Prior approval for a different version doesn't count.

### 5. Bump, commit, tag

```bash
npm version X.Y.Z -m "chore(release): v%s"
```

This writes `package.json` + `package-lock.json`, commits them with that message, and creates annotated tag `vX.Y.Z` on the new commit. Do not add a `Co-Authored-By` trailer — this is a mechanical release commit.

If `npm version` fails, nothing should have been committed; verify with `git status` / `git log -1` and report the exact error.

### 6. Push atomically

```bash
git push --atomic origin main vX.Y.Z
```

`--atomic` guarantees either both the commit and the tag land, or neither. Never `--tags`, never `--force`.

If the push fails (e.g. `main` moved on origin), undo locally so state stays consistent:

```bash
git tag -d vX.Y.Z
git reset --hard origin/main
```

Then report the exact error; the user can rerun `/release` after resolving.

### 7. Verify

```bash
gh run list --workflow=release.yml --limit 1
gh release view vX.Y.Z -R kaledbarreto/pexe
```

The workflow may take a minute; if the release isn't there yet, report the run status and link rather than polling repeatedly. Remind the user the deployer picks it up on its next poll.

## Rules

- Never move, delete, or re-push an existing remote tag. A bad release is fixed by cutting a new patch version.
- Never edit `package.json` `version` by hand — only via `npm version`.
- Report outcome plainly: commit + tag pushed, release URL, or the exact failure.
