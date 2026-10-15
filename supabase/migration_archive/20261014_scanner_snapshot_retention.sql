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
