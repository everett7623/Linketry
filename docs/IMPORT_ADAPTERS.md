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

| Adapter | File | Formats |
|---------|------|---------|
| Shlink | `apps/worker/src/importers/shlink.ts` | JSON, JSONL, CSV |
| Generic CSV | `apps/worker/src/importers/generic.ts` | CSV |
| Generic JSON | `apps/worker/src/importers/generic.ts` | JSON |

Adapters are registered in `apps/worker/src/routes/importRoutes.ts`.

## Adding an Adapter

1. Create `apps/worker/src/importers/<source>.ts`.
2. Normalize input into `NormalizedImportItem`.
3. Validate URL and slug safety.
4. Register the adapter in `importRoutes.ts`.
5. Add source selection in `apps/admin/src/pages/ImportExport.tsx`.
6. Add tests or at least local preview/confirm smoke checks.

## V1 Rules

- Slug conflicts use `skip`.
- Do not overwrite existing links.
- Do not make KV the source of truth.
- Import confirmation writes links through `src/db/index.ts`.
- Imported active links are cached after D1 writes succeed.

## Future Adapters

V2 backlog includes Sink, YOURLS, and Dub adapters plus rename/overwrite conflict modes.

