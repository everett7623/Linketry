# Admin Operator Console UX critique pass — 2026-11-19 (v0.35.2)

## Done

- Impeccable `PRODUCT.md` / `DESIGN.md` / `.impeccable/design.json` for `apps/admin` (North Star: The Operator Console).
- Critique of Admin shell: 26/40 Acceptable; live evidence on `https://admin.uukk.de`.
- Implemented priority fixes without touching redirect logic:
  - Links row actions → Copy / Edit + overflow menu (`LinkCardActions` shared with cards)
  - Advanced filters collapsed by default on desktop; bulk bar Status / Organize / Delete
  - Sidebar brand lockup + Overview domain/lede/One Voice stats; Create removed from sidebar
  - Login uses shared `Input`; Overview/Links Create CTAs use `Button` (no nested link/button)
- Tests updated: `links-layout`, `at-audit`, `i18n-smoke` selectors; i18n + `tsc` green locally.
- Version bumped to 0.35.2.

## Left

- Owner commit / deploy / GitHub Release.
- Playwright browsers were missing in this sandbox; re-run `npx playwright test tests/links-layout.spec.ts` on a machine with Chromium installed.
