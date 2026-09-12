# Plan : session de sélection partagée

1. Ajouter le modèle Supabase pour les sessions, participants, titres et votes.
2. Ajouter la création d’une session à partir des filtres et la génération d’un lien.
3. Ajouter la page de participation par lien, avec identification temporaire de l’invité.
4. Ajouter l’interface de cartes, les actions swipe droite/gauche et les boutons accessibles.
5. Ajouter le calcul et l’affichage des titres communs.
6. Vérifier l’expiration, les accès par jeton et les états incomplets.

## Risques

- Un lien partagé est une autorisation; sa révocation et son expiration doivent être vérifiables côté serveur.
- Une liste TMDB paginée peut contenir moins de dix titres après filtrage; la session doit conserver une liste stable.
- Le geste de swipe doit rester utilisable au clavier et sur écran tactile.
