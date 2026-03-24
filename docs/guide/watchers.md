# Watchers (Reactivity)

Watchers let you subscribe to data changes on a collection. They fire synchronously after every mutation — insert, update, delete, or drop.

This is the core feature that makes StateDB reactive. Instead of polling for changes, your UI re-renders automatically.

## Basic Usage

```ts
const id = users.watch((event, docs, prevDocs) => {
  console.log(event);    // 'insert' | 'update' | 'delete' | 'drop'
  console.log(docs);     // affected documents (current state)
  console.log(prevDocs); // previous state (null for insert and drop)
});
```

## Callback Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `'insert' \| 'update' \| 'delete' \| 'drop'` | The operation that triggered the watcher |
| `docs` | `Document[]` | The affected documents (after the operation) |
| `prevDocs` | `Document[] \| null` | The previous state of the documents (only for `update`) |

### Insert Events

```ts
users.watch((event, docs, prev) => {
  // event: 'insert'
  // docs: [{ __inc: 1, name: 'Omar', ... }]
  // prev: null
});
users.insertOne({ name: 'Omar' });
```

### Update Events

```ts
users.watch((event, docs, prev) => {
  // event: 'update'
  // docs: [{ __inc: 1, name: 'Omar H', ... }]  — new state
  // prev: [{ __inc: 1, name: 'Omar', ... }]     — old state
});
users.updateOne({ name: 'Omar' }, { $set: { name: 'Omar H' } });
```

### Delete Events

```ts
users.watch((event, docs, prev) => {
  // event: 'delete'
  // docs: [{ __inc: 1, name: 'Omar', ... }]  — the deleted documents
  // prev: null
});
users.deleteOne({ name: 'Omar' });
```

### Drop Events

```ts
users.watch((event, docs, prev) => {
  // event: 'drop'
  // docs: [all documents that were in the collection]
  // prev: null
});
users.drop();
```

## Filtering by Operation

Only listen to specific operations:

```ts
// Only insert and delete
users.watch(callback, { ops: ['insert', 'delete'] });

// Only updates
users.watch(callback, { ops: ['update'] });
```

## Removing Watchers

### By ID

```ts
const id = users.watch(callback);

// Later...
users.unwatch(id);
```

### Remove All

```ts
users.unwatch(); // removes all watchers from this collection
```

## Error Handling

If a watcher throws an error, it doesn't break other watchers:

```ts
users.watch(() => {
  throw new Error('broken watcher');
});

users.watch(() => {
  console.log('still fires'); // this runs fine
});

users.insertOne({ name: 'Test' });
// Error is logged to console, second watcher still fires
```

## Patterns

### Reactive UI Re-rendering

```ts
const db = new StateDB('app');
const todos = db.createCollection('todos');

function render() {
  const items = todos.find().sort({ __inc: -1 }).toArray();
  const list = document.getElementById('list');
  list.textContent = '';
  items.forEach(t => {
    const li = document.createElement('li');
    li.textContent = t.text;
    list.appendChild(li);
  });
}

// Re-render on any change
todos.watch(render);

// Initial render
render();
```

### Live Counter

```ts
users.watch(() => {
  document.getElementById('count').textContent = String(users.count());
});
```

### Change Log

```ts
users.watch((event, docs) => {
  const names = docs.map(d => d.name).join(', ');
  console.log(`[${new Date().toISOString()}] ${event}: ${names}`);
});
```

### Conditional Actions

```ts
users.watch((event, docs) => {
  if (event === 'insert') {
    docs.forEach(doc => {
      if (doc.role === 'admin') {
        notifications.insertOne({ text: `New admin: ${doc.name}` });
      }
    });
  }
});
```

## Performance

Watchers add minimal overhead:

- 5,000 inserts with 1 watcher: **~2ms**
- 1,000 updates with 10 watchers: **~1ms**

Watchers fire synchronously, so keep them fast. Avoid heavy DOM operations inside watchers — batch your renders if needed.
