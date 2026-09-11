# Implementation Plan: Roulette de sélection

## Overview

Créer une page `/roulette` qui reprend les critères de filtrage utiles au choix d'un titre, charge un ensemble borné de candidats issus du catalogue TMDB canadien, puis permet un tirage aléatoire animé. Les titres déjà tirés sont exclus de la session courante et l'historique reste uniquement en mémoire côté navigateur.

La fonctionnalité ne nécessite ni migration Supabase ni nouvelle dépendance runtime. Elle s'appuie sur les contrats TMDB et les statuts personnels existants.

## Architecture Decisions

- La page `/roulette` est une route dédiée afin d'isoler l'état éphémère du tirage et de garder Explorer focalisé sur la recherche et la pagination.
- La sélection aléatoire vit dans une fonction pure sous `lib/roulette`, avec une source aléatoire injectable pour rendre l'exclusion et les cas limites testables.
- La récupération des candidats reste côté serveur. Le client reçoit des résumés de titres déjà réduits, sans payload TMDB complet ni secret.
- L'historique est géré par l'état React du composant client. Il n'existe aucune table, action serveur ou écriture Supabase pour cette fonctionnalité.
- Le changement de filtre réinitialise la session de roulette, car les titres tirés dans un autre ensemble de candidats ne doivent pas bloquer le nouvel ensemble.
- Le nombre de candidats est borné par la capacité de découverte déjà disponible. L'interface doit signaler clairement l'absence de candidats ou l'épuisement du jeu courant.
- L'animation est CSS/React et respecte `prefers-reduced-motion`; aucune librairie d'animation n'est ajoutée pour la V1.

## Dependency Graph

```text
CatalogTitleSummary + existing TMDB discovery
                  │
                  ├── pure roulette selection + title keys
                  │           │
                  │           └── picker and session history UI
                  │                         │
                  └── server candidate loader ── roulette page and filters
                                              │
                                              └── Explorer navigation + E2E flow
```

## Task List

### Phase 1: Selection foundation

- Task 1: Implement the pure draw and exclusion rules.
- Task 2: Add the server-side candidate loader and route data contract.

### Checkpoint: Foundation

- Focused roulette tests pass.
- Candidate loading reuses existing TMDB and personal-status boundaries.
- No Supabase migration or client-side secret access was introduced.

### Phase 2: Complete roulette flow

- Task 3: Build the roulette filters and page shell.
- Task 4: Build the animated picker and temporary session history.

### Checkpoint: Core flow

- A user can filter candidates, draw a title, open its detail page, and re-roll without repeating a drawn title.
- Empty, loading, error and exhausted-session states are reachable and understandable.

### Phase 3: Integration and verification

- Task 5: Add the Explorer entry point and browser flow coverage.
- Task 6: Run full quality checks and polish responsive/accessibility behavior.

### Checkpoint: Complete

- All roulette success criteria in `../../features/roulette-selection/SPEC.md` are met.
- Vitest, lint, typecheck, build and the relevant Playwright flow pass.
- The existing catalogue, personal library and detail routes remain unchanged in behavior.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| TMDB discovery returns too few titles for a filter combination | High | Bound the candidate set, show an explicit empty state and let the user broaden filters. |
| Personal status filtering is applied after catalogue discovery | Medium | Reuse the existing user title lookup and apply status matching to normalized summaries before passing data to the client. |
| Re-roll state becomes inconsistent during animation | Medium | Disable draw controls while a timer is active and commit the selected title and history together. |
| Session history is accidentally persisted | High | Keep history in client state only and add a test/inspection check that no server action or migration is added. |
| A new route duplicates fragile Explorer parsing | Medium | Extract only the small shared parsing/option contracts needed by roulette; avoid broad Explorer refactoring in V1. |
| Reduced-motion users wait through a long animation | Low | Use a shorter or zero-duration transition when the media query is active. |

## Open Questions

None blocking implementation. The candidate count and animation duration can use the existing catalogue bounds and a short default without changing the user-facing contract.
