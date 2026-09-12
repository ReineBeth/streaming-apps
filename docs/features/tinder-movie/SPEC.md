# Spécification : session de sélection partagée

## Objectif

Permettre à une personne de créer une session de sélection de films ou de séries, puis de partager un lien avec un autre participant, membre ou invité. Chaque participant évalue une même sélection d’environ dix titres avec une action positive ou négative. Quand les deux participants ont terminé, l’application affiche les titres aimés par les deux.

## Parcours cible

1. Le créateur ouvre la page de sélection partagée.
2. Il choisit les filtres : statut, note personnelle, type et genre.
3. L’application crée une session et génère un lien partageable.
4. L’autre participant ouvre le lien sans devoir créer de compte.
5. Les deux participants évaluent chaque titre avec un swipe vers la droite ou la gauche. Des boutons accessibles permettent aussi de choisir sans geste tactile.
6. Quand les deux participants ont terminé, l’application affiche les titres aimés par les deux.

## Règles fonctionnelles

- Une session contient exactement dix titres lorsque le catalogue permet de les trouver; elle peut en contenir moins si les filtres ne donnent pas assez de résultats.
- Les deux participants reçoivent la même liste et la même séquence de titres.
- Un titre commun est un titre accepté par les deux participants.
- Le créateur peut partager le lien avec un membre ou un non-membre.
- Le participant invité est identifié par un nom temporaire saisi à son arrivée; aucune création de compte n’est requise.
- Le lien utilise un jeton aléatoire non devinable et possède une date d’expiration configurable côté serveur.
- La session est limitée à deux participants. Un troisième visiteur voit un état de session complète.
- Les filtres sont enregistrés dans la session et ne changent plus après le premier swipe.

## Filtres

- Statut personnel : tous, à voir, en cours, vu, abandonné, pas intéressé.
- Note personnelle minimale : aucune, Bon, Très bon, Chef-d’œuvre.
- Type : films, séries, films et séries.
- Genre : un genre ou tous.

## Données et sécurité

- Les titres de la session sont copiés dans la session pour garantir que les deux participants voient exactement la même liste.
- Les votes sont liés à un participant de session, jamais directement à un compte lorsque l’utilisateur est invité.
- Le créateur connecté peut consulter et fermer ses sessions.
- Un participant ne peut lire ou modifier que la session dont il possède le jeton de participation.
- Le lien ne contient aucune donnée personnelle ni clé Supabase.

## Vérification

- Un créateur peut générer une session et copier son lien.
- Un membre et un invité peuvent rejoindre la session.
- Les deux participants voient les dix mêmes titres.
- Les votes positifs et négatifs sont persistés après rechargement.
- Le résultat commun apparaît seulement lorsque les deux participants ont terminé.
- Les filtres réduisent effectivement la liste initiale.
- Les boutons clavier et tactiles fonctionnent en plus du swipe.

## Hypothèses à valider

- Une session expire après 24 heures.
- Le nom temporaire de l’invité est libre, entre 1 et 40 caractères.
- Le créateur est automatiquement le premier participant.
- Les résultats ne sont pas ajoutés automatiquement à la liste personnelle d’un participant.
