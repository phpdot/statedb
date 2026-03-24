---
layout: home
hero:
  name: StateDB
  text: Reactive Database for JavaScript
  tagline: MongoDB-style queries, real-time watchers, schema validation — zero dependencies, ~20KB minified.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/installation
    - theme: alt
      text: API Reference
      link: /api/statedb
    - theme: alt
      text: GitHub
      link: https://github.com/phpdot/statedb

features:
  - icon: "{ }"
    title: MongoDB-Style API
    details: Familiar query syntax with $gt, $in, $regex, $set, $inc, $push and more. If you know MongoDB, you know StateDB.
  - icon: "\u26A1"
    title: Reactive Watchers
    details: Subscribe to insert, update, delete events per collection. Your UI re-renders automatically when data changes.
  - icon: "\u2714"
    title: Schema Validation
    details: Type checking, required fields, min/max, enum, regex, defaults, and capped collections — validated on every write.
  - icon: "\uD83D\uDD0D"
    title: Indexes
    details: Single and compound indexes with unique constraints. Queries use the best index automatically — up to 145x faster.
  - icon: "\uD83D\uDD17"
    title: Hooks (Middleware)
    details: Pre/post hooks for insert, update, delete. Pre-hooks can modify data or abort operations.
  - icon: "\uD83D\uDCBE"
    title: Persistence
    details: Optional auto-save to localStorage or sessionStorage with debounce. Data survives page reloads.
  - icon: "\uD83D\uDCE6"
    title: Zero Dependencies
    details: Single ~20KB minified file. Ships as ESM, CJS, and IIFE. Works in browsers, Node.js, and any JS runtime.
  - icon: "\uD83D\uDCD8"
    title: TypeScript
    details: Fully typed with exported interfaces. First-class TypeScript support out of the box.
---

<div style="text-align: center; padding: 40px 20px 0;">

## Install

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

```html [CDN]
<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
```

:::

</div>
