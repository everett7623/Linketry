# GPL-3.0 License Change — 2026-07-09

## Status

Done.

## Scope

- Changed Linketry project licensing from MIT to GNU GPL v3 only.
- Updated package metadata to use SPDX `GPL-3.0-only`.
- Replaced the root `LICENSE` notice.
- Updated README, roadmap, changelog, progress, task tracking, example configs, deployment docs, and runtime version metadata.
- Bumped Linketry from `0.7.2` to `0.7.3`.

## Verification

- `npm run type-check --workspace=apps/worker` passed.
- `npm run build --workspace=apps/admin` passed.
- `git diff --check` passed with only existing Windows LF-to-CRLF warnings.
- GitHub repository variables updated: `LINKETRY_VERSION=0.7.3`, `LINKETRY_SHORT_DOMAIN=s.y8o.de`, `LINKETRY_API_URL=https://s.y8o.de`.
