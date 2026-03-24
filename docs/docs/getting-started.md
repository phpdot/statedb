# Getting Started

StateDB is a lightweight, zero-dependency reactive database for JavaScript and TypeScript. It provides a MongoDB-style API with real-time watchers, schema validation, indexes, and optional persistence.

## Quick Example

```ts
import { StateDB } from '@phpdot/statedb';

const db = new StateDB('mydb');
const users = db.createCollection('users');

// Insert
users.insertOne({ name: 'Omar', age: 30, role: 'admin' });

// Query with operators
users.find({ age: { $gte: 25 } }).sort({ age: -1 }).toArray();

// Update
users.updateOne({ name: 'Omar' }, { $set: { age: 31 }, $inc: { logins: 1 } });

// Watch for changes — your UI re-renders automatically
users.watch((event, docs) => {
  console.log(event, docs);
});

// Delete
users.deleteMany({ role: 'guest' });
```

## Why StateDB?

- You need client-side data with a **familiar query syntax**
- You want **reactive UI updates** without React/Vue/Angular
- You want to **drop in a single `<script>` tag** and start working
- You're building with **Livewire, HTMX, Alpine, or vanilla JS**

## Next Steps

- [Installation](/docs/installation) — npm, CDN, ESM/CJS
- [CRUD Operations](/docs/crud) — insert, find, update, delete
- [Watchers](/docs/watchers) — reactive UI patterns
