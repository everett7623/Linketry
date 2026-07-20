# Data Scale Contract

Date: 2026-07-21
Target version: 0.28.2
Status: Completed

## Goal

Add repeatable large-data correctness and response-time gates for authenticated operational reads without changing redirect behavior, analytics ingestion, or the database schema.

## Planned

- [x] Make Links and Audit pagination deterministic when rows share the same timestamp or primary sort value.
- [x] Share strict positive-integer page and page-size normalization across both routes.
- [x] Add an in-memory SQLite scale profile for Links, Visits/Analytics, Audit, and Health History.
- [x] Publish conservative response-time budgets and dataset sizes in the executable test contract.
- [x] Run the complete repository regression and synchronize v0.28.2 release metadata.

## Verification

- [x] 72 deployment, 98 Worker, 58 Admin unit, 25 Admin browser, 6 Demo API, and 4 project-site tests pass.
- [x] Worker type-check and Admin/Site production builds pass.
- [x] Official npm registry audit reports zero known vulnerabilities.
- [x] The scale profile completes in under one second locally while enforcing much wider CI-safe budgets.

## Boundaries

- No redirect-handler changes.
- No visit-ingestion or conversion-semantics changes.
- No schema or migration changes.
- No production or Demo deployment.
