# Export & Import

StateDB provides two pairs of methods for moving data in and out of the database:

- **`export()` / `import()`** — clean data without internal metadata
- **`dump()` / `restore()`** — full snapshot including `__inc` counters

## export()

Returns all collections as plain objects with `__inc` stripped. Suitable for sending to an API or downloading as user-facing JSON.

```js
const data = db.export();
// {
//   users: [
//     { name: 'Omar', age: 30 },
//     { name: 'Sara', age: 25 }
//   ],
//   todos: [
//     { text: 'Buy milk', done: false }
//   ]
// }
```

## dump()

Returns a full snapshot including `__inc` values and the current counter. Use this for backups, cloning, or transferring between StateDB instances.

```js
const data = db.dump();
// {
//   users: {
//     documents: [
//       { name: 'Omar', age: 30, __inc: 1 },
//       { name: 'Sara', age: 25, __inc: 2 }
//     ],
//     inc: 3
//   },
//   todos: {
//     documents: [
//       { text: 'Buy milk', done: false, __inc: 1 }
//     ],
//     inc: 2
//   }
// }
```

## import(data)

Imports clean data (without `__inc`). Each collection is dropped first, then documents are re-inserted with fresh `__inc` values.

```js
db.import({
  users: [
    { name: 'Omar', age: 30 },
    { name: 'Sara', age: 25 },
  ],
  todos: [
    { text: 'Buy milk', done: false },
  ],
});
```

Collections that do not exist are created automatically.

## restore(dump)

Restores a full dump including `__inc` values. The counter is set to the saved value so new inserts continue the sequence.

```js
db.restore({
  users: {
    documents: [
      { name: 'Omar', age: 30, __inc: 1 },
      { name: 'Sara', age: 25, __inc: 2 },
    ],
    inc: 3,
  },
});
```

## Differences

| | `export()` / `import()` | `dump()` / `restore()` |
|---|---|---|
| Includes `__inc` | No | Yes |
| Preserves counter | No (re-inserts with new IDs) | Yes |
| Drops existing data | Yes (per collection) | Yes (per collection) |
| Creates missing collections | Yes | Yes |
| Format | `{ collName: docs[] }` | `{ collName: { documents, inc } }` |
| Use case | API sync, user download | Backup, clone, transfer |

## Practical Patterns

### Download as JSON

```js
function downloadDatabase() {
  const data = db.export();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'statedb-export.json';
  a.click();
  URL.revokeObjectURL(url);
}
```

### Upload JSON

```js
function handleFileUpload(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = JSON.parse(e.target.result);
    db.import(data);
  };
  reader.readAsText(file);
}

// Usage with a file input
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json';
input.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileUpload(e.target.files[0]);
  }
});
```

### Sync with API

```js
// Push local data to server
async function pushToServer() {
  const data = db.export();
  await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// Pull server data into local DB
async function pullFromServer() {
  const response = await fetch('/api/sync');
  const data = await response.json();
  db.import(data);
}
```

### Clone a Database

```js
const source = new StateDB('source');
const target = new StateDB('target');

// Full clone preserving __inc values
target.restore(source.dump());
```

### Backup and Restore

```js
// Save a backup
const backup = db.dump();
localStorage.setItem('backup', JSON.stringify(backup));

// Restore from backup
const saved = JSON.parse(localStorage.getItem('backup'));
db.restore(saved);
```
