# Watchers

Watchers let you subscribe to collection changes and react in real time. They are the foundation for building reactive UIs without a framework.

## watch(callback, options?)

Register a callback that fires whenever the collection changes. Returns a numeric watcher ID.

```js
const id = users.watch((event, docs, prevDocs) => {
  console.log(event, docs);
});
```

### Callback Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `event` | `'insert' \| 'update' \| 'delete' \| 'drop'` | The operation that triggered the watcher |
| `docs` | `Document[]` | The affected documents (inserted, updated, deleted, or all docs before drop) |
| `prevDocs` | `Document[] \| null` | Previous versions of the documents (only for `update` events) |

```js
users.watch((event, docs, prevDocs) => {
  switch (event) {
    case 'insert':
      console.log('Inserted:', docs);
      // prevDocs is null
      break;
    case 'update':
      console.log('Updated:', docs);
      console.log('Previous:', prevDocs);
      break;
    case 'delete':
      console.log('Deleted:', docs);
      // prevDocs is null
      break;
    case 'drop':
      console.log('Collection dropped, had:', docs);
      // prevDocs is null
      break;
  }
});
```

### Filtering by Operation

Use the `ops` option to only listen to specific event types.

```js
// Only listen to inserts
users.watch((event, docs) => {
  console.log('New document:', docs[0]);
}, { ops: ['insert'] });

// Only listen to updates and deletes
users.watch((event, docs, prevDocs) => {
  console.log(event, docs);
}, { ops: ['update', 'delete'] });
```

## Event Types

### insert

Fired after `insertOne` or `insertMany`. The `docs` array contains the newly inserted documents.

```js
users.watch((event, docs) => {
  if (event === 'insert') {
    console.log('Inserted', docs.length, 'documents');
  }
}, { ops: ['insert'] });

users.insertOne({ name: 'Omar' });
// Inserted 1 documents

users.insertMany([{ name: 'Sara' }, { name: 'Ali' }]);
// Inserted 2 documents
```

### update

Fired after `updateOne`, `updateMany`, or `replaceOne`. The `docs` array contains the updated documents, `prevDocs` contains their previous state.

```js
users.watch((event, docs, prevDocs) => {
  if (event === 'update') {
    docs.forEach((doc, i) => {
      console.log(`${doc.name}: age ${prevDocs[i].age} -> ${doc.age}`);
    });
  }
}, { ops: ['update'] });

users.updateOne({ name: 'Omar' }, { $inc: { age: 1 } });
// Omar: age 30 -> 31
```

### delete

Fired after `deleteOne` or `deleteMany`. The `docs` array contains the deleted documents.

```js
users.watch((event, docs) => {
  if (event === 'delete') {
    console.log('Deleted:', docs.map(d => d.name));
  }
}, { ops: ['delete'] });
```

### drop

Fired when `drop()` is called on the collection or when `db.dropCollection()` is called. The `docs` array contains all documents that were in the collection before the drop.

```js
users.watch((event, docs) => {
  if (event === 'drop') {
    console.log('Collection dropped, lost', docs.length, 'documents');
  }
}, { ops: ['drop'] });
```

## unwatch

### Unwatch by ID

Remove a specific watcher using the ID returned by `watch()`.

```js
const id = users.watch((event, docs) => {
  console.log(event);
});

// Later, stop watching
users.unwatch(id);
```

### Unwatch All

Call `unwatch()` with no arguments to remove all watchers from the collection.

```js
users.unwatch(); // removes all watchers
```

## Error Isolation

If a watcher callback throws an error, it does not affect other watchers. Each callback is wrapped in a try/catch, and the error is logged to `console.error`.

```js
// This watcher throws
users.watch(() => {
  throw new Error('broken');
});

// This watcher still runs
users.watch((event, docs) => {
  console.log('Still works:', event);
});

users.insertOne({ name: 'Test' });
// Console: "Watcher error: Error: broken"
// Console: "Still works: insert"
```

## Reactive UI Pattern

The most common use of watchers is re-rendering a UI whenever data changes.

```js
const db = new StateDB('app');
const todos = db.createCollection('todos');

function render() {
  const items = todos.find().sort({ __inc: -1 }).toArray();
  const list = document.getElementById('todo-list');
  list.textContent = '';

  items.forEach(todo => {
    const li = document.createElement('li');
    li.textContent = todo.text;
    if (todo.done) {
      li.style.textDecoration = 'line-through';
    }
    li.addEventListener('click', () => {
      todos.updateOne({ __inc: todo.__inc }, { $set: { done: !todo.done } });
    });
    list.appendChild(li);
  });
}

// Re-render on every change
todos.watch(render);

// Initial render
render();
```

Any operation that modifies the collection (insert, update, delete, drop) triggers the watcher, so the UI stays in sync automatically. Since watchers fire synchronously after the operation completes, the DOM update happens immediately.
