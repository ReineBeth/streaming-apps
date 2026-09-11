-- Add commonly used Canadian streaming providers.
-- This migration is additive and safe to run after the initial schema migration.
insert into public.streaming_services (tmdb_provider_id, name)
values
  (119, 'Amazon Prime Video'),
  (8, 'Netflix'),
  (531, 'Paramount Plus'),
  (283, 'Crunchyroll'),
  (151, 'BritBox'),
  (314, 'CBC Gem'),
  (11, 'MUBI')
on conflict (tmdb_provider_id) do update
set name = excluded.name;
