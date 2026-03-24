# API Reference

Complete reference for all StateDB classes, methods, and types.

## StateDB

### Constructor

```ts
new StateDB(name?: string, options?: StateDBOptions)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | `'statedb'` | Database name (used as storage key prefix) |
| `options.persistent` | `boolean` | `false` | Enable auto-save/load |
| `options.storage` | `'local' \| 'session'` | `'local'` | Storage backend |
| `options.debounce` | `number` | `100` | Debounce interval in ms |

### Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `createCollection` | `(name: string, options?: CollectionOptions)` | `Collection` | Create or retrieve a collection |
| `getCollection` | `(name: string)` | `Collection \| null` | Get an existing collection |
| `listCollections` | `()` | `string[]` | List all collection names |
| `dropCollection` | `(name: string)` | `boolean` | Drop a collection |
| `drop` | `()` | `boolean` | Drop all collections and flush storage |
| `save` | `()` | `boolean` | Immediately save to storage |
| `load` | `()` | `boolean` | Load from storage |
| `flush` | `()` | `boolean` | Remove saved data from storage |
| `export` | `()` | `ExportData` | Export all data (without `__inc`) |
| `dump` | `()` | `DumpData` | Full snapshot (with `__inc` + counter) |
| `import` | `(data: ImportData)` | `boolean` | Import clean data (re-inserts) |
| `restore` | `(dump: DumpData)` | `boolean` | Restore a full dump |

### CollectionOptions

```ts
interface CollectionOptions {
  schema?: SchemaDefinition;
  capped?: boolean;
  max?: number;
}
```

---

## Collection

### CRUD Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `insertOne` | `(doc: object)` | `Document \| null` | Insert a document |
| `insertMany` | `(docs: object[])` | `Document[]` | Insert multiple documents |
| `find` | `(query?: QueryFilter, projection?: ProjectionSpec)` | `QueryResult` | Find documents |
| `findOne` | `(query?: QueryFilter)` | `Document \| null` | Find first matching document |
| `count` | `(query?: QueryFilter)` | `number` | Count matching documents |
| `exists` | `(query?: QueryFilter)` | `boolean` | Check if any document matches |
| `first` | `()` | `Document \| null` | First document by insertion order |
| `last` | `()` | `Document \| null` | Last document by insertion order |
| `updateOne` | `(query: QueryFilter, update: UpdateSpec)` | `UpdateResult` | Update first match |
| `updateMany` | `(query: QueryFilter, update: UpdateSpec)` | `UpdateResult` | Update all matches |
| `replaceOne` | `(query: QueryFilter, replacement: object)` | `UpdateResult` | Replace first match entirely |
| `upsertOne` | `(query: QueryFilter, doc: object)` | `UpdateResult` | Update or insert |
| `deleteOne` | `(query: QueryFilter)` | `DeleteResult` | Delete first match |
| `deleteMany` | `(query: QueryFilter)` | `DeleteResult` | Delete all matches |
| `drop` | `()` | `DeleteResult` | Remove all documents, reset counter |

### Index Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `createIndex` | `(fields: string \| string[] \| Record<string, number>, options?: IndexOptions)` | `string` | Create an index, returns index name |
| `dropIndex` | `(name: string)` | `boolean` | Remove an index |
| `getIndexes` | `()` | `string[]` | List all index names |

### Watcher Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `watch` | `(callback: WatcherCallback, options?: WatcherOptions)` | `number` | Register a watcher, returns ID |
| `unwatch` | `(id?: number)` | `void` | Remove one or all watchers |

### Hook Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `pre` | `(operation: HookOperation, callback: PreHookCallback)` | `this` | Register a pre-hook |
| `post` | `(operation: HookOperation, callback: PostHookCallback)` | `this` | Register a post-hook |
| `removePre` | `(operation: HookOperation, callback?: PreHookCallback)` | `this` | Remove pre-hook(s) |
| `removePost` | `(operation: HookOperation, callback?: PostHookCallback)` | `this` | Remove post-hook(s) |

---

## QueryResult

Returned by `collection.find()`. Supports chainable modifiers and terminal methods.

### Chainable Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `sort` | `(spec: SortSpec)` | `this` | Sort results (`1` ascending, `-1` descending) |
| `skip` | `(n: number)` | `this` | Skip the first `n` results |
| `limit` | `(n: number)` | `this` | Limit to `n` results |
| `project` | `(spec: ProjectionSpec)` | `this` | Include/exclude fields |

### Terminal Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `toArray` | `()` | `Document[]` | Execute and return array |
| `count` | `()` | `number` | Count of results |
| `first` | `()` | `Document \| null` | First result |
| `last` | `()` | `Document \| null` | Last result |
| `forEach` | `(callback: (doc, i, arr) => void)` | `this` | Iterate results |
| `map` | `(callback: (doc, i, arr) => T)` | `T[]` | Map results to new array |
| `filter` | `(callback: (doc, i, arr) => boolean)` | `Document[]` | Filter results |
| `explain` | `()` | `ExplainResult` | Query execution plan |

### Projection

Include specific fields (inclusion mode):

```js
users.find({}, { name: 1, age: 1 }).toArray();
// [{ name: 'Omar', age: 30, __inc: 1 }]
```

Exclude specific fields (exclusion mode):

```js
users.find({}, { password: 0 }).toArray();
// All fields except password
```

`__inc` is always included in inclusion mode.

### Sort

```js
users.find().sort({ age: 1 }).toArray();    // ascending
users.find().sort({ age: -1 }).toArray();   // descending

// Multi-field sort
users.find().sort({ role: 1, age: -1 }).toArray();
```

---

## Type Reference

```ts
import type {
  // Core
  Document,
  StateDBOptions,
  CollectionOptions,

  // Query
  QueryFilter,
  QueryOperators,
  ProjectionSpec,
  SortSpec,

  // Update
  UpdateSpec,
  UpdateOperators,

  // Results
  UpdateResult,
  DeleteResult,
  ExplainResult,
  ExecutionStats,

  // Schema
  SchemaDefinition,
  SchemaFieldDefinition,
  SchemaType,
  SchemaOptions,

  // Index
  IndexOptions,

  // Watcher
  WatcherEvent,
  WatcherCallback,
  WatcherOptions,

  // Hooks
  HookOperation,
  PreHookCallback,
  PostHookCallback,

  // Export/Import
  CollectionDump,
  ExportData,
  DumpData,
  ImportData,
} from '@phpdot/statedb';
```

### Key Types

```ts
interface Document {
  __inc: number;
  [key: string]: unknown;
}

interface UpdateResult {
  matchedCount: number;
  modifiedCount: number;
  upsertedId?: number;
}

interface DeleteResult {
  deletedCount: number;
}

type WatcherEvent = 'insert' | 'update' | 'delete' | 'drop';
type HookOperation = 'insert' | 'update' | 'delete';

type WatcherCallback = (
  event: WatcherEvent,
  docs: Document[],
  prevDocs: Document[] | null,
) => void;

interface ExplainResult {
  queryPlanner: {
    winningPlan: {
      stage: string;
      inputStage?: {
        stage: string;
        indexName: string | null;
        indexFields: string[] | null;
      };
    };
  };
  executionStats: {
    nReturned: number;
    totalDocsExamined: number;
    totalKeysExamined: number;
    indexUsed: boolean;
    indexName: string | null;
    indexFields: string[] | null;
    executionTimeMs: number;
  };
}
```
