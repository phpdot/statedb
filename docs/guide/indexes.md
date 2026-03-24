# Indexes

Indexes speed up queries by avoiding full collection scans. StateDB automatically selects the best index for each query.

## Creating Indexes

### Single Field

```ts
users.createIndex('email');
users.createIndex('email', { unique: true });
```

You can also pass an object (MongoDB style):

```ts
users.createIndex({ email: 1 });
users.createIndex({ email: 1 }, { unique: true });
```

### Compound Index

Index multiple fields together:

```ts
users.createIndex({ country: 1, city: 1 });
```

The index name is the fields joined by `_` — in this case, `country_city`.

## How Indexes Work

Without an index, every query does a **full collection scan** (COLLSCAN) — it checks every document.

With an index, the query does an **index scan** (IXSCAN) — it looks up the value in a hash map and directly fetches matching documents.

```ts
// Without index: scans all 10,000 documents
users.findOne({ email: 'omar@test.com' }); // ~32us

// With index: direct lookup
users.createIndex('email');
users.findOne({ email: 'omar@test.com' }); // ~0.2us (145x faster)
```

## Unique Indexes

Unique indexes prevent duplicate values:

```ts
users.createIndex('email', { unique: true });

users.insertOne({ email: 'omar@test.com' }); // OK
users.insertOne({ email: 'omar@test.com' }); // Error: Duplicate key error
```

Documents without the indexed field are **not** included in the index, so multiple documents can omit the field:

```ts
users.insertOne({ name: 'A' }); // OK — no email, not indexed
users.insertOne({ name: 'B' }); // OK — no email, not indexed
```

## Compound Index Prefix Matching

A compound index on `{ country, city }` can be used for:

| Query | Uses Index? | Reason |
|-------|-------------|--------|
| `{ country: 'UAE', city: 'Dubai' }` | Yes | Full match |
| `{ country: 'UAE' }` | Yes | Prefix match (first field) |
| `{ city: 'Dubai' }` | **No** | Not a prefix |

```ts
users.createIndex({ country: 1, city: 1 });

// Uses index (full compound match)
users.find({ country: 'UAE', city: 'Dubai' });

// Uses index (prefix match — first field only)
users.find({ country: 'UAE' });

// Does NOT use index (city is not the prefix)
users.find({ city: 'Dubai' });
```

## Supported Query Patterns

Indexes are used for **equality** queries only:

| Query | Uses Index? |
|-------|-------------|
| `{ email: 'omar@test.com' }` | Yes |
| `{ email: { $eq: 'omar@test.com' } }` | Yes |
| `{ email: { $gt: 'a' } }` | **No** (range query) |
| `{ email: { $regex: /omar/ } }` | **No** (pattern match) |
| `{ email: { $in: ['a', 'b'] } }` | **No** |

Range queries, `$in`, `$regex`, and other operators fall back to a full scan after index lookup or use no index at all.

## Managing Indexes

### List Indexes

```ts
users.getIndexes();
// ['__inc', 'email', 'country_city']
```

`__inc` is always listed — it's the built-in primary index.

### Drop an Index

```ts
users.dropIndex('email');     // returns true
users.dropIndex('nonexistent'); // returns false
```

### Index Maintenance

Indexes are automatically maintained on:

- **Insert** — new document added to all indexes
- **Update** — old entry removed, new entry added
- **Delete** — entry removed from all indexes
- **Drop** — all index entries cleared

## Explain

Use `.explain()` to see if a query uses an index:

```ts
const explain = users.find({ email: 'omar@test.com' }).explain();

console.log(explain.queryPlanner.winningPlan);
// With index:    { stage: 'FETCH', inputStage: { stage: 'IXSCAN', indexName: 'email' } }
// Without index: { stage: 'COLLSCAN' }

console.log(explain.executionStats);
// {
//   nReturned: 1,
//   totalDocsExamined: 1,
//   totalKeysExamined: 1,
//   indexUsed: true,
//   indexName: 'email',
//   executionTimeMs: 0.02,
// }
```

## Performance

Benchmarked with 10,000 documents:

| Lookup | Without Index | With Index | Speedup |
|--------|--------------|------------|---------|
| `findOne({ email })` | ~32us | ~0.2us | **145x** |
| `findOne({ country, city })` compound | ~32us | ~0.2us | **145x** |

## Best Practices

1. **Index fields you query frequently** — especially in `findOne` and `find` with equality filters
2. **Use unique indexes for natural keys** — email, username, slug
3. **Compound indexes follow left-to-right prefix** — `{ a, b }` supports `{ a }` but not `{ b }`
4. **Check with explain** — verify your queries actually use the index
5. **Don't over-index** — each index adds overhead to insert/update/delete
