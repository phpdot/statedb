# Hooks (Middleware)

Hooks let you run functions before or after insert, update, and delete operations. Pre-hooks can modify data or abort the operation entirely.

## Pre-Hooks

Run **before** the operation executes. Can modify the arguments or abort by returning `false`.

### pre('insert')

Receives the document being inserted. You can modify it directly.

```ts
users.pre('insert', (doc) => {
  doc.createdAt = new Date();
  doc.updatedAt = new Date();
});
```

#### Abort an Insert

Return `false` to prevent the insert. `insertOne` returns `null`.

```ts
users.pre('insert', (doc) => {
  if (doc.role === 'superadmin') return false; // blocked
});

const result = users.insertOne({ role: 'superadmin' });
// result === null
```

### pre('update')

Receives the query and update arguments.

```ts
users.pre('update', (query, update) => {
  // Add updatedAt to every update
  update.$set = update.$set || {};
  update.$set.updatedAt = new Date();
});
```

#### Abort an Update

```ts
users.pre('update', (query, update) => {
  // Prevent changing admin users
  const doc = users.findOne(query);
  if (doc && doc.role === 'admin') return false;
});
```

### pre('delete')

Receives the query argument.

```ts
users.pre('delete', (query) => {
  // Prevent deleting admin users
  const doc = users.findOne(query);
  if (doc && doc.role === 'admin') return false;
});
```

## Post-Hooks

Run **after** the operation completes. Cannot abort — they're for side effects like logging, notifications, or syncing.

### post('insert')

Receives the inserted document.

```ts
users.post('insert', (doc) => {
  console.log('New user:', doc.name, 'ID:', doc.__inc);
});
```

### post('update')

Receives the result, original query, and update.

```ts
users.post('update', (result, query, update) => {
  console.log(`Modified ${result.modifiedCount} document(s)`);
});
```

### post('delete')

Receives the result and original query.

```ts
users.post('delete', (result, query) => {
  console.log(`Deleted ${result.deletedCount} document(s)`);
});
```

## Multiple Hooks

Multiple hooks on the same operation run in registration order:

```ts
users.pre('insert', (doc) => { doc.step1 = true; });
users.pre('insert', (doc) => { doc.step2 = true; });
users.post('insert', () => console.log('post-1'));
users.post('insert', () => console.log('post-2'));

users.insertOne({ name: 'Test' });
// Document has step1 and step2
// Console: post-1, post-2
```

If any pre-hook returns `false`, subsequent pre-hooks do not run and the operation is aborted.

## Removing Hooks

### Remove a Specific Hook

Pass the same function reference:

```ts
const addTimestamp = (doc) => {
  doc.createdAt = new Date();
};

users.pre('insert', addTimestamp);

// Later...
users.removePre('insert', addTimestamp);
```

### Remove All Hooks for an Operation

```ts
users.removePre('insert');   // remove all pre-insert hooks
users.removePost('update');  // remove all post-update hooks
```

## Practical Patterns

### Auto-Timestamps

```ts
users.pre('insert', (doc) => {
  doc.createdAt = new Date();
  doc.updatedAt = new Date();
});

users.pre('update', (query, update) => {
  update.$set = update.$set || {};
  update.$set.updatedAt = new Date();
});
```

### Audit Log

```ts
const auditLog = db.createCollection('audit');

users.post('insert', (doc) => {
  auditLog.insertOne({ action: 'create', userId: doc.__inc, at: new Date() });
});

users.post('update', (result, query) => {
  auditLog.insertOne({ action: 'update', query, at: new Date() });
});

users.post('delete', (result, query) => {
  auditLog.insertOne({ action: 'delete', query, at: new Date() });
});
```

### Input Sanitization

```ts
users.pre('insert', (doc) => {
  if (typeof doc.name === 'string') {
    doc.name = doc.name.trim();
  }
  if (typeof doc.email === 'string') {
    doc.email = doc.email.toLowerCase().trim();
  }
});
```

### Soft Delete

```ts
users.pre('delete', (query) => {
  // Instead of deleting, mark as deleted
  users.updateOne(query, { $set: { deleted: true, deletedAt: new Date() } });
  return false; // abort the actual delete
});
```

## Notes

- Pre-hooks run synchronously
- If a pre-hook throws an error, the operation is aborted and the error propagates
- Post-hooks that throw are caught and logged — they don't break the operation or other hooks
- `insertMany` with hooks falls back to per-item insertion (each item gets its own hook calls)
- `insertMany` without hooks uses optimized batch insertion
