# Admin Brand And Update Discovery - 2026-07-18

## Status

Implemented and deployed in Linketry v0.26.3 after reviewing the live production Admin at `admin.uukk.de`.

## Findings

- Production `/favicon.svg`, `https://linketry.com/favicon.svg`, and the repository canonical dark Logo have identical SHA256 content.
- The Admin rendered an unversioned Logo URL, so a browser or CDN cache could retain an older image after deployment.
- Update checks cached a successful result for six hours and ran only when the authenticated Layout mounted.
- A release published immediately after a cached check could remain invisible until cache expiry or manual browser-storage clearing.
- Automatic Worker-triggered deployment remains conditional on the protected `LINKETRY_GITHUB_UPDATE_TOKEN`; the manual Actions fallback remains available without it.

## Completed

- [x] Add the running version to BrandMark and Admin browser favicon URLs.
- [x] Keep dark/light theme Logo selection intact.
- [x] Reduce update cache freshness to 15 minutes.
- [x] Poll GitHub while the Admin is visible and recheck when returning to a stale tab.
- [x] Add desktop and mobile force-refresh controls with localized feedback.
- [x] Make a manual check ignore both the cached result and prior dismissal for the detected release.
- [x] Label the manual workflow fallback separately from automatic online upgrade.
- [x] Add unit and Chromium coverage for forced checks, cache policy, themed Logo URLs, and update actions.

## Safety Boundary

- GitHub package metadata requests are anonymous and do not include the Admin token.
- The UI does not create, copy, or expose a GitHub update token.
- Redirect handlers, asynchronous analytics, D1/KV ownership, migrations, production data, and Cloudflare resources are unchanged.

## Verification

- Deployment policy and Demo parity tests: 53 passed.
- Worker tests: 81 passed; TypeScript type-check passed.
- Admin tests: 48 unit and 19 Chromium browser tests passed; production build passed.
- Project-site tests: 4 passed; production build passed.
- Live production Admin, project-site, and repository Logo hashes match before the cache fix.
- Isolated Demo run `29634990846` passed the production-parity gate and deployed v0.26.3.
- Production run `29635088591` deployed v0.26.3 from commit `ffc7d51`.
- Production and Demo Workers report v0.26.3; both Admins return 200 and expose the v0.26.3 favicon cache key.
- Production unauthenticated API and missing-slug checks return 401 and 404; the Demo read API remains publicly available in read-only mode.
