# Branded QR — design proposal (batch 4, 2026-10-17)

Status: proposal only; nothing implemented. Baseline `a5e0d2d` (v0.31.12 deployed).
Roadmap entry: "branded QR Code assets with visual safety guardrails, PNG/SVG/PDF exports, and scan attribution that is labeled separately from link-click analytics" (`docs/ROADMAP.md`, `TASKS.md` V9+).

## Current state

- QR exists only in the Admin. `pages/Links.tsx` `showQr` lazy-loads `qrcode` and renders a 320 px PNG data URL (`#020617` on `#ffffff`, error correction `M`, margin 2); `components/links/QrCodeModal.tsx` previews it and offers Copy link / Download PNG.
- Nothing is stored; no Worker route, no settings, no analytics.
- Gap against the QR spec: margin 2 is below the required 4-module quiet zone. Most phone scanners cope, but printed codes next to other artwork can fail. Worth fixing even without branding.

## Goals

1. Let an owner produce on-brand QR codes (colours, centre logo, caption, sizes) that still scan reliably.
2. Export print-ready files: PNG at chosen size and SVG (vector); PDF later.
3. Keep one instance-wide default style so every link's QR is consistent without per-link setup.
4. Keep the redirect path, KV rules and analytics pipeline untouched in the first phase.

## Non-goals (first phase)

- Per-link QR styles, QR "designs" marketplace, dot/eye shape art, gradients or background images.
- Scan attribution (needs a redirect-path decision, see Phase 3).
- Any D1 migration, new binding or Worker dependency on the redirect path.
- Multi-user/team ownership of styles (V10 scope).

## Phase 1 — Admin branded QR (proposed v0.32.0)

### User experience

- The QR dialog gains a "Style" panel beside the preview: foreground colour, background colour, centre logo (upload / remove), caption toggle (short URL under the code), size preset (512 / 1024 / 2048 px) and format (PNG / SVG).
- "Use instance default" is preselected; "Save as default" (admin scope) stores the current style for all links.
- Live preview re-renders on change; guardrail messages appear inline (`role="status"`), and Download is disabled while a blocking guardrail fails.
- Settings → Appearance gets a read-only summary of the default style with a "Reset to standard" action.

### Safety guardrails (block download when failing unless noted)

| Rule | Threshold | Why |
|------|-----------|-----|
| Dark modules on light background | foreground relative luminance lower than background | Many scanners reject inverted codes |
| Contrast | ≥ 4.5:1 between foreground and background | Keeps codes readable in print and on dim screens |
| Quiet zone | 4 modules, fixed (not user-editable) | QR spec minimum |
| Logo area | ≤ 20 % of the symbol area, centred, with a background-coloured pad | Error correction must cover the hidden modules |
| Error correction | forced to `H` when a logo is present, else `M` | `H` restores up to ~30 % damage |
| Decode check | rendered bitmap must decode back to the exact short URL | Catches every combination above; warning-only if the decoder chunk fails to load |

The decode check uses a lazily loaded decoder (candidate: `jsqr`, ~45 kB min) that only loads when the Style panel is opened.

### Rendering and export

- Keep `qrcode` (already a lazy chunk). PNG: draw the matrix to an offscreen canvas at the chosen size, composite logo and caption, `canvas.toBlob`. SVG: `qrcode.toString({ type: 'svg' })`, then inject the logo as an `<image>` data URI and the caption as `<text>`, so the file stays a single self-contained vector.
- File names stay `linketry-qr-<slug>.<ext>`.
- Bundle budget: the QR chunk may grow by at most 25 kB gzip; the decoder is a separate chunk.

### Storage and API (no migration)

- New dedicated route `GET/PUT /api/v1/qr-style` (read for `read` scope, write requires `admin`), stored in the existing `settings` table under `qr_style_default`, added to `INTERNALLY_MANAGED_KEYS` and stripped from `GET /settings`. This prevents the logo data from bloating every settings read (the Links page fetches settings for the default domain).
- Shape, validated in a shared validator (`packages/shared/src/validators`):
  - `foreground`, `background`: `#rrggbb`, with the same luminance/contrast rules enforced server-side.
  - `logo`: optional PNG data URL, at most 256×256 px after client-side downscale and at most 48 kB encoded; SVG uploads are rasterised in the browser and never stored as SVG (avoids script-bearing SVG).
  - `caption`: boolean; `size`: one of 512/1024/2048; `format`: `png` | `svg`.
- Audit log entry `qr_style.update`; included in JSON backups and restore.
- Demo: the route is a write, so it stays 403 in read-only Demo; styling and download still work client-side there.

### Accessibility and i18n

- Colour inputs and the logo control are labelled; guardrail messages are announced; the preview `alt` keeps describing the encoded URL.
- New en and zh-CN keys for the panel, guardrails and actions, in the existing per-area catalogs.

### Tests

- Shared validator unit tests: colours, contrast, inverted rejection, logo size limits, unknown keys.
- Worker route tests: auth scopes, settings stripping, Demo 403, backup round trip.
- Admin unit tests: luminance/contrast helper, logo area calculation.
- Browser tests: style a code, download PNG and SVG, decode the PNG back to the short URL, blocking guardrail disables download, default style persists across reloads.

### Work breakdown (estimate)

1. Quiet zone 2 → 4 and colour/contrast helper (small; can ship alone as a patch).
2. Shared validator plus `qr-style` route, settings stripping, backup and audit (medium).
3. Style panel, live preview, PNG/SVG export (medium).
4. Decode check chunk and guardrail wiring (small–medium).
5. Settings summary, i18n, docs (`docs/API.md`, OpenAPI), tests and release metadata (medium).

## Phase 2 — API QR export (later)

- `GET /api/v1/links/:id/qr.svg` for API tokens (read scope), rendered in the Worker with a pure-JS encoder and the stored default style. SVG only, since PNG would need an image encoder in the Worker. Never on the redirect path; cacheable with `ETag` on the style and URL.
- PDF export (single-page vector PDF with the SVG embedded) once there is a dependency-light writer worth the bundle cost.

## Phase 3 — Scan attribution (needs explicit approval)

- Requires distinguishing a scan from a click. The only robust signal is a marker in the encoded URL (for example `/<slug>?_q=1`), which the redirect path would have to recognise and strip before forwarding. That touches redirect logic, which is golden-rule #1 and needs an explicit instruction.
- If approved: recognise the marker only in the asynchronous `ctx.waitUntil()` visit record; never add a lookup or branch that can delay or fail the redirect. Report "QR scans" as a labelled subset of clicks rather than a separate total. Accept that a copied QR URL counts as a scan.
- Privacy: no new identifiers; reuse existing visit fields.

## Decisions (recorded 2026-10-17)

1. Logo storage: D1 settings key, 48 kB cap; works on every install.
2. Quiet zone: shipped now as standalone patch v0.31.13.
3. Decode check: lazily loaded decoder; downloads that do not decode are blocked.
4. PDF: deferred to Phase 2.
5. Scan attribution: deferred; revisit after Phase 1.
6. Next: implement Phase 1 as v0.32.0.

## Decisions originally requested

1. Logo storage: D1 settings key capped at 48 kB (proposed; works for every install), or require R2 (larger logos, but excludes installs without R2)?
2. Ship the quiet-zone fix now as a standalone patch, or with Phase 1?
3. Decode-check dependency: accept a ~45 kB lazily loaded decoder, or make the check warning-only without a decoder?
4. PDF in Phase 1, or defer to Phase 2 as proposed?
5. Should Phase 3 scan attribution go ahead at all, given it touches the redirect path?
