# Spec: Streaming Apps

## Objective

Build a personal web application that shows films and TV shows available in Canada on the user's active streaming services, while keeping personal statuses, ratings, watchlist entries and viewing history in Supabase.

The first user is one account, but every personal record is scoped to a user so the data model remains compatible with multiple users. TMDB is the source of catalogue metadata and availability. The TMDB secret must remain server-side.

## Assumptions

1. The application is created directly in `streaming-apps`.
2. The target region is Canada (`CA`) and the primary locale is `fr-CA`.
3. Supabase Auth uses cookie-backed sessions in the Next.js App Router.
4. Crave, Disney+ and Apple TV+ are seeded initially; services remain database-driven afterward.
5. V1 tracks a series at title level. The schema leaves room for future seasons and episodes.
6. The first implementation uses CSS Modules unless the initialized Next.js project makes another lightweight option clearly preferable.
7. TMDB provider availability is treated as catalogue data fetched on demand; only user-owned identifiers and state are persisted.

## Tech Stack

- Next.js with App Router
- TypeScript strict mode
- React
- Supabase PostgreSQL, Auth and Row Level Security
- TMDB server integration
- CSS Modules or another lightweight styling solution already supported by the scaffold
- Vitest for focused unit tests and Playwright for critical browser flows when UI exists

## Commands

The exact package-manager commands will be recorded after initialization. The project must provide equivalents of:

```text
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Project Structure

```text
streaming-apps/
├── app/                 # App Router routes and route-level loading/error states
├── components/          # Reusable accessible UI components
├── lib/                 # Supabase clients, TMDB server client and domain helpers
├── types/               # Shared TypeScript contracts
├── supabase/migrations/ # Versioned SQL migrations and seed data where appropriate
├── tests/               # Unit and integration tests
├── e2e/                 # Browser-level flows
├── public/              # Static assets
├── docs/context/        # Project context and capability map
├── docs/features/       # Feature specifications
└── docs/tasks/          # Approved plans and checklists
```

## Code Style

Use small named functions, explicit domain types and server/client boundaries that are visible from imports. Keep TMDB calls in server-only modules and keep persistence operations separate from presentation.

```ts
export type MediaType = "movie" | "tv";

export async function getWatchProviders(
  tmdbId: number,
  mediaType: MediaType,
  region = "CA",
): Promise<WatchProvider[]> {
  const response = await tmdbClient.get(`/${mediaType}/${tmdbId}/watch/providers`);
  return parseCanadianProviders(response, region);
}
```

The final implementation should avoid string workarounds like the illustrative URL normalization above; the example establishes naming and return-type conventions only. Format with the repository formatter, prefer semantic HTML, and make interactive controls keyboard accessible.

## Testing Strategy

- Unit tests cover TMDB response mapping, status and rating validation, provider filtering and database-facing domain helpers.
- Integration tests cover server actions or route handlers with mocked external TMDB responses and isolated Supabase test data where practical.
- Playwright covers login, changing active services, exploring filtered titles, updating a title status and adding a personal rating.
- Every implementation step runs lint and TypeScript checks. The production build must pass before a stage is considered complete.
- External TMDB and Supabase credentials are never committed or used as test fixtures.

## Boundaries

- Always: keep secrets server-side, validate user input, enforce RLS, preserve accessible loading/error/empty states, run lint and TypeScript after each stage.
- Ask first: schema changes after approval, new runtime dependencies, CI changes, changes to provider semantics, or any change that expands V1 scope.
- Never: commit secrets, expose the TMDB key to client bundles, store complete TMDB payloads unnecessarily, bypass RLS, remove failing tests to make checks pass, or commit directly to `main`.

## Success Criteria

- A fresh checkout can start the Next.js application with documented environment variables.
- Supabase migrations create the approved user, service, subscription and title-state foundations with constraints, indexes and RLS.
- TMDB credentials are consumed only by server-side code.
- The catalogue can be restricted to Canadian availability on active services.
- Personal states and ratings are scoped to the authenticated user and can be changed without losing existing catalogue functionality.
- Loading, error and empty states are present for each data-driven page.
- Lint, TypeScript and production build pass after each completed stage.

## Open Questions

- Which Supabase authentication method should be enabled first: email/password, magic link, or both?
- Should the initial interface copy be French, English, or bilingual?
- Should titles available on several active services display all providers or only the services selected in the filter?
- Should TMDB catalogue results be paginated in V1, or is a bounded first page sufficient?
