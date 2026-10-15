alter table public.scanner_sources
  add column if not exists manual_reviewed_at timestamptz,
  add column if not exists manual_reviewed_by uuid,
  add column if not exists manual_review_interval_days integer not null default 35,
  add column if not exists manual_review_note text;

alter table public.scanner_sources
  drop constraint if exists scanner_sources_manual_review_interval_days_check;

alter table public.scanner_sources
  add constraint scanner_sources_manual_review_interval_days_check
  check (manual_review_interval_days between 7 and 365);

with good as (
  select source_id,max(fetched_at) last_good
  from public.scanner_snapshots
  where error is null
    and coalesce(http_status,0) between 200 and 299
    and coalesce((structured_payload->>'unsupported')::boolean,false)=false
  group by source_id
)
update public.scanner_sources s
set manual_reviewed_at=g.last_good,
    manual_review_note='Initial manual-review baseline migrated from latest successful official snapshot.',
    updated_at=now()
from good g
where s.id=g.source_id
  and s.publish_policy='manual_only'
  and s.manual_reviewed_at is null;

update public.scanner_sources
set manual_reviewed_at=now(),
    manual_review_note='Verified against the official public page during scanner anti-bot cleanup on 2026-10-14.',
    updated_at=now()
where id in (
  'pivdenny-karpaty-visa-2026',
  'pivdenny-promos',
  'pivdenny-uklon-2026',
  'oschad-mastercard-subscriptions-2026'
)
and publish_policy='manual_only'
and manual_reviewed_at is null;
