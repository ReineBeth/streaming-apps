# Implementation Plan: Streaming Apps

## Overview

Build the application in dependency order, keeping each increment runnable and verified. Stage 1 establishes the Next.js project, environment boundaries, Supabase clients, TMDB server adapter contracts, shared domain types and initial SQL migrations. Later stages add vertical user flows.

## Architecture Decisions

- Keep TMDB access in server-only modules under `lib/tmdb`; client components receive typed, reduced results.
- Store user-owned state and TMDB identifiers in Supabase. Do not cache full TMDB responses in the first version.
- Use Supabase Auth user ids as the owner key and RLS on every user-owned table.
- Keep streaming services data-driven through `streaming_services` and `user_streaming_services`.
- Use title-level status for V1 and add season/episode tables in a later migration.
- Treat TMDB as the source for title metadata and Canadian provider presence, but not for provider audio or subtitle languages.
- Keep provider language availability behind a separate typed boundary so the UI is independent of the eventual authorized external or curated source.
- Improve Quebec discovery with TMDB language, origin-country and keyword signals, while allowing explicit title search to recover less popular entries.

## Task List

### Phase 1: Foundation

- [ ] Task 1: Initialize the Next.js App Router project and repository scripts.
- [ ] Task 2: Add environment templates, server/client configuration boundaries and shared domain types.
- [ ] Task 3: Add Supabase browser/server clients and authentication type foundations.
- [ ] Task 4: Add the initial Supabase migration for profiles, services, subscriptions and user titles.
- [ ] Task 5: Add the typed server-only TMDB client and endpoint contracts.

### Checkpoint: Foundation

- [ ] Lint passes.
- [ ] TypeScript passes.
- [ ] Production build passes.
- [ ] Migration SQL is reviewed for constraints, indexes and RLS.
- [ ] No environment secrets are tracked.

### Phase 2: Identity and Services

- [ ] Task 6: Implement sign-in and protected route session handling.
- [ ] Task 7: Implement service settings and active subscription updates.

### Checkpoint: Identity and Services

- [ ] A user can authenticate and update active services.
- [ ] User A cannot access User B's subscriptions.

### Phase 3: Catalogue

- [ ] Task 8: Implement TMDB discovery and Canadian provider filtering.
- [ ] Task 9: Implement Explorer search and filters.
- [ ] Task 10: Implement title detail pages.
- [ ] Task 17: Extend title metadata contracts with original language and Quebec discovery fields.
- [ ] Task 18: Include Quebec content in provider-filtered discovery and search.
- [ ] Task 19: Define and validate the provider audio-language data boundary.
- [ ] Task 20: Display provider-specific `FR`, `EN` and `subtitle only` labels on media tiles.
- [ ] Task 21: Display original language and provider language details on title pages.

### Checkpoint: Catalogue

- [ ] Explore and details work with loading, error and empty states.
- [ ] TMDB credentials remain server-only.
- [ ] Known Quebec examples such as Les Boys and Empathie are discoverable when matching TMDB and Canadian provider records exist.
- [ ] A tile never infers streaming audio from the title's original language alone.
- [ ] Missing provider audio data degrades safely without falsely displaying `subtitle only`.

### Phase 4: Personal Library

- [ ] Task 11: Implement status changes and watchlist behavior.
- [ ] Task 12: Implement watched ratings and history filters.
- [ ] Task 13: Implement Home sections from real user and catalogue data.

### Checkpoint: Personal Library

- [ ] Statuses, ratings, watchlist and history persist per user.
- [ ] A watched title records a date and accepts only half-star ratings from 0.5 to 5.

### Phase 5: Series Extension and Polish

- [ ] Task 14: Add the future-compatible season and episode migration design.
- [ ] Task 15: Add responsive accessibility and visual polish.
- [ ] Task 16: Add critical Playwright flows and final production verification.

### Checkpoint: Complete

- [ ] All acceptance criteria in `../context/SPEC.md` are met.
- [ ] Unit, integration and critical browser tests pass.
- [ ] Lint, TypeScript and production build pass.
- [ ] Documentation and environment setup are complete.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| TMDB provider ids or availability differ by region | High | Seed documented ids, filter by `CA`, and expose provider mapping as a boundary function. |
| Supabase session handling differs between server and browser | High | Use official SSR client patterns and test protected routes early. |
| TMDB rate limits affect discovery | Medium | Keep requests server-side, bound result sizes and defer caching until a real need appears. |
| Series progress expands V1 scope | Medium | Keep V1 title-level and reserve separate season/episode tables. |
| No Git repository exists in this workspace | Medium | Keep changes incremental and report commits as unavailable until the user initializes or provides a repository. |
| TMDB metadata is incomplete for less popular Quebec titles | High | Combine French language, Canadian origin, Quebec-related keywords and direct search; verify with fixture titles. |
| TMDB Watch Providers omits audio and subtitle languages | High | Keep audio metadata as a separate provider contract; evaluate an authorized source or curated service data before implementing labels. |
| Audio availability varies by season, region or plan | High | Scope V1 to the exact Canadian provider offer represented by the selected source and show unknown when data is missing. |

## Open Questions

- Choose email/password, magic link, or both for the first auth flow.
- Choose French, English, or bilingual interface copy.
- Decide whether V1 needs pagination beyond the first bounded discovery page.
- Confirm the authorized source for provider audio and subtitle languages.
- Define whether `subtitle only` means neither French nor English audio, or specifically that at least one subtitle language is known.
- Confirm whether Quebec discovery means Quebec-produced content only or all Canadian French-language content.

## Quality and UI Remediation Plan

This section supersedes the remaining implementation backlog above for the next work cycle. The completed foundation remains valid; the priority is now reliability and page completion.

### Phase 0: Correctness blockers

- [x] Task Q1: Fix watched timestamp triggers for title and season inserts.
- [x] Task Q2: Make season removal explicit and preserve status/rating invariants.
- [x] Task Q3: Add focused persistence regression tests and document database verification.

### Checkpoint: Data integrity

- [ ] First-time watched title and season saves succeed and assign `watched_at`.
- [ ] Leaving `watched` clears `watched_at` and the rating.
- [ ] Both title and season paths are covered by regression tests.

### Phase 1: Shared UI foundation

- [x] Task Q4: Add shared loading, route error and not-found states.
- [x] Task Q5: Harden Navbar, global focus styles, contrast and reduced-motion behavior.
- [x] Task Q6: Add pending and failure feedback to login, settings, title and season forms.

### Phase 2: Page priority order

1. **Login and Settings** — entry and configuration; unblock authenticated verification.
2. **Explorer** — primary catalogue workflow; fix request amplification, filters, cards and responsive behavior.
3. **Title details** — conversion point; fix metadata failures, status/rating feedback and season tracking.
4. **Home, Watchlist and History** — personal value; complete empty/error states and request bounds.
5. **Roulette and Export** — secondary workflows; finish accessibility and bound external work.

### Phase 3: Explorer

- [x] Task Q7: Stabilize Explorer Supabase/TMDB failure handling and bounded query parsing.
- [x] Task Q8: Reduce per-page TMDB/Supabase request amplification and deduplicate enrichment.
- [x] Task Q9: Polish filters, result cards, pagination, modal focus and mobile keyboard interaction.
- [x] Task Q10: Add Explorer and accessibility regression coverage.

### Phase 4: Details and library

- [x] Task Q11: Harden title detail invalid-route, loading, empty and TMDB-error states.
- [x] Task Q12: Finish title status/rating pending feedback and watched invariants.
- [x] Task Q13: Finish season save, rating, removal and narrow-screen behavior.
- [x] Task Q14: Finish Home, Watchlist and History states, metadata fallbacks and performance bounds.

### Phase 5: Secondary workflows and release gate

- [x] Task Q15: Finish Roulette loading, empty, reduced-motion and keyboard feedback.
- [x] Task Q16: Bound and harden catalogue export with authentication, size limits and controlled failures.
- [x] Task Q17: Run full unit, lint, typecheck, build and configured authenticated E2E verification.

### Remediation checkpoint

- [ ] All Critical and Required review findings are resolved.
- [ ] Every data-driven page has loading, error and empty states.
- [x] UI works at 320px, 768px, 1024px and 1440px.
- [x] Authenticated E2E runs with reachable Supabase credentials.

### Remediation risks

| Risk | Impact | Mitigation |
|---|---|---|
| The watched trigger reads `OLD` on `INSERT` | High | Fix before UI work and cover title/season inserts. |
| Explorer and export fan out into too many requests | High | Add deduplication, bounded concurrency and an export cap. |
| Authenticated E2E depends on external Supabase | Medium | Document environment setup and keep login-only checks independent. |
| UI changes regress keyboard/mobile behavior | Medium | Verify four viewport widths and explicit focus flows. |
