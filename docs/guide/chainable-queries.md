# Chainable Queries

`find()` returns a `QueryResult` object with chainable methods. The query is only executed when you call a terminal method like `.toArray()`.

## Sorting

```ts
// Ascending (1)
users.find().sort({ name: 1 }).toArray();

// Descending (-1)
users.find().sort({ age: -1 }).toArray();

// Multiple fields
users.find().sort({ role: 1, age: -1 }).toArray();
// Sort by role ascending, then by age descending within each role
```

## Pagination

### skip

Skip the first N results:

```ts
users.find().skip(10).toArray();
```

### limit

Return at most N results:

```ts
users.find().limit(5).toArray();
```

### Combined (Pagination)

```ts
const page = 3;
const perPage = 10;

users.find({ active: true })
  .sort({ __inc: -1 })
  .skip((page - 1) * perPage)
  .limit(perPage)
  .toArray();
```

## Projection

Select which fields to include or exclude.

### Include Mode

Only return specified fields. `__inc` is always included.

```ts
users.find({}, { name: 1, email: 1 }).toArray();
// [{ __inc: 1, name: 'Omar', email: 'omar@test.com' }]
```

### Exclude Mode

Return all fields except specified ones.

```ts
users.find({}, { password: 0, secret: 0 }).toArray();
// All fields except password and secret
```

### Chained Projection

```ts
users.find()
  .sort({ age: -1 })
  .limit(5)
  .project({ name: 1, age: 1 })
  .toArray();
```

::: warning
Don't mix include and exclude modes in the same projection. Use one or the other.
:::

## Iteration Methods

### toArray

Execute the query and return an array of documents:

```ts
const results = users.find({ role: 'admin' }).toArray();
```

### forEach

Iterate over results:

```ts
users.find().forEach((doc, index) => {
  console.log(index, doc.name);
});
```

### map

Transform results:

```ts
const names = users.find().map(doc => doc.name);
// ['Omar', 'Ali', 'Sara']
```

### filter

Further filter results with a callback:

```ts
const result = users.find({ role: 'admin' })
  .filter(doc => (doc.age as number) > 25);
```

### count

Count results (respects skip/limit):

```ts
users.find({ role: 'admin' }).count(); // 5
users.find().skip(3).count();           // total - 3
```

### first / last

Get first or last result:

```ts
users.find({ role: 'admin' }).sort({ age: -1 }).first();
// Oldest admin

users.find().last();
// Last document
```

## Explain

Inspect how the query is executed — useful for performance debugging.

```ts
const explain = users.find({ email: 'omar@test.com' }).explain();

console.log(explain.queryPlanner.winningPlan);
// Without index: { stage: 'COLLSCAN' }
// With index:    { stage: 'FETCH', inputStage: { stage: 'IXSCAN', indexName: 'email' } }

console.log(explain.executionStats);
// {
//   nReturned: 1,
//   totalDocsExamined: 1,      // 1 with index, 10000 without
//   totalKeysExamined: 1,
//   indexUsed: true,
//   indexName: 'email',
//   executionTimeMs: 0.02,
// }
```

## Full Chain Example

```ts
// Get page 2 of active admins, sorted by name, with only name and email fields
const results = users
  .find({
    $and: [
      { role: 'admin' },
      { active: true },
    ],
  })
  .sort({ name: 1 })
  .skip(10)
  .limit(10)
  .project({ name: 1, email: 1 })
  .toArray();
```
