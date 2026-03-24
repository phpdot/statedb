# Quick Start

## Create a Database

```ts
import { StateDB } from '@phpdot/statedb';

const db = new StateDB('mydb');
```

The name is used as a namespace for persistence. You can create multiple databases with different names.

## Create a Collection

```ts
const users = db.createCollection('users');
```

Calling `createCollection` with the same name returns the existing collection — it doesn't create a duplicate.

## Insert Documents

```ts
// Insert one
const doc = users.insertOne({ name: 'Omar', age: 30, role: 'admin' });
console.log(doc);
// { __inc: 1, name: 'Omar', age: 30, role: 'admin' }

// Insert many
const docs = users.insertMany([
  { name: 'Ali', age: 25, role: 'user' },
  { name: 'Sara', age: 28, role: 'admin' },
]);
```

Every inserted document receives an auto-incrementing `__inc` field. This is the primary key — it's never reused, even after deletes.

## Find Documents

```ts
// All documents
users.find().toArray();

// With a query
users.find({ role: 'admin' }).toArray();
// [{ __inc: 1, name: 'Omar', ... }, { __inc: 3, name: 'Sara', ... }]

// Find one
users.findOne({ name: 'Ali' });
// { __inc: 2, name: 'Ali', age: 25, role: 'user' }

// By primary key (instant O(1) lookup)
users.findOne({ __inc: 1 });
```

## Update Documents

```ts
// Simple field merge
users.updateOne({ name: 'Ali' }, { age: 26 });

// With MongoDB operators
users.updateOne({ name: 'Ali' }, {
  $set: { role: 'admin' },
  $inc: { age: 1 },
});
```

## Delete Documents

```ts
users.deleteOne({ name: 'Ali' });
users.deleteMany({ role: 'user' });
```

## Watch for Changes

```ts
users.watch((event, docs, prevDocs) => {
  console.log(event); // 'insert' | 'update' | 'delete' | 'drop'
  console.log(docs);  // affected documents
});

// Now any mutation triggers the watcher
users.insertOne({ name: 'Zain', age: 35 });
// Console: 'insert' [{ __inc: 4, name: 'Zain', ... }]
```

## Full Example

```ts
import { StateDB } from '@phpdot/statedb';

const db = new StateDB('mydb');
const users = db.createCollection('users');

// Watch for changes
users.watch((event, docs) => {
  console.log(`[${event}]`, docs.length, 'document(s)');
});

// Insert
users.insertOne({ name: 'Omar', age: 30, role: 'admin' });
users.insertMany([
  { name: 'Ali', age: 25, role: 'user' },
  { name: 'Sara', age: 28, role: 'admin' },
]);

// Query
const admins = users.find({ role: 'admin' })
  .sort({ age: -1 })
  .toArray();
console.log('Admins:', admins.map(u => u.name)); // ['Omar', 'Sara']

// Update
users.updateOne({ name: 'Ali' }, { $set: { role: 'admin' }, $inc: { age: 1 } });

// Count
console.log('Total:', users.count());           // 3
console.log('Admins:', users.count({ role: 'admin' })); // 3

// Delete
users.deleteOne({ name: 'Ali' });
console.log('After delete:', users.count());     // 2
```

## Next Steps

- [CRUD Operations](/guide/crud-operations) — full insert, find, update, delete docs
- [Query Operators](/guide/query-operators) — `$gt`, `$in`, `$regex`, `$and`, `$or`, and more
- [Watchers](/guide/watchers) — reactive UI patterns
- [Schema Validation](/guide/schema-validation) — validate data on write
