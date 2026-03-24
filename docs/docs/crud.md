# CRUD Operations

StateDB provides a MongoDB-style API for creating, reading, updating, and deleting documents.

## Setup

```js
import { StateDB } from '@phpdot/statedb';

const db = new StateDB('myapp');
const users = db.createCollection('users');
```

## Insert

### insertOne

Inserts a single document. Returns the inserted document with an auto-generated `__inc` primary key, or `null` if a pre-hook aborted the insert.

```js
const user = users.insertOne({ name: 'Omar', age: 30 });
// { name: 'Omar', age: 30, __inc: 1 }

const user2 = users.insertOne({ name: 'Sara', age: 25 });
// { name: 'Sara', age: 25, __inc: 2 }
```

The `__inc` field is an auto-incrementing integer assigned to every document. It serves as the primary key and cannot be overridden.

### insertMany

Inserts multiple documents in a single batch. Returns an array of inserted documents.

```js
const docs = users.insertMany([
  { name: 'Ali', age: 28 },
  { name: 'Noor', age: 35 },
  { name: 'Zain', age: 22 },
]);
// [{ name: 'Ali', __inc: 3 }, { name: 'Noor', __inc: 4 }, { name: 'Zain', __inc: 5 }]
```

`insertMany` emits a single watcher event and a single persistence save for the entire batch, making it more efficient than calling `insertOne` in a loop.

## Read

### find

Returns a `QueryResult` object. Chain `.sort()`, `.skip()`, `.limit()`, `.project()` before calling a terminal method.

```js
// All documents
users.find().toArray();

// With query filter
users.find({ age: { $gte: 25 } }).toArray();

// With projection (include only specific fields)
users.find({}, { name: 1 }).toArray();

// Chained
users.find({ age: { $gte: 25 } })
  .sort({ age: -1 })
  .skip(0)
  .limit(10)
  .toArray();
```

### findOne

Returns the first matching document, or `null`.

```js
const user = users.findOne({ name: 'Omar' });
// { name: 'Omar', age: 30, __inc: 1 }

const missing = users.findOne({ name: 'Ghost' });
// null
```

Fast path: querying by `__inc` uses a direct Map lookup instead of scanning.

```js
users.findOne({ __inc: 1 }); // O(1) lookup
```

### count

Returns the number of matching documents.

```js
users.count(); // total documents
users.count({ age: { $gte: 25 } }); // filtered count
```

### exists

Returns `true` if at least one document matches.

```js
users.exists({ name: 'Omar' }); // true
users.exists({ name: 'Ghost' }); // false
```

### first / last

Returns the first or last document by insertion order.

```js
users.first(); // { name: 'Omar', age: 30, __inc: 1 }
users.last();  // { name: 'Zain', age: 22, __inc: 5 }
```

## Update

### updateOne

Updates the first matching document. Returns an `UpdateResult`.

```js
const result = users.updateOne(
  { name: 'Omar' },
  { $set: { age: 31 }, $inc: { logins: 1 } }
);
// { matchedCount: 1, modifiedCount: 1 }
```

### updateMany

Updates all matching documents.

```js
const result = users.updateMany(
  { age: { $lt: 30 } },
  { $set: { tier: 'junior' } }
);
// { matchedCount: 2, modifiedCount: 2 }
```

### replaceOne

Replaces an entire document (preserving `__inc`).

```js
users.replaceOne(
  { name: 'Omar' },
  { name: 'Omar', age: 31, role: 'admin' }
);
```

### upsertOne

Updates if a match is found, otherwise inserts. When inserting, the result includes `upsertedId`.

```js
// Updates existing document
users.upsertOne({ name: 'Omar' }, { name: 'Omar', age: 32 });
// { matchedCount: 1, modifiedCount: 1 }

// Inserts new document
users.upsertOne({ name: 'New' }, { name: 'New', age: 20 });
// { matchedCount: 0, modifiedCount: 0, upsertedId: 6 }
```

## Delete

### deleteOne

Deletes the first matching document.

```js
const result = users.deleteOne({ name: 'Zain' });
// { deletedCount: 1 }
```

### deleteMany

Deletes all matching documents.

```js
const result = users.deleteMany({ age: { $lt: 25 } });
// { deletedCount: 1 }
```

### drop

Removes all documents from the collection and resets the `__inc` counter.

```js
const result = users.drop();
// { deletedCount: 5 }
```

## Result Shapes

### UpdateResult

```ts
interface UpdateResult {
  matchedCount: number;   // documents that matched the query
  modifiedCount: number;  // documents that were modified
  upsertedId?: number;    // __inc of inserted doc (upsertOne only)
}
```

### DeleteResult

```ts
interface DeleteResult {
  deletedCount: number;   // documents that were deleted
}
```

## The `__inc` Primary Key

Every document receives an `__inc` field on insert. It is:

- An auto-incrementing integer starting at 1
- Unique within the collection
- Used internally for O(1) lookups and index references
- Preserved across updates and replaces
- Reset to 1 when `drop()` is called
- Included in `dump()` output (but stripped from `export()` output)

```js
const doc = users.insertOne({ name: 'Test' });
console.log(doc.__inc); // 1

// Use it to find documents directly
users.findOne({ __inc: 1 }); // O(1) primary key lookup
```
