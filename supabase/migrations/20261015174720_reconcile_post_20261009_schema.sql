
-- Canonical reconciliation of SaveFlow schema changes applied out-of-band after 2026-10-09.
-- This migration is intentionally idempotent and converges to the current reviewed production schema.

-- pg_net belongs outside public. It is not relocatable, so only rebuild it when necessary.
do $$
declare
  v_schema text;
begin
  select n.nspname into v_schema
  from pg_extension e
  join pg_namespace n on n.oid=e.extnamespace
  where e.extname='pg_net';

  if v_schema is not null and v_schema <> 'extensions' then
    if exists (select 1 from net.http_request_queue limit 1) then
      raise exception 'Cannot relocate pg_net while request queue is not empty';
    end if;
    execute 'drop extension pg_net';
    execute 'create extension pg_net with schema extensions';
  end if;
end $$;

-- Manual-review tracking for anti-bot / personalized official sources.
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

-- Scanner/audit indexes.
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
create index if not exists change_log_actor_id_idx
  on public.change_log(actor_id);
create index if not exists global_content_items_updated_by_idx
  on public.global_content_items(updated_by);
create index if not exists global_matrix_overrides_updated_by_idx
  on public.global_matrix_overrides(updated_by);

-- Final scanner RLS.
drop policy if exists scanner_partner_index_admin_manage on public.scanner_partner_index;
create policy scanner_partner_index_admin_manage
on public.scanner_partner_index
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists scanner_sources_admin_select on public.scanner_sources;
drop policy if exists scanner_sources_admin_manage on public.scanner_sources;
create policy scanner_sources_admin_manage
on public.scanner_sources
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists scanner_matrix_index_admin_select on public.scanner_matrix_index;
drop policy if exists scanner_matrix_index_admin_manage on public.scanner_matrix_index;
create policy scanner_matrix_index_admin_manage
on public.scanner_matrix_index
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists scanner_candidates_admin_select on public.scanner_candidates;
create policy scanner_candidates_admin_select
on public.scanner_candidates
for select
to authenticated
using (private.is_admin());

drop policy if exists scanner_candidates_admin_update on public.scanner_candidates;
create policy scanner_candidates_admin_update
on public.scanner_candidates
for update
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists scanner_runs_admin_select on public.scanner_runs;
create policy scanner_runs_admin_select
on public.scanner_runs
for select
to authenticated
using (private.is_admin());

drop policy if exists scanner_snapshots_admin_select on public.scanner_snapshots;
create policy scanner_snapshots_admin_select
on public.scanner_snapshots
for select
to authenticated
using (private.is_admin());

-- Snapshot retention helper: service-role only.
create or replace function public.prune_scanner_snapshots(p_keep_per_source integer default 24)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer := 0;
begin
  if p_keep_per_source < 12 or p_keep_per_source > 120 then
    raise exception 'p_keep_per_source must be between 12 and 120';
  end if;

  with ranked as (
    select id,
           row_number() over (
             partition by source_id
             order by fetched_at desc, id desc
           ) as rn
    from public.scanner_snapshots
  ),
  deleted as (
    delete from public.scanner_snapshots s
    using ranked r
    where s.id=r.id
      and r.rn > p_keep_per_source
    returning s.id
  )
  select count(*) into v_deleted from deleted;

  return v_deleted;
end;
$$;
revoke all on function public.prune_scanner_snapshots(integer) from public, anon, authenticated;
grant execute on function public.prune_scanner_snapshots(integer) to service_role;

-- Final personal-data RLS and least-privilege grants.
drop policy if exists profiles_read_own_or_admin on public.profiles;
create policy profiles_read_own_or_admin
on public.profiles
for select
to authenticated
using ((id = (select auth.uid())) or private.is_admin());

drop policy if exists profiles_update_own_safe on public.profiles;
create policy profiles_update_own_safe
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists preferences_own_select on public.user_preferences;
create policy preferences_own_select
on public.user_preferences for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists preferences_own_insert on public.user_preferences;
create policy preferences_own_insert
on public.user_preferences for insert to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists preferences_own_update on public.user_preferences;
create policy preferences_own_update
on public.user_preferences for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists preferences_own_delete on public.user_preferences;
create policy preferences_own_delete
on public.user_preferences for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists user_matrix_own_select on public.user_matrix_overrides;
create policy user_matrix_own_select
on public.user_matrix_overrides for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists user_matrix_own_insert on public.user_matrix_overrides;
create policy user_matrix_own_insert
on public.user_matrix_overrides for insert to authenticated
with check (user_id = (select auth.uid()));
drop policy if exists user_matrix_own_update on public.user_matrix_overrides;
create policy user_matrix_own_update
on public.user_matrix_overrides for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists user_matrix_own_delete on public.user_matrix_overrides;
create policy user_matrix_own_delete
on public.user_matrix_overrides for delete to authenticated
using (user_id = (select auth.uid()));

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.user_preferences from public, anon, authenticated;
revoke all on table public.user_matrix_overrides from public, anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_preferences to authenticated;
grant select, insert, update, delete on table public.user_matrix_overrides to authenticated;

-- Final change-log access model.
drop policy if exists change_log_insert_user_or_admin on public.change_log;
create policy change_log_insert_user_or_admin
on public.change_log
for insert
to authenticated
with check (
  ((select auth.uid()) is not null)
  and actor_id = (select auth.uid())
  and (
    scope = 'user'
    or (scope = 'admin' and private.is_admin())
  )
);
drop policy if exists change_log_read_own_or_admin on public.change_log;
create policy change_log_read_own_or_admin
on public.change_log
for select
to authenticated
using ((actor_id = (select auth.uid())) or private.is_admin());

-- Safe global-state backups used by Admin Export/Import.
create table if not exists public.global_state_backups (
  id uuid primary key default gen_random_uuid(),
  label text,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint global_state_backups_snapshot_object
    check (jsonb_typeof(snapshot) = 'object')
);
alter table public.global_state_backups enable row level security;
revoke all on table public.global_state_backups from anon, authenticated;
grant select, insert, delete on table public.global_state_backups to authenticated;

drop policy if exists global_state_backups_admin_select on public.global_state_backups;
create policy global_state_backups_admin_select
on public.global_state_backups for select to authenticated
using (private.is_admin());
drop policy if exists global_state_backups_admin_delete on public.global_state_backups;
create policy global_state_backups_admin_delete
on public.global_state_backups for delete to authenticated
using (private.is_admin());
drop policy if exists global_state_backups_admin_insert on public.global_state_backups;
create policy global_state_backups_admin_insert
on public.global_state_backups for insert to authenticated
with check (private.is_admin() and created_by = (select auth.uid()));

create index if not exists global_state_backups_created_at_idx
  on public.global_state_backups(created_at desc);
create index if not exists global_state_backups_created_by_idx
  on public.global_state_backups(created_by);

create or replace function private.capture_saveflow_global_state()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'format', 'saveflow-global-v1',
    'version', 1,
    'generated_at', now(),
    'matrix_overrides',
      coalesce((
        select jsonb_agg(
          jsonb_build_object('cell_key',m.cell_key,'payload',m.payload)
          order by m.cell_key
        )
        from public.global_matrix_overrides m
      ), '[]'::jsonb),
    'content_items',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'block',c.block::text,
            'base_id',c.base_id,
            'payload',c.payload,
            'hidden',c.hidden,
            'source_url',c.source_url,
            'checked_at',c.checked_at
          )
          order by c.block::text,c.base_id
        )
        from public.global_content_items c
      ), '[]'::jsonb)
  );
$$;
revoke all on function private.capture_saveflow_global_state() from public, anon;
grant execute on function private.capture_saveflow_global_state() to authenticated;

create or replace function private.validate_saveflow_global_state(p_snapshot jsonb)
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_matrix jsonb;
  v_content jsonb;
begin
  if p_snapshot is null or jsonb_typeof(p_snapshot) <> 'object' then
    raise exception 'Invalid SaveFlow snapshot: root must be an object';
  end if;
  if coalesce(p_snapshot->>'format','') <> 'saveflow-global-v1'
     or coalesce((p_snapshot->>'version')::int,0) <> 1 then
    raise exception 'Unsupported SaveFlow snapshot format/version';
  end if;

  v_matrix := p_snapshot->'matrix_overrides';
  v_content := p_snapshot->'content_items';
  if jsonb_typeof(v_matrix) <> 'array' or jsonb_typeof(v_content) <> 'array' then
    raise exception 'Invalid SaveFlow snapshot: arrays are missing';
  end if;

  if exists (
    select 1 from jsonb_array_elements(v_matrix) x
    where jsonb_typeof(x) <> 'object'
       or coalesce(trim(x->>'cell_key'),'') = ''
       or jsonb_typeof(x->'payload') <> 'object'
  ) then raise exception 'Invalid matrix override entry'; end if;

  if (select count(*) from jsonb_array_elements(v_matrix))
     <> (select count(distinct x->>'cell_key') from jsonb_array_elements(v_matrix) x)
  then raise exception 'Duplicate matrix cell_key in snapshot'; end if;

  if exists (
    select 1 from jsonb_array_elements(v_content) x
    where jsonb_typeof(x) <> 'object'
       or coalesce(x->>'block','') not in ('partner','promo','bonus')
       or coalesce(trim(x->>'base_id'),'') = ''
       or jsonb_typeof(x->'payload') <> 'object'
       or (x ? 'hidden' and jsonb_typeof(x->'hidden') <> 'boolean')
  ) then raise exception 'Invalid global content entry'; end if;

  if (select count(*) from jsonb_array_elements(v_content))
     <> (
       select count(distinct concat_ws('|||',x->>'block',x->>'base_id'))
       from jsonb_array_elements(v_content) x
     )
  then raise exception 'Duplicate block/base_id in snapshot'; end if;
end;
$$;
revoke all on function private.validate_saveflow_global_state(jsonb) from public, anon;
grant execute on function private.validate_saveflow_global_state(jsonb) to authenticated;

create or replace function public.admin_export_global_state()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not private.is_admin() then raise exception 'Admin only'; end if;
  return private.capture_saveflow_global_state();
end;
$$;
revoke all on function public.admin_export_global_state() from public, anon;
grant execute on function public.admin_export_global_state() to authenticated;

create or replace function public.admin_create_global_backup(p_label text default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_actor uuid := auth.uid();
begin
  if not private.is_admin() then raise exception 'Admin only'; end if;
  insert into public.global_state_backups(label,snapshot,created_by)
  values (
    nullif(left(trim(coalesce(p_label,'')),160),''),
    private.capture_saveflow_global_state(),
    v_actor
  )
  returning id into v_id;
  return v_id;
end;
$$;
revoke all on function public.admin_create_global_backup(text) from public, anon;
grant execute on function public.admin_create_global_backup(text) to authenticated;

create or replace function public.admin_replace_global_state(
  p_snapshot jsonb,
  p_backup_label text default 'Автобекап перед імпортом'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_backup_id uuid;
  v_matrix_count int;
  v_content_count int;
begin
  if not private.is_admin() then raise exception 'Admin only'; end if;
  perform private.validate_saveflow_global_state(p_snapshot);

  insert into public.global_state_backups(label,snapshot,created_by)
  values (
    nullif(left(trim(coalesce(p_backup_label,'')),160),''),
    private.capture_saveflow_global_state(),
    v_actor
  )
  returning id into v_backup_id;

  delete from public.global_matrix_overrides;
  delete from public.global_content_items;

  insert into public.global_matrix_overrides(cell_key,payload,updated_by,updated_at)
  select x->>'cell_key',x->'payload',v_actor,now()
  from jsonb_array_elements(p_snapshot->'matrix_overrides') x;

  insert into public.global_content_items(
    block,base_id,payload,hidden,source_url,checked_at,updated_by,updated_at
  )
  select
    (x->>'block')::public.content_block,
    x->>'base_id',
    x->'payload',
    coalesce((x->>'hidden')::boolean,false),
    nullif(x->>'source_url',''),
    case when coalesce(x->>'checked_at','')='' then null
         else (x->>'checked_at')::timestamptz end,
    v_actor,
    now()
  from jsonb_array_elements(p_snapshot->'content_items') x;

  select count(*) into v_matrix_count from public.global_matrix_overrides;
  select count(*) into v_content_count from public.global_content_items;

  return jsonb_build_object(
    'ok',true,
    'backup_id',v_backup_id,
    'matrix_rows',v_matrix_count,
    'content_rows',v_content_count
  );
end;
$$;
revoke all on function public.admin_replace_global_state(jsonb,text) from public, anon;
grant execute on function public.admin_replace_global_state(jsonb,text) to authenticated;

create or replace function public.admin_restore_global_backup(p_backup_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_snapshot jsonb;
  v_result jsonb;
begin
  if not private.is_admin() then raise exception 'Admin only'; end if;
  select b.snapshot into v_snapshot
  from public.global_state_backups b
  where b.id=p_backup_id;
  if v_snapshot is null then raise exception 'Backup not found'; end if;

  v_result := public.admin_replace_global_state(
    v_snapshot,
    'Автобекап перед відновленням ' || p_backup_id::text
  );
  return v_result || jsonb_build_object('restored_backup_id',p_backup_id);
end;
$$;
revoke all on function public.admin_restore_global_backup(uuid) from public, anon;
grant execute on function public.admin_restore_global_backup(uuid) to authenticated;
