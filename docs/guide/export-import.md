# Export / Import

Move data in and out of StateDB — for backups, migration, API integration, or syncing.

## Export

Get clean data without internal fields (`__inc`). Useful for sending to an API or downloading as JSON.

```ts
const data = db.export();
// {
//   users: [
//     { name: 'Omar', age: 30 },
//     { name: 'Ali', age: 25 },
//   ],
//   posts: [
//     { title: 'Hello', body: '...' },
//   ],
// }
```

## Dump

Get the full internal state including `__inc` and the auto-increment counter. Useful for backups.

```ts
const backup = db.dump();
// {
//   users: {
//     documents: [
//       { __inc: 1, name: 'Omar', age: 30 },
//       { __inc: 2, name: 'Ali', age: 25 },
//     ],
//     inc: 3,
//   },
// }
```

## Import

Import clean data (without `__inc`). Each document gets a new `__inc` assigned.

```ts
db.import({
  users: [
    { name: 'Omar', age: 30 },
    { name: 'Ali', age: 25 },
  ],
});
```

::: warning
`import` drops existing data in the target collections before inserting. If the collection doesn't exist, it's created.
:::

## Restore

Restore from a dump. Preserves `__inc` values and the auto-increment counter.

```ts
db.restore(backup);
```

Use `restore` when you want an exact copy — for example, restoring a backup or syncing between tabs.

## Practical Patterns

### Download as JSON

```ts
function downloadJSON() {
  const data = JSON.stringify(db.export(), null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json';
  a.click();
  URL.revokeObjectURL(url);
}
```

### Upload JSON

```ts
function handleFileUpload(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
    db.import(data);
  };
  reader.readAsText(file);
}
```

### Sync with API

```ts
// Save to server
async function syncToServer() {
  const data = db.export();
  await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// Load from server
async function syncFromServer() {
  const response = await fetch('/api/data');
  const data = await response.json();
  db.import(data);
}
```

### Backup / Restore

```ts
// Create backup
const backup = db.dump();
localStorage.setItem('manual_backup', JSON.stringify(backup));

// Restore backup
const saved = localStorage.getItem('manual_backup');
if (saved) {
  db.restore(JSON.parse(saved));
}
```

## Export vs Dump

| | `export()` | `dump()` |
|---|---|---|
| Includes `__inc` | No | Yes |
| Includes `inc` counter | No | Yes |
| Use case | API, downloads, display | Backups, exact restore |
| Restore with | `import()` | `restore()` |
| New `__inc` on import | Yes | No (preserved) |
