# Persistence

StateDB can automatically save and restore collections to `localStorage` or `sessionStorage`. Data survives page reloads without any manual serialization.

## Enabling Persistence

Pass `persistent: true` when creating the database.

```js
import { StateDB } from '@phpdot/statedb';

const db = new StateDB('myapp', { persistent: true });
const users = db.createCollection('users');

users.insertOne({ name: 'Omar' });
// Automatically saved to localStorage
```

## StateDBOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `persistent` | `boolean` | `false` | Enable auto-save and auto-load |
| `storage` | `'local' \| 'session'` | `'local'` | Storage backend |
| `debounce` | `number` | `100` | Milliseconds to debounce save calls |

```js
// Session storage with 200ms debounce
const db = new StateDB('myapp', {
  persistent: true,
  storage: 'session',
  debounce: 200,
});
```

## How It Works

### Auto-Load

When `persistent: true`, the constructor calls `load()` to restore any previously saved data. When `createCollection()` is called, it also checks storage for that collection's data.

```js
// Page load 1
const db = new StateDB('app', { persistent: true });
const todos = db.createCollection('todos');
todos.insertOne({ text: 'Buy milk' });

// Page load 2 (data is restored)
const db2 = new StateDB('app', { persistent: true });
const todos2 = db2.createCollection('todos');
todos2.count(); // 1
todos2.first(); // { text: 'Buy milk', __inc: 1 }
```

### Auto-Save

Every mutation (insert, update, delete, drop) triggers a debounced save. Multiple rapid mutations are batched into a single write.

```js
// These three operations result in one save call (within 100ms)
users.insertOne({ name: 'A' });
users.insertOne({ name: 'B' });
users.insertOne({ name: 'C' });
```

### beforeunload

A `beforeunload` event listener ensures data is flushed to storage when the user leaves the page.

## Manual Methods

### save()

Force an immediate save. Returns `true` on success, `false` on failure.

```js
db.save(); // true
```

### load()

Reload data from storage. Returns `true` if data was found and loaded.

```js
db.load(); // true
```

### flush()

Remove all saved data from storage. Does not clear in-memory collections.

```js
db.flush(); // true
```

## Debouncing

The `debounce` option controls how long StateDB waits before writing to storage after a mutation. This prevents excessive writes during rapid updates.

```js
const db = new StateDB('app', {
  persistent: true,
  debounce: 500, // wait 500ms after last mutation
});
```

Each mutation resets the debounce timer. The save only fires once mutations stop for the specified duration.

```
insert -> reset timer (500ms)
insert -> reset timer (500ms)  (20ms later)
insert -> reset timer (500ms)  (20ms later)
         ... 500ms of silence ...
         save()                 (one write)
```

## Storage Format

Data is stored as a JSON string under the key `statedb_{name}`.

```js
const db = new StateDB('myapp', { persistent: true });
```

The storage key is `statedb_myapp`. The value is a JSON object mapping collection names to their dump:

```json
{
  "users": {
    "documents": [
      { "name": "Omar", "age": 30, "__inc": 1 },
      { "name": "Sara", "age": 25, "__inc": 2 }
    ],
    "inc": 3
  },
  "todos": {
    "documents": [
      { "text": "Buy milk", "done": false, "__inc": 1 }
    ],
    "inc": 2
  }
}
```

The `inc` value is the next `__inc` to be assigned, ensuring new inserts continue the sequence after a reload.

## localStorage vs sessionStorage

| Feature | `localStorage` | `sessionStorage` |
|---------|---------------|-----------------|
| Lifetime | Persists until cleared | Cleared when tab closes |
| Shared across tabs | Yes | No |
| Size limit | ~5-10 MB | ~5-10 MB |
| Use case | Long-term state | Temporary session state |

```js
// Persists across browser restarts
const db1 = new StateDB('app', { persistent: true, storage: 'local' });

// Cleared when tab closes
const db2 = new StateDB('app', { persistent: true, storage: 'session' });
```

## Error Handling

Storage errors (quota exceeded, private browsing restrictions) are caught and logged to `console.error`. The methods return `false` on failure.

```js
const saved = db.save();
if (!saved) {
  console.warn('Failed to save — storage may be full');
}
```

## Server-Side Safety

Persistence gracefully handles server-side environments (Node.js, SSR) where `window`, `localStorage`, and `sessionStorage` do not exist. All persistence methods return `false` when no storage is available.
