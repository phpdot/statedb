# StateDB

[![npm version](https://img.shields.io/npm/v/@phpdot/statedb.svg)](https://www.npmjs.com/package/@phpdot/statedb)
[![license](https://img.shields.io/npm/l/@phpdot/statedb.svg)](https://github.com/phpdot/statedb/blob/main/LICENSE)
[![tests](https://img.shields.io/badge/tests-133%20passed-brightgreen.svg)](https://github.com/phpdot/statedb)
[![zero deps](https://img.shields.io/badge/dependencies-0-blue.svg)](https://www.npmjs.com/package/@phpdot/statedb)
[![gzip size](https://img.shields.io/badge/gzip-~7KB-blue.svg)](https://www.npmjs.com/package/@phpdot/statedb)

Lightweight, zero-dependency reactive database for JavaScript and TypeScript. MongoDB-style queries, update operators, indexes, schema validation, and a built-in watcher system for real-time UI reactivity. Optional localStorage/sessionStorage persistence.

Built for developers who think in **collections, queries, and CRUD** — not observables, reducers, or stores.

## Why StateDB?

- You need client-side data with a **familiar query syntax** (MongoDB-style)
- You want **reactive UI updates** without React/Vue/Angular
- You want to **drop in a single `<script>` tag** and start working
- You don't want to learn RxJS, Redux, or a new state management paradigm
- You're building with **Livewire, HTMX, Alpine, or vanilla JS** and need structured client-side state

## Install

```bash
npm install @phpdot/statedb
```

### CDN

```html
<!-- Minified (~20KB) -->
<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>

<!-- Non-minified (readable) -->
<script src="https://unpkg.com/@phpdot/statedb/dist/index.js"></script>

<script>
  const db = new StateDB('my-app');
</script>
```

### ESM / CJS

```ts
// ESM
import { StateDB } from '@phpdot/statedb';

// CJS
const { StateDB } = require('@phpdot/statedb');
```

## Quick Start

```ts
import { StateDB } from '@phpdot/statedb';

// Create a database and collection
const db = new StateDB('mydb');
const users = db.createCollection('users');

// Insert documents
users.insertOne({ name: 'Omar', age: 30, role: 'admin' });
users.insertMany([
  { name: 'Ali', age: 25, role: 'user' },
  { name: 'Sara', age: 28, role: 'admin' },
]);

// Query with MongoDB operators
const admins = users.find({ role: 'admin' }).sort({ age: -1 }).toArray();
// [{ name: 'Omar', age: 30, ... }, { name: 'Sara', age: 28, ... }]

// Update with operators
users.updateOne({ name: 'Ali' }, { $set: { role: 'admin' }, $inc: { age: 1 } });

// React to changes
users.watch((event, docs) => {
  console.log(event, docs); // 'update', [{ name: 'Ali', ... }]
});

// Delete
users.deleteMany({ role: 'user' });
```

---

## Features

### CRUD Operations

```ts
const users = db.createCollection('users');

// Insert
const doc = users.insertOne({ name: 'Omar', age: 30 });
// → { __inc: 1, name: 'Omar', age: 30 }

const docs = users.insertMany([{ name: 'Ali' }, { name: 'Sara' }]);

// Find
users.find().toArray();                          // all documents
users.find({ role: 'admin' }).toArray();         // with query
users.findOne({ name: 'Omar' });                 // single document
users.findOne({ __inc: 1 });                     // by ID (O(1) lookup)

// Helpers
users.count({ role: 'admin' });                  // count matching
users.exists({ name: 'Omar' });                  // true/false
users.first();                                   // first document
users.last();                                    // last document

// Update
users.updateOne({ name: 'Omar' }, { $set: { age: 31 } });
users.updateMany({ role: 'user' }, { $set: { active: true } });
users.replaceOne({ name: 'Omar' }, { name: 'Omar H', age: 31 });
users.upsertOne({ email: 'new@test.com' }, { name: 'New', email: 'new@test.com' });

// Delete
users.deleteOne({ name: 'Omar' });
users.deleteMany({ active: false });
users.drop();                                    // remove all documents
```

Every document gets an auto-incrementing `__inc` field used as the primary key. This is never reused, even after deletes.

---

### Query Operators

Full MongoDB-style query syntax with dot notation for nested fields.

| Comparison | Logical | Array | Element | Evaluation |
|-----------|---------|-------|---------|------------|
| `$eq` `$ne` | `$and` | `$all` | `$exists` | `$regex` |
| `$gt` `$gte` | `$or` | `$elemMatch` | `$type` | |
| `$lt` `$lte` | `$not` | `$size` | | |
| `$in` `$nin` | `$nor` | | | |

```ts
// Comparison
users.find({ age: { $gt: 25, $lte: 35 } });

// Logical
users.find({ $or: [{ role: 'admin' }, { age: { $gte: 30 } }] });
users.find({ $and: [{ active: true }, { $not: { role: 'guest' } }] });

// Array
users.find({ tags: { $all: ['js', 'ts'] } });
users.find({ scores: { $elemMatch: { $gte: 90 } } });
users.find({ tags: { $size: 3 } });

// Element
users.find({ email: { $exists: true } });
users.find({ age: { $type: 'number' } });

// Regex
users.find({ name: { $regex: /^om/i } });

// Inclusion
users.find({ status: { $in: ['active', 'pending'] } });
users.find({ role: { $nin: ['banned'] } });

// Dot notation (nested fields)
users.find({ 'address.city': 'Dubai' });
users.find({ 'profile.settings.theme': 'dark' });
```

---

### Update Operators

| Field | Numeric | Array |
|-------|---------|-------|
| `$set` `$unset` | `$inc` `$mul` | `$push` `$pop` |
| `$rename` | `$min` `$max` | `$pull` `$pullAll` |
| `$currentDate` | | `$addToSet` |

```ts
// Set fields (supports dot notation)
users.updateOne({ name: 'Omar' }, {
  $set: { 'address.city': 'Dubai', active: true },
});

// Increment / multiply
users.updateOne({ __inc: 1 }, { $inc: { loginCount: 1 } });
users.updateOne({ __inc: 1 }, { $mul: { price: 1.1 } });

// Min / max (only updates if new value is lower/higher)
users.updateOne({ __inc: 1 }, { $min: { lowest: 5 }, $max: { highest: 100 } });

// Remove fields
users.updateOne({ __inc: 1 }, { $unset: { tempField: '' } });

// Rename fields
users.updateOne({ __inc: 1 }, { $rename: { oldName: 'newName' } });

// Set current date
users.updateOne({ __inc: 1 }, { $currentDate: { updatedAt: true } });

// Array: push
users.updateOne({ __inc: 1 }, { $push: { tags: 'new' } });
users.updateOne({ __inc: 1 }, {
  $push: { tags: { $each: ['a', 'b'], $position: 0 } },
});

// Array: add unique
users.updateOne({ __inc: 1 }, { $addToSet: { tags: 'unique' } });
users.updateOne({ __inc: 1 }, { $addToSet: { tags: { $each: ['a', 'b'] } } });

// Array: remove
users.updateOne({ __inc: 1 }, { $pull: { tags: 'old' } });
users.updateOne({ __inc: 1 }, { $pullAll: { tags: ['a', 'b'] } });
users.updateOne({ __inc: 1 }, { $pop: { tags: 1 } });   // last
users.updateOne({ __inc: 1 }, { $pop: { tags: -1 } });  // first

// Simple merge (no operators — merges fields directly)
users.updateOne({ __inc: 1 }, { name: 'Omar H', age: 31 });
```

---

### Chainable Queries

```ts
users.find({ active: true })
  .sort({ age: -1 })          // sort descending
  .skip(10)                    // pagination offset
  .limit(5)                    // max results
  .project({ name: 1, age: 1 }) // include only these fields
  .toArray();                  // execute and return array

// Iteration helpers
users.find().forEach((doc) => console.log(doc));
users.find().map((doc) => doc.name);     // ['Omar', 'Ali', ...]
users.find().filter((doc) => doc.age > 25);
users.find().count();
users.find().first();
users.find().last();
```

---

### Projection

```ts
// Include mode — only return specified fields (+ __inc always included)
users.find({}, { name: 1, email: 1 }).toArray();
// [{ __inc: 1, name: 'Omar', email: 'omar@test.com' }]

// Exclude mode — return all fields except specified
users.find({}, { password: 0, secret: 0 }).toArray();

// Works with dot notation
users.find({}, { 'address.city': 1 }).toArray();
```

---

### Watchers (Reactivity)

Subscribe to data changes. Watchers fire synchronously after every mutation — ideal for re-rendering UI.

```ts
// Watch all changes
const id = users.watch((event, docs, prevDocs) => {
  // event:    'insert' | 'update' | 'delete' | 'drop'
  // docs:     affected documents (current state)
  // prevDocs: previous state (null for insert/drop)
  console.log(event, docs);
});

// Watch specific operations only
users.watch(callback, { ops: ['insert', 'delete'] });

// Stop watching
users.unwatch(id);       // remove specific watcher
users.unwatch();         // remove all watchers
```

#### Real-world example: reactive UI

```html
<ul id="user-list"></ul>

<script>
  const db = new StateDB('app');
  const users = db.createCollection('users');

  // Re-render whenever data changes
  users.watch(function() {
    var list = document.getElementById('user-list');
    list.textContent = '';
    users.find().sort({ name: 1 }).toArray().forEach(function(u) {
      var li = document.createElement('li');
      li.textContent = u.name + ' (' + u.age + ')';
      list.appendChild(li);
    });
  });

  // These automatically trigger the watcher
  users.insertOne({ name: 'Omar', age: 30 });
  users.updateOne({ name: 'Omar' }, { $inc: { age: 1 } });
</script>
```

---

### Schema Validation

Define schemas when creating collections. Documents are validated on every insert and update.

```ts
const users = db.createCollection('users', {
  schema: {
    name:  { type: String, required: true, minLength: 2, maxLength: 50 },
    email: { type: String, required: true, match: /^.+@.+\..+$/ },
    age:   { type: Number, min: 0, max: 150 },
    role:  { type: String, enum: ['admin', 'user', 'guest'], default: 'user' },
    tags:  { type: Array, of: String },
    bio:   { type: String },
    active:{ type: Boolean, default: true },
    joined:{ type: Date, default: () => new Date() },
  },
});
```

#### Schema rules

| Rule | Type | Description |
|------|------|-------------|
| `type` | `String` `Number` `Boolean` `Date` `Array` `Object` | Type checking |
| `required` | `boolean` | Must be present on insert |
| `default` | value or `() => value` | Applied on insert if field is missing |
| `min` / `max` | `number` | For Number fields |
| `minLength` / `maxLength` | `number` | For String fields |
| `enum` | `array` | Allowed values |
| `match` | `RegExp` | Pattern match for String fields |
| `of` | type constructor | Element type for Array fields |

```ts
// Defaults are applied automatically
users.insertOne({ name: 'Omar', email: 'omar@test.com' });
// → { name: 'Omar', email: 'omar@test.com', role: 'user', active: true, joined: Date, __inc: 1 }

// Validation errors throw
users.insertOne({ name: 'A' });
// Error: Validation error: name must be at least 2 characters

users.insertOne({ age: 'not a number' });
// Error: Validation error: age must be of type Number
```

#### Capped collections

Automatically remove the oldest documents when the collection reaches a maximum size. Useful for logs, recent activity, or chat messages.

```ts
const logs = db.createCollection('logs', {
  schema: {},
  capped: true,
  max: 1000,
});

// When the 1001st doc is inserted, the oldest is removed automatically
```

---

### Indexes

Create indexes for fast lookups. Queries automatically use the best available index.

```ts
// Single field index
users.createIndex('email', { unique: true });

// Compound index (multiple fields)
users.createIndex({ country: 1, city: 1 });

// Queries use indexes automatically
users.findOne({ email: 'omar@test.com' });       // IXSCAN (fast)
users.find({ country: 'UAE', city: 'Dubai' });    // uses compound index
users.find({ country: 'UAE' });                   // uses compound index (prefix match)
users.find({ city: 'Dubai' });                    // COLLSCAN (city is not the prefix)

// Manage indexes
users.getIndexes();          // ['__inc', 'email', 'country_city']
users.dropIndex('email');
```

#### Explain

Inspect how a query is executed — whether it uses an index or a full collection scan.

```ts
const explain = users.find({ email: 'omar@test.com' }).explain();

console.log(explain.queryPlanner.winningPlan);
// { stage: 'FETCH', inputStage: { stage: 'IXSCAN', indexName: 'email' } }

console.log(explain.executionStats);
// { nReturned: 1, totalDocsExamined: 1, indexUsed: true, executionTimeMs: 0.02 }
```

---

### Hooks (Middleware)

Run functions before or after operations. Pre-hooks can modify data or abort the operation.

```ts
// Add timestamps automatically
users.pre('insert', (doc) => {
  doc.createdAt = new Date();
  doc.updatedAt = new Date();
});

users.pre('update', (query, update) => {
  update.$set = update.$set || {};
  update.$set.updatedAt = new Date();
});

// Abort an operation (return false)
users.pre('delete', (query) => {
  const doc = users.findOne(query);
  if (doc.role === 'admin') return false; // prevent deleting admins
});

// Post-hooks for side effects
users.post('insert', (doc) => {
  console.log('New user:', doc.name);
});

users.post('update', (result, query, update) => {
  console.log(`Modified ${result.modifiedCount} documents`);
});

users.post('delete', (result, query) => {
  console.log(`Deleted ${result.deletedCount} documents`);
});

// Remove hooks
users.removePre('insert');              // remove all pre-insert hooks
users.removePre('insert', specificFn);  // remove specific hook
users.removePost('update');
```

---

### Persistence

Optionally save data to `localStorage` or `sessionStorage`. Data auto-saves on every mutation (debounced) and auto-loads on initialization.

```ts
const db = new StateDB('mydb', {
  persistent: true,
  storage: 'local',   // 'local' (default) or 'session'
  debounce: 100,       // ms between saves (default: 100)
});

// Data auto-saves after mutations
// Data auto-loads when StateDB is created

// Manual controls
db.save();   // force save now
db.load();   // force reload from storage
db.flush();  // clear storage completely
```

---

### Export / Import

Move data in and out of StateDB.

```ts
// Export — clean data without __inc (for APIs, downloads)
const data = db.export();
// { users: [{ name: 'Omar', age: 30 }, { name: 'Ali', age: 25 }] }

// Dump — full data with __inc and counters (for backups)
const backup = db.dump();
// { users: { documents: [{ __inc: 1, name: 'Omar', ... }], inc: 3 } }

// Import clean data (assigns new __inc values)
db.import({ users: [{ name: 'Omar' }, { name: 'Ali' }] });

// Restore from dump (preserves __inc values)
db.restore(backup);
```

---

## Browser Usage (IIFE)

StateDB works anywhere JavaScript runs. For browsers without a build tool, use the IIFE bundle:

```html
<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
<script>
  var db = new StateDB('app');
  var todos = db.createCollection('todos');

  // Reactive rendering
  todos.watch(function() {
    var list = document.getElementById('list');
    list.textContent = '';
    todos.find().sort({ __inc: -1 }).toArray().forEach(function(t) {
      var li = document.createElement('li');
      li.textContent = t.text;
      list.appendChild(li);
    });
  });

  todos.insertOne({ text: 'Hello StateDB', done: false });
</script>
```

All exports are available on the global `StateDB` object:

```js
var db = new StateDB('app');            // main class
StateDB.Collection;                      // Collection class
StateDB.Query;                           // Query engine
StateDB.Schema;                          // Schema class
StateDB.Index;                           // Index class
StateDB.Watcher;                         // Watcher class
```

---

## Performance

Benchmarked on Node v22 with 10,000 documents. Run `npm run bench` to reproduce.

### Insert

| Operation | Time | Throughput |
|-----------|------|------------|
| `insertOne` x10,000 | 3.2ms | 3.1M ops/s |
| `insertMany` x10,000 | 1.0ms | 10.4M docs/s |

### Find

| Operation | Time (1,000 queries) | Per query |
|-----------|---------------------|-----------|
| `find({}).toArray()` | 0.09ms | ~0.09us |
| `find({ role: "admin" })` | 22ms | ~22us |
| `find({ age: { $gt: 40 } })` | 53ms | ~53us |
| `find({ $and + $or })` | 167ms | ~167us |
| `find().sort().skip().limit()` | 854ms | ~854us |

### Find One

| Operation | Time (5,000 lookups) | Per lookup |
|-----------|---------------------|------------|
| `findOne({ __inc })` primary key | 0.05ms | ~0.01us |
| `findOne({ email })` full scan | 160ms | ~32us |
| `findOne({ email })` **indexed** | 1.1ms | ~0.22us |
| **Index speedup** | | **145x** |

### Update

| Operation | Time (1,000 updates) | Per update |
|-----------|---------------------|-----------|
| `updateOne $set` (by ID) | 0.3ms | ~0.3us |
| `updateOne $inc` (by ID) | 0.5ms | ~0.5us |
| `updateMany` (~2K docs) x10 | 4.0ms | ~0.4ms/batch |

### Delete

| Operation | Time |
|-----------|------|
| `deleteOne` x5,000 (one by one) | 2.5ms |
| `deleteMany` (4,000 matched) | 0.8ms |

### Watchers

| Scenario | Time |
|----------|------|
| `insertOne` x5,000 + 1 watcher | 2.2ms |
| `updateOne` x1,000 + 10 watchers | 1.1ms |

### Schema

| Scenario | Time (10,000 inserts) | Overhead |
|----------|----------------------|----------|
| Without schema | 1.9ms | - |
| With schema (4 validated fields) | 7.7ms | ~4x |

---

## API Reference

### StateDB

```ts
new StateDB(name?: string, options?: StateDBOptions)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `persistent` | `boolean` | `false` | Enable auto-save to storage |
| `storage` | `'local' \| 'session'` | `'local'` | Storage backend |
| `debounce` | `number` | `100` | Save debounce in ms |

| Method | Returns | Description |
|--------|---------|-------------|
| `createCollection(name, options?)` | `Collection` | Create or get collection |
| `getCollection(name)` | `Collection \| null` | Get existing collection |
| `listCollections()` | `string[]` | List collection names |
| `dropCollection(name)` | `boolean` | Drop a collection |
| `drop()` | `boolean` | Drop all collections |
| `save()` | `boolean` | Force save to storage |
| `load()` | `boolean` | Force load from storage |
| `flush()` | `boolean` | Clear storage |
| `export()` | `ExportData` | Export clean data (no `__inc`) |
| `dump()` | `DumpData` | Export with metadata |
| `import(data)` | `boolean` | Import clean data |
| `restore(dump)` | `boolean` | Restore from dump |

### Collection

```ts
db.createCollection(name: string, options?: CollectionOptions)
```

| Option | Type | Description |
|--------|------|-------------|
| `schema` | `SchemaDefinition` | Field validation rules |
| `capped` | `boolean` | Enable capped collection |
| `max` | `number` | Max documents (capped only) |

#### CRUD

| Method | Returns | Description |
|--------|---------|-------------|
| `insertOne(doc)` | `Document \| null` | Insert one document |
| `insertMany(docs)` | `Document[]` | Insert multiple documents |
| `find(query?, projection?)` | `QueryResult` | Find documents |
| `findOne(query?)` | `Document \| null` | Find one document |
| `count(query?)` | `number` | Count matching documents |
| `exists(query?)` | `boolean` | Check if any match exists |
| `first()` | `Document \| null` | First document in collection |
| `last()` | `Document \| null` | Last document in collection |
| `updateOne(query, update)` | `UpdateResult` | Update first match |
| `updateMany(query, update)` | `UpdateResult` | Update all matches |
| `replaceOne(query, replacement)` | `UpdateResult` | Replace entire document |
| `upsertOne(query, doc)` | `UpdateResult` | Update or insert |
| `deleteOne(query)` | `DeleteResult` | Delete first match |
| `deleteMany(query)` | `DeleteResult` | Delete all matches |
| `drop()` | `DeleteResult` | Remove all documents |

#### Indexes

| Method | Returns | Description |
|--------|---------|-------------|
| `createIndex(fields, options?)` | `string` | Create index (returns name) |
| `dropIndex(name)` | `boolean` | Remove an index |
| `getIndexes()` | `string[]` | List all index names |

#### Watchers

| Method | Returns | Description |
|--------|---------|-------------|
| `watch(callback, options?)` | `number` | Subscribe to changes (returns ID) |
| `unwatch(id?)` | `void` | Unsubscribe (by ID, or all) |

#### Hooks

| Method | Returns | Description |
|--------|---------|-------------|
| `pre(op, callback)` | `this` | Add pre-hook (return `false` to abort) |
| `post(op, callback)` | `this` | Add post-hook |
| `removePre(op, callback?)` | `this` | Remove pre-hook(s) |
| `removePost(op, callback?)` | `this` | Remove post-hook(s) |

### QueryResult

Returned by `find()`. All methods except `toArray()`, `map()`, `filter()`, `count()`, `first()`, `last()`, and `explain()` are chainable.

| Method | Returns | Description |
|--------|---------|-------------|
| `sort(spec)` | `this` | Sort: `{ field: 1 }` (asc) or `{ field: -1 }` (desc) |
| `skip(n)` | `this` | Skip first n results |
| `limit(n)` | `this` | Limit to n results |
| `project(spec)` | `this` | Include (`{ name: 1 }`) or exclude (`{ password: 0 }`) fields |
| `toArray()` | `Document[]` | Execute and return results |
| `forEach(fn)` | `this` | Iterate over results |
| `map(fn)` | `any[]` | Map results |
| `filter(fn)` | `Document[]` | Filter results |
| `count()` | `number` | Number of results |
| `first()` | `Document \| null` | First result |
| `last()` | `Document \| null` | Last result |
| `explain()` | `ExplainResult` | Query execution details |

### TypeScript Types

All types are exported for use in your code:

```ts
import type {
  Document,
  QueryFilter,
  QueryOperators,
  UpdateSpec,
  UpdateResult,
  DeleteResult,
  SchemaDefinition,
  CollectionOptions,
  StateDBOptions,
  WatcherEvent,
  WatcherCallback,
  ProjectionSpec,
  SortSpec,
  ExplainResult,
} from '@phpdot/statedb';
```

---

## Examples

The `examples/` folder contains working demos:

- **`basic.html`** — Minimal getting-started example
- **`todo-demo.html`** — Todo app with watchers and live operation log
- **`api-demo.html`** — Index and query explain demo with external API data

Run locally:

```bash
npx serve .
# Open http://localhost:3000/examples/todo-demo.html
```

---

## Development

```bash
# Install
npm install

# Build (ESM + CJS + IIFE + types)
npm run build

# Run tests (133 tests)
npm test

# Run benchmarks
npm run bench

# Watch mode
npm run dev
```

### Project Structure

```
src/
  index.ts          Entry point (exports)
  browser.ts        IIFE entry (attaches classes to StateDB global)
  StateDB.ts        Database class, persistence
  Collection.ts     Collection class, CRUD delegation
  Query.ts          Query engine, compiled matchers
  DbIndex.ts        Index (single + compound, unique)
  Schema.ts         Schema validation
  Watcher.ts        Reactive event system
  types.ts          TypeScript interfaces
  operations/
    insert.ts       insertOne, insertMany
    find.ts         find, findOne, QueryResult
    update.ts       updateOne, updateMany, operators
    delete.ts       deleteOne, deleteMany, drop
tests/              Vitest test files (133 tests)
benchmarks/         Performance benchmarks
examples/           HTML demos
dist/               Build output
  index.mjs         ESM
  index.cjs         CJS
  index.js          IIFE (non-minified)
  index.min.js      IIFE (minified, ~20KB)
  index.d.ts        TypeScript declarations
  index.d.mts       TypeScript declarations (ESM)
```

---

## License

MIT - [Omar Hamdan](mailto:omar@phpdot.com)

[GitHub](https://github.com/phpdot/statedb) | [npm](https://www.npmjs.com/package/@phpdot/statedb)
