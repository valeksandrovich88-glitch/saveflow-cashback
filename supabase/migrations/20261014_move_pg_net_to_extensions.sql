begin;

do $$
begin
  if (select count(*) from net.http_request_queue) <> 0 then
    raise exception 'pg_net request queue is not empty';
  end if;
end $$;

drop extension pg_net;
create extension pg_net with schema extensions;

commit;

select net.worker_restart();
