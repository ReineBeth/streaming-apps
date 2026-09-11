# Capability Map: Streaming Apps

| Module id | Responsibility | Depends on |
|---|---|---|
| `identity` | Supabase authentication, sessions and user profiles | — |
| `streaming-services` | Configurable streaming services and active subscriptions | `identity` |
| `tmdb-catalog` | Server-only TMDB access for discovery, search, details and Canadian providers | `streaming-services` |
| `personal-library` | User title status, ratings, watchlist and history | `identity`, `tmdb-catalog` |
| `series-tracking` | Data model reserved for future season and episode tracking | `identity`, `personal-library` |
| `web-experience` | Routes, navigation, reusable UI, responsive and accessible states | `identity`, `streaming-services`, `tmdb-catalog`, `personal-library` |
| `roulette-selection` | Filtered random title selection, animation and re-roll behavior | `tmdb-catalog`, `personal-library`, `web-experience` |
| `roulette-history` | Temporary history of titles drawn during the current browser session | `roulette-selection` |

Build order: `identity` → `streaming-services` → `tmdb-catalog` → `personal-library` → `series-tracking` → `web-experience` → `roulette-selection` → `roulette-history`.
