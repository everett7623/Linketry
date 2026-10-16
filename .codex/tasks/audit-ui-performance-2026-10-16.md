# Local/remote audit and Admin UI/performance — 2026-10-16

## Scope and source

- Fetch `origin` and compare local `main` (`c242b91`) to remote `main` (`e1beb72`). The sole upstream change removes two README lines; fast-forwarded cleanly with no pre-existing local changes.
- Read AGENTS, PROGRESS, TASKS, ROADMAP and KNOWN_ISSUES. Review Admin API client, shared UI, link listing/QR generation, focus management and bundling configuration; run Worker regression coverage.
- Runtime read-only checks: production `https://go.uukk.de/health` and isolated Demo `https://demoapi.linketry.com/health` both return HTTP 200, `status: ok`, version `0.31.6`.
- Patch version: `0.31.7`. User authorized commit, push and deployment on 2026-10-16; protected workflow release is in progress. No new migrations or production data edits.

## Findings and fixes

1. **P2 — pending confirmation can be dismissed.** Cancel is disabled while loading, but Escape, backdrop and the header close control still invoked `onClose`. A shared `dismissible` prop now gates all three paths, and ConfirmDialog binds it to `!loading`. A ref lets the keyboard handler observe current state without restarting focus/scroll effects.
2. **P2 — mobile notifications and light-theme contrast.** Fixed-color dark toast backgrounds combined with theme-inverted slate text and light-theme status colors produced poor contrast. Use the theme-aware slate surface, preserve status borders/icons, wrap long unbroken URLs, constrain width on narrow screens, and improve close-button focus/target size.
3. **Performance — eagerly shared QR implementation.** The Links page statically imported QRCode and Vite forced it into the shared vendor utility chunk. Use dynamic import at generation time and remove qrcode from that manual chunk. Verified the production Links chunk contains `import("./browser-may7ET9C.js")`; QR implementation is a separate 25,828-byte asset. Shared utility output shrinks from 73.47 kB (21.10 kB gzip) to 48.11 kB (11.27 kB gzip). These are bundle sizes, not measured interaction latency.
4. **Performance — notification context churn.** Memoize the provider value so adding/removing a toast does not invalidate every context consumer.
5. **UI polish.** Modal height follows the dynamic viewport, overscroll stays contained, and close controls have visible keyboard focus with theme-aware hover text.

## Validation

- Worker: 145 tests pass; TypeScript check passes.
- Admin unit: 67 tests pass; TypeScript/production build and canonical asset integrity pass.
- Deployment regression: 92 tests pass; site production build passes.
- Focused browser checks pass: existing desktop/mobile layout and AT tests (6), new notification layout/axe and pending-confirmation tests (2).
- Visually inspected `apps/admin/test-results/ui-audit-long-notification-b73e7-passes-light-theme-contrast-chromium/notification-light-mobile.png`: 320px viewport, wrapped long URL, visible close control, no horizontal overflow.
- Full Admin browser suite: **32 passed (39.0s)** using installed Chrome; covers English/Chinese workflows, themes, responsive navigation, imports, upgrades, AT, and the new regressions.
- Browser environment: use installed Chrome via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; default Playwright revision 1234 is absent. Initial harness runs failed due to the React DOM CJS export shape; corrected to the default export before the passing checks.

## Boundaries and remaining evidence

- This is a targeted source/automated UI audit, not proof that every product flow is bug-free. Production authenticated workflows and real large-D1 timings were not exercised.
- Redirect logic, analytics scheduling, D1/KV ownership, schemas and Demo isolation are unchanged.
- Manual screen-reader validation, fresh-account deployment rehearsal, remote-D1 scale evidence and optional Demo R2 remain the existing Pre-1.0 gates.

## Release preparation

- Site 10/10 and Demo API 6/6 tests pass.
- Migration digest `54bf95ca42735b85e17f109766db9c1005a1d851f8d4ec25d880cff8ca92da2f` matches the existing reviewed repository approval.
- Existing backup verification/reference remains configured; no new backup was created or claimed in this session.
- Production uses authenticated exact-version/exact-commit workflow dispatch; Demo follows the isolated main push; site uses exact-commit dispatch.
