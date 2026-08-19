# Assistive Technology Audit Checklist

Updated: 2026-08-19

Manual AT review gate for Pre-1.0 / public 1.0. Complete this against Admin (desktop + mobile) and the official Demo when applicable. Record evidence in `PROGRESS.md`.

## Setup

- [x] Keyboard-only pass on Chrome or Edge (no mouse) — Playwright `apps/admin/tests/at-audit.spec.ts` plus existing modal, drawer, and i18n smoke coverage (v0.31.3)
- [ ] One screen-reader pass (NVDA, VoiceOver, or TalkBack)
- [x] Viewports: 1440x900 desktop and ~390x844 mobile — `responsive-layout.spec.ts`, analytics refresh, version-center mobile
- [x] Locales: English and zh-CN for critical flows — `i18n-smoke.spec.ts` plus login locale switch in `at-audit.spec.ts`

## Critical flows

- [x] Login / Demo preview grant: focus order, visible focus, error announcement — login token autofocus, invalid-token `role="alert"` / `aria-live="assertive"`, toast does not steal focus
- [x] First-run wizard: step focus, dismiss, skip, completion — `/setup` wizard next-step link is keyboard-reachable; wizard has no separate dismiss control (it is a setup page, not a modal)
- [x] Overview empty state and primary CTA — empty heading plus Create link CTA is keyboard-reachable
- [x] Create / edit link (including password and expiry fields when Advanced) — `i18n-smoke.spec.ts`
- [x] Links table: row actions, bulk selection, pagination — `i18n-smoke.spec.ts` table and migration dialog Tab trap
- [x] Analytics: chart/table alternatives, filters, keyboard reachability — `analytics-refresh.spec.ts` with Axe
- [x] Settings sections / tabs: anchors, labels, danger-zone confirmations — `i18n-smoke.spec.ts`
- [x] Version center / upgrade modal: focus trap, Escape, restore focus — `at-audit.spec.ts` and `sidebar-utility-actions.spec.ts`
- [x] Mobile nav drawer: open/close, focus trap, skip-to-content target — `responsive-layout.spec.ts`; skip-to-content in `at-audit.spec.ts`

## Component bar

- [x] Skip-to-content link reaches `<main>`
- [x] Icon-only buttons have accessible names — version status, theme, navigation, short-link open/copy
- [x] Modals trap focus and restore on close
- [x] Toasts are polite / do not steal focus — success toasts `polite`; error toasts `assertive`; dismiss control is not auto-focused
- [x] Color contrast for text, badges, and status meets WCAG AA on default theme — light-theme CSS assertions plus Axe serious/critical
- [x] Reduced-motion preference does not break required feedback — `responsive-layout.spec.ts`

## Pass criteria

All critical flows keyboard-reachable; no focus traps outside dialogs; screen reader announces page title / primary errors; mobile drawer usable without gesture-only controls.

## Status

- Evidence status: **keyboard/axe archived in v0.31.3**; **screen-reader pass still pending**
- Owner: release / Pre-1.0 validation
- Playwright evidence: `apps/admin/tests/at-audit.spec.ts` (4 tests, 2026-08-19)
