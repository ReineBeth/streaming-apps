# Spec: series-tracking

## Objective

Keep the V1 title-level series workflow simple while reserving a clean extension point for seasons and episodes.

## Acceptance Criteria

- V1 does not require episode-level UI.
- The data model does not make future season or episode records conflict with title-level status.
- A future migration can add seasons and episodes using TMDB identifiers and user-scoped progress without rewriting `user_titles`.
