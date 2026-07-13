# Import Confirm Timeout Follow-up - 2026-07-13

## Status

Complete and verified locally for Linkora 0.9.13.

## Completed

- [x] Return a pending import job before parsing large Shlink content.
- [x] Move parsing and adapter work behind an asynchronous D1 boundary in `ctx.waitUntil()`.
- [x] Update the job source and total after parsing.
- [x] Persist background parse failures with a report.
- [x] Show failed jobs as errors in Admin and preserve retry input.
- [x] Add a dedicated confirm timeout and queue-boundary regression test.
- [x] Keep the default conflict strategy as `skip` and leave redirect logic unchanged.

## Verification

- [x] Worker type-check
- [x] Worker test suite (26 passing)
- [x] Admin unit tests (8 passing)
- [x] Admin production build
