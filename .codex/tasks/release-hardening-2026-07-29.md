# Release Hardening

Date: 2026-07-29
Target release: 0.29.19
Follow-up patch: 0.29.20
Status: Complete locally

## Goal

Harden the public release baseline before a beginner-facing Cloudflare Quick Deploy launch without changing redirect behavior or any live Cloudflare resource.

## Safety Boundaries

- Do not modify redirect evaluation, analytics scheduling, D1/KV ownership, migrations, or stored data.
- Do not deploy, create, delete, or rebind Cloudflare resources during local hardening.
- Keep React Router changes within the existing declarative `BrowserRouter` architecture.
- Treat a fresh-account Quick Deploy rehearsal and GitHub private vulnerability reporting as explicit external launch gates.

## Dependency Decision

- Upgrade Wrangler from 4.111.0 to 4.115.0 so Miniflare and Sharp receive maintained releases.
- Upgrade PostCSS to 8.5.24.
- Upgrade React Router from 6.30.4 to 7.18.2, which fixes the applicable open-redirect advisory while preserving the v6 declarative APIs.
- Remove ESLint because the repository has no ESLint configuration or lint script and the dependency was unused.
- Accept the remaining package-level React Router audit finding as not applicable: `GHSA-qwww-vcr4-c8h2` affects only unstable RSC APIs, and Linketry imports no RSC API.

## Status

- [x] Confirm local and remote `main` start at commit `08b45e99faa29043b2e6663fe14945a3075883e7`.
- [x] Capture the v0.29.18 dependency-audit baseline.
- [x] Pin Node.js 24 with `.node-version`.
- [x] Upgrade the maintained dependency baseline and remove unused ESLint.
- [x] Rebuild the lockfile from `registry.npmjs.org` with integrity metadata and no `npmmirror.com` artifact URLs.
- [x] Stabilize the two measured lazy-route cold-start assertions.
- [x] Scope Links workflow assertions to the active results table.
- [x] Pass the Admin production build and the default eight-worker 25-test browser suite.
- [x] Pass the complete local release regression, Wrangler dry-run, clean-install check, and final audit review.
- [ ] Rehearse Quick Deploy in a fresh Cloudflare account.
- [ ] Enable GitHub private vulnerability reporting before public 1.0.

## 0.29.20 Follow-up

- [x] Remove the duplicate page-level completion notice after the target Admin build loads.
- [x] Keep completed release status in the existing sidebar version center.
- [x] Clear persisted and inferred completed feedback without rendering a transient success banner.
- [x] Preserve stale-build automatic and manual refresh guidance.
- [x] Update focused browser coverage and synchronize release metadata.
- [x] Preserve the v0.29.19 dependency, redirect, data, secret, and Cloudflare safety boundaries.
