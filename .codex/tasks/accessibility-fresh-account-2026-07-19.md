# Accessibility And Fresh-account UX - 2026-07-19

## Objective

Close the maintained pre-1.0 accessibility baseline and make the first isolated Cloudflare account deployment path exact enough for a new owner to follow without weakening production or Demo boundaries.

## Findings

- Shared dialogs lacked complete focus entry, containment, Escape dismissal, focus return, and background-scroll behavior.
- Several icon actions, filter fields, UTM template controls, loading states, form errors, and notifications lacked complete accessible names or state association.
- Reduced-motion behavior covered only selected components, and small muted text plus the primary hover color failed the strict browser contrast threshold on tested themes.
- The deployment automation was mature, but the owner actions for repository environments, cross-account DNS, optional R2 bindings, first use, upgrade, and rollback were spread across multiple documents.
- The existing Vite 5 development toolchain carried advisories even though production dependencies were clean.

## Implemented

- Added shared focus helpers and applied accessible modal/drawer dialog behavior with focus restoration and scroll containment.
- Associated form hints/errors with unique controls and exposed invalid, busy, status, alert, dismiss, filter, navigation, and icon-action semantics in English and Chinese.
- Added a global reduced-motion baseline and corrected tested dark/light contrast colors.
- Added Axe coverage to core route, conversion, dialog, theme, and mobile browser suites without disabling serious or critical rules.
- Added `docs/FRESH_ACCOUNT_REHEARSAL.md` and a contract test covering repository-scoped commands, both Demo DNS targets, DNS-only mode, and both optional R2 variables.
- Upgraded Admin/site Vite to 6.4.3 and synchronized release metadata at 0.27.1.

## Verification

- Browser-inspected the isolated Demo and a local Admin build backed by the read-only Demo API.
- Verified accessible Overview action names, modal focus entry/return, form error association, mobile drawer focus, reduced motion, dark/light contrast, and existing Analytics/update flows.
- Passed 64 deployment, 82 Worker, 48 Admin unit, 20 Admin browser, 6 Demo API, and 4 site tests.
- Passed Worker type-check, Admin/site production builds, Demo Pages Function compilation, and a full official-registry npm audit with zero vulnerabilities.
- The Admin entry bundle is 315.06 KB before gzip, about 45% below the pre-route-splitting baseline.
- Guarded production/Demo rollout evidence is recorded in `PROGRESS.md` after completion.

## Safety

- No redirect handler, redirect rule, visit scheduling, D1 query, KV cache, migration, production domain, or Demo isolation logic changed.
- Fresh-account examples require scoped API tokens and prohibit the Global API Key.
- Optional R2 activation and Worker binding configuration remain distinct explicit steps.
