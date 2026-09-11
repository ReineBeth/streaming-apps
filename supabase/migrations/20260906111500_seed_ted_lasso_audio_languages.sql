-- Ted Lasso is available with English and French audio on Apple TV+ in Canada.
insert into public.title_provider_audio
  (tmdb_id, media_type, tmdb_provider_id, audio_languages, subtitle_languages)
values
  (97546, 'tv', 350, array['en', 'fr'], array['en', 'fr'])
on conflict (tmdb_id, media_type, tmdb_provider_id) do update
set audio_languages = excluded.audio_languages,
    subtitle_languages = excluded.subtitle_languages,
    updated_at = now();
