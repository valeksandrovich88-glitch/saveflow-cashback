begin;

drop policy if exists scanner_partner_index_admin_manage on public.scanner_partner_index;
create policy scanner_partner_index_admin_manage
on public.scanner_partner_index
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists scanner_sources_admin_select on public.scanner_sources;
drop policy if exists scanner_matrix_index_admin_select on public.scanner_matrix_index;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.scanner_sources'::regclass
      and conname='scanner_sources_manual_reviewed_by_fkey'
  ) then
    alter table public.scanner_sources
      add constraint scanner_sources_manual_reviewed_by_fkey
      foreign key (manual_reviewed_by)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

create index if not exists scanner_sources_manual_reviewed_by_idx
  on public.scanner_sources(manual_reviewed_by);

create index if not exists scanner_candidates_run_id_idx
  on public.scanner_candidates(run_id);

create index if not exists scanner_candidates_source_id_idx
  on public.scanner_candidates(source_id);

create index if not exists scanner_candidates_reviewed_by_idx
  on public.scanner_candidates(reviewed_by);

create index if not exists scanner_runs_triggered_by_idx
  on public.scanner_runs(triggered_by);

create index if not exists scanner_snapshots_run_id_idx
  on public.scanner_snapshots(run_id);

commit;
