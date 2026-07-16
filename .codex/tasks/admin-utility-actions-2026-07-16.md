# Admin Utility Actions - 2026-07-16

## Status

Complete and verified for Linketry 0.21.0.

## Goal

Place the Admin language switch, light/dark switch, and a reserved coffee-support link together as one compact, accessible Sidebar utility group.

## Link Decision

- Canonical reserved URL: https://everettlabs.dev/support
- Reason: support can later include coffee, sponsorship, migration help, and other owner-defined options.
- Future compatibility: /coffee can redirect to /support when the site is activated.
- Current external state: everettlabs.dev has Cloudflare authority records but no resolvable site record, so the UI entry is intentionally a placeholder.

## Refactor Comparison

### Before

- Sidebar owns all 17 navigation items, Footer controls, and display logic in one 251-line component.
- Footer contains a wide language select, interface mode button, and logout.
- Theme switching is available only in Settings.

### After

- All 17 navigation items remain in the same four groups and retain their advanced/module flags.
- Navigation configuration moves to a dedicated module.
- Footer retains interface mode and logout without behavior changes.
- One utility group contains exactly three equal icon controls: language, light/dark, and support.
- Login and Settings keep the full language select.

## Safety Notes

- No Worker, API, D1, KV, redirect, authentication, or deployment behavior changes.
- The support link opens in a new tab without sending an Admin token.
- Controls use text alternatives and visible keyboard focus; no emoji or decorative effects.

## Verification

- [x] Locale catalogs and placeholders pass as part of 35 Admin unit tests.
- [x] Sidebar utility Playwright coverage passes in system Chrome.
- [x] All 12 existing and new Admin smoke tests pass.
- [x] Admin production build passes.
- [x] Worker type-check, 60 Worker tests, and 35 deployment tests remain green after the release bump.
- [x] File-size, version, formatting, and diff checks pass.
