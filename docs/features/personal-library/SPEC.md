# Spec: personal-library

## Objective

Persist the user's relationship to a TMDB title: status, optional personal rating, watchlist membership and watched date.

## Acceptance Criteria

- A title is uniquely identified per user by TMDB id and media type.
- Status is one of `to_watch`, `in_progress`, `watched`, `abandoned` or `not_interested`.
- Ratings accept half-star increments from 0.5 through 5 and are only allowed when status is `watched`.
- Marking a title watched records `watched_at`; changing its status follows documented update semantics.
- History, watchlist and status queries are indexed and protected by RLS.
