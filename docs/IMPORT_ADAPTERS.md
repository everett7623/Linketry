# Import Adapters

Importers live in `apps/worker/src/importers/` and implement the shared `ImportAdapter` interface.

```ts
export interface ImportAdapter {
  source: string;
  detect(input: unknown): boolean;
  parse(input: unknown): Promise<NormalizedImportItem[]>;
  validate(item: NormalizedImportItem): ImportValidationResult;
}
```

## Current Adapters

| Adapter         | File                                     | Formats                                           |
| --------------- | ---------------------------------------- | ------------------------------------------------- |
| Shlink          | `apps/worker/src/importers/shlink.ts`    | JSON, JSONL, CSV, API pull                        |
| Bitly           | `apps/worker/src/importers/mainstream.ts` | CSV                                              |
| Short.io        | `apps/worker/src/importers/mainstream.ts` | CSV                                              |
| Sink            | `apps/worker/src/importers/platforms.ts` | JSON, JSONL                                       |
| YOURLS          | `apps/worker/src/importers/platforms.ts` | JSON, JSONL                                       |
| Dub             | `apps/worker/src/importers/platforms.ts` | JSON, JSONL                                       |
| Linketry backup | `apps/worker/src/importers/platforms.ts` | `backup.json`                                     |
| Generic CSV     | `apps/worker/src/importers/generic.ts`   | CSV                                               |
| Generic JSON    | `apps/worker/src/importers/generic.ts`   | JSON, JSONL-style newline objects, wrapped arrays |

Adapters are registered in `apps/worker/src/routes/importRoutes.ts`.

## Generic Field Mapping

Generic CSV and JSON import can accept a `fieldMapping` object in preview and confirm requests. Mapping keys use `NormalizedImportItem` fields such as `slug`, `longUrl`, `title`, `tags`, `createdAt`, `expiresAt`, and `maxClicks`; values are source column or property names.

Example:

```json
{
  "slug": "Code",
  "longUrl": "Destination",
  "title": "Name",
  "tags": "Labels"
}
```

The generic adapter still falls back to built-in aliases such as `code`, `alias`, `destination`, `url`, `labels`, and `categories`.

## Bitly And Short.io Contracts

The v0.28.0 adapters use the current official export contracts and conservative header detection before the Generic CSV fallback.

- Bitly preserves the selected short URL, custom domain, case-sensitive back-half, destination, title, creation date, engagement total, and source link. Documented `Active` rows remain active; documented `Deleted` rows import archived and unavailable.
- Short.io preserves its ID string, short URL and domain, original path, destination, title, click total, created/updated timestamps, expiry, and tags. The creator column is recognized during parsing but is not persisted or mapped to a Linketry ownership concept.
- Both fixtures use reserved example domains and synthetic identifiers. They cover empty optional fields, quoted commas and quotes, multiline values, custom domains, and malformed rows.
- Auto-detection requires several platform-specific headers. Partial or unrelated files continue to the Generic adapter instead of being claimed by a named source.

The representative fixtures live in `apps/worker/src/importers/fixtures/`. A redacted real-account export should be added when available to detect future provider-side header drift without introducing private data.

## Candidate Adapters

Rebrandly follows as a JSON/API target only after its pagination and payload are verified against a redacted response.

| Candidate | Status                   | Requirement before implementation                                         |
| --------- | ------------------------ | ------------------------------------------------------------------------- |
| Rebrandly | Planned phase 2          | Redacted JSON/API fixture plus verified pagination and credential handling |
| Kutt      | Fixture-gated            | Current official export or API payload contract                           |
| TinyURL   | Deferred to Generic      | Current official export contract and representative account export       |
| BL.INK    | Deferred to Generic      | Current official export contract and representative account export       |
| Cuttly    | Deferred to Generic      | Current official export contract and representative account export       |

Do not infer another production field contract from an old planning table or a platform name. Before implementation, collect representative current exports, record format/version details, confirm how custom domains and click totals are represented, and define fixtures that contain no credentials or personal data.

Prioritize adapters based on user migration demand and maintainability. A platform-specific adapter should provide more reliable normalization than the Generic importer; otherwise, document a Generic field mapping instead.

The detailed acceptance checklist is tracked in `.codex/tasks/mainstream-import-adapters-2026-07-20.md`.

## Adding an Adapter

1. Create `apps/worker/src/importers/<source>.ts`.
2. Normalize input into `NormalizedImportItem`.
3. Validate URL and slug safety.
4. Register the adapter in `importRoutes.ts`.
5. Add source selection in `apps/admin/src/pages/ImportExport.tsx`.
6. Add tests or at least local preview/confirm smoke checks.

Adapter acceptance also requires:

- representative redacted fixtures;
- detection that does not claim unrelated Generic payloads;
- preview counts for valid, conflict, and invalid rows;
- skip, rename, and overwrite coverage;
- preservation of source slug and short domain when the source provides them;
- bounded asynchronous confirmation for large files;
- downloadable failure reporting.

## Operating Envelope

- Import content is limited to 10 MiB measured as UTF-8 bytes.
- One preview or confirmation job can normalize at most 50,000 items.
- Shlink API pull has a lower 5,000-item and 100-page operating limit because it performs sequential external requests. It reports an explicit error instead of silently truncating a larger pagination result; use reviewed file-import batches for larger migrations.
- Admin rejects oversized files before reading them; Worker preview and confirm enforce the same shared content contract independently.
- Confirmation remains asynchronous and uses 25-link D1 batches, but inputs beyond the documented envelope fail before link writes.
- These are safety limits, not a claim that every 50,000-item dataset meets a production response-time budget; representative D1 scale benchmarks remain pre-1.0 work.

## Conflict Rules

- Default slug conflict strategy is `skip`.
- `rename` appends a suffix to conflicting slugs.
- `overwrite` updates existing links and should be used only after reviewing the pre-import backup.
- Do not overwrite existing links unless the user explicitly selects `overwrite`.
- Do not make KV the source of truth.
- Import confirmation writes links through `src/db/index.ts`.
- Imported active links are cached after D1 writes succeed.
