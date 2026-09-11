-- Manually curated provider audio metadata.
-- An absent row means unknown; an empty audio_languages array means confirmed
-- that the provider offers no audio track in French or English.
create table public.title_provider_audio (
  tmdb_id integer not null check (tmdb_id > 0),
  media_type public.media_type not null,
  tmdb_provider_id integer not null check (tmdb_provider_id > 0),
  audio_languages text[] not null default '{}',
  subtitle_languages text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (tmdb_id, media_type, tmdb_provider_id)
);

create index title_provider_audio_provider_idx
  on public.title_provider_audio (tmdb_provider_id, media_type);

alter table public.title_provider_audio enable row level security;

create policy "Authenticated users can read title provider audio"
on public.title_provider_audio for select
to authenticated
using (true);
