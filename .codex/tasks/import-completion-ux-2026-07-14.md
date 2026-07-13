# Import Completion UX - 2026-07-14

## Status

Complete and verified locally for Linkora 0.9.17.

## Completed

- [x] Start polling immediately when confirmation returns a background job ID.
- [x] Use sequential timeout-based polling instead of overlapping interval requests.
- [x] Exit the importing state on both completed and failed jobs.
- [x] Clear the completed file input, content, preview, and expanded preview state.
- [x] Disable browser and response caching for import job reads.
- [x] Add a browser regression test for the pending-to-completed transition.
- [x] Leave redirect logic unchanged.

## Verification

- [x] Admin type-check and production build.
- [x] Admin unit tests (8 passing) and browser smoke tests (4 passing).
- [x] Worker type-check and tests (28 passing).
- [x] Deployment YAML and diff checks.
