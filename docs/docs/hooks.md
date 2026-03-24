# Hooks

Hooks let you run custom logic before or after insert, update, and delete operations. Use them for validation, transformation, logging, and side effects.

## pre(operation, callback)

Register a pre-hook. The callback runs **before** the operation. Return `false` to abort the operation.

```js
users.pre('insert', (doc) => {
  console.log('About to insert:', doc);
});
```

## post(operation, callback)

Register a post-hook. The callback runs **after** the operation completes.

```js
users.post('insert', (doc) => {
  console.log('Inserted:', doc);
});
```

## Supported Operations

| Operation | Pre-hook arguments | Post-hook arguments |
|-----------|-------------------|-------------------|
| `insert` | `(doc)` | `(insertedDoc)` |
| `update` | `(query, update)` | `(result, query, update)` |
| `delete` | `(query)` | `(result, query)` |

## Aborting Operations

Return `false` from a pre-hook to cancel the operation. The operation returns as if no document matched.

```js
users.pre('insert', (doc) => {
  if (doc.name === 'blocked') {
    return false; // abort insert
  }
});

const result = users.insertOne({ name: 'blocked' });
// result is null

const result2 = users.insertOne({ name: 'allowed' });
// result2 is the inserted document
```

```js
users.pre('delete', (query) => {
  if (query.role === 'admin') {
    return false; // prevent deleting admins
  }
});

users.deleteOne({ role: 'admin' });
// { deletedCount: 0 }
```

## Multiple Hooks

Multiple hooks for the same operation run in the order they were registered. If any pre-hook returns `false`, subsequent pre-hooks are skipped and the operation is aborted.

```js
users.pre('insert', (doc) => {
  console.log('Hook 1');
});

users.pre('insert', (doc) => {
  console.log('Hook 2');
});

users.pre('insert', (doc) => {
  console.log('Hook 3');
});

users.insertOne({ name: 'Test' });
// Hook 1
// Hook 2
// Hook 3
```

## removePre / removePost

Remove hooks by reference, or remove all hooks for an operation.

### Remove a Specific Hook

```js
const hook = (doc) => {
  console.log('Insert hook');
};

users.pre('insert', hook);
users.removePre('insert', hook); // removes only this hook
```

### Remove All Hooks for an Operation

```js
users.removePre('insert');   // removes all pre-insert hooks
users.removePost('update');  // removes all post-update hooks
```

## Chainable Registration

`pre()`, `post()`, `removePre()`, and `removePost()` all return `this`, so they can be chained.

```js
users
  .pre('insert', validateDoc)
  .pre('update', validateUpdate)
  .post('insert', logInsert)
  .post('delete', logDelete);
```

## Practical Patterns

### Auto-Timestamps

Automatically set `createdAt` on insert and `updatedAt` on update.

```js
const tasks = db.createCollection('tasks');

tasks.pre('insert', (doc) => {
  doc.createdAt = new Date();
  doc.updatedAt = new Date();
});

tasks.pre('update', (query, update) => {
  if (!update.$set) update.$set = {};
  update.$set.updatedAt = new Date();
});

tasks.insertOne({ title: 'Write docs' });
// { title: 'Write docs', createdAt: Date, updatedAt: Date, __inc: 1 }
```

### Audit Log

Record all changes in a separate collection.

```js
const items = db.createCollection('items');
const audit = db.createCollection('audit');

items.post('insert', (doc) => {
  audit.insertOne({ action: 'insert', docId: doc.__inc, timestamp: new Date() });
});

items.post('update', (result, query, update) => {
  audit.insertOne({ action: 'update', query, update, timestamp: new Date() });
});

items.post('delete', (result, query) => {
  audit.insertOne({ action: 'delete', query, deleted: result.deletedCount, timestamp: new Date() });
});
```

### Soft Delete

Instead of deleting documents, mark them as deleted.

```js
const records = db.createCollection('records');

records.pre('delete', (query) => {
  // Convert delete into an update
  records.updateMany(query, {
    $set: { deleted: true, deletedAt: new Date() }
  });
  return false; // abort the actual delete
});

records.insertOne({ name: 'Important', deleted: false });
records.deleteOne({ name: 'Important' });

records.findOne({ name: 'Important' });
// { name: 'Important', deleted: true, deletedAt: Date, __inc: 1 }
```

### Input Sanitization

Clean up data before it is stored.

```js
users.pre('insert', (doc) => {
  if (typeof doc.name === 'string') {
    doc.name = doc.name.trim();
  }
  if (typeof doc.email === 'string') {
    doc.email = doc.email.toLowerCase().trim();
  }
});
```

## Error Handling

If a pre-hook throws an error, the error propagates and the operation is aborted. If a post-hook throws, the error is caught and logged to `console.error` without affecting the result.

```js
// Pre-hook errors propagate
users.pre('insert', () => {
  throw new Error('Validation failed');
});
users.insertOne({ name: 'Test' }); // throws Error

// Post-hook errors are caught
users.post('insert', () => {
  throw new Error('Logging failed');
});
users.insertOne({ name: 'Test' }); // succeeds, error logged
```
