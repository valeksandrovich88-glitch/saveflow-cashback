begin;

create index if not exists change_log_actor_id_idx
  on public.change_log(actor_id);

create index if not exists global_content_items_updated_by_idx
  on public.global_content_items(updated_by);

create index if not exists global_matrix_overrides_updated_by_idx
  on public.global_matrix_overrides(updated_by);

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
to public
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists preferences_own_select on public.user_preferences;
create policy preferences_own_select
on public.user_preferences
for select
to public
using (user_id = (select auth.uid()));

drop policy if exists preferences_own_insert on public.user_preferences;
create policy preferences_own_insert
on public.user_preferences
for insert
to public
with check (user_id = (select auth.uid()));

drop policy if exists preferences_own_update on public.user_preferences;
create policy preferences_own_update
on public.user_preferences
for update
to public
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists preferences_own_delete on public.user_preferences;
create policy preferences_own_delete
on public.user_preferences
for delete
to public
using (user_id = (select auth.uid()));

drop policy if exists user_matrix_own_select on public.user_matrix_overrides;
create policy user_matrix_own_select
on public.user_matrix_overrides
for select
to public
using (user_id = (select auth.uid()));

drop policy if exists user_matrix_own_insert on public.user_matrix_overrides;
create policy user_matrix_own_insert
on public.user_matrix_overrides
for insert
to public
with check (user_id = (select auth.uid()));

drop policy if exists user_matrix_own_update on public.user_matrix_overrides;
create policy user_matrix_own_update
on public.user_matrix_overrides
for update
to public
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists user_matrix_own_delete on public.user_matrix_overrides;
create policy user_matrix_own_delete
on public.user_matrix_overrides
for delete
to public
using (user_id = (select auth.uid()));

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

commit;
