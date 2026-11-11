# R2 backup known-length put — 2026-11-12 (v0.35.1)

## Baseline

- Live production Admin Backups: every scheduled row from 2026-10-30 through 2026-11-12 status `failed`, size empty. Times ~02:00 CST match `LINKETRY_DAILY_CRON` `0 18 * * *`.
- R2 bucket `linketry-backups` exists; Worker binds `BACKUPS`. Failures predate v0.35.0 OKLCH.

## Cause

`createR2Backup` did `streamBackupJson(...).pipeThrough(new TransformStream(...))` then `env.BACKUPS.put(key, body)`. Cloudflare R2 requires a known-length body; TransformStream readable sides are rejected with `TypeError: Provided readable stream must have a known length (...)`.

## Fix

- Buffer with `await new Response(streamBackupJson(env)).arrayBuffer()` then `put` the ArrayBuffer.
- D1 paging during generation remains; peak memory is the full JSON (same class as pre-stream stringify for the upload step).
- `/export/backup.json` still streams to the client.
- Tests require `put` to receive `ArrayBuffer`.

## Schedule (owner request)

- Do not slow the whole daily Cron to every 3/5 days (retention, reports, anomaly stay daily).
- Default scheduled backup interval: **3 days** via `backup_interval_days` (Advanced Settings, 1–365).
- `runScheduledBackup` compares against latest `status = 'completed'` only; failed rows never postpone the next try.
- After deploy with only failed history, the next daily Cron (or Manual Create) creates a successful snapshot.

## Validation

- `apps/worker` `src/backups/optimization.test.mjs` + `schedulePolicy.test.mjs` (15 pass with retention).

## Deploy

- Commit `88b2439` on `main` with `[skip production]`.
- Demo push `43120202413`, production dispatch `43120221853`, site `43120253737` — success.
- Live health / Admin meta / site `llms.txt` → `0.35.1`.
- GitHub Release `v0.35.1` Latest on `88b2439`.
