# Backup And Restore

Linkora currently supports manual exports and pre-import backup downloads.

## Available Exports

| Endpoint | Contents |
|----------|----------|
| `GET /api/export/links.csv` | Link records as CSV |
| `GET /api/export/links.json` | Link records as JSON |
| `GET /api/export/visits.csv` | Visit records as CSV |
| `GET /api/export/backup.json` | Links, tags, and settings |

All export endpoints require `Authorization: Bearer <ADMIN_TOKEN>`.

## Admin Exports

Open Admin, then Import / Export, then use the download buttons.

Before confirming an import, Admin downloads a file named like:

```txt
linkora-pre-import-backup-YYYY-MM-DD-HHMMSS.json
```

The import only proceeds after that backup download request succeeds.

## Backup Format

```json
{
  "name": "Linkora Backup",
  "version": "0.1.0",
  "exportedAt": "2026-07-01T00:00:00.000Z",
  "links": [],
  "tags": [],
  "settings": {}
}
```

## Restore Status

Full `backup.json` restore import is not implemented yet. It is tracked in the V2 backlog.

Until restore is implemented, keep exported backups and use D1 backup/restore tooling for disaster recovery.

