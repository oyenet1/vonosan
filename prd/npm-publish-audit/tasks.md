# Tasks: Vonosan Framework npm Publish Fixes

## Implementation Checklist

- [x] 1. Add `./server/openapi` and `./server/route-rules` to vonosan export map
- [x] 2. Add `@hono/zod-validator` as peer dependency to `@vonosan/auth`
- [x] 3. Fix scaffold template: route-rules import path and shape
- [x] 4. Fix scaffold template: `createUnhead` API in generated main.ts
- [x] 5. Fix scaffold template: tsconfig include `*.d.ts`
- [x] 6. Remove stray build artifacts from `packages/cli/src/`
- [x] 7. Add .gitignore rules to prevent future stray artifacts
- [x] 8. Verify build passes after all changes
