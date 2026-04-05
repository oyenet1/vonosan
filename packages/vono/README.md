# vono

Vono core runtime — config, composables, SSR helpers, and Vite plugin for building fullstack Vue applications.

## Features

- 🔧 **Vite Plugin** — First-class Vite integration for dev and production builds
- 🖥️ **SSR Helpers** — Server-side rendering utilities with streaming support
- 🧩 **Composables** — Vue composables for state, head, routing, and more
- 🌐 **Server Runtime** — Hono-based server with middleware, sessions, and DB integration
- 📦 **Module System** — Extensible module architecture

## Installation

```bash
npm install vono
```

## Exports

| Entry         | Description                        |
| ------------- | ---------------------------------- |
| `vono`        | Core config and shared utilities   |
| `vono/vite`   | Vite plugin                        |
| `vono/server` | Server runtime (Hono, middleware)  |
| `vono/client` | Client-side composables            |
| `vono/types`  | TypeScript type definitions        |

## Quick Start

```ts
// vite.config.ts
import { vonoPlugin } from "vono/vite";

export default {
  plugins: [vonoPlugin()],
};
```

## Peer Dependencies

- **Required**: `vue`, `vue-router`
- **Optional**: `hono`, `@unhead/vue`, `pinia`, `drizzle-orm`, `zod`

## License

MIT © Bowofade Oyerinde
