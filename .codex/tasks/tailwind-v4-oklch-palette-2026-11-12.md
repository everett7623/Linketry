# Tailwind CSS v4 OKLCH palette — 2026-11-12 (v0.35.0)

## Baseline

- `main` / `origin/main`: `18dfe6a` (v0.34.1). Tailwind CSS 4.3.3 already in use; colours still pinned to the v3 palette from v0.34.0.
- Owner asked to adopt the v4 OKLCH palette (the design decision deferred in the v0.34.0 migration).

## Changes

- [x] `apps/admin/src/index.css`: remove the `@theme` block that pinned 14 colour families to v3 hex; set slate and brand to Tailwind v4 OKLCH (brand = indigo); light theme inverted slate + contrast brand in OKLCH; status text overrides use `var(--color-*)`.
- [x] Keep v3 sans stack and rem line-height pins; keep border/placeholder/cursor preflight compatibility.
- [x] `analyticsPalette.ts` world-map ramp → matching OKLCH steps; empty cell → slate-800 OKLCH; unit test updated.
- [x] Release metadata → 0.35.0.

## Validation

- `analyticsPalette` + `theme` unit tests: pass.
- `npm run build --workspace=apps/admin`: pass; stylesheet emits OKLCH (`--color-brand-500: oklch(58.5% …)`, etc.), ≈58.63 kB / gzip 10.55 kB.

## Release

- Commit `ddf9802` on `main`.
- Validate `43057611389` on `release/v0.35.0`: Worker + contracts green; Admin failed twice on runner apt DNS for `playwright install --with-deps` (not a product regression). Local Worker 187 / Admin unit 74 / Admin build OK.
- Site `43060672092` success; production `43061166953` (+ `43062106835`) and Demo `43060582003` success after the apt flake cleared.
- Live 0.35.0 on `go.uukk.de`, `demoapi.linketry.com`, Admin favicons, `linketry.com/llms.txt`. GitHub Release [v0.35.0](https://github.com/everett7623/Linketry/releases/tag/v0.35.0) Latest; temporary branch deleted.
