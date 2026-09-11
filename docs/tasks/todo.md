# Streaming Apps Task Checklist

## Phase 1: Foundation

- [x] Task 1: Initialize the Next.js App Router project and repository scripts.
  - Acceptance: The app starts with the documented dev command; lint, typecheck and build scripts exist.
  - Verify: Run `npm run lint`, `npm run typecheck` and `npm run build`.
  - Files: `package.json`, `app/`, `tsconfig.json`, `next.config.*`, `.gitignore`.

- [x] Task 2: Add environment templates, server/client configuration boundaries and shared domain types.
  - Acceptance: Public Supabase URL and browser key are distinct from the server-only TMDB key; required values have typed accessors.
  - Verify: Run TypeScript and confirm `.env.local` is ignored.
  - Files: `.env.example`, `lib/env.ts`, `types/domain.ts`, `.gitignore`.

- [x] Task 3: Add Supabase browser/server clients and authentication type foundations.
  - Acceptance: Browser and server clients compile with the expected environment variables and no service-role key reaches client code.
  - Verify: Run TypeScript and build.
  - Files: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/database.types.ts`.

- [x] Task 4: Add the initial Supabase migration for profiles, services, subscriptions and user titles.
  - Acceptance: SQL contains constraints, indexes, seed services and RLS policies for user-owned rows.
  - Verify: Review SQL and run the available Supabase migration validation command.
  - Files: `supabase/migrations/*_initial_schema.sql`.

- [x] Task 5: Add the typed server-only TMDB client and endpoint contracts.
  - Acceptance: Required catalogue functions have typed signatures and never import into a client component.
  - Verify: Unit-test response mapping and run lint, typecheck and build.
  - Files: `lib/tmdb/client.ts`, `lib/tmdb/catalog.ts`, `types/tmdb.ts`, `tests/tmdb/*`.

## Checkpoint: Foundation

- [x] Lint passes.
- [x] TypeScript passes.
- [x] Production build passes.
- [x] No secrets are tracked.

## Phase 3: Catalogue

- [ ] Task 8: Implement TMDB discovery and Canadian provider filtering.
  - Acceptance: Discovery remains restricted to Canadian availability and active provider ids.
  - Verify: Run `npm test -- tests/tmdb/providers.test.ts`, `npm run typecheck` and `npm run build`.
  - Files: `lib/tmdb/catalog.ts`, `lib/tmdb/providers.ts`, `types/tmdb.ts`, `tests/tmdb/*`.

- [ ] Task 9: Implement Explorer search and filters.
  - Acceptance: Search, media type, service, genre, rating, year and pagination filters preserve existing behavior.
  - Verify: Run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build`.
  - Files: `app/explorer/page.tsx`, `components/explorer-filters.tsx`, related styles and tests.

- [ ] Task 10: Implement title detail pages.
  - Acceptance: A movie or series has a working detail route with loading, error and empty states.
  - Verify: Run `npm run typecheck`, `npm run build` and the relevant Playwright flow when credentials are available.
  - Files: `app/titles/[mediaType]/[tmdbId]/page.tsx`, related styles and tests.

- [ ] Task 17: Extend title metadata contracts with original language and Quebec discovery fields.
  - Acceptance: Domain summaries retain TMDB original language; discovery options can express French language, Canadian origin and Quebec-related keywords without exposing raw TMDB payloads to client components.
  - Verify: Add mapping tests for `original_language`, `origin_country` and keyword inputs; run `npm test` and `npm run typecheck`.
  - Files: `types/domain.ts`, `types/tmdb.ts`, `lib/tmdb/catalog.ts`, `tests/tmdb/*`.
  - Dependencies: Tasks 8 and 10.

- [ ] Task 18: Include Quebec content in provider-filtered discovery and search.
  - Acceptance: Quebec-focused discovery can find fixture examples such as Les Boys and Empathie when matching TMDB and Canadian provider records exist; ordinary provider filtering still works.
  - Verify: Test query construction with mocked TMDB responses; run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build`.
  - Files: `lib/tmdb/catalog.ts`, `app/explorer/page.tsx`, `tests/tmdb/*`.
  - Dependencies: Task 17.

- [ ] Task 19: Define and validate the provider audio-language data boundary.
  - Acceptance: A typed contract distinguishes French audio, English audio, both, neither and unknown for each provider offer; the implementation documents whether the source is an authorized external feed or curated data.
  - Verify: Unit-test all states, including missing data; run `npm test` and `npm run typecheck`.
  - Files: `types/domain.ts`, `lib/streaming-services.ts` or a new focused module, `tests/*`.
  - Dependencies: Task 8.

- [ ] Task 20: Display provider-specific `FR`, `EN` and `subtitle only` labels on media tiles.
  - Acceptance: Each tile shows `FR` or `EN` only for a provider with confirmed matching audio; it shows `subtitle only` only when the provider confirms neither French nor English audio; unknown data produces no misleading label.
  - Verify: Component tests cover all language states; run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build`.
  - Files: `components/media-card.tsx`, `components/media-card.module.css`, `types/domain.ts`, tests.
  - Dependencies: Task 19.

- [ ] Task 21: Display original language and provider language details on title pages.
  - Acceptance: The detail page displays a human-readable original language and identifies language availability per selected Canadian provider where data exists.
  - Verify: Render tests cover French, English, another language and unknown values; run `npm test`, `npm run typecheck` and `npm run build`.
  - Files: `app/titles/[mediaType]/[tmdbId]/page.tsx`, `lib/tmdb/languages.ts`, related styles and tests.
  - Dependencies: Tasks 17 and 19.

## Checkpoint: Catalogue

- [ ] TMDB mappings and Quebec discovery tests pass.
- [ ] Provider language states are explicit and never inferred from original language.
- [ ] Tiles and detail pages render safely when provider language data is unavailable.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` pass.

## Quality and UI Remediation Backlog

The earlier unchecked catalogue backlog is retained for history. The ordered tasks below are the active execution plan for the quality pass.

### Phase 0: Correctness blockers

- [x] Task Q1: Fix watched timestamp triggers for title and season inserts.
  - Acceptance: watched inserts succeed and assign `watched_at`; leaving watched clears it; ratings remain constrained.
  - Verify: focused database regression tests or documented Supabase migration check, then `npm run typecheck`.
  - Dependencies: existing title and season migrations.
  - Scope: Small.

- [x] Task Q2: Make season removal explicit and preserve invariants.
  - Acceptance: `Non suivi` removes the user's season row; non-watched seasons cannot retain a rating; watched seasons can be rated.
  - Verify: action tests, `npm test`, `npm run lint`, `npm run typecheck`.
  - Files: `app/titles/actions.ts`, `components/season-tracker.tsx`, focused tests.
  - Dependencies: Q1.
  - Scope: Medium.

- [x] Task Q3: Add persistence regression tests and document database verification.
  - Acceptance: watched insert/update and season removal are reproducible without live TMDB requests.
  - Verify: focused tests and `npm run build`.
  - Files: `tests/*`, `README.md` or `docs/tasks/plan.md`.
  - Dependencies: Q1-Q2.
  - Scope: Small.

### Checkpoint: Data integrity

- [ ] Q1-Q3 pass before page remediation continues.

### Phase 1: Shared UI foundation

- [x] Task Q4: Add shared loading, route error and not-found states.
  - Acceptance: all data-driven routes show meaningful loading/error/not-found content; empty states retain next actions.
  - Verify: `npm run build` and route checks with configured or mocked data.
  - Files: `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`, route-level states as needed.
  - Dependencies: None.
  - Scope: Medium.

- [ ] Task Q5: Harden Navbar, global focus styles, contrast and reduced motion.
  - Acceptance: keyboard navigation and visible focus work at 320px, 768px, 1024px and 1440px; reduced motion is respected.
  - Verify: lint, responsive browser tests and keyboard pass.
  - Files: `app/globals.css`, `app/layout.tsx`, `components/navbar.tsx`, `components/navbar.module.css`, shared CSS.
  - Dependencies: None.
  - Scope: Medium.

- [x] Task Q6: Add pending and failure feedback to server-action forms.
  - Acceptance: login, service, title and season forms prevent duplicate submission and expose actionable failures.
  - Verify: typecheck/build and delayed/failed action checks.
  - Files: login, settings, title-status and season components/actions.
  - Dependencies: Q4.
  - Scope: Medium.

### Phase 2: Login and Settings

- [ ] Task Q7: Finish login UX and safe authenticated redirects.
  - Acceptance: invalid credentials, unreachable Supabase, success and safe `next` redirects have distinct feedback.
  - Verify: `npm run test:e2e` and focused tests.
  - Dependencies: Q4-Q6.
  - Scope: Small.

- [ ] Task Q8: Finish Settings service selection states.
  - Acceptance: active state is announced; toggles cannot double-submit; failures and no-service states are useful.
  - Verify: focused E2E, typecheck and build.
  - Dependencies: Q2 and Q6.
  - Scope: Medium.

### Phase 3: Explorer

- [x] Task Q9: Stabilize Explorer integration failures and bounded query parsing.
  - Acceptance: auth, Supabase and TMDB failures produce safe UI; malformed parameters do not throw.
  - Verify: filter/error tests, lint, typecheck and build.
  - Dependencies: Q4-Q5.
  - Scope: Medium.

- [x] Task Q10: Reduce Explorer request amplification and deduplicate enrichment.
  - Acceptance: page request budget is bounded; repeated titles do not duplicate enrichment; provider/audio semantics remain correct.
  - Verify: mocked request counters and build.
  - Dependencies: Q9.
  - Scope: Medium.

- [x] Task Q11: Polish Explorer filters, cards, pagination, modal focus and mobile interaction.
  - Acceptance: URL state, reset, focus, keyboard and reduced motion work on mobile and desktop.
  - Verify: responsive and keyboard browser checks.
  - Dependencies: Q5 and Q10.
  - Scope: Medium.

- [x] Task Q12: Add Explorer/accessibility regression coverage.
  - Acceptance: tests cover empty catalogue, provider filter, modal focus return, reset and pagination bounds.
  - Verify: full npm checks and configured authenticated E2E.
  - Dependencies: Q9-Q11.
  - Scope: Medium.

### Phase 4: Details and library

- [x] Task Q13: Harden title detail invalid-route, loading, empty and TMDB-error states.
  - Acceptance: invalid media types/ids return not-found; missing metadata/providers degrade cleanly.
  - Verify: route tests, typecheck and build.
  - Dependencies: Q4 and Q9.
  - Scope: Small.

- [x] Task Q14: Finish title status/rating feedback and watched invariants.
  - Acceptance: status changes refresh affected pages; ratings require watched; pending/failure states are explicit.
  - Verify: action tests and authenticated title flow.
  - Dependencies: Q1-Q2 and Q6.
  - Scope: Medium.

- [x] Task Q15: Finish season save, rating, removal and narrow-screen behavior.
  - Acceptance: save, rate and remove are explicit; form remains usable on narrow screens; results are announced.
  - Verify: season tests and authenticated browser coverage.
  - Dependencies: Q2 and Q6.
  - Scope: Medium.

- [x] Task Q16: Finish Home, Watchlist and History states and performance bounds.
  - Acceptance: useful empty/error states exist; metadata failures do not erase lists; request budgets are documented.
  - Verify: page tests, mocked request counters and responsive checks.
  - Dependencies: Q10 and Q14-Q15.
  - Scope: Large; split by page if needed.

### Phase 5: Roulette, export and release gate

- [x] Task Q17: Finish Roulette loading, empty, reduced-motion and keyboard feedback.
  - Acceptance: draw/re-roll is keyboard accessible; loading/failure/empty states are clear; motion preference is respected.
  - Verify: roulette unit/E2E tests at mobile and desktop widths.
  - Dependencies: Q4-Q5 and Q10.
  - Scope: Medium.

- [x] Task Q18: Bound and harden catalogue export.
  - Acceptance: export requires authentication, has a maximum size, avoids whole-catalogue fan-out and returns controlled failures.
  - Verify: mocked request counts, unauthenticated route test and build.
  - Dependencies: Q9-Q10.
  - Scope: Medium.

- [x] Task Q19: Run full release verification.
  - Acceptance: all Critical/Required findings are resolved and every data-driven page has loading/error/empty states.
  - Verify: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, `npm run test:e2e:responsive`, `npm run test:e2e:auth` with reachable Supabase.
  - Dependencies: Q1-Q18.
  - Scope: Medium.
