# Duplicate Destination Detection - 2026-07-15

## Status

Completed in Linketry 0.10.2.

## Delivered

- [x] Add authenticated, bounded normalized-destination lookup for existing links.
- [x] Normalize host casing, default ports, and query-parameter order while preserving meaningful URL differences.
- [x] Exclude the current link during editing.
- [x] Debounce Create/Edit checks and ignore detection failures so saving is never blocked.
- [x] Show matching slugs in English and Simplified Chinese while allowing intentional duplicates.
- [x] Update the OpenAPI inventory and API documentation.

## Verification

- [x] Worker type-check and complete Worker test suite.
- [x] Admin production build and EN/ZH catalog parity.
- [x] Browser create/edit regression coverage.

## Safety

- Redirect handling is unchanged.
- D1 remains the source of truth; KV behavior is unchanged.
- Candidate reads and displayed matches are bounded.
