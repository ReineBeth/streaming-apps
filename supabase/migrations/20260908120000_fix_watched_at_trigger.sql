-- Handle INSERT triggers without reading the unassigned OLD record.
-- This function is shared by title and season state tables.
create or replace function public.set_user_title_watched_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'watched' then
    if tg_op = 'INSERT' then
      new.watched_at = coalesce(new.watched_at, now());
    elsif old.status is distinct from 'watched' or new.watched_at is null then
      new.watched_at = coalesce(new.watched_at, now());
    end if;
  elsif new.status <> 'watched' then
    new.watched_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists user_titles_set_watched_at on public.user_titles;
create trigger user_titles_set_watched_at
before insert or update on public.user_titles
for each row execute function public.set_user_title_watched_at();

drop trigger if exists user_seasons_set_watched_at on public.user_seasons;
create trigger user_seasons_set_watched_at
before insert or update on public.user_seasons
for each row execute function public.set_user_title_watched_at();
