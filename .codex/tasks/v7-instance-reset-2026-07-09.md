# V7 Instance Reset - 2026-07-09

## Goal

Add a safe factory reset workflow for operators who need to clean up test or migration data before long-term production use.

## Completed

- [x] Added authenticated reset preview API.
- [x] Added authenticated reset API with exact confirmation phrase.
- [x] Added optional pre-reset R2 backup, enabled by default in Admin.
- [x] Reset clears links, analytics, tags, domains, imports, API tokens, audit logs, redirect rules, settings, and short-link KV cache.
- [x] Reset preserves R2 backup records, R2 backup objects, and the environment `ADMIN_TOKEN`.
- [x] Reset restores default settings after deletion.
- [x] Added Admin Settings danger-zone reset panel.

## Safety Notes

- Do not run reset in production unless the operator has reviewed the preview.
- Keep pre-reset backup enabled unless R2 is unavailable and the operator accepts the risk.
- Reset is intentionally separate from backup deletion.

## Verification

- [x] `npm run type-check --workspace=apps/worker`
- [x] `npm run build --workspace=apps/admin`
- [x] `git diff --check`
