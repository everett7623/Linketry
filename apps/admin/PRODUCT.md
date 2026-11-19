# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: the self-hosting **instance owner / operator** who runs Linketry on their own Cloudflare account. Their job is to manage short links, understand traffic, migrate data, back up the system, and keep destinations healthy—without depending on a hosted SaaS panel.

Secondary audience: visitors of the official read-only Demo, who explore the Admin with synthetic data and must never be confused with a real owner instance.

## Product Purpose

Linketry Admin is the control surface for a self-hosted link management, analytics, and monitoring platform. It lets the owner create and govern short links, inspect analytics, import/export and restore safely, configure domains/rules/notifications, and operate the instance day to day.

Success means: every shipped Admin capability works correctly; the public redirect path stays stable; the owner can complete routine and advanced operations with confidence. Experience and UI upgrades are welcome only when they preserve that correctness.

## Positioning

Unlike SaaS short-link dashboards, Admin runs against **the owner's own Cloudflare Worker, D1, and KV**, with data and domains under their control. It keeps a calm Simple mode for everyday short-link work while exposing Advanced operations (analytics depth, redirect rules, backups, automation) without forcing complexity on first-run users.

## Operating Context

- Deployed as a React admin (Vite + Tailwind) against the Worker's `/api/v1` Admin API; often on a Pages domain or same-origin `/admin/` via Quick Deploy.
- Auth is bearer-token based (`LINKETRY_ADMIN_TOKEN` / scoped API tokens).
- Locales: English and Simplified Chinese.
- Themes: dark by default, optional light; density preferences for tables.
- Modes: Simple vs Advanced Admin surfaces.
- Companion tracks (must stay isolated): production/self-host, official Demo (`LINKETRY_DEMO_MODE=read-only`), and the marketing site at linketry.com.
- Operator rituals: first-run wizard / setup checks, create-edit-bulk link workflows, import preview with default conflict `skip`, analytics refresh, backup/restore, health checks, online upgrade notices.

## Capabilities and Constraints

Confirmed Admin capabilities include: link CRUD and bulk ops; tags/groups/domains; analytics (overview, trends, geography, conversions); import/export and R2 backups; smart redirect rules; health checks and notifications; API tokens; audit logs; QR; password/warning links; UTM tools; settings and first-run setup.

Hard constraints future work must preserve:

- **Correctness first.** Features must not regress or silently fail. UI upgrades optimize experience on top of working behavior—they do not replace QA of the underlying job.
- **Redirect stability is #1 for the product.** Admin analytics and mutations must never put stats or UI convenience on the public redirect critical path.
- **D1 is source of truth; KV is cache only.**
- **Import never silently overwrites slugs** (default conflict strategy `skip`).
- **Production / Demo / site tracks stay isolated.** Never enable Demo mode on a real instance.
- **No multi-user/teams/RBAC** unless an explicit V10-scoped task asks for it.
- Brand assets: Linketry name; theme-aware favicons (`favicon.svg` / `favicon-light.svg`) via `BrandMark`.

Open decisions:

- A hard WCAG version target (e.g. 2.2 AA) is **not yet product-mandated**; Admin already uses axe/Playwright accessibility checks in places.

## Brand Commitments

- Product name: **Linketry**
- Author / support: everettlabs; support via the owner Coffee page
- License: GPL-3.0-only
- Public site copy framing that also constrains Admin tone: calm operator interface; open source; self-hosted; “Own every link”
- Existing Logo/favicon pair for dark and light themes must remain usable and version-cache-busted

## Evidence on Hand

- Live production Admin and isolated Demo (`demo.linketry.com`) with synthetic advanced-feature fixtures
- Project site and docs: `apps/site`, `docs/SELF_HOSTING.md`, `docs/ARCHITECTURE.md`, `README.md`
- Brand marks under Admin public assets and `BrandMark`
- Do **not** invent customer testimonials, benchmarks, pricing, or hosted-SaaS claims

## Product Principles

1. **Correctness before polish** — a feature that looks better but works worse is a failure; UI upgrades must keep behavior trustworthy.
2. **Redirect and data integrity outrank Admin chrome** — never trade public redirect stability or D1 truth for Admin convenience.
3. **Upgrade the experience deliberately** — improve clarity, density, and visual craft, especially UI, once the job stays correct.
4. **Simple by default, advanced when needed** — everyday short-link work stays calm; power tools stay available without forcing them.
5. **Owner sovereignty** — self-hosted on the user's Cloudflare account; Demo and marketing never bleed into a real instance.

## Accessibility & Inclusion

Admin ships with dark/light themes, en/zh-CN locales, reduced-motion CSS respect, and automated axe coverage on selected flows. A formal WCAG conformance level is still an open product decision.
