# Spec: tmdb-catalog

## Objective

Create a server-only TMDB adapter with small reusable functions for movies, TV shows, search, discovery and Canadian watch providers.

## Acceptance Criteria

- The TMDB API key is read from server-only environment configuration.
- `getMovie`, `getTvShow`, `searchTitles`, `discoverMovies`, `discoverTvShows` and `getWatchProviders` expose typed results.
- Provider results are filtered to Canada and can be mapped to configured service ids.
- HTTP errors, malformed responses and rate-limit responses produce controlled application errors.
- No complete TMDB payload is persisted in Supabase.
