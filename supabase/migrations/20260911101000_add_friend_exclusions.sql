create table public.friend_exclusions (
  user_id uuid not null references auth.users (id) on delete cascade,
  excluded_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, excluded_user_id),
  check (user_id <> excluded_user_id)
);

create index friend_exclusions_excluded_user_idx
  on public.friend_exclusions (excluded_user_id);

alter table public.friend_exclusions enable row level security;

create policy "Users can read their own friend exclusions"
on public.friend_exclusions for select
using (auth.uid() = user_id);

create policy "Users can create their own friend exclusions"
on public.friend_exclusions for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own friend exclusions"
on public.friend_exclusions for delete
using (auth.uid() = user_id);

create or replace function public.get_friend_recommended_titles()
returns table (tmdb_id integer, media_type public.media_type)
language sql
security definer
set search_path = public
as $$
  select distinct ut.tmdb_id, ut.media_type
  from public.user_titles ut
  where ut.user_id <> auth.uid()
    and ut.rating_label in ('good', 'very_good', 'masterpiece')
    and not exists (
      select 1
      from public.friend_exclusions fe
      where fe.user_id = auth.uid()
        and fe.excluded_user_id = ut.user_id
    );
$$;

create or replace function public.list_friend_profiles()
returns table (id uuid, display_name text, is_excluded boolean)
language sql
security definer
set search_path = public
as $$
  select p.id, p.display_name, exists (
    select 1
    from public.friend_exclusions fe
    where fe.user_id = auth.uid()
      and fe.excluded_user_id = p.id
  ) as is_excluded
  from public.profiles p
  where p.id <> auth.uid()
  order by lower(coalesce(p.display_name, ''));
$$;

revoke execute on function public.get_friend_recommended_titles() from public;
revoke execute on function public.list_friend_profiles() from public;
grant execute on function public.get_friend_recommended_titles() to authenticated;
grant execute on function public.list_friend_profiles() to authenticated;
