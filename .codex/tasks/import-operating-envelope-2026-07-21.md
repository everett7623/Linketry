# Import Operating Envelope

Date: 2026-07-21
Target version: 0.28.1
Status: Completed

## Goal

Give imports an explicit, consistent operating boundary before parsing or queuing can consume unbounded Worker memory.

## Delivered

- [x] Define shared limits of 10 MiB UTF-8 content and 50,000 normalized items.
- [x] Reject oversized preview and confirm content with HTTP 413 before import-format JSON/CSV parsing or job creation.
- [x] Fail an asynchronous confirmation job before D1 writes when normalized item count exceeds the limit.
- [x] Apply the content boundary and a lower 5,000-item/100-page sequential-request boundary to Shlink API pulls; report pagination over the boundary instead of silently truncating it.
- [x] Show the file-size limit in Admin and reject oversized files before FileReader processing.
- [x] Clear stale content, filename, preview, and file selection after a rejected or unreadable file.
- [x] Keep all limit labels localized and sourced from the shared contract.

## Verification

- [x] Shared unit coverage checks UTF-8 byte counting and exact size/item boundaries.
- [x] Browser coverage verifies an oversized file produces an accessible error and cannot leave Preview enabled.
- [x] 72 deployment, 95 Worker, 58 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests pass.
- [x] Worker type-check, Admin/Site builds, and the official npm registry audit pass.
- [x] Redirect handlers, analytics, D1/KV semantics, migrations, production data, and Demo isolation are unchanged.

## Remaining Scale Work

- Representative D1 fixtures and response-time budgets for Links, Visits, Analytics, audit rows, and health history remain pre-1.0 work.
