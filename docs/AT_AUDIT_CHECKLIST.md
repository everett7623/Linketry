# Assistive Technology Audit Checklist

Updated: 2026-08-07

Manual AT review gate for Pre-1.0 / public 1.0. Complete this against Admin (desktop + mobile) and the official Demo when applicable. Record evidence in `PROGRESS.md`.

## Setup

- [ ] Keyboard-only pass on Chrome or Edge (no mouse)
- [ ] One screen-reader pass (NVDA, VoiceOver, or TalkBack)
- [ ] Viewports: 1440x900 desktop and ~390x844 mobile
- [ ] Locales: English and zh-CN for critical flows

## Critical flows

- [ ] Login / Demo preview grant: focus order, visible focus, error announcement
- [ ] First-run wizard: step focus, dismiss, skip, completion
- [ ] Overview empty state and primary CTA
- [ ] Create / edit link (including password and expiry fields when Advanced)
- [ ] Links table: row actions, bulk selection, pagination
- [ ] Analytics: chart/table alternatives, filters, keyboard reachability
- [ ] Settings sections / tabs: anchors, labels, danger-zone confirmations
- [ ] Version center / upgrade modal: focus trap, Escape, restore focus
- [ ] Mobile nav drawer: open/close, focus trap, skip-to-content target

## Component bar

- [ ] Skip-to-content link reaches `<main>`
- [ ] Icon-only buttons have accessible names
- [ ] Modals trap focus and restore on close
- [ ] Toasts are polite / do not steal focus
- [ ] Color contrast for text, badges, and status meets WCAG AA on default theme
- [ ] Reduced-motion preference does not break required feedback

## Pass criteria

All critical flows keyboard-reachable; no focus traps outside dialogs; screen reader announces page title / primary errors; mobile drawer usable without gesture-only controls.

## Status

- Evidence status: **pending** (checklist landed; manual AT pass not yet archived)
- Owner: release / Pre-1.0 validation
