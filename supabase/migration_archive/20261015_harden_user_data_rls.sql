-- Harden personal SaveFlow data so only authenticated owners can access it.

alter policy profiles_read_own_or_admin
  on public.profiles
  to authenticated;

alter policy profiles_update_own_safe
  on public.profiles
  to authenticated;

alter policy user_matrix_own_select
  on public.user_matrix_overrides
  to authenticated;
alter policy user_matrix_own_insert
  on public.user_matrix_overrides
  to authenticated;
alter policy user_matrix_own_update
  on public.user_matrix_overrides
  to authenticated;
alter policy user_matrix_own_delete
  on public.user_matrix_overrides
  to authenticated;

alter policy preferences_own_select
  on public.user_preferences
  to authenticated;
alter policy preferences_own_insert
  on public.user_preferences
  to authenticated;
alter policy preferences_own_update
  on public.user_preferences
  to authenticated;
alter policy preferences_own_delete
  on public.user_preferences
  to authenticated;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.user_preferences from public, anon, authenticated;
revoke all on table public.user_matrix_overrides from public, anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_preferences to authenticated;
grant select, insert, update, delete on table public.user_matrix_overrides to authenticated;
