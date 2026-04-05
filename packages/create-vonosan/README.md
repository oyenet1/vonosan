# create-vonosan

Interactive project scaffolder for Vonosan.

## Usage

```bash
bun create vonosan@latest
```

You can also pass a project name directly:

```bash
bun create vonosan@latest my-app
```

If no name is provided, the wizard prompts for a project name.

## Wizard Highlights

- Language: TypeScript or JavaScript
- Project mode: Full-stack or API
- Deployment targets:
  - Bun (self-hosted)
  - Node.js (self-hosted)
  - Bun (Docker)
  - Node.js (Docker)
  - Cloudflare Workers
  - Cloudflare Pages
  - Vercel
  - Netlify
  - Deno Deploy
  - AWS Lambda
- Queue driver:
  - BullMQ (with backend choice)
  - Cloudflare Queues (only shown for Cloudflare deployment targets)
- BullMQ backend options:
  - ioredis
  - redis (node-redis)
  - Upstash Redis (Redis URL)
- Cache driver:
  - Upstash Redis
  - ioredis
  - Cloudflare KV (only shown for Cloudflare deployment targets)
- WebSocket driver (when WebSocket feature is selected):
  - Native WebSocket
  - Socket.IO
  - Cloudflare WebSocket (only shown for Cloudflare deployment targets)

## Native WebSocket Runtime Notes

When `Native WebSocket` is selected, generated projects use official Hono runtime adapters:

- Bun: `hono/bun` (`upgradeWebSocket`, `websocket`)
- Node.js: `@hono/node-ws` + `@hono/node-server`
- Cloudflare Workers/Pages: `hono/cloudflare-workers`
- Deno: `hono/deno`

When `Cloudflare WebSocket` is selected, generated projects scaffold
`upgradeWebSocket` routes via `hono/cloudflare-workers`.

## Docker Scaffolding

When a Docker deployment target is selected, these files are generated:

- Dockerfile
- docker-compose.yml
- docker-stack.yml (Docker Swarm stack)
- .dockerignore

## Drizzle ORM

Generated projects use standard Drizzle ORM dependency:

- drizzle-orm
- drizzle-kit

Reference docs:

- https://orm.drizzle.team/docs/overview

## CLI Commands In Generated App

Generated app package scripts include:

- bun run lint
- bun run migrate:make
- bun run migrate:run
- bun run make:module -- users

These scripts call a local fallback runner at:

- scripts/vono-cli.mjs

It tries, in order:

1. Local node_modules/.bin/vonosan
2. bunx @vonosan/cli
3. npx @vonosan/cli

So project install does not hard-fail if @vonosan/cli is temporarily unavailable on npm.

## Single Port Mode

Generated defaults use one port for the full app (Hono serves everything):

- PORT=4000
- APP_URL=http://localhost:4000
- CLIENT_URL=http://localhost:4000
- ALLOWED_ORIGINS=http://localhost:4000

The Vonosan CLI package remains:

- @vonosan/cli

Scaffolds also include provider files under:

- src/jobs/queue.provider.ts
- src/shared/ws/*

## Automated Publishing and Releases

Repository workflow:

- .github/workflows/release-packages.yml

On release tags (v*), it will:

1. Build and pack all packages
2. Create GitHub release assets
3. Publish non-private workspace packages to npm

Required GitHub secret for npm publish:

- NPM_TOKEN
