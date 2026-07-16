# Deployment Approval Recovery - 2026-07-16

## Status

Completed in v0.20.1, subject to the exact-commit post-push production verification.

## Scope

- [x] Synchronize the production workflow fallback with the current release version.
- [x] Bump all Linketry release metadata to v0.20.1.
- [x] Preserve the reviewed migration inventory and digest without changing SQL.
- [x] Run deployment, Worker, Admin, and project-site verification.
- [x] Commit the reviewed fix locally before changing production approvals.
- [x] Update the exact GitHub release and commit approvals, then push `main`.
- [x] Monitor the production workflow and run read-only health checks before handoff.

## Safety Boundary

- Redirect logic, migration files, D1/KV bindings, API contracts, and stored data are unchanged.
- GitHub approval variables are updated only after the final local commit SHA exists and before its push triggers deployment.
- The existing migration digest, backup verification, migration review, and upgrade-target confirmation remain required.
- If deployment stops before Cloudflare writes, restore the previous approval variables; if deployment partially succeeds, redeploy the previous known release or an explicit revert.

## Verification

- Deployment safety tests: 35 passed.
- Reviewed migration digest remains `8b2c24a834f54c833603c613fe7fb1a18772bd2f24a3ddb8dee8e11e883fa7f4`.
- Worker type-check passed; Worker tests: 60 passed.
- Admin unit tests: 35 passed; production build passed with the existing bundle-size advisory only.
- Project site tests: 3 passed; production build passed.
- The production workflow and live health checks are verified operationally after this exact commit is pushed.
