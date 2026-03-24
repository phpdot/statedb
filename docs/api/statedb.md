# StateDB

The main database class. Manages collections, persistence, and data import/export.

## Constructor

```ts
new StateDB(name?: string, options?: StateDBOptions)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | `'statedb'` | Database name (used as storage key prefix) |
| `options.persistent` | `boolean` | `false` | Enable auto-save to storage |
| `options.storage` | `'local' \| 'session'` | `'local'` | Storage backend |
| `options.debounce` | `number` | `100` | Save debounce in milliseconds |

```ts
// Basic
const db = new StateDB('mydb');

// With persistence
const db = new StateDB('mydb', {
  persistent: true,
  storage: 'local',
  debounce: 100,
});
```

## Collection Management

### createCollection

```ts
db.createCollection(name: string, options?: CollectionOptions): Collection
```

Create a new collection or return an existing one with the same name.

| Option | Type | Description |
|--------|------|-------------|
| `schema` | `SchemaDefinition` | Field validation rules |
| `capped` | `boolean` | Enable capped collection |
| `max` | `number` | Max documents (requires `capped: true`) |

```ts
const users = db.createCollection('users');

const logs = db.createCollection('logs', {
  schema: { message: { type: String, required: true } },
  capped: true,
  max: 1000,
});
```

### getCollection

```ts
db.getCollection(name: string): Collection | null
```

Get an existing collection by name. Returns `null` if not found.

```ts
const users = db.getCollection('users');
```

### listCollections

```ts
db.listCollections(): string[]
```

List all collection names.

```ts
db.listCollections(); // ['users', 'posts', 'logs']
```

### dropCollection

```ts
db.dropCollection(name: string): boolean
```

Drop a collection. Emits a `'drop'` watcher event. Returns `true` if found, `false` if not.

```ts
db.dropCollection('logs'); // true
```

### drop

```ts
db.drop(): boolean
```

Drop all collections and clear storage.

```ts
db.drop();
db.listCollections(); // []
```

## Persistence

### save

```ts
db.save(): boolean
```

Force an immediate save to storage. Returns `false` if no storage is available.

### load

```ts
db.load(): boolean
```

Force reload from storage. Returns `false` if no data found.

### flush

```ts
db.flush(): boolean
```

Clear all stored data from storage.

## Export / Import

### export

```ts
db.export(): ExportData
```

Export clean data without `__inc`. Returns `{ collectionName: Document[], ... }`.

### dump

```ts
db.dump(): DumpData
```

Export full data with `__inc` and `inc` counter. Returns `{ collectionName: { documents: Document[], inc: number }, ... }`.

### import

```ts
db.import(data: ImportData): boolean
```

Import clean data. Drops existing data in target collections. Assigns new `__inc` values.

### restore

```ts
db.restore(dump: DumpData): boolean
```

Restore from dump. Preserves `__inc` values and counters.
