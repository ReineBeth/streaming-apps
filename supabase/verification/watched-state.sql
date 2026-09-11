-- Run after applying all migrations.
-- The transaction is rolled back, so this script does not modify application data.
begin;

create temporary table watched_state_trigger_fixture (
  status public.title_status not null,
  watched_at timestamptz
);

create trigger watched_state_trigger_fixture_set_watched_at
before insert or update on watched_state_trigger_fixture
for each row execute function public.set_user_title_watched_at();

insert into watched_state_trigger_fixture (status)
values ('watched');

do $$
begin
  if not exists (
    select 1
    from watched_state_trigger_fixture
    where status = 'watched' and watched_at is not null
  ) then
    raise exception 'watched insert did not assign watched_at';
  end if;
end;
$$;

update watched_state_trigger_fixture
set status = 'to_watch'
where status = 'watched';

do $$
begin
  if exists (
    select 1
    from watched_state_trigger_fixture
    where status = 'to_watch' and watched_at is not null
  ) then
    raise exception 'leaving watched did not clear watched_at';
  end if;
end;
$$;

insert into watched_state_trigger_fixture (status)
values ('to_watch');

update watched_state_trigger_fixture
set status = 'watched'
where status = 'to_watch'
  and watched_at is null;

do $$
begin
  if exists (
    select 1
    from watched_state_trigger_fixture
    where status = 'watched' and watched_at is null
  ) then
    raise exception 'watched update did not assign watched_at';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'user_titles_set_watched_at'
      and not tgisinternal
  ) then
    raise exception 'title watched trigger is missing';
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'user_seasons_set_watched_at'
      and not tgisinternal
  ) then
    raise exception 'season watched trigger is missing';
  end if;
end;
$$;

rollback;
