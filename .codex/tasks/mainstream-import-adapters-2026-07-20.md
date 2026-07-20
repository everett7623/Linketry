# Mainstream Import Adapters

Date: 2026-07-20 to 2026-07-21
Target version: 0.28.0
Status: Phase 1 completed; Phase 2 fixture-gated

## Goal

Add reliable migration paths for mainstream short-link platforms without guessing export fields or weakening Linketry's existing preview and conflict-safety behavior.

## Delivery Order

### Phase 1 — File Imports

- [x] Add representative, redacted contract fixtures for the current documented Bitly and Short.io CSV fields; retain real-account export validation as a provider-drift follow-up.
- [x] Add a Bitly CSV adapter using the documented `Link`, `Custom Link`, `Date created`, `Title`, `Destination URL`, `Engagements`, and `Status` columns.
- [x] Preserve the Bitly short URL, custom domain, case-sensitive slug, destination, title, creation time, click total, and verified active/deleted status mapping.
- [x] Add a Short.io CSV adapter using the documented ID, short URL, original path, original URL, title, click, created, updated, expiry, creator, and tag columns.
- [x] Preserve the Short.io short domain, slug, destination, title, tags, click total, timestamps, and expiry when present.
- [x] Register both adapters for explicit selection and conservative auto-detection before the Generic adapters.
- [x] Add Admin source choices and localized labels without adding another polling or credential flow.

### Phase 2 — API Import

- [ ] Collect a representative, redacted Rebrandly response and confirm pagination behavior.
- [ ] Add Rebrandly JSON/API import only after verifying `slashtag`, `destination`, `shortUrl`, `domain`, timestamps, and source ID against the current API contract.
- [ ] Keep any Rebrandly API credential request-scoped and out of browser persistence, logs, audit metadata, and saved settings.

### Deferred Sources

- [x] Keep Kutt, TinyURL, BL.INK, and Cuttly on Generic CSV/JSON until a current official export contract and redacted fixture are available.
- [x] Do not expose a named adapter when it would be less reliable than an explicit Generic field mapping.

## Acceptance

- [x] Representative fixtures contain no credentials, personal domains, private destinations, or account identifiers.
- [x] Auto-detection does not claim unrelated CSV/JSON payloads.
- [x] Preview covers valid, invalid, and existing-slug conflict rows.
- [x] Default conflicts remain `skip`; `rename` and explicit `overwrite` retain their current behavior.
- [x] Source slug and short domain are preserved when supplied by the platform.
- [x] Bitly and Short.io fixtures cover custom domains, empty optional fields, quoted/multiline CSV values, and malformed rows.
- [x] Unit coverage verifies normalization/detection, and the route-owned policy coverage verifies preview and confirm conflict contracts.
- [x] Import failure reporting remains downloadable and large confirmations remain bounded and asynchronous.
- [x] Redirect handling, asynchronous analytics, D1 source-of-truth ownership, KV cache semantics, migrations, and production data are unchanged.

## Delivered

- Platform normalization is isolated in `apps/worker/src/importers/mainstreamCore.ts`; adapters are registered before Generic CSV.
- The shared CSV state machine is also used by Generic CSV, eliminating line-splitting failures on quoted multiline cells.
- Admin exposes localized Bitly and Short.io choices and hides request-scoped Shlink credential inputs outside the Shlink source.
- Rebrandly remains intentionally unimplemented until a current redacted response verifies payload and cursor pagination behavior.

## Contract Sources

- Bitly export contract: <https://support.bitly.com/hc/en-us/articles/115000268051-How-do-I-export-all-data-from-the-Links-page>
- Short.io export contract: <https://docs.short.io/articles/managing-links/how-to-export-short-links-from-short.io>
- Rebrandly list-links contract: <https://developers.rebrandly.com/docs/list-links>
- Rebrandly export guidance: <https://support.rebrandly.com/en/articles/469699-can-i-move-links-between-my-workspaces>
