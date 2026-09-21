# Organize AshokMart project files

## Scope
Reorganize only application-owned source files whose names or locations are unclear. Preserve all file contents, behavior, URLs, UI, database schema, and API behavior.

## Changes
- Keep TanStack route filenames and route folders unchanged because their paths define public URLs and authentication layouts.
- Keep generated and platform-managed files unchanged, including `routeTree.gen.ts`, backend integration files, package files, and framework configuration.
- Group shared React code by purpose under `src/components/` (layout, product, reviews, assistant, and branding/navigation) while retaining the existing component names.
- Rename the broad `useAshokMart.ts` hook module to a purpose-based account/data hook name and update every import.
- Group app-owned service modules under `src/services/` with clear names for authentication, cart, and assistant behavior; preserve the required `.functions.ts` suffix for the server function.
- Keep numbered SQL migrations and their metadata unchanged because migration filenames are execution history. Add no migrations and make no database changes.
- Update documentation references only where moved source paths are described.

## Validation
- Search the full repository for every old path and ensure no stale imports or references remain.
- Run TypeScript validation and the existing production build.
- Open the running app and verify the sign-in page loads without browser errors.
