# Spec: title-discovery

## Objective

Allow users to find Canadian catalogue titles through people and companies, then give them a more useful complete title page with the main credits and distribution context.

## Scope

- Search titles, people and companies from one Explorer field and use a selected actor or director as a title filter.
- Search and use production/distribution companies as title filters.
- Keep existing streaming-platform filtering; represent a platform as a provider filter rather than a TMDB production company.
- Extend movie and TV detail responses with credits and production companies.
- Keep all TMDB access server-only and pass reduced typed data to the UI.

## Contract

- The unified Explorer query returns title results plus bounded person suggestions with TMDB ids, names, known-for department and profile paths.
- `searchCompanies(query, page)` returns bounded company search results with TMDB ids, names and logos.
- `discoverMovies` and `discoverTvShows` accept optional `peopleIds`, `castIds`, `crewIds` and `companyIds` filters.
- Detail metadata exposes reduced cast, crew and company records; unknown or missing fields render as an explicit empty state.

## Acceptance Criteria

- Explorer can search a person and a company and apply the selected result without exposing raw TMDB payloads to client components.
- Actor searches use TMDB cast filtering; director searches use crew filtering.
- Company searches include production/distribution companies represented by TMDB.
- Existing provider, cost, genre, year and personal-state filters continue to work.
- Complete movie and TV pages show principal cast, director when available, writers when available, production/distribution companies and Canadian providers.
- TMDB failures degrade to the existing controlled error state.
- Inputs and third-party response fields are bounded and mapped before rendering.

## Testing Strategy

- Unit-test search and discovery parameter construction, response mapping and role selection.
- Test detail mapping with missing credits and companies.
- Run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build`.
- Verify the Explorer and detail page manually when TMDB credentials are available.

## Boundaries

- Always: keep TMDB keys server-side, use Canadian provider data from TMDB, and keep client props reduced and typed.
- Ask first: new runtime dependencies, schema changes, direct JustWatch integration, or a new external data source.
- Never: persist complete TMDB payloads or infer a person's role from an unvalidated client value.

## Sources

- TMDB person search: https://developer.themoviedb.org/reference/search-person
- TMDB movie discovery filters: https://developer.themoviedb.org/reference/discover-movie
- TMDB movie credits: https://developer.themoviedb.org/reference/movie-credits
- TMDB movie watch providers: https://developer.themoviedb.org/reference/movie-watch-providers
