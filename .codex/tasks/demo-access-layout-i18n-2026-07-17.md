# Linketry Demo Access, Layout, And Language Roadmap - 2026-07-17

## Goal

Record the long-term language expansion plan, settle the public Demo access boundary, and improve Admin workspace utilization without changing redirect behavior.

## Tasks

- [x] Audit the current Demo authentication, Cloudflare resource permissions, Sidebar, and content-width behavior.
- [x] Record the staged language roadmap and translation quality requirements.
- [x] Document the visitor-visible Demo preview code and the minimum Cloudflare permissions it needs.
- [x] Add a persistent desktop Sidebar collapse control while preserving the mobile drawer.
- [x] Use available desktop width more effectively without making dense operational views hard to scan.
- [x] Synchronize release metadata, changelog, progress, and task status.
- [x] Run unit, browser, build, formatting, and responsive layout regression checks.

## Safety Boundary

- Redirect routing, D1 link records, KV cache behavior, and production domains are outside this task.
- Demo credentials must not grant production access or expose a privileged secret in browser code.
- Cloudflare permissions remain isolated to Demo resources and use the minimum account scopes required by the deployed bindings.
