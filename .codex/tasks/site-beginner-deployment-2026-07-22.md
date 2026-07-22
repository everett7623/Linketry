# Beginner-Friendly Site Deployment Paths

Date: 2026-07-22
Target release: 0.29.6
Status: Complete

## Goal

Make the Linketry project site easier for first-time self-hosters by presenting two honest deployment paths: an AI-assisted path for beginners and the existing guarded command-line path for operators.

## Scope

- Keep the existing Linketry visual identity and static Vite architecture.
- Surface Demo, AI-assisted deployment, and GitHub actions clearly from the hero.
- Replace the single dense deployment sequence with two selectable routes.
- Explain the minimum Cloudflare profile and the dry-run-before-write safety model.
- Provide a copyable AI deployment prompt that never asks users to paste secrets into chat or source files.
- Keep advanced R2, Queue, branded Admin DNS, upgrades, redirects, and runtime behavior out of the beginner flow.

## Checklist

- [x] Review the current Linketry site and EdgeEver reference structure.
- [x] Implement the two deployment routes and beginner reassurance points.
- [x] Add accessible copy feedback and responsive styling.
- [x] Replace the primary-navigation GitHub text control with an accessible icon.
- [x] Update site contract coverage and release metadata.
- [x] Run formatting, site tests, and the production build.
- [x] Review the final diff for deployment-contract accuracy.

## Safety Boundaries

- No Worker, redirect, API, D1, KV, migration, or Admin runtime changes.
- No one-click or permanently-free claim.
- No credentials in prompts, commands, HTML, tests, or committed files.
- Every mutating deployment step remains behind the existing dry-run, confirmation, and workflow gates.
