# Release Hygiene Rule — 2026-07-09

## Status

Done.

## Scope

- Added a project rule that every intentional code, workflow, config, or documentation change must update version metadata and `CHANGELOG.md`.
- Documented the expected synchronized files in `AGENTS.md`.
- Bumped Linkora from `0.7.1` to `0.7.2`.
- Updated package versions, shared runtime version, lockfile, env and wrangler examples, deployment docs, `PROGRESS.md`, `TASKS.md`, and `CHANGELOG.md`.

## Verification

- `npm run type-check --workspace=apps/worker` passed.
- `npm run build --workspace=apps/admin` passed.
- GitHub repository variable `LINKORA_VERSION` set to `0.7.2`.
