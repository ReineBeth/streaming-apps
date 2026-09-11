# Roulette de sélection — tâches

Référence : [SPEC.md](../../features/roulette-selection/SPEC.md)

## Phase 1 — Sélection foundation

- [x] Task 1: Implement the pure draw and exclusion rules
  - Description: Ajouter les types/helpers de clé de titre et une fonction pure qui choisit un candidat disponible, exclut les titres déjà tirés et retourne `null` lorsque la session est épuisée.
  - Acceptance:
    - [ ] Un film et une série sont distingués par la paire `mediaType:tmdbId`.
    - [ ] Un titre présent dans l'historique ne peut jamais être retourné.
    - [ ] Un jeu vide retourne `null` sans exception.
    - [ ] La source aléatoire est injectable pour rendre les tests déterministes.
  - Verify: `npm test -- tests/roulette/selection.test.ts`; `npm run typecheck`.
  - Dependencies: None.
  - Files likely touched: `lib/roulette/selection.ts`, `tests/roulette/selection.test.ts`.
  - Estimated scope: Small.

- [x] Task 2: Add the server-side candidate loader and route data contract
  - Description: Construire la récupération serveur des candidats à partir des providers actifs, de la découverte TMDB et des statuts personnels, avec les filtres genre, type, note minimale et statut.
  - Acceptance:
    - [ ] Les appels TMDB et Supabase restent côté serveur.
    - [ ] Les résultats sont réduits à `CatalogTitleSummary` ou à un contrat équivalent sans payload TMDB brut.
    - [ ] Le statut vide sélectionne les titres sans ligne personnelle ou sans statut.
    - [ ] Les erreurs et l'absence de providers sont représentables par le contrat de route.
  - Verify: tests unitaires des paramètres de découverte et du mapping; `npm run typecheck`; `npm run lint`.
  - Dependencies: Task 1; existing `tmdb-catalog` and `personal-library` contracts.
  - Files likely touched: `lib/roulette/candidates.ts`, `types/domain.ts` if required, `tests/roulette/candidates.test.ts`.
  - Estimated scope: Medium.

## Checkpoint: Foundation

- [x] Tests ciblés de sélection et de candidats passent.
- [x] Les secrets TMDB restent uniquement dans les modules serveur.
- [x] Aucun fichier Supabase de migration n'a été ajouté.

## Phase 2 — Complete roulette flow

- [x] Task 3: Build the roulette filters and page shell
  - Description: Ajouter la route `/roulette`, le formulaire de filtres et les états serveur de chargement, erreur, vide et résultats disponibles.
  - Acceptance:
    - [ ] La route est accessible aux utilisatrices authentifiées selon les conventions existantes.
    - [ ] Les filtres genre, type, note TMDB minimale et statut sont accessibles au clavier.
    - [ ] Modifier les filtres recharge les candidats et réinitialise la session côté client.
    - [ ] Les états sans résultat et erreur expliquent quoi faire ensuite.
  - Verify: `npm run lint`; `npm run typecheck`; `npm run build`; vérification manuelle de `/roulette`.
  - Dependencies: Task 2.
  - Files likely touched: `app/roulette/page.tsx`, `app/roulette/page.module.css`, `components/roulette-filters.tsx`, `components/roulette-filters.module.css`.
  - Estimated scope: Medium.

- [x] Task 4: Build the animated picker and temporary session history
  - Description: Ajouter le composant client qui anime le tirage, désactive les contrôles pendant la transition, affiche le résultat, gère le re-roll et montre l'historique en mémoire.
  - Acceptance:
    - [ ] Le premier tirage et chaque re-roll excluent tous les titres déjà tirés.
    - [ ] Le résultat contient l'affiche, le titre, le type, la note TMDB et un lien vers la fiche.
    - [ ] L'historique affiche les tirages du plus récent au plus ancien et permet d'ouvrir chaque fiche.
    - [ ] Le re-roll est désactivé pendant l'animation et lorsque le jeu est épuisé.
    - [ ] `prefers-reduced-motion` réduit ou supprime l'animation.
  - Verify: tests de composant ou d'intégration sur tirage/re-roll/historique; `npm run typecheck`; `npm run build`.
  - Dependencies: Tasks 1 and 3.
  - Files likely touched: `components/roulette-picker.tsx`, `components/roulette-picker.module.css`, `components/roulette-history.tsx`, `components/roulette-history.module.css`, `tests/roulette/roulette-flow.test.tsx` if the repository's test setup supports it.
  - Estimated scope: Medium.

## Checkpoint: Core flow

- [ ] Un tirage aboutit à un titre et à sa fiche.
- [ ] Le re-roll ne répète jamais un titre de la session.
- [ ] L'historique reste temporaire et disparaît après rechargement.
- [ ] Les états chargement, erreur, vide et session épuisée sont vérifiés.

## Phase 3 — Integration and verification

- [x] Task 5: Add the Explorer entry point and browser flow coverage
  - Description: Ajouter un accès visible depuis Explorer et couvrir le parcours navigateur principal de la roulette.
  - Acceptance:
    - [ ] Explorer permet d'ouvrir `/roulette` avec un nom accessible.
    - [ ] Le test navigateur peut filtrer, tirer, ouvrir une fiche, revenir et effectuer un re-roll.
    - [ ] Le test confirme la présence des entrées d'historique après plusieurs tirages.
  - Verify: `npm run test:e2e:auth -- --grep "roulette exposes filters"` avec l'environnement de test configuré; `npm run lint`. Le test reste bloqué localement par la connexion Supabase de l'environnement.
  - Dependencies: Tasks 3 and 4.
  - Files likely touched: `app/explorer/page.tsx` or its shared navigation component, `tests/e2e/roulette.spec.ts`, related route styles only if required.
  - Estimated scope: Small.

- [ ] Task 6: Run full quality checks and polish responsive/accessibility behavior
  - Description: Vérifier le parcours complet sur les tailles d'écran supportées, corriger les problèmes révélés et documenter la validation finale.
  - Acceptance:
    - [ ] La mise en page reste utilisable sur mobile et desktop.
    - [ ] Les contrôles et les changements d'état sont compréhensibles avec clavier et lecteur d'écran.
    - [ ] Aucune régression n'apparaît dans les tests existants.
  - Verify: `npm test`; `npm run lint`; `npm run typecheck`; `npm run build`; `npm run test:e2e:responsive` si l'environnement est disponible.
  - Dependencies: Task 5.
  - Files likely touched: roulette CSS/components and focused tests only.
  - Estimated scope: Medium.

## Checkpoint: Complete

- [ ] Tous les critères de succès de `../../features/roulette-selection/SPEC.md` sont vérifiés.
- [ ] Les vérifications Vitest, lint, typecheck et build passent.
- [ ] Le parcours Playwright pertinent passe lorsque les credentials de test sont disponibles.
