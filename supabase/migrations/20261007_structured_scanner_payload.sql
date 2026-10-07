alter table public.scanner_snapshots
  add column if not exists parser_version integer,
  add column if not exists structured_payload jsonb not null default '{}'::jsonb;

alter table public.scanner_candidates
  add column if not exists parser_version integer,
  add column if not exists structured_payload jsonb not null default '{}'::jsonb;

comment on column public.scanner_snapshots.structured_payload is
  'Structured parser output for review only. Never auto-published.';

comment on column public.scanner_candidates.structured_payload is
  'Structured extraction copied from the changed snapshot for manual review; never auto-published.';
