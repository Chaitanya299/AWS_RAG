# Complete End-to-End Vercel Fix Plan

## The Root Cause
1. **Directory Flattening**: The frontend files (`package.json`, `vite.config.ts`, and the React `src/` directory) are currently sitting in the **root** directory of the repository. Vercel's configuration (`vercel.json`) expects them to be in a `frontend/` directory.
2. **TanStack Router Splitting**: Vercel fails with `ENOENT` during the `tsr-split=component` phase because the imports for files like `settings-store` lack explicit extensions (`.ts`/`.tsx`). In strict ESM environments, extension-less imports fail during virtual file compilation.

## Execution Steps

### Phase 1: Directory Realignment
Move all frontend configuration and source files from the root into a dedicated `frontend/` directory.
1. `mkdir -p frontend/src`
2. Move the frontend source files: `mv src/components src/hooks src/lib src/routes src/router.tsx src/routeTree.gen.ts src/styles.css frontend/src/`
3. Move frontend configs: `mv package.json package-lock.json vite.config.ts tsconfig.json components.json eslint.config.js bun.lockb bunfig.toml wrangler.jsonc node_modules frontend/`

### Phase 2: Explicit Extensions Fix
Run a script to update all internal imports within `frontend/src/` to include `.ts` or `.tsx` extensions.
1. Check `frontend/src/routes/index.tsx` and ensure `import { useSettings } from "@/lib/settings-store";` becomes `import { useSettings } from "@/lib/settings-store.ts";`.
2. Do the same for `api-client.ts`, `session-logs.ts`, `types.ts`, and all `ui` and `dashboard` components.

### Phase 3: Build Verification
1. Run `cd frontend && npm run build` to verify the Vite build completes with zero errors.
2. Commit and push the fixes.
