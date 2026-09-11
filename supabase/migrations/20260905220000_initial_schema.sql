create extension if not exists pgcrypto;

create type public.media_type as enum ('movie', 'tv');
create type public.title_status as enum ('to_watch', 'in_progress', 'watched', 'abandoned');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.streaming_services (
  id uuid primary key default gen_random_uuid(),
  tmdb_provider_id integer not null unique check (tmdb_provider_id > 0),
  name text not null unique check (char_length(trim(name)) > 0),
  logo_path text,
  created_at timestamptz not null default now()
);

create table public.user_streaming_services (
  user_id uuid not null references auth.users (id) on delete cascade,
  streaming_service_id uuid not null references public.streaming_services (id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, streaming_service_id)
);

create table public.user_titles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id integer not null check (tmdb_id > 0),
  media_type public.media_type not null,
  status public.title_status not null default 'to_watch',
  rating numeric(2, 1),
  watched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type),
  check (rating is null or (rating >= 0.5 and rating <= 5 and mod(rating * 2, 1) = 0)),
  check (status = 'watched' or rating is null)
);

create index user_streaming_services_active_idx
  on public.user_streaming_services (user_id, active);

create index user_titles_status_idx
  on public.user_titles (user_id, status);

create index user_titles_watched_at_idx
  on public.user_titles (user_id, watched_at desc)
  where watched_at is not null;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_streaming_services_set_updated_at
before update on public.user_streaming_services
for each row execute function public.set_updated_at();

create trigger user_titles_set_updated_at
before update on public.user_titles
for each row execute function public.set_updated_at();

create or replace function public.set_user_title_watched_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'watched' and (old.status is distinct from 'watched' or new.watched_at is null) then
    new.watched_at = coalesce(new.watched_at, now());
  elsif new.status <> 'watched' then
    new.watched_at = null;
  end if;
  return new;
end;
$$;

create trigger user_titles_set_watched_at
before insert or update on public.user_titles
for each row execute function public.set_user_title_watched_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.streaming_services enable row level security;
alter table public.user_streaming_services enable row level security;
alter table public.user_titles enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Authenticated users can read streaming services"
on public.streaming_services for select
to authenticated
using (true);

create policy "Users can read their own service subscriptions"
on public.user_streaming_services for select
using (auth.uid() = user_id);

create policy "Users can insert their own service subscriptions"
on public.user_streaming_services for insert
with check (auth.uid() = user_id);

create policy "Users can update their own service subscriptions"
on public.user_streaming_services for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own service subscriptions"
on public.user_streaming_services for delete
using (auth.uid() = user_id);

create policy "Users can read their own title states"
on public.user_titles for select
using (auth.uid() = user_id);

create policy "Users can insert their own title states"
on public.user_titles for insert
with check (auth.uid() = user_id);

create policy "Users can update their own title states"
on public.user_titles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own title states"
on public.user_titles for delete
using (auth.uid() = user_id);

insert into public.streaming_services (tmdb_provider_id, name)
values
  (230, 'Crave'),
  (337, 'Disney+'),
  (350, 'Apple TV+')
on conflict (tmdb_provider_id) do update
set name = excluded.name;
