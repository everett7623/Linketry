# Online Upgrade Credential Validation - 2026-07-20

## Status

Complete. The production Admin detected v0.27.2 and exposed the enabled owner-controlled online-upgrade action while production remained on v0.27.1.

## Objective

Complete the production one-click-upgrade credential path without exposing the GitHub token or automatically applying the test release.

## Progress

- [x] Configure `LINKETRY_GITHUB_UPDATE_TOKEN` as a repository Actions secret.
- [x] Restrict the fine-grained token to `everett7623/Linketry` with Actions read and write only.
- [x] Redeploy production v0.27.1 through workflow run `29715930612`.
- [x] Confirm the workflow copied the optional token into the Worker secret store.
- [x] Pass Worker, deployment, Admin, Demo API, project-site, build, and release-metadata checks for v0.27.2.
- [x] Publish v0.27.2 to `main` with `[skip ci]` so production remains on v0.27.1.
- [x] Confirm the authenticated production Admin detects v0.27.2 and offers the online-upgrade action.
- [x] Leave the final upgrade click to the repository owner.

## Safety Boundary

- The token value is never read back, logged, committed, or exposed to the Admin browser.
- The token is limited to one repository and GitHub Actions read/write operations.
- Production remains on v0.27.1 until the owner explicitly confirms the in-app upgrade.
- Redirect behavior, D1 data, KV entries, migrations, and Demo isolation are unchanged by the discovery-only v0.27.2 commit.
