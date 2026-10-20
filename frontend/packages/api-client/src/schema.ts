/**
 * The one place the app picks its API types.
 *
 * Today: hand-written from docs/api.md (the backend's /openapi.json was unreachable).
 * After `pnpm api:generate` succeeds against the running backend, point these
 * exports at './generated/schema' and fix any type errors it reveals.
 */
export type * from './hand-written/schema';
