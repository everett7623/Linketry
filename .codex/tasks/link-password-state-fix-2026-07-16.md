# Link Password State Fix — 2026-07-16

## Objective

Ensure new links have no password by default and that removing an existing password immediately clears the protected state.

## Completed

- [x] Mark Create/Edit password fields as new-password inputs to prevent credential autofill.
- [x] Preserve an untouched existing password while treating edit-then-empty as an explicit clear.
- [x] Keep the existing explicit clear control.
- [x] Disable caching for Admin GET requests and Worker JSON responses.
- [x] Add unit, response-header, and browser regression coverage.
