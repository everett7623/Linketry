# Shlink Reset Migration Readiness - 2026-07-09

## Goal

Prepare Linkora for a clean reset followed by a full Shlink short-link migration.

## Completed

- [x] Added `domain` to normalized import items.
- [x] Shlink JSON, JSONL, CSV, and API pull imports preserve the hostname from `shortUrl`.
- [x] Generic imports can map a domain field or infer it from `shortUrl`.
- [x] Dub, Sink, and Linkora backup imports preserve domain where available.
- [x] Import confirm writes the imported domain into `links.domain`.
- [x] Import cache sync uses the stored link domain instead of the API request host.
- [x] Overwrite import clears the old domain cache before writing new cache.
- [x] R2 backup restore now prefers the normalized `domain` field.
- [x] Shlink import documentation includes the domain cutover note.

## Migration Safety

- Do not reset production until the operator has reviewed reset preview.
- Keep the pre-reset R2 backup enabled.
- Import Shlink data before moving `s.y8o.de` in Cloudflare.
- After import, spot-check that stored domains are `s.y8o.de` before DNS cutover.

## Verification

- [x] `npm run type-check --workspace=apps/worker`
- [x] `npm run build --workspace=apps/admin`
- [x] `git diff --check`
