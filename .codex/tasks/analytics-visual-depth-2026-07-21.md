# Analytics Visual Depth - 2026-07-21

## Goal

Fix browser-local "today" analytics and make the Analytics dashboard useful for trend, geography, and audience analysis without changing redirect behavior, the stable visits schema, or D1 ownership.

## Scope

- Treat the browser-provided UTC offset as the explicit day boundary for Overview and Analytics.
- Return a zero-filled daily series with total, human, bot, and unique-visitor counts.
- Add a bounded ISO 3166-1 alpha-2 country distribution for a local interactive world map.
- Add line, area, and stacked-bar trend views plus device and browser composition charts.
- Keep the existing `topCountries` and all current Analytics response fields compatible.
- Update synthetic Demo data coverage, tests, documentation, and release metadata for v0.28.6.

## Status

- [x] Read project progress, task, roadmap, analytics API, Worker queries, and current Admin layout.
- [x] Confirm UTC day boundaries and sparse daily rows as the causes of misleading "today" displays.
- [x] Confirm visit country values are Cloudflare ISO 3166-1 alpha-2 codes.
- [x] Implement timezone-aware Overview and Analytics queries.
- [x] Implement daily-series and geography response fields.
- [x] Implement trend, world map, and audience composition panels.
- [x] Add focused Worker, Admin, Demo, and responsive browser coverage.
- [x] Synchronize v0.28.6 release metadata and project status.
- [x] Run tests, builds, and desktop/mobile visual verification.

## Verification

- 109 Worker tests, including real SQLite boundary and 100k-visit budget coverage.
- 58 Admin unit tests and 25 Playwright browser scenarios.
- 78 deployment contracts, 6 Demo API tests, and 4 project-site tests.
- Worker type-check plus Admin and project-site production builds.
- Desktop and mobile screenshot review, Axe scan, and horizontal-overflow checks.
- Official npm registry audit: zero known vulnerabilities.
- Isolated Demo workflow `29803326084` deployed commit `9a5b07b2f53cce60eb174bf0bad61bf4f2f905d5` and passed its live parity/read-only gates.
- Live `demo.linketry.com/analytics` reports v0.28.6, browser-local today traffic, all three visual panels, no horizontal overflow at 1280px, and no console errors.

## Project Review

- Scanned 284 code files and 142 Markdown files under the project size-check rules.
- 29 pre-existing code files remain above the current line-count guidance; no unrelated refactor was included in this release.
- The visual analytics message additions were split into a dedicated catalog so the touched observability catalog remains within its TypeScript limit.

## Safety Boundaries

- No migration or `visits` schema change.
- No redirect handler, redirect decision, KV cache, or synchronous analytics write change.
- Country aggregation is capped at 250 grouped rows and uses prepared D1 statements.
- Unknown/non-ISO country values remain visible as unmapped traffic instead of being silently dropped.
