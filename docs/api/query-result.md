# QueryResult

Returned by `collection.find()`. Provides chainable methods for sorting, pagination, projection, and iteration.

The query is executed lazily — documents are only processed when a terminal method is called (`.toArray()`, `.count()`, `.first()`, etc.).

## Chainable Methods

These methods return `this` for chaining:

### sort

```ts
result.sort(spec: { [field: string]: 1 | -1 }): this
```

Sort results. `1` = ascending, `-1` = descending.

```ts
users.find().sort({ age: -1 }).toArray();          // oldest first
users.find().sort({ role: 1, name: 1 }).toArray();  // role asc, then name asc
```

### skip

```ts
result.skip(n: number): this
```

Skip the first N results.

```ts
users.find().skip(10).toArray();
```

### limit

```ts
result.limit(n: number): this
```

Limit to N results.

```ts
users.find().limit(5).toArray();
```

### project

```ts
result.project(spec: { [field: string]: 0 | 1 | boolean }): this
```

Select fields to include or exclude. `__inc` is always included in include mode.

```ts
// Include mode
users.find().project({ name: 1, email: 1 }).toArray();
// [{ __inc: 1, name: 'Omar', email: 'omar@test.com' }]

// Exclude mode
users.find().project({ password: 0 }).toArray();
```

## Terminal Methods

These execute the query and return results:

### toArray

```ts
result.toArray(): Document[]
```

Execute the query chain and return an array of documents.

When no sort/skip/limit/projection is applied, this returns the internal array directly (zero-copy) for maximum performance.

### count

```ts
result.count(): number
```

Count results after applying skip/limit.

```ts
users.find({ role: 'admin' }).count();     // all admins
users.find().skip(5).limit(10).count();     // 10 (or less)
```

### first

```ts
result.first(): Document | null
```

First result after applying sort/skip/limit. Returns `null` if empty.

### last

```ts
result.last(): Document | null
```

Last result after applying sort/skip/limit. Returns `null` if empty.

### forEach

```ts
result.forEach(callback: (doc: Document, index: number, array: Document[]) => void): this
```

Iterate over results. Returns `this` (chainable).

```ts
users.find().forEach((doc, i) => {
  console.log(i, doc.name);
});
```

### map

```ts
result.map<T>(callback: (doc: Document, index: number, array: Document[]) => T): T[]
```

Transform results into a new array.

```ts
const names = users.find().map(doc => doc.name);
// ['Omar', 'Ali', 'Sara']
```

### filter

```ts
result.filter(callback: (doc: Document, index: number, array: Document[]) => boolean): Document[]
```

Further filter results with a JavaScript callback.

```ts
const result = users.find({ role: 'admin' })
  .filter(doc => (doc.age as number) > 30);
```

### explain

```ts
result.explain(): ExplainResult
```

Return query execution details. Useful for debugging index usage.

```ts
const explain = users.find({ email: 'omar@test.com' }).explain();
```

Returns:

```ts
{
  queryPlanner: {
    winningPlan: {
      stage: 'FETCH' | 'COLLSCAN',
      inputStage?: {
        stage: 'IXSCAN',
        indexName: string,
        indexFields: string[],
      },
    },
  },
  executionStats: {
    nReturned: number,
    totalDocsExamined: number,
    totalKeysExamined: number,
    indexUsed: boolean,
    indexName: string | null,
    indexFields: string[] | null,
    executionTimeMs: number,
  },
}
```

## Full Example

```ts
const results = users
  .find({
    $and: [
      { role: 'admin' },
      { active: true },
    ],
  })
  .sort({ name: 1 })
  .skip(0)
  .limit(10)
  .project({ name: 1, email: 1 })
  .toArray();

// [{ __inc: 3, name: 'Omar', email: 'omar@test.com' }, ...]
```
