# Persistence

StateDB can optionally save data to `localStorage` or `sessionStorage`. Data auto-saves on every mutation and auto-loads when the database is created.

## Enabling Persistence

```ts
const db = new StateDB('mydb', {
  persistent: true,
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `persistent` | `boolean` | `false` | Enable auto-save |
| `storage` | `'local' \| 'session'` | `'local'` | Storage backend |
| `debounce` | `number` | `100` | Milliseconds between saves |

```ts
const db = new StateDB('mydb', {
  persistent: true,
  storage: 'local',   // survives browser close
  debounce: 100,       // wait 100ms before saving (batches rapid changes)
});
```

### localStorage vs sessionStorage

| | `localStorage` | `sessionStorage` |
|---|---|---|
| Survives browser close | Yes | No |
| Survives tab close | Yes | No |
| Shared across tabs | Yes (same origin) | No |
| Storage limit | ~5-10MB | ~5-10MB |

## How It Works

1. **On creation** — if `persistent: true`, StateDB loads data from storage
2. **On mutation** — every insert, update, delete schedules a debounced save
3. **On page unload** — a `beforeunload` listener forces an immediate save
4. **Storage key** — data is stored under `statedb_{name}` (e.g., `statedb_mydb`)

```ts
// Create with persistence
const db = new StateDB('myapp', { persistent: true });
const users = db.createCollection('users');

// Insert — auto-saves after 100ms
users.insertOne({ name: 'Omar' });

// Reload the page...

// Data is still there
const db2 = new StateDB('myapp', { persistent: true });
const users2 = db2.createCollection('users');
users2.count(); // 1
```

## Manual Controls

### save()

Force an immediate save (bypass debounce):

```ts
db.save();
```

### load()

Force reload from storage:

```ts
db.load();
```

### flush()

Clear all stored data:

```ts
db.flush();
```

## Debouncing

When many mutations happen in rapid succession, StateDB batches them into a single save:

```ts
const db = new StateDB('mydb', { persistent: true, debounce: 200 });
const col = db.createCollection('items');

// These 100 inserts result in only 1 save to localStorage
for (let i = 0; i < 100; i++) {
  col.insertOne({ value: i });
}
// Save fires ~200ms after the last insert
```

Set `debounce: 0` to save immediately on every mutation (not recommended for high-frequency writes).

## Storage Format

Data is stored as JSON under the key `statedb_{name}`:

```json
{
  "users": {
    "documents": [
      { "__inc": 1, "name": "Omar", "age": 30 },
      { "__inc": 2, "name": "Ali", "age": 25 }
    ],
    "inc": 3
  },
  "posts": {
    "documents": [],
    "inc": 1
  }
}
```

## Limitations

- **Storage size**: localStorage/sessionStorage is limited to ~5-10MB per origin
- **Data types**: `Date` objects are serialized as strings in JSON. After reloading, dates will be strings, not `Date` objects
- **No IndexedDB**: For larger datasets, StateDB currently only supports Web Storage APIs

::: tip
For datasets under 1MB (thousands of simple documents), localStorage works perfectly. For larger datasets, consider using StateDB as an in-memory cache without persistence.
:::
