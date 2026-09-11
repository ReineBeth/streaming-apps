create table public.user_seasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tmdb_id integer not null check (tmdb_id > 0),
  season_number integer not null check (season_number > 0),
  status public.title_status not null default 'to_watch',
  rating_label text,
  watched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tmdb_id, season_number),
  check (rating_label is null or rating_label in ('bad', 'okay', 'good', 'very_good', 'masterpiece')),
  check (status = 'watched' or rating_label is null)
);

create index user_seasons_status_idx on public.user_seasons (user_id, status);
create index user_seasons_show_idx on public.user_seasons (user_id, tmdb_id);

create trigger user_seasons_set_updated_at before update on public.user_seasons for each row execute function public.set_updated_at();
create trigger user_seasons_set_watched_at before insert or update on public.user_seasons for each row execute function public.set_user_title_watched_at();

alter table public.user_seasons enable row level security;
create policy "Users can read their own season states" on public.user_seasons for select using (auth.uid() = user_id);
create policy "Users can insert their own season states" on public.user_seasons for insert with check (auth.uid() = user_id);
create policy "Users can update their own season states" on public.user_seasons for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own season states" on public.user_seasons for delete using (auth.uid() = user_id);
