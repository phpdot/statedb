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

Then import in your code:

```ts
import { StateDB } from '@phpdot/statedb';
```

Or with CommonJS:

```js
const { StateDB } = require('@phpdot/statedb');
```

## CDN

For use directly in the browser without a build tool:

```html
<!-- Minified (~20KB) -->
<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>

<!-- Non-minified (readable, for development) -->
<script src="https://unpkg.com/@phpdot/statedb/dist/index.js"></script>
```

After loading the script, `StateDB` is available as a global:

```html
<script>
  const db = new StateDB('my-app');
</script>
```

## What's Included

The npm package ships the following files in `dist/`:

| File | Format | Use case |
|------|--------|----------|
| `index.mjs` | ESM | Bundlers (Vite, Webpack, Rollup) |
| `index.cjs` | CJS | Node.js / `require()` |
| `index.js` | IIFE | Browser `<script>` tag (readable) |
| `index.min.js` | IIFE | Browser `<script>` tag (production) |
| `index.d.ts` | TypeScript | Type declarations |
| `index.d.mts` | TypeScript | Type declarations (ESM) |

All files include source maps.

## Requirements

- **Browser**: Any modern browser (ES2020+)
- **Node.js**: 16+ (for ESM/CJS usage)
- **TypeScript**: 4.7+ (optional)

No runtime dependencies.
