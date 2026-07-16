# Privacy-Safe Traffic Anomaly Alerts - 2026-07-16

## Status

Completed in v0.22.0.

## Scope

- [x] Run an opt-in bounded aggregate check from the daily Cron.
- [x] Compare the latest 24 hours with the preceding 7-day daily baseline.
- [x] Require a configurable minimum visit count before evaluating either signal.
- [x] Detect explainable visit-volume and bot-rate spikes.
- [x] Suppress repeated active alerts and emit recovery notices.
- [x] Deliver through existing configured notification channels.
- [x] Add authenticated status, configuration, and manual-run endpoints.
- [x] Add EN/ZH Analytics controls and real-browser coverage.
- [x] Publish the API operations and self-hosting guidance.

## Privacy And Stability Boundary

- The detector stores only aggregate counts, rates, time windows, and bounded alert state.
- It does not add visitor, IP, session, referrer, or country identifiers.
- All D1 reads and notification delivery run from the daily Cron or an authenticated manual action.
- Redirect handling, redirect rules, link mutation behavior, D1 link ownership, KV cache keys, and bindings are unchanged.
- Low-volume windows are marked insufficient rather than producing alerts.

## Verification

- Worker type-check and 69 Worker tests passed, including policy, notification privacy, threshold precision, and OpenAPI inventory coverage.
- 35 Admin unit tests and 13 Playwright browser tests passed, including the traffic-alert configuration/manual-check workflow.
- 35 deployment safety tests and 3 project-site tests passed.
- Admin and project-site production builds passed.
