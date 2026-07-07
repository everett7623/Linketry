# Shlink Import

Linkora supports Shlink JSON, JSONL, and CSV imports through the Admin Import / Export page.

## Flow

1. Export links from Shlink.
2. Open Linkora Admin.
3. Go to Import / Export.
4. Upload the Shlink file.
5. Select `Shlink` or leave source as auto-detect.
6. Click Preview.
7. Review valid, conflicting, and invalid rows.
8. Click Import.

Before the import mutates data, Admin downloads a pre-import `backup.json` snapshot.

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

