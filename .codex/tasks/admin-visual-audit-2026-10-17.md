# Admin visual audit — 2026-10-17 (batch 3, report only)

Baseline: local HEAD and `origin/main` both `e607ca1` (v0.31.11 deployed); clean tree. No code changed in this batch.

## Method

- Local Worker (`wrangler dev`, local D1/KV, throwaway session token) + Admin Vite dev server. Seeded 25 links (active, disabled, archived, expired, click-limited, password, warning, CJK title, long URL/tags) and 169 local redirects.
- Playwright Chromium, Advanced mode, 20 routes × 5 variants = 100 captures: dark/light at 1440×900, dark/light at 390×844 (touch), Simplified Chinese light at 390×844.
- Per capture: console/page errors, failed `/api/` responses, horizontal page overflow and unclipped elements past the viewport, touch targets under 32 px (mobile), axe serious/critical violations.
- Second pass unrolled the inner `main` scroll container on 9 content-heavy pages (the Admin scrolls inside `main`, so page-level full-page screenshots stop at one viewport) and measured table overflow and first-result position.
- Screenshots: `%TEMP%\linketry-audit\shots` and `%TEMP%\linketry-audit\tall` (not committed).

## Clean results

- No console errors, page errors or failed API calls on any route in any variant (other than the dev-only proxy issue below).
- No page-level horizontal overflow on any route at 390 px or 1440 px; wide tables scroll inside their own containers.
- Dark and light themes render every route without unthemed panels; Chinese copy fits on mobile without clipping.
- API Tokens renders correctly via in-app navigation with no serious axe findings.

## Findings

### P1 — Per-link Daily Clicks chart never draws bars

- `components/analytics/AnalyticsBlocks.tsx` `DailyBars` (used only by `pages/LinkAnalytics.tsx`). Each bar's height is a percentage of its column, but the column is an auto-height flex child of the `items-end` row, so the percentage resolves to 0. Measured: 30 bars, 0 visible; the 10/17 bar for 40 clicks is 0 px tall in a 23 px column inside a 176 px row.
- Present since the chart was introduced (July 2026, `8595840`/`2383946`); the global Analytics chart uses a separate SVG chart and is unaffected.
- Fix direction: give each column the full row height (`h-full` with `justify-end`) so the percentage resolves; add a browser assertion that a non-zero day has a visible bar.

### P2 — Links table clips the Actions column at 1440 px

- Desktop (1440×900, expanded sidebar): the table is 59 px wider than its container; the "Actions" header shows as "AC" and the delete button is off-screen until the table is scrolled sideways. Created dates also wrap to two lines.
- Fix direction: tighten the action cluster (overflow menu for archive/delete, or smaller gaps), cap destination width, or keep Actions sticky on the right.

### P2 — Links page on mobile

- 390 px: the basic filters plus the always-open Advanced Filters panel (8 fields) push the first result to 876 px, below the 844 px fold. The table view needs 853 px of sideways scrolling; card view exists but table remains the default.
- Fix direction: collapse Advanced Filters by default below `md` (show an active-filter count), and default to card view on narrow screens when no preference is stored.

### P2 — Unlabelled selects (axe `select-name`, serious)

- `pages/LinkAnalytics.tsx:155` (date range) and `:216` (public share range)
- `pages/ImportExport.tsx:362` (conflict strategy; visible text is not associated with the control)
- `pages/AuditLogs.tsx:109` (action filter)
- Fix: pass `label` or `aria-label` to `Select`, or `htmlFor`/`id` for the raw select. These pages are not in the existing axe browser coverage, which is why CI did not catch them.

### P3 — Light-theme Active badge contrast

- Overview lists: emerald `#047857` on `#cfece7` at 12 px = 4.38:1 (needs 4.5:1); 10 nodes on light desktop/mobile/zh. Darken the light-theme success text one step.

### P3 — Audit log table not keyboard-scrollable on mobile

- axe `scrollable-region-focusable`: the mobile `.overflow-x-auto` wrapper (317 px of hidden width) has no focusable content. Add `tabIndex={0}` with an accessible name to the scroll region, or reflow the table into cards on mobile.

### P3 — Touch targets on mobile

- Icon actions are 26×26 (Links rows/cards, Tags, Overview copy/open); row checkboxes 13–16 px; Analytics/Settings checkboxes 13–16 px; login token reveal 16×16; view toggle and page action buttons 28 px tall. 26 px meets WCAG 2.2 AA (24 px) but is below common 44/48 px touch guidance; the 13–16 px checkboxes rely on surrounding spacing.
- Fix direction: enlarge hit areas (padding or a pseudo-element) on mobile only, without changing desktop density.

### P3 — Layout polish

- Sidebar at 900 px height: the bottom utility block (language/theme/coffee, mode badge, logout) overlaps the last nav entries; "API Tokens" is cut off until the nav list scrolls.
- Overview on mobile: three full-width stat cards take ~1.5 screens before recent links; a compact 3-column row would fit.
- Link Analytics: six separate empty UTM cards ("No data yet") take a full screen; collapse empty UTM dimensions into one note.
- Analytics is ~11.5 phone screens and Settings ~9; Settings already has tabs, but saving is split across per-section buttons (general, module visibility, webhooks, each notification channel).

### Dev-only — `/api-tokens` hits the Worker in local development

- `apps/admin/vite.config.ts` proxies the `'/api'` prefix, which also matches `/api-tokens`; reloading or opening that page directly on the dev server shows the Worker's 404 page. Production and Quick Deploy are unaffected. Fix: proxy `'/api/'`.

### Local environment notes (not product bugs)

- The local `apps/worker/.dev.vars` still uses the pre-rename `ADMIN_TOKEN` key, so local admin API calls return 401 until it is renamed to `LINKETRY_ADMIN_TOKEN`. The audit used a throwaway session token instead of reading or editing it.
- Local `wrangler.toml` still declares `LINKETRY_VERSION = "0.31.0"`.
- Unique visitors and countries are 0/US locally because local requests carry no Cloudflare IP/geo metadata.

## v0.31.12 fixes

- Fixed: P1 Daily Clicks bars (inner `flex-1 items-end` track so bar percentages resolve); P2 unlabelled selects (`aria-label` on Link Analytics range/share range and Audit action, `htmlFor`/`id` on import conflict handling, plus `aria-label` on the audit search); P3 audit-log scroll region (`tabIndex=0`, `role="region"`, labelled, visible focus ring); P3 light-theme success text `#047857` → `#065f46`; dev proxy `'/api'` → `'/api/'`.
- Regression: `apps/admin/tests/page-accessibility.spec.ts` — all three tests fail against the v0.31.11 source (bar height 0, unnamed action combobox, color-contrast) and pass after the fixes.
- Validation: TypeScript, Admin unit 68/68, browser 36/36, build + asset integrity, production-build smoke 3/3, deployment 92/92, site 10/10.
- Deployment: source `a5e0d2db62ff581f3c92cbab8e2be54301877399` on remote baseline `b10c9c2`; [production 39044243842](https://github.com/everett7623/Linketry/actions/runs/39044243842), [Demo 39044226848](https://github.com/everett7623/Linketry/actions/runs/39044226848), [site 39044246580](https://github.com/everett7623/Linketry/actions/runs/39044246580) succeeded. Live: health and Admin/site versions 0.31.12; production 401/401/404, Demo write 403; live Admin CSS contains `#065f46`.
- Still open: P2 Links table width at 1440 px and mobile Links layout; P3 touch targets and layout polish.

## Suggested follow-up

The accessibility/chart fix release shipped as v0.31.12. Remaining: the Links table/mobile layout changes as a separate, reviewable UI change, then touch-target and layout polish.
