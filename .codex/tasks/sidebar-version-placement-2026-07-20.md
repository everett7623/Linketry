# Sidebar Version Placement

Date: 2026-07-20
Version: 0.27.4
Status: Complete

## Goal

Move the version and update-status control directly below the Linketry Logo so it no longer interrupts the preference and logout controls in the Sidebar footer.

## Work

- [x] Group the Logo and version status into one Sidebar header region.
- [x] Remove version status from the Sidebar footer.
- [x] Preserve update checks, notifications, collapsed navigation, and the mobile drawer.
- [x] Add desktop, collapsed, and mobile placement assertions.
- [x] Pass the Admin production build, 4 targeted layout tests, 48 Admin unit tests, and all 21 Admin browser tests.

## Safety Boundary

- Version discovery and online-upgrade behavior are unchanged.
- Locale, theme, support, interface mode, Demo state, and logout handlers are unchanged.
- Redirects, analytics, D1, KV, migrations, deployment gates, and production data are unchanged.
