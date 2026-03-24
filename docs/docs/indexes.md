# Indexes

Indexes speed up queries by maintaining a lookup structure that avoids full collection scans. StateDB supports single-field, compound, and unique indexes.

## createIndex

Create an index on one or more fields. Returns the index name (fields joined by `_`).

### Single Field Index

```js
const users = db.createCollection('users');
users.createIndex('email');
// Returns: 'email'
```

### Compound Index

```js
users.createIndex(['role', 'age']);
// Returns: 'role_age'

// Object syntax (equivalent)
users.createIndex({ role: 1, age: 1 });
// Returns: 'role_age'
```

### Unique Index

Prevents duplicate values in the indexed field. Throws an error on insert if a duplicate is detected.

```js
users.createIndex('email', { unique: true });

users.insertOne({ name: 'Omar', email: 'omar@example.com' });
users.insertOne({ name: 'Fake', email: 'omar@example.com' });
// Error: "Duplicate key error: email = omar@example.com"
```

## dropIndex

Remove an index by name.

```js
users.dropIndex('email');    // true
users.dropIndex('missing');  // false
```

## getIndexes

Returns an array of all index names. Always includes `__inc` (the built-in primary key).

```js
users.createIndex('email');
users.createIndex(['role', 'age']);

users.getIndexes();
// ['__inc', 'email', 'role_age']
```

## How Indexes Work

An index maintains a `Map` from field values to sets of `__inc` primary keys. When you query an indexed field with an equality match, StateDB looks up matching `__inc` values in the index and only examines those documents, instead of scanning the entire collection.

```
Index: email
  "omar@example.com"  -> Set { 1 }
  "sara@example.com"  -> Set { 2 }
  "ali@example.com"   -> Set { 3 }
```

When you run `users.find({ email: 'omar@example.com' })`, the index returns `Set { 1 }` and only document `__inc: 1` is examined.

## Supported Query Patterns

Indexes are used when the query contains **equality matches** (`$eq` or direct value) on the indexed field(s).

```js
// Index IS used
users.find({ email: 'omar@example.com' });
users.find({ email: { $eq: 'omar@example.com' } });

// Index is NOT used (range operators)
users.find({ age: { $gt: 25 } });

// Index is NOT used (logical operators)
users.find({ $or: [{ email: 'a' }, { email: 'b' }] });
```

## Compound Index Prefix Matching

A compound index on `['role', 'age']` can be used for queries on:

- `{ role: 'admin' }` (uses the first field as a prefix)
- `{ role: 'admin', age: 30 }` (uses both fields)

But **not** for:

- `{ age: 30 }` (does not start with the first field)

```js
users.createIndex(['role', 'age']);

// Uses index (prefix match on 'role')
users.find({ role: 'admin' }).toArray();

// Uses index (full compound match)
users.find({ role: 'admin', age: 30 }).toArray();

// Does NOT use index (skips 'role')
users.find({ age: 30 }).toArray();
```

## explain()

Use `explain()` on a `QueryResult` to inspect whether an index was used.

```js
users.createIndex('role');

const result = users.find({ role: 'admin' });
const plan = result.explain();
```

The `explain()` output:

```js
{
  queryPlanner: {
    winningPlan: {
      stage: 'FETCH',           // or 'COLLSCAN' if no index
      inputStage: {
        stage: 'IXSCAN',
        indexName: 'role',
        indexFields: ['role']
      }
    }
  },
  executionStats: {
    nReturned: 2,               // documents returned
    totalDocsExamined: 2,       // documents examined
    totalKeysExamined: 2,       // index keys examined
    indexUsed: true,
    indexName: 'role',
    indexFields: ['role'],
    executionTimeMs: 0.05
  }
}
```

When no index is used, the plan shows `COLLSCAN`:

```js
const plan = users.find({ age: { $gt: 25 } }).explain();
// plan.queryPlanner.winningPlan.stage === 'COLLSCAN'
// plan.executionStats.indexUsed === false
```

## Performance

Indexes provide dramatic speedups on large collections. On a collection with 100,000 documents, an indexed equality query can be up to **145x faster** than a full collection scan.

```js
const col = db.createCollection('perf');

// Insert 100,000 documents
const docs = [];
for (let i = 0; i < 100000; i++) {
  docs.push({ userId: `user_${i}`, score: Math.random() * 100 });
}
col.insertMany(docs);

// Without index: scans all 100,000 docs
col.find({ userId: 'user_50000' }).explain();
// totalDocsExamined: 100000

// With index: examines only 1 doc
col.createIndex('userId');
col.find({ userId: 'user_50000' }).explain();
// totalDocsExamined: 1, totalKeysExamined: 1
```

## Index Lifecycle

- Indexes are built immediately when `createIndex` is called (all existing documents are indexed).
- Indexes are updated automatically on insert, update, and delete.
- Indexes are cleared when `drop()` is called on the collection.
- Indexes are rebuilt when `_load()` restores data from persistence.
- Creating an index with the same fields is a no-op (returns the existing index name).
