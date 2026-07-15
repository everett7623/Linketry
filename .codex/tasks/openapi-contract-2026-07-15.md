# Authenticated OpenAPI Contract - 2026-07-15

## Status

Completed in Linketry 0.10.1.

## Delivered

- [x] Inventory the canonical authenticated `/api/v1` endpoints.
- [x] Serve an OpenAPI 3.1 JSON document from `/api/v1/openapi.json`.
- [x] Serve an authenticated Swagger UI from `/api/v1/docs`.
- [x] Describe bearer authentication, read/write scope expectations, standard success/error envelopes, path parameters, and pagination metadata.
- [x] Keep tokens and secrets out of the contract and disable authorization persistence in Swagger UI.
- [x] Compare mounted Hono route declarations with the operation inventory in the Worker test suite.
- [x] Document the contract as the foundation for external clients.

## Safety

- Redirect behavior is unchanged.
- D1 and KV behavior is unchanged.
- The legacy `/api` alias does not expose the new contract or documentation endpoints.
