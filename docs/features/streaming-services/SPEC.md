# Spec: streaming-services

## Objective

Store the service catalogue independently from user subscriptions so services can be added, removed or renamed without code changes.

## Acceptance Criteria

- `streaming_services` stores the TMDB provider id, display name and optional logo path.
- `user_streaming_services` stores one active flag per user and service.
- Initial seed data includes Crave, Disney+ and Apple TV+ with their TMDB provider ids documented in the migration.
- Settings can read and update the authenticated user's active services.
- RLS prevents one user from reading or changing another user's subscriptions.
