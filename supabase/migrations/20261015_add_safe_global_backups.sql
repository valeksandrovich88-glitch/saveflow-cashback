-- Safe global admin export/import with automatic server-side backups.
-- Import/restore is atomic because it runs inside a single PostgreSQL function call.

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
grant select, delete on table public.global_state_backups to authenticated;

drop policy if exists global_state_backups_admin_select on public.global_state_backups;
create policy global_state_backups_admin_select
on public.global_state_backups
for select
to authenticated
using (private.is_admin());

drop policy if exists global_state_backups_admin_delete on public.global_state_backups;
create policy global_state_backups_admin_delete
on public.global_state_backups
for delete
to authenticated
using (private.is_admin());

create index if not exists global_state_backups_created_at_idx
  on public.global_state_backups(created_at desc);

create or replace function private.capture_saveflow_global_state()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'format', 'saveflow-global-v1',
    'version', 1,
    'generated_at', now(),
    'matrix_overrides',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'cell_key', m.cell_key,
            'payload', m.payload
          )
          order by m.cell_key
        )
        from public.global_matrix_overrides m
      ), '[]'::jsonb),
    'content_items',
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'block', c.block::text,
            'base_id', c.base_id,
            'payload', c.payload,
            'hidden', c.hidden,
            'source_url', c.source_url,
            'checked_at', c.checked_at
          )
          order by c.block::text, c.base_id
        )
        from public.global_content_items c
      ), '[]'::jsonb)
  );
$$;

revoke all on function private.capture_saveflow_global_state() from public, anon, authenticated;

create or replace function private.validate_saveflow_global_state(p_snapshot jsonb)
returns void
language plpgsql
stable
security definer
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
    select 1
    from jsonb_array_elements(v_matrix) x
    where jsonb_typeof(x) <> 'object'
       or coalesce(trim(x->>'cell_key'),'') = ''
       or jsonb_typeof(x->'payload') <> 'object'
  ) then
    raise exception 'Invalid matrix override entry';
  end if;

  if (
    select count(*) from jsonb_array_elements(v_matrix)
  ) <> (
    select count(distinct x->>'cell_key') from jsonb_array_elements(v_matrix) x
  ) then
    raise exception 'Duplicate matrix cell_key in snapshot';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_content) x
    where jsonb_typeof(x) <> 'object'
       or coalesce(x->>'block','') not in ('partner','promo','bonus')
       or coalesce(trim(x->>'base_id'),'') = ''
       or jsonb_typeof(x->'payload') <> 'object'
       or (
         x ? 'hidden'
         and jsonb_typeof(x->'hidden') <> 'boolean'
       )
  ) then
    raise exception 'Invalid global content entry';
  end if;

  if (
    select count(*) from jsonb_array_elements(v_content)
  ) <> (
    select count(distinct concat_ws('|||',x->>'block',x->>'base_id'))
    from jsonb_array_elements(v_content) x
  ) then
    raise exception 'Duplicate block/base_id in snapshot';
  end if;
end;
$$;

revoke all on function private.validate_saveflow_global_state(jsonb) from public, anon, authenticated;

create or replace function public.admin_export_global_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Admin only';
  end if;
  return private.capture_saveflow_global_state();
end;
$$;

revoke all on function public.admin_export_global_state() from public, anon;
grant execute on function public.admin_export_global_state() to authenticated;

create or replace function public.admin_create_global_backup(p_label text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_actor uuid := auth.uid();
begin
  if not private.is_admin() then
    raise exception 'Admin only';
  end if;

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
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_backup_id uuid;
  v_matrix_count int;
  v_content_count int;
begin
  if not private.is_admin() then
    raise exception 'Admin only';
  end if;

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
  select
    x->>'cell_key',
    x->'payload',
    v_actor,
    now()
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
    case
      when coalesce(x->>'checked_at','') = '' then null
      else (x->>'checked_at')::timestamptz
    end,
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
security definer
set search_path = ''
as $$
declare
  v_snapshot jsonb;
  v_result jsonb;
begin
  if not private.is_admin() then
    raise exception 'Admin only';
  end if;

  select b.snapshot into v_snapshot
  from public.global_state_backups b
  where b.id = p_backup_id;

  if v_snapshot is null then
    raise exception 'Backup not found';
  end if;

  v_result := public.admin_replace_global_state(
    v_snapshot,
    'Автобекап перед відновленням ' || p_backup_id::text
  );

  return v_result || jsonb_build_object('restored_backup_id',p_backup_id);
end;
$$;

revoke all on function public.admin_restore_global_backup(uuid) from public, anon;
grant execute on function public.admin_restore_global_backup(uuid) to authenticated;
