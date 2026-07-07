# Migration From Shlink

This is the cutover process for moving from Shlink to Linkora.

## Safe Migration Plan

1. Keep Shlink running.
2. Export all short URLs from Shlink.
3. Deploy Linkora to the test short-link domain, currently `go.y8o.de`.
4. Import Shlink data into Linkora.
5. Verify the import report.
6. Spot-check 30 to 50 old slugs.
7. Test high-traffic slugs.
8. Run Linkora in parallel for 1 to 2 weeks.
9. Back up Shlink.
10. Cut `s.y8o.de` DNS or Cloudflare routing over to Linkora.
11. Keep Shlink available for rollback for 1 to 2 weeks.

## Rollback

If Linkora has a production issue after cutover, point `s.y8o.de` back to Shlink immediately.

## Current Status

The production migration checklist is tracked in [../CUTOVER_S_Y8O_DE.md](../CUTOVER_S_Y8O_DE.md).

Outstanding operational tasks:

- Revoke or rotate the Shlink API key used during migration.
- Cut over `s.y8o.de` when ready.

