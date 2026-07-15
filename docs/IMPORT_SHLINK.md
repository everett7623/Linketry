# Shlink Import

Linketry supports Shlink JSON, JSONL, CSV, and authenticated Shlink API pull imports through the Admin Import / Export page.

## Flow

1. Export links from Shlink, or prepare a temporary Shlink API key.
2. Open Linketry Admin.
3. Go to Import / Export.
4. Upload the Shlink file, or enter the Shlink URL and API key and click `Fetch Shlink`.
5. Select `Shlink` or leave source as auto-detect when uploading a file.
6. Click Preview.
7. Review valid, conflicting, and invalid rows.
8. Click Import.

Before the import mutates data, Admin downloads a pre-import `backup.json` snapshot.
Shlink API keys are used only for the fetch request and are not stored by Linketry.

## Field Mapping

| Shlink field | Linketry field |
|--------------|---------------|
| `shortCode` | `slug` |
| `shortUrl` | `short_url` |
| `shortUrl` hostname | `domain` |
| `longUrl` | `long_url` |
| `title` | `title` |
| `tags` | `tags` |
| `dateCreated` | `created_at` |
| `visitsSummary.total` | `clicks` |

## Conflict Policy

V1 conflict handling is intentionally conservative:

- Existing slugs are skipped.
- Existing links are never overwritten silently.
- The original Shlink `shortCode` is preserved when imported.
- The original Shlink short domain is preserved from `shortUrl`, for example `https://s.y8o.de/example` imports as domain `s.y8o.de`.
- Import jobs keep a CSV report that can be downloaded from Import History.

## Domain Cutover Note

For a full Shlink-to-Linketry cutover, import from the Shlink API or export file before moving DNS. After import, the stored Linketry domain should match the legacy short domain, such as `s.y8o.de`. Only switch Cloudflare DNS or Worker custom domain after spot-checking imported links in Linketry.

## Validation

Imported URLs must use `http://` or `https://`. Slugs must use only letters, numbers, hyphen, or underscore, and reserved paths such as `api`, `admin`, and `health` are rejected.
