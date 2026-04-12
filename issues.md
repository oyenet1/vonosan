# Vonosan Framework Issue Report

Date: 2026-04-10
Project used for validation: [package.json](package.json)
Framework package: [node_modules/vonosan/package.json](node_modules/vonosan/package.json)

## Executive Summary

This project exposes multiple framework-level API and scaffolding inconsistencies in Vonosan `0.2.0`.

The highest impact issues are:
- Package exports do not expose OpenAPI and route-rules subpaths, while related symbols exist internally.
- Runtime and scaffold templates are out of sync for route-rules and head/plugin APIs.
- Build fails because Vonosan server jobs import `node-cron`, but the package does not provide a transitive install path.

## Environment and Reproduction

- OS: Linux
- Runtime: Bun
- Framework: Vonosan `0.2.0`

Commands used:
- `./node_modules/.bin/vite build`
- `./node_modules/.bin/tsc --noEmit --pretty false`
- `bun -e "import('vonosan/server/openapi')..."`
- `bun -e "import('vonosan/server/route-rules')..."`

## Confirmed Issues

### 1) OpenAPI and Route-Rules Are Internal but Not Publicly Exported

Severity: Critical

Expected:
- If Vonosan provides OpenAPI and route-rules utilities internally, they should be importable through declared package exports.

Actual:
- Package exports only expose `./server`, `./client`, `./types`; no `./server/openapi` or `./server/route-rules` path is exported.
- Internal files exist and export the utilities, but consumers cannot import them through package exports.

Evidence:
- [node_modules/vonosan/package.json](node_modules/vonosan/package.json#L23)
- [node_modules/vonosan/package.json](node_modules/vonosan/package.json#L32)
- [node_modules/vonosan/dist/server/openapi/index.d.ts](node_modules/vonosan/dist/server/openapi/index.d.ts#L10)
- [node_modules/vonosan/dist/server/route-rules.d.ts](node_modules/vonosan/dist/server/route-rules.d.ts#L19)

Reproduction output:
- `ResolveMessage: Cannot find module 'vonosan/server/openapi'`
- `ResolveMessage: Cannot find module 'vonosan/server/route-rules'`

Impact:
- Public API is inconsistent with available internals.
- App templates or docs that rely on subpath imports fail.

Suggested framework fix:
- Add export map entries for `./server/openapi` and `./server/route-rules`, or re-export these from `./server` root.

### 2) Route Rules Scaffold Uses Outdated Shape and Wrong Import Source

Severity: Critical

Expected:
- Generated route-rules file should match current Vonosan `RouteRule` schema and import location.

Actual:
- Scaffold uses `import type { RouteRules } from 'vonosan/server'`, but `RouteRules` is not exported from server root.
- Scaffold uses boolean `ssr` keys, while framework expects `mode: 'ssr' | 'spa' | 'prerender'`.

Evidence:
- [src/route-rules.ts](src/route-rules.ts#L11)
- [src/route-rules.ts](src/route-rules.ts#L18)
- [node_modules/vonosan/dist/server/route-rules.d.ts](node_modules/vonosan/dist/server/route-rules.d.ts#L13)
- [node_modules/vonosan/dist/server/route-rules.d.ts](node_modules/vonosan/dist/server/route-rules.d.ts#L19)
- [node_modules/vonosan/dist/server/index.d.ts](node_modules/vonosan/dist/server/index.d.ts#L10)

Impact:
- New projects fail type-check immediately or drift away from framework conventions.

Suggested framework fix:
- Update scaffolder to emit `mode`-based rules.
- Export `RouteRules` from `vonosan/server` root or provide an exported subpath and use it in generated code.

### 3) Nuxt UI Integration in Vonosan Runtime Uses Wrong Import Contract

Severity: High

Expected:
- Runtime helper should import Nuxt UI plugin using the contract exported by installed `@nuxt/ui`.

Actual:
- Vonosan runtime does `const { ui } = await import('@nuxt/ui/vue-plugin')`.
- Current Nuxt UI plugin export is default plugin export.

Evidence:
- [node_modules/vonosan/dist/client/nuxt-ui/setup.js](node_modules/vonosan/dist/client/nuxt-ui/setup.js#L26)
- [node_modules/vonosan/dist/client/nuxt-ui/setup.js](node_modules/vonosan/dist/client/nuxt-ui/setup.js#L29)
- [node_modules/@nuxt/ui/vue-plugin.d.ts](node_modules/@nuxt/ui/vue-plugin.d.ts#L3)
- [node_modules/@nuxt/ui/vue-plugin.d.ts](node_modules/@nuxt/ui/vue-plugin.d.ts#L5)

Impact:
- Plugin registration can fail at runtime depending on consumer usage.

Suggested framework fix:
- Change runtime helper to default import extraction:
  - `const { default: ui } = await import('@nuxt/ui/vue-plugin')`

### 4) Head API in Scaffold Is Version-Misaligned

Severity: High

Expected:
- Generated head setup should match exported APIs of current `@unhead/vue` version.

Actual:
- Scaffold imports `createHead` from `@unhead/vue` root.
- Current root exports include `createUnhead`; `createHead` is not exported from root index in this version.

Evidence:
- [src/main.ts](src/main.ts#L13)
- [src/main.ts](src/main.ts#L21)
- [node_modules/@unhead/vue/dist/index.d.ts](node_modules/@unhead/vue/dist/index.d.ts#L11)

Impact:
- Type-check failure in newly generated apps.

Suggested framework fix:
- Update template to use the correct API path for current dependency version.

### 5) Starter Router References a Page That Is Not Scaffolded

Severity: High

Expected:
- Generated default route should target an existing file.

Actual:
- Router points to `./modules/home/index.page.vue`, but only placeholder exists in modules folder.

Evidence:
- [src/router.ts](src/router.ts#L16)
- [src/modules/.gitkeep](src/modules/.gitkeep)

Impact:
- Route import fails during type-check and at runtime navigation.

Suggested framework fix:
- Scaffold `src/modules/home/index.page.vue` by default, or point default route to an existing component.

### 6) Generated TypeScript Baseline Omits Required App Typings

Severity: High

Expected:
- New app should include Vue and Vite ambient typing baseline.

Actual:
- No app-local `src/**/*.d.ts` exists for Vue module declaration and Vite client env typing.
- Root generated declaration files are outside `tsconfig` include scope.

Evidence:
- [tsconfig.json](tsconfig.json#L18)
- [components.d.ts](components.d.ts)
- [auto-imports.d.ts](auto-imports.d.ts)

Impact:
- Errors such as unresolved `.vue` modules and missing ambient types in strict setups.

Suggested framework fix:
- Ensure generated `tsconfig` includes root `*.d.ts` files or generate `src/env.d.ts` with Vite + Vue declarations.

### 7) Build Fails on Missing node-cron from Vonosan Server Jobs Runner

Severity: Critical

Expected:
- Full build should not fail due to unresolved framework internal module.

Actual:
- Vite build fails with Rolldown unresolved import `node-cron` from Vonosan server jobs runner.
- Vonosan package does not declare `node-cron` in dependencies or optional peer dependencies.

Evidence:
- [node_modules/vonosan/dist/server/jobs/runner.js](node_modules/vonosan/dist/server/jobs/runner.js#L37)
- [node_modules/vonosan/dist/server/jobs/runner.js](node_modules/vonosan/dist/server/jobs/runner.js#L40)
- [node_modules/vonosan/package.json](node_modules/vonosan/package.json)
- [node_modules/vonosan/dist/vite/index.js](node_modules/vonosan/dist/vite/index.js#L181)

Observed build error excerpt:
- `Rolldown failed to resolve import "node-cron" from ".../node_modules/vonosan/dist/server/jobs/runner.js"`

Impact:
- Production build fails in clean installs unless consumers manually discover and install extra package.

Suggested framework fix:
- Add `node-cron` as dependency, or explicitly externalize/guard import in framework build strategy.

## Additional DX Concern

### 8) Strict Type-Check Surfaces Large Third-Party Declaration Failures

Severity: Medium

Observation:
- `tsc --noEmit` reports a large number of errors from `node_modules/drizzle-orm/*` declarations.

Impact:
- New projects appear broken despite app code being minimal.

Suggested framework fix:
- Consider a starter `tsconfig` with `skipLibCheck: true` for initial DX, or pin known compatible versions in framework guidance.

## Priority Recommendations for Framework Maintainer

1. Fix package exports first (`server/openapi`, `server/route-rules`) and/or root re-exports.
2. Patch scaffold templates (`route-rules`, `main.ts`, default route page generation).
3. Fix `setupNuxtUI` import contract to default plugin import.
4. Resolve `node-cron` packaging/build contract so clean builds pass.
5. Harden starter TypeScript baseline (`.d.ts` includes and environment typing).
OK