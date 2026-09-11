# Spec: Roulette de sélection

## Objective

Ajouter une roulette de films et de séries dans `streaming-apps`. Une utilisatrice choisit des critères de catalogue et de bibliothèque personnelle, lance un tirage animé, puis arrive sur la fiche du titre sélectionné. Elle peut relancer le tirage si le résultat ne lui convient pas.

La roulette sera disponible sur une page dédiée `/roulette`, avec un accès depuis Explorer. La page dédiée permet de conserver l'état temporaire de la session de roulette sans mélanger ce comportement avec la pagination et la grille de catalogue.

## Assumptions

1. Les titres candidats viennent du catalogue TMDB disponible au Canada sur les services actifs de l'utilisatrice.
2. Les filtres V1 sont le genre, le type (`film`, `série`), la note TMDB minimale et le statut personnel.
3. Le statut vide signifie qu'aucun statut personnel n'est enregistré pour le titre.
4. L'historique est conservé uniquement dans l'état de la page et n'est jamais écrit dans Supabase.
5. Un titre déjà tiré est exclu des tirages suivants de la même session, y compris après un re-roll.
6. La session commence au chargement de `/roulette` et se termine lorsque la page est rechargée ou quittée.
7. Le résultat sélectionné ouvre la fiche existante `/titles/[mediaType]/[tmdbId]`.
8. Si tous les candidats ont déjà été tirés, le re-roll est désactivé et l'interface l'explique.

## Tech Stack

- Next.js App Router 16, React 19 et TypeScript strict
- Supabase pour l'authentification et la lecture des statuts personnels
- TMDB via les modules serveur existants de `lib/tmdb`
- CSS Modules, selon les conventions existantes
- Vitest pour les fonctions de sélection et Playwright pour le parcours principal

## Commands

```text
npm run dev
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Project Structure

```text
app/roulette/                         # Page dédiée et chargement des candidats
components/roulette-filters.tsx       # Filtres de la roulette
components/roulette-picker.tsx       # Animation, résultat et re-roll côté client
components/roulette-history.tsx       # Historique temporaire de la session
lib/roulette/selection.ts             # Sélection déterministe et règles d'exclusion
types/domain.ts                       # Contrats partagés si nécessaire
tests/roulette/                       # Tests unitaires de la sélection et de l'historique
tests/e2e/roulette.spec.ts            # Parcours navigateur principal
```

La récupération TMDB et Supabase reste côté serveur. Le composant client reçoit uniquement une liste réduite de titres candidats et les informations nécessaires à l'affichage.

## Behavior

### Filters

- Le formulaire permet de sélectionner un genre, un type, une note TMDB minimale et un statut personnel.
- Les valeurs par défaut correspondent à tous les genres, films et séries, toutes les notes et tous les statuts.
- Le bouton de tirage est désactivé lorsqu'aucun titre candidat n'est disponible.
- Les filtres sont appliqués avant le tirage et un changement de filtre démarre une nouvelle session de roulette, en vidant l'historique affiché.

### Draw

- Le premier tirage choisit uniformément un titre parmi les candidats filtrés.
- Le titre est ajouté à l'historique de session avant l'affichage final.
- Une animation visuelle indique que le tirage est en cours pendant une courte durée.
- À la fin de l'animation, le titre affiché contient son affiche, son titre, son type, sa note TMDB et un lien ou bouton vers sa fiche.
- Le bouton `Re-roll` effectue un nouveau tirage parmi les candidats qui ne figurent pas dans l'historique.
- Pendant un tirage, les contrôles de tirage et de re-roll sont désactivés pour empêcher les doubles sélections.
- Lorsque tous les candidats ont été tirés, l'interface affiche un état de fin de session et propose de modifier les filtres.

### Session history

- L'historique affiche les titres tirés dans l'ordre inverse du tirage, avec le plus récent en premier.
- Chaque entrée permet d'ouvrir la fiche du titre.
- L'historique est uniquement en mémoire dans le navigateur et ne crée ni table, ni migration, ni enregistrement Supabase.
- La fermeture, la navigation hors de la page ou le rechargement efface l'historique.

### Accessibility and motion

- Les boutons, champs et liens sont utilisables au clavier et possèdent des noms accessibles.
- L'état du tirage est annoncé avec une région `aria-live`.
- `prefers-reduced-motion: reduce` supprime ou raccourcit l'animation sans modifier la logique du tirage.
- Les états chargement, erreur, résultat vide et fin de session sont visibles et compréhensibles sans dépendre de la couleur.

## Code Style

La logique de sélection est indépendante de React et reçoit des titres déjà filtrés :

```ts
export function pickRandomTitle(
  candidates: CatalogTitleSummary[],
  drawnIds: Set<string>,
  random = Math.random,
): CatalogTitleSummary | null {
  const available = candidates.filter(
    (title) => !drawnIds.has(`${title.mediaType}:${title.tmdbId}`),
  );

  if (available.length === 0) return null;
  return available[Math.floor(random() * available.length)];
}
```

Les identifiants de titre combinent `mediaType` et `tmdbId` pour éviter toute collision entre un film et une série partageant un identifiant numérique dans des contrats futurs. Les fonctions de domaine restent nommées, typées et testables sans rendu React.

## Testing Strategy

- Les tests Vitest vérifient la sélection uniforme via une fonction aléatoire injectée, l'exclusion des titres déjà tirés, le résultat `null` lorsque la session est épuisée et la construction de l'identifiant de session.
- Les tests vérifient que les changements de filtres réinitialisent l'historique et qu'un re-roll ne répète jamais un titre tiré.
- Un test d'intégration ou de composant vérifie les états chargement, animation, résultat, re-roll, liste vide et session épuisée.
- Playwright vérifie : ouvrir `/roulette`, appliquer des filtres, lancer un tirage, atteindre la fiche, revenir à la roulette, effectuer un re-roll et voir l'historique de session.
- Les vérifications existantes restent obligatoires : `npm run lint`, `npm run typecheck`, `npm test` et `npm run build`.
- Aucun test ne dépend d'un appel réel à TMDB ni de credentials Supabase.

## Boundaries

- Always: conserver les appels TMDB et Supabase côté serveur, valider les paramètres, exclure les titres déjà tirés, préserver les états accessibles et respecter les conventions de l'application.
- Ask first: ajouter une migration ou une persistance de l'historique, ajouter une dépendance d'animation, modifier le contrat de découverte TMDB, ou étendre les filtres au-delà d'Explorer.
- Never: enregistrer l'historique temporaire dans Supabase, exposer la clé TMDB au client, contourner RLS, répéter silencieusement un titre déjà tiré ou supprimer un test pour faire passer les vérifications.

## Success Criteria

1. Une utilisatrice authentifiée peut ouvrir `/roulette` depuis l'application.
2. Les filtres genre, type, note TMDB minimale et statut personnel modifient la liste des candidats.
3. Le bouton de tirage lance une animation puis affiche un titre candidat avec un accès à sa fiche.
4. Le re-roll sélectionne un titre différent de tous les titres déjà tirés pendant la session.
5. L'historique affiche tous les tirages de la session dans le bon ordre et chaque entrée ouvre la bonne fiche.
6. L'historique disparaît après rechargement ou navigation hors de la page et aucune donnée de roulette n'est persistée.
7. Les états sans résultat, erreur, chargement et session épuisée sont gérés.
8. L'animation respecte la préférence de réduction des mouvements.
9. Les tests, le lint, le typecheck et le build passent.

## Open Questions

Aucune décision fonctionnelle bloquante pour la V1.
