# Demo Live Rollout And Advanced Cloudflare Follow-up - 2026-07-17

## Status

Core Demo rollout is complete and live at `https://demo.linketry.com`. The account is the recorded fresh-account core rehearsal. R2 subscription activation and the optional GitHub online-upgrade token remain external owner actions.

## Delivered

- [x] Pushed responsive Demo parity in commit `b7cc135451cc19fad7f85f542b98c73aeafa7832`.
- [x] Pushed the Wrangler R2/Queue discovery repair in commit `b65bef258e3964af3ed796a51a59f10989c12246`.
- [x] Completed the isolated manual deployment in GitHub Actions run `29536944045`.
- [x] Deployed D1 migrations, deterministic synthetic data, the Worker, and the Admin Pages project.
- [x] Verified all 17 Admin routes load without application errors after their API data resolves.
- [x] Verified 5 links, 84 visits, 3 redirect rules, 2 import jobs, 2 API tokens, 2 backup records, health samples, Analytics samples, and audit history.
- [x] Verified the 390x844 layout has a 390px document/main width, no horizontal overflow, and a drawer containing all routes.
- [x] Verified a live create attempt is rejected with `ApiError: The public Linketry Demo is read-only.`
- [x] Verified Setup reports 5 successful core checks, 0 failures, and Linketry version `0.25.1` for the deployed runtime.

## Current Cloudflare State

- D1, KV, Queue, Worker, Pages, the `workers.dev` API hostname, and `demo.linketry.com` are live in the isolated Demo account.
- The exposed old Demo API token was revoked/replaced and the protected GitHub environment secret was updated.
- The replacement token passes account, D1, KV, Queue, Worker, and Pages checks, but the isolated account returns Cloudflare R2 error `10042` before bucket inventory.
- The successful core rollout therefore omitted only R2 bindings and synthetic R2 artifact uploads; the two R2 environment variables are temporarily unset.
- `demoapi.linketry.com` is active through a DNS-only CNAME to `linketry-demo-api.pages.dev`; the Demo Admin uses it as the public API origin.
- `https://linketry-demo-worker.tuomeixi.workers.dev` remains the isolated Worker origin, sample-redirect hostname, and fallback.
- v0.26.5 Demo run `29641004812` deployed `linketry-demo-api`, passed its gateway parity gate and the full Demo parity gate, and registered the custom domain in `initializing` status.
- v0.26.5 production run `29641004768` deployed the synchronized production Worker, Admin, and project site successfully.
- DNS cutover run `29646559998` passed the safety gate but stopped before every Cloudflare write because Wrangler's JSON project inventory uses `Project Name`; v0.26.6 corrects the repeat-deployment lookup.
- v0.26.6 Demo run `29647646987` reused the existing API Pages project, confirmed the custom domain active, and passed both 18-read-API parity gates plus the `403` write boundary.
- v0.26.6 production run `29647646808` completed successfully; production and Demo API/Admin surfaces all report v0.26.6.
- Guarded v0.26.4 R2 recheck run `29639154619` still returned account-level code `10042`; all mutation and deployment steps were skipped and both R2 variables were removed again.
- `demoapi.linketry.com` is the preferred public API name because `linketry.com` is the project site and Demo namespace, while production uses `admin.uukk.de` and `go.uukk.de`.
- Direct cross-account CNAME routing to `workers.dev` is not used. v0.26.5 implements a Pages Function in the Demo account with a Service Binding to `linketry-demo-worker`; the `linketry.com` zone supplies only the public CNAME.

## Follow-up

- [x] Revoke/replace the old Demo API token because it was shared in conversation history.
- [x] Replace `LINKETRY_DEMO_CLOUDFLARE_API_TOKEN` in the protected `linketry-demo` GitHub environment.
- [x] Verify account identity, D1, KV, Queue, Worker, Pages, and guarded core deployment run `29600589228`.
- [ ] Enable R2 API access in the exact isolated account so `wrangler r2 bucket list` no longer returns `10042`.
- [ ] Restore the two R2 environment variables, approve the exact release/commit/digest, and rerun the isolated Demo workflow.
- [ ] Verify R2 backup downloads and report downloads after the successful R2 rollout.
- [x] Implement the Demo-account Pages API gateway, isolated deployment gates, domain-registration helper, and local regression coverage.
- [x] Deploy the API gateway and verify `https://linketry-demo-api.pages.dev` in Demo run `29641004812`.
- [x] Add DNS-only CNAME `demoapi` to `linketry-demo-api.pages.dev` and verify the Pages custom domain is active.
- [x] Switch `LINKETRY_DEMO_API_URL` to `https://demoapi.linketry.com`, redeploy the Admin, and retain the Worker origin variable as fallback.

## Safety Boundary

- Production Cloudflare resources, credentials, DNS, data, deployment workflow, and redirect behavior were not modified.
- The Demo remains synthetic-only, public-read-only, rate-limited, and isolated from the protected production account.
- R2 and Queue provisioning remains behind the fail-closed Demo deployment gate.
- Cloudflare's [R2 getting-started guide](https://developers.cloudflare.com/r2/get-started/) requires an R2 subscription; activate it from **Storage & databases → R2 → Overview** in the isolated account before retrying.
- Cloudflare Pages supports [custom subdomains through CNAME](https://developers.cloudflare.com/pages/configuration/custom-domains/) without moving the parent zone into the Demo account.
- Pages Functions support [Service Bindings](https://developers.cloudflare.com/pages/functions/bindings/#service-bindings), so requests can invoke the Demo Worker without exposing or duplicating its D1/KV/Queue bindings.
