# Installation

## Package Manager

::: code-group

```bash [npm]
npm install @phpdot/statedb
```

```bash [yarn]
yarn add @phpdot/statedb
```

```bash [pnpm]
pnpm add @phpdot/statedb
```

:::

```ts
// ESM
import { StateDB } from '@phpdot/statedb';

// CJS
const { StateDB } = require('@phpdot/statedb');
```

## CDN

```html
<!-- Production -->
<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>

<!-- Development -->
<script src="https://unpkg.com/@phpdot/statedb/dist/index.js"></script>
```

```html
<script>
  const db = new StateDB('my-app');
</script>
```

## What's Included

| File | Format | Use case |
|------|--------|----------|
| `index.mjs` | ESM | Bundlers (Vite, Webpack, Rollup) |
| `index.cjs` | CJS | Node.js / `require()` |
| `index.js` | IIFE | Browser `<script>` tag (readable) |
| `index.min.js` | IIFE | Browser `<script>` tag (production) |
| `index.d.ts` | TypeScript | Type declarations |

All files include source maps. No runtime dependencies.
