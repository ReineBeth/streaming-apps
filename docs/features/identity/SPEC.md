# Spec: identity

## Objective

Provide Supabase authentication and a user profile foundation. V1 needs one usable account flow while keeping all personal data associated with `auth.users.id`.

## Acceptance Criteria

- A user can sign in using the approved Supabase method.
- Authenticated server requests can resolve the current user safely.
- A profile row is created for a new user and is inaccessible to other users through RLS.
- Unauthenticated users are redirected or shown an appropriate sign-in state for protected routes.

## Boundaries

- Always use Supabase server clients for server data access and validate session state.
- Ask first before adding social providers or account administration.
- Never expose service-role credentials to the browser.
