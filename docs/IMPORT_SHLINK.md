# Shlink Import

Linkora supports Shlink JSON, JSONL, CSV, and authenticated Shlink API pull imports through the Admin Import / Export page.

## Flow

1. Export links from Shlink, or prepare a temporary Shlink API key.
2. Open Linkora Admin.
3. Go to Import / Export.
4. Upload the Shlink file, or enter the Shlink URL and API key and click `Fetch Shlink`.
5. Select `Shlink` or leave source as auto-detect when uploading a file.
6. Click Preview.
7. Review valid, conflicting, and invalid rows.
8. Click Import.

Before the import mutates data, Admin downloads a pre-import `backup.json` snapshot.
Shlink API keys are used only for the fetch request and are not stored by Linkora.

## Field Mapping

| Shlink field | Linkora field |
|--------------|---------------|
| `shortCode` | `slug` |
| `shortUrl` | `short_url` |
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
- Import jobs keep a CSV report that can be downloaded from Import History.

## Validation

Imported URLs must use `http://` or `https://`. Slugs must use only letters, numbers, hyphen, or underscore, and reserved paths such as `api`, `admin`, and `health` are rejected.
