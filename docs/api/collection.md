# Collection

A collection holds documents and provides all CRUD, query, index, watcher, and hook operations.

Collections are created via `db.createCollection()` — never instantiated directly.

## CRUD

### insertOne

```ts
collection.insertOne(doc: Record<string, unknown>): Document | null
```

Insert a single document. Returns the document with `__inc` assigned, or `null` if aborted by a pre-hook.

### insertMany

```ts
collection.insertMany(docs: Record<string, unknown>[]): Document[]
```

Insert multiple documents. Returns an array of inserted documents.

When no hooks are registered, `insertMany` is optimized: single watcher emit, single save schedule.

### find

```ts
collection.find(query?: QueryFilter, projection?: ProjectionSpec): QueryResult
```

Find documents matching a query. Returns a chainable [QueryResult](/api/query-result).

```ts
collection.find().toArray();                          // all
collection.find({ role: 'admin' }).toArray();         // with query
collection.find({}, { name: 1, email: 1 }).toArray(); // with projection
```

### findOne

```ts
collection.findOne(query?: QueryFilter): Document | null
```

Find the first matching document. Returns `null` if not found.

Lookup by `__inc` is O(1):

```ts
collection.findOne({ __inc: 5 }); // instant Map lookup
```

### count

```ts
collection.count(query?: QueryFilter): number
```

Count matching documents. Without a query, returns the total document count (O(1)).

### exists

```ts
collection.exists(query?: QueryFilter): boolean
```

Returns `true` if at least one document matches.

### first

```ts
collection.first(): Document | null
```

First document in insertion order. Returns `null` if empty.

### last

```ts
collection.last(): Document | null
```

Last document in insertion order. Returns `null` if empty.

### updateOne

```ts
collection.updateOne(query: QueryFilter, update: UpdateSpec): UpdateResult
```

Update the first matching document.

```ts
// { matchedCount: 1, modifiedCount: 1 }
// or { matchedCount: 0, modifiedCount: 0 } if not found
```

### updateMany

```ts
collection.updateMany(query: QueryFilter, update: UpdateSpec): UpdateResult
```

Update all matching documents. Returns counts.

### replaceOne

```ts
collection.replaceOne(query: QueryFilter, replacement: Record<string, unknown>): UpdateResult
```

Replace the entire document (preserving `__inc`).

### upsertOne

```ts
collection.upsertOne(query: QueryFilter, doc: Record<string, unknown>): UpdateResult
```

Update if found, insert if not. Returns `upsertedId` on insert.

### deleteOne

```ts
collection.deleteOne(query: QueryFilter): DeleteResult
```

Delete the first matching document.

```ts
// { deletedCount: 1 } or { deletedCount: 0 }
```

### deleteMany

```ts
collection.deleteMany(query: QueryFilter): DeleteResult
```

Delete all matching documents.

### drop

```ts
collection.drop(): DeleteResult
```

Remove all documents and reset the `__inc` counter.

## Indexes

### createIndex

```ts
collection.createIndex(
  fields: string | string[] | Record<string, number>,
  options?: { unique?: boolean }
): string
```

Create an index. Returns the index name.

```ts
collection.createIndex('email');                        // 'email'
collection.createIndex('email', { unique: true });      // 'email'
collection.createIndex({ country: 1, city: 1 });        // 'country_city'
collection.createIndex(['country', 'city']);              // 'country_city'
```

### dropIndex

```ts
collection.dropIndex(name: string): boolean
```

Remove an index. Returns `true` if found.

### getIndexes

```ts
collection.getIndexes(): string[]
```

List all index names. Always includes `'__inc'` (primary).

## Watchers

### watch

```ts
collection.watch(
  callback: (event: WatcherEvent, docs: Document[], prevDocs: Document[] | null) => void,
  options?: { ops?: WatcherEvent[] }
): number
```

Subscribe to changes. Returns a watcher ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `function` | Called on every matching mutation |
| `options.ops` | `WatcherEvent[]` | Filter: `['insert']`, `['update', 'delete']`, etc. |

### unwatch

```ts
collection.unwatch(id?: number): void
```

Remove a watcher by ID, or all watchers if no ID given.

## Hooks

### pre

```ts
collection.pre(operation: 'insert' | 'update' | 'delete', callback: Function): this
```

Add a pre-hook. Return `false` from the callback to abort the operation.

| Operation | Callback arguments |
|-----------|-------------------|
| `insert` | `(doc)` |
| `update` | `(query, update)` |
| `delete` | `(query)` |

### post

```ts
collection.post(operation: 'insert' | 'update' | 'delete', callback: Function): this
```

Add a post-hook.

| Operation | Callback arguments |
|-----------|-------------------|
| `insert` | `(doc)` |
| `update` | `(result, query, update)` |
| `delete` | `(result, query)` |

### removePre

```ts
collection.removePre(operation: string, callback?: Function): this
```

Remove a specific pre-hook, or all pre-hooks for the operation if no callback given.

### removePost

```ts
collection.removePost(operation: string, callback?: Function): this
```

Remove a specific post-hook, or all post-hooks for the operation.
