# Product Gap Audit

Updated: 2026-07-19

This document tracks what Linketry still needs as a practical open-source, self-hosted short-link platform. It complements `ROADMAP.md`, `SHLINK_FEATURE_GAP.md`, and `SINK_COMPARISON.md` without weakening redirect stability.

## Audit Basis

The review covered:

- All Admin routes and the shared desktop/mobile shell
- The Analytics and per-link Analytics API/UI contract
- Redirect, cache, asynchronous visit, import, backup, update, and Demo boundaries
- 1440x900 desktop and 390x844 mobile layouts on the isolated public Demo
- Production dependency advisories through the official npm registry
- Current official Shlink, Dub, and Kutt documentation for product comparison

The complete dependency audit reports no known vulnerabilities. Vite is updated to the supported 6.4 line; React, Tailwind, and React Router major releases remain separate work because they need dedicated migration testing.

## Completed In 0.27.8

| Area                   | Result                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Beginner configuration | One idempotent command derives and verifies the minimum GitHub secret/variable plan from the exact Cloudflare bootstrap resources and clean release metadata.     |
| First deployment       | The guarded workflow creates a missing Pages project and uploads the generated Admin token with the first Worker deployment.                                      |
| Credential boundaries  | The Cloudflare token permission list includes the required zone-scoped Workers Routes permission; token values remain outside arguments, logs, builds, and files. |
| Upgrade rehearsal      | An existing protected Worker can receive the optional online-upgrade secret without deploying code or applying migrations.                                        |
| Documentation contract | README, self-hosting, deployment, and fresh-account guidance are tested as one recommended beginner path.                                                         |

## Completed In 0.27.1

| Area                              | Result                                                                                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessibility automation          | Axe regression covers Login, Overview, Links, Create/Edit, Analytics, Settings, authenticated dialogs, light theme, and mobile navigation without disabling serious/critical rules.      |
| Keyboard workflows                | Shared modals and the mobile drawer move, contain, dismiss, and restore focus; controls expose names, errors, hints, busy state, and live status.                                        |
| Visual accessibility              | Reduced-motion preferences suppress nonessential animation, and maintained dark/light muted text and primary actions pass the tested contrast baseline.                                  |
| Fresh-account guidance            | One owner checklist covers scoped credentials, repository configuration, idempotent Cloudflare bootstrap, DNS-only Demo CNAMEs, optional R2 bindings, first use, upgrades, and rollback. |
| Deployment documentation contract | Automated checks keep GitHub commands repository-scoped and prevent the Demo DNS/R2 instructions from drifting.                                                                          |
| Dependency security               | Admin/site use Vite 6.4.3 and the official npm registry reports zero known production or development dependency vulnerabilities.                                                         |

## Completed In 0.27.0

| Area                 | Result                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Analytics filters    | The date range stays visible while the fourteen attribution fields move behind an explicit Advanced filters control. Saved views reopen advanced fields when needed. |
| Conversion semantics | The Admin now calls the metric Event Rate and shows the human-click denominator, avoiding the impression that it is a session/user conversion rate.                  |
| Conversion value     | Currency-separated totals already stored by the API are now summarized in Analytics, per-link Analytics, and CSV exports.                                            |
| Mobile Analytics     | The first viewport is no longer dominated by the complete filter form, and expanded filters retain zero horizontal overflow.                                         |
| Admin loading        | Authenticated pages are route-split. The production entry chunk decreased from about 573.7 KB to 298.0 KB before gzip.                                               |
| Visual consistency   | Analytics operational panels use the same bounded border radius and section treatment.                                                                               |

## P0 Before 1.0

### Fresh-account deployment rehearsal

The maintained owner checklist and automation now cover repository setup, scoped credentials, D1/KV creation, first deployment, first login, first domain, first redirect, optional R2 backup, upgrade, and rollback. Before 1.0, repeat the exact checklist in an independent owner-controlled fork/account and retain the evidence; local automation and contract tests do not replace this external validation.

### Public Demo redirect-domain reachability

The Admin and API have branded Pages domains, but seeded short links still use the isolated account's `workers.dev` origin. Before 1.0, add and verify an isolated branded redirect hostname so public Demo redirects do not depend on regional `workers.dev` reachability; never reuse production routes or data.

### Independent assistive-technology audit

The automated baseline now covers the core routes, dialogs, mobile navigation, keyboard focus, names, errors, reduced motion, and dark/light contrast. Before 1.0, perform a manual screen-reader and keyboard audit on the remaining advanced routes and publish any browser/assistive-technology limitations.

### Large-data operating envelope

Document and test realistic limits for links, visits, import files, audit rows, health history, and Analytics filters. Existing APIs use bounded lists and pagination in key places, but a release-grade project needs repeatable fixtures and response-time budgets at representative D1 sizes.

### Release and support policy

Publish a stable pre-1.0 compatibility policy covering API changes, migration support, security reports, supported Node/Wrangler versions, backup expectations, and the minimum rollback procedure.

## P1 Core Enhancements

### Privacy-safe click-to-conversion attribution

Current conversions are trusted server-side events associated with a link and time range. They are not tied to a unique click or session. A future design should use an opaque click identifier, an explicit attribution window, first/last-click rules, idempotent lead/sale events, and a public ingestion boundary that never exposes an Admin/write token. Raw customer email, name, and direct identifiers should remain out of the default model.

### Asynchronous signed click webhook

Add optional `link.clicked` delivery through Queue/post-processing only. Signing, retries, suppression, and payload minimization must reuse existing webhook conventions, and failures must never delay a redirect.

### Optional identity-provider authentication

Add Cloudflare Access or OIDC as an optional Admin authentication layer while preserving bearer-token recovery for self-hosters. Define logout, CSRF, token rotation, lockout recovery, and local-development behavior before implementation.

### Domain and ownership-scoped API tokens

Read/write/admin scopes are implemented. The remaining security gap is restricting automation tokens to specific domains or links they created, similar to Shlink's domain-specific and authored-short-URL roles.

### Per-link social preview controls

Destination preview inspection is implemented. The missing capability is explicit per-link social title, description, and image configuration with optional R2 storage and safe fallback behavior.

### Lifecycle review queue

Expiry and click limits are implemented. Add an opt-in dry-run queue for long-idle or expired links, with review, archive-first defaults, export, and restore guidance instead of automatic destructive deletion.

### Additional import adapters

Add Bitly, Rebrandly, and TinyURL only when real export fixtures and conflict behavior are available. Every adapter must preserve preview, `skip` defaults, bounded batches, and original source identifiers.

## P2 Optional Enhancements

- Extra-path forwarding and multi-segment slugs, only behind explicit settings and redirect regression gates
- Additional reviewed locales through the existing catalog-parity workflow
- Browser extension, Raycast, Shortcuts, MCP, and mobile clients generated against the stable OpenAPI contract
- Optional real-time event views after bounded polling and scheduled reports remain the default
- Optional Workers AI assistance while local deterministic suggestions remain available

## Deliberate Non-goals

- No synchronous destination probe, webhook, analytics query, or AI call in the redirect response path
- No multi-tenant billing or hosted-SaaS dependency in the core self-hosted edition
- No email tracking pixel by default
- No iframe cloaking
- No storage of raw visitor IP addresses
- No silent destructive cleanup or migration

## Conversion Metric Contract

- `eligibleClicks = totalClicks - classifiedBotClicks`
- `eventRate = conversionEvents / eligibleClicks`
- Event Rate can exceed 100% when one click produces multiple conversion events
- Values are aggregated separately by currency and never summed across unlike currencies
- Country/device/browser/referrer filters intentionally make conversion metrics unavailable until visit-level attribution exists

This is an event-performance view, not a customer funnel. A click-to-lead-to-sale funnel belongs to the future attribution work above.

## External Product References

- Shlink API key roles: https://shlink.io/documentation/api-docs/api-key-roles/
- Shlink extra-path, multi-segment slug, bot, and expired-link behavior: https://shlink.io/documentation/some-features/
- Dub click-to-lead-to-sale attribution model: https://dub.co/docs/concepts/attribution
- Kutt self-hosting, custom domains, OIDC, and API overview: https://github.com/thedevs-network/kutt
