# Online Upgrade Readiness State - 2026-07-21

## Goal

Make an in-progress Admin page automatically converge to the deployed release without requiring a manual refresh, while avoiding a reload into a partially propagated Pages deployment.

## Evidence

- Production workflow `29811494912` deployed Worker and Admin v0.28.7, then failed its readiness step after the Admin entry script returned `text/html` for five minutes.
- The GitHub workflow dispatch endpoint returned `204`, so the Worker returned `runId: null` and the Admin could not poll a concrete workflow run.
- The stale v0.28.5 page continued to show "Worker and Admin deployment is running" after the runtime had changed.
- A manual reload later loaded v0.28.7 and showed completion.
- Current live checks confirm Worker v0.28.7, Admin HTML v0.28.7, and an `application/javascript` entry asset.

## Scope

- Require the target Worker version and a target Admin document with executable initial assets before automatic reload.
- Persist successful feedback on every success path, including `runId: null`.
- Wake a suspended poll when the tab becomes visible, focused, or online again.
- Cover real `204` dispatch behavior, delayed Pages asset propagation, and bounded failure behavior.
- Synchronize release metadata as v0.28.8.

## Status

- [x] Capture production workflow, runtime, Admin HTML, and asset MIME evidence.
- [x] Implement combined Worker/Admin readiness polling.
- [x] Persist and restore success feedback for the real no-run-ID path.
- [x] Add unit, browser, and deployment regressions.
- [x] Synchronize v0.28.8 release metadata and documentation.
- [x] Deploy and verify the isolated Demo through workflow `29817579157`.

## Verification

- 60 Admin unit tests and all 25 Playwright browser scenarios pass.
- 110 Worker tests, Worker type-check, and 78 deployment policy tests pass.
- 6 Demo API and 4 project-site tests pass.
- Admin and project-site production builds pass.
- Official npm registry audit: zero known vulnerabilities.
- Demo Worker health and Admin metadata report v0.28.8, the initial script serves `application/javascript`, the upgrade-complete feedback survives reload, and the stable overview has no browser warnings or errors.
- The production workflow stopped at its owner-controlled safety gate before mutation because its approved release metadata still targets the prior release.

## Safety Boundaries

- No redirect handler or redirect decision changes.
- No D1, KV, visits, migration, or analytics changes.
- No production deployment without the existing owner-controlled release gates.
- No polling loops that multiply across React effects.

## v0.30.3 Production Recovery Follow-up

- GitHub Actions run `30781318488` failed before Cloudflare writes because `demo-admin-parity.test.mjs` still expected the v0.29.20 favicon query while the release advertised v0.30.2.
- Production Worker and Admin remained on v0.30.1; public health and Admin HTML checks confirmed no partial v0.30.2 deployment.
- The sidebar could expose its upgrade button while the protected capability request was still pending, causing a false “Upgrade status unavailable” warning.
- The parity test now reads the root package version, and a delayed-capability browser regression verifies that production waits for `everett7623/Linketry` `main` before opening the upgrade confirmation.
- Redirect handling, D1/KV data, migrations, secrets, and the protected deployment gates remain unchanged.
- Local verification passes: 90 deployment, 110 Worker, 6 Demo API, 64 Admin unit, 26 Admin browser, 1 production-build browser, and 10 Site tests, plus Worker type-check and Admin/Site production builds.

## v0.30.4 Two-stage Readiness Follow-up

- Production run `30783158533` passed preflight, tests, safety gates, migrations, Worker deployment, and Admin deployment; v0.30.3 is live on the Worker, Pages origin, and custom Admin domain.
- The run ended at Admin readiness because its first custom-domain request reached a new hashed asset before Pages propagation completed, received SPA fallback HTML, and the outer custom-domain cache retained that response as a cache hit.
- The production workflow now verifies the exact target version and canonical initial JS/CSS MIME on `https://${LINKETRY_PAGES_PROJECT}.pages.dev` before making its first custom-domain readiness request.
- The custom-domain check remains strict and does not add a query string, `no-cache` bypass, or alternate asset URL, so a green workflow still proves the user-facing canonical deployment is usable.
- The production online-upgrade target remains `everett7623/Linketry` `main`; dispatch, approval variables, backup, migrations, and Cloudflare resource gates are unchanged.
