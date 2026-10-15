# SaveFlow migration archive

These SQL files document out-of-band changes made while SaveFlow was being stabilized.

Do **not** run them as active migrations: several share non-unique date-only prefixes and some represent intermediate states that were superseded later.

The reviewed production schema after 2026-10-09 is reconciled by:

- `supabase/migrations/20261015174720_reconcile_post_20261009_schema.sql`

The Supabase remote migration history is authoritative for earlier migrations.
