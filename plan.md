# Architecture Restoration Plan

## Current Broken State
- Backend Python files (`src/main.py`, `src/application`, `src/infrastructure`, etc.) were accidentally deleted during a `git stash pop`.
- Frontend React files (`components`, `routes`, `lib`, etc.) were dumped into the root `src/` directory instead of `frontend/src/`.
- Vercel build fails with `ENOENT` because it expects frontend code in `frontend/src/`.

## Phase 1: Frontend Realignment
1. Ensure the `frontend/src/` directory exists.
2. Move all frontend-specific folders and files from the root `src/` to `frontend/src/`:
   - `components/`, `hooks/`, `lib/`, `routes/`
   - `router.tsx`, `routeTree.gen.ts`, `styles.css`
3. Verify that `frontend/package.json` and `frontend/vite.config.ts` are correctly in place.

## Phase 2: Backend Restoration
1. Use Git to restore the missing backend files from the last known good commit (`8099dd6` or `d7c51ea`).
   - Run: `git checkout 8099dd6 -- src/main.py src/application src/domain src/infrastructure src/shared config/`
2. Apply the final production updates to `src/application/rag_service.py` (e.g., removing Redis, adding `DomainBoundaryException` fallback) that were made *after* that commit.
3. Ensure the root `requirements.txt` is intact and doesn't contain `redis`.

## Phase 3: Build Verification
1. Run `cd frontend && npm run build`.
2. Ensure Vercel can successfully resolve all imports and emit the production assets without `ENOENT` errors.
