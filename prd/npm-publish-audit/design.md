# Design: Vonosan Framework npm Publish Fixes

## Architecture

No architecture changes required. All fixes are configuration/packaging corrections within the existing monorepo structure.

## Changes by Package

### 1. `packages/vonosan/package.json`

**Export Map Additions:**
```json
"./server/openapi": {
  "import": "./dist/server/openapi/index.js",
  "types": "./dist/server/openapi/index.d.ts"
},
"./server/route-rules": {
  "import": "./dist/server/route-rules.js",
  "types": "./dist/server/route-rules.d.ts"
}
```

### 2. `packages/auth/package.json`

**Add `@hono/zod-validator` as peer dependency:**
```json
"peerDependencies": {
  "@hono/zod-validator": ">=0.7.0",
  ...existing
}
```

### 3. `packages/create-vonosan/src/templates.ts`

**Fix route-rules import path:** Change from `vonosan/server` to `vonosan/server/route-rules`.

**Fix main.ts head API:** Change `createHead` to `createUnhead` in generated `src/main.ts`.

**Fix tsconfig include:** Add `*.d.ts` to the include array.

### 4. Stray Build Artifacts

**Delete:** All `.js`, `.d.ts`, `.js.map`, `.d.ts.map` files in `packages/cli/src/`.

**Add `.gitignore`:** Root-level rule to prevent compiled artifacts in `src/`.

## Data Model

No changes.

## Interfaces

No changes to public API interfaces — only fixing export map so existing interfaces are reachable.
