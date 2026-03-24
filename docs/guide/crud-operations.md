# CRUD Operations

## Insert

### insertOne

Insert a single document. Returns the inserted document with `__inc` assigned.

```ts
const doc = users.insertOne({ name: 'Omar', age: 30 });
// { __inc: 1, name: 'Omar', age: 30 }
```

If a pre-insert hook returns `false`, the insert is aborted and `null` is returned.

```ts
const result = users.insertOne({ name: 'blocked' });
// null (if pre-hook aborted)
```

### insertMany

Insert multiple documents at once. Returns an array of inserted documents.

```ts
const docs = users.insertMany([
  { name: 'Ali', age: 25 },
  { name: 'Sara', age: 28 },
]);
// [{ __inc: 2, name: 'Ali', ... }, { __inc: 3, name: 'Sara', ... }]
```

`insertMany` is optimized for bulk inserts — it emits a single watcher event and schedules a single save for the entire batch (when no hooks are registered).

### The `__inc` Field

Every document receives an auto-incrementing `__inc` integer:

- Starts at 1 for each collection
- Never reused, even after deletes
- Used as the primary key for O(1) lookups
- Preserved across export/restore

```ts
users.insertOne({}); // __inc: 1
users.insertOne({}); // __inc: 2
users.deleteOne({ __inc: 1 });
users.insertOne({}); // __inc: 3 (not 1)
```

## Find

### find

Returns a `QueryResult` with all matching documents. Call `.toArray()` to get the results.

```ts
// All documents
users.find().toArray();

// With query
users.find({ role: 'admin' }).toArray();

// With projection (select fields)
users.find({}, { name: 1, email: 1 }).toArray();
```

`find()` returns a chainable `QueryResult` — see [Chainable Queries](/guide/chainable-queries) for `.sort()`, `.skip()`, `.limit()`, `.project()`.

### findOne

Returns the first matching document, or `null`.

```ts
users.findOne({ name: 'Omar' });
// { __inc: 1, name: 'Omar', age: 30 }

users.findOne({ name: 'Nobody' });
// null
```

Looking up by `__inc` is an O(1) operation (uses the primary index directly):

```ts
users.findOne({ __inc: 1 }); // instant
```

### count

Count matching documents.

```ts
users.count();                    // all documents
users.count({ role: 'admin' });   // matching query
```

### exists

Check if any document matches.

```ts
users.exists({ name: 'Omar' });   // true
users.exists({ name: 'Nobody' }); // false
```

### first / last

Get the first or last document in insertion order.

```ts
users.first(); // { __inc: 1, ... }
users.last();  // { __inc: 3, ... }

// Empty collection
users.first(); // null
users.last();  // null
```

## Update

### updateOne

Update the first matching document. Returns an `UpdateResult`.

```ts
const result = users.updateOne(
  { name: 'Omar' },               // query
  { $set: { age: 31 } },          // update
);
// { matchedCount: 1, modifiedCount: 1 }
```

Without operators, the update object is merged into the document:

```ts
users.updateOne({ __inc: 1 }, { age: 31, city: 'Dubai' });
// Merges age and city into the document
```

Returns `{ matchedCount: 0, modifiedCount: 0 }` if no document matches.

### updateMany

Update all matching documents.

```ts
const result = users.updateMany(
  { role: 'user' },
  { $set: { active: true } },
);
// { matchedCount: 5, modifiedCount: 5 }
```

### replaceOne

Replace the entire document (except `__inc`).

```ts
users.replaceOne(
  { name: 'Omar' },
  { name: 'Omar H', age: 31 },  // completely replaces the document
);

const doc = users.findOne({ __inc: 1 });
// { __inc: 1, name: 'Omar H', age: 31 }
// Note: any other fields from the original document are gone
```

### upsertOne

Update if exists, insert if not.

```ts
// If a user with this email exists, replace it. Otherwise insert.
users.upsertOne(
  { email: 'omar@test.com' },
  { name: 'Omar', email: 'omar@test.com', age: 30 },
);
```

Returns `{ matchedCount: 1, modifiedCount: 1 }` on update, or `{ matchedCount: 0, modifiedCount: 0, upsertedId: 4 }` on insert.

## Delete

### deleteOne

Delete the first matching document.

```ts
const result = users.deleteOne({ name: 'Omar' });
// { deletedCount: 1 }

users.deleteOne({ name: 'Nobody' });
// { deletedCount: 0 }
```

### deleteMany

Delete all matching documents.

```ts
users.deleteMany({ role: 'user' });
// { deletedCount: 3 }

// Delete all documents
users.deleteMany({});
```

### drop

Remove all documents and reset the collection (including `__inc` counter).

```ts
users.drop();
// { deletedCount: 10 }

users.count();  // 0
users.insertOne({ name: 'New' });
// __inc starts at 1 again
```

::: tip
`drop()` resets the `__inc` counter. `deleteMany({})` does not.
:::
