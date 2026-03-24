# Schema Validation

Schemas enforce data integrity by validating documents on insert and update. Define field types, constraints, and defaults at collection creation time.

## Defining a Schema

Pass a `schema` object when creating a collection.

```js
import { StateDB } from '@phpdot/statedb';

const db = new StateDB('app');
const users = db.createCollection('users', {
  schema: {
    name: { type: String, required: true, minLength: 1, maxLength: 100 },
    email: { type: String, required: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    age: { type: Number, min: 0, max: 150 },
    role: { type: String, enum: ['admin', 'user', 'guest'], default: 'user' },
    active: { type: Boolean, default: true },
    tags: { type: Array, of: String },
    profile: { type: Object },
    createdAt: { type: Date, default: () => new Date() },
  }
});
```

## Schema Rules

| Rule | Type | Description |
|------|------|-------------|
| `type` | `SchemaType` | Required type for the field value |
| `required` | `boolean` | Field must be present on insert (not enforced on update) |
| `default` | `any \| () => any` | Default value if field is missing on insert |
| `min` | `number` | Minimum value (for numbers) |
| `max` | `number` | Maximum value (for numbers) |
| `minLength` | `number` | Minimum string length |
| `maxLength` | `number` | Maximum string length |
| `enum` | `any[]` | Value must be one of the listed values |
| `match` | `RegExp` | String must match the regular expression |
| `of` | `SchemaType` | Type constraint for array elements |

## Type Constructors

Use JavaScript's built-in constructors as type values:

| Constructor | Validates |
|-------------|-----------|
| `String` | `typeof value === 'string'` |
| `Number` | `typeof value === 'number'` and not `NaN` |
| `Boolean` | `typeof value === 'boolean'` |
| `Date` | `value instanceof Date` |
| `Array` | `Array.isArray(value)` |
| `Object` | Plain object (not null, not array) |

```js
const logs = db.createCollection('logs', {
  schema: {
    message: { type: String, required: true },
    level: { type: Number, min: 0, max: 5 },
    timestamp: { type: Date, default: () => new Date() },
    meta: { type: Object },
    tags: { type: Array, of: String },
    archived: { type: Boolean, default: false },
  }
});
```

## Defaults

Default values are applied on insert when the field is `undefined`. They are not applied during updates.

### Static Defaults

```js
const col = db.createCollection('items', {
  schema: {
    status: { type: String, default: 'draft' },
    count: { type: Number, default: 0 },
  }
});

col.insertOne({ name: 'Test' });
// { name: 'Test', status: 'draft', count: 0, __inc: 1 }
```

### Function Defaults

Use a function to generate dynamic defaults. The function is called at insert time.

```js
const col = db.createCollection('events', {
  schema: {
    id: { type: String, default: () => Math.random().toString(36).slice(2) },
    createdAt: { type: Date, default: () => new Date() },
  }
});

col.insertOne({ title: 'Event 1' });
// { title: 'Event 1', id: 'k7x9m2p', createdAt: Date, __inc: 1 }
```

## Validation on Insert

All schema rules are checked after defaults are applied.

```js
const users = db.createCollection('users', {
  schema: {
    name: { type: String, required: true },
    age: { type: Number, min: 0 },
  }
});

// Missing required field
users.insertOne({ age: 25 });
// Error: "Validation error: name is required"

// Wrong type
users.insertOne({ name: 123 });
// Error: "Validation error: name must be of type String"

// Out of range
users.insertOne({ name: 'Omar', age: -5 });
// Error: "Validation error: age must be at least 0"
```

## Validation on Update

Schema validation also runs on `updateOne`, `updateMany`, and `replaceOne`. On updates, `required` checks are skipped (you do not need to provide all required fields in a partial update).

```js
users.insertOne({ name: 'Omar', age: 30 });

// Type violation on update
users.updateOne({ name: 'Omar' }, { $set: { age: 'thirty' } });
// Error: "Validation error: age must be of type Number"

// Range violation on update
users.updateOne({ name: 'Omar' }, { $set: { age: -1 } });
// Error: "Validation error: age must be at least 0"
```

## String Constraints

### minLength / maxLength

```js
const col = db.createCollection('posts', {
  schema: {
    title: { type: String, minLength: 1, maxLength: 200 },
  }
});

col.insertOne({ title: '' });
// Error: "Validation error: title must be at least 1 characters"

col.insertOne({ title: 'A'.repeat(201) });
// Error: "Validation error: title must be at most 200 characters"
```

### match

```js
const col = db.createCollection('accounts', {
  schema: {
    email: { type: String, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  }
});

col.insertOne({ email: 'not-an-email' });
// Error: "Validation error: email does not match required pattern"
```

## Enum Constraint

```js
const col = db.createCollection('tasks', {
  schema: {
    priority: { type: String, enum: ['low', 'medium', 'high'] },
  }
});

col.insertOne({ priority: 'urgent' });
// Error: "Validation error: priority must be one of: low, medium, high"
```

## Array Element Type (of)

The `of` rule validates the type of each element in an array.

```js
const col = db.createCollection('lists', {
  schema: {
    tags: { type: Array, of: String },
    scores: { type: Array, of: Number },
  }
});

col.insertOne({ tags: ['a', 'b', 123] });
// Error: "Validation error: tags[2] must be of type String"
```

## Capped Collections

A capped collection automatically removes the oldest documents when it reaches the maximum size.

```js
const logs = db.createCollection('logs', {
  schema: {
    message: { type: String, required: true },
  },
  capped: true,
  max: 100,
});

// After 100 inserts, the 101st insert removes the oldest document
for (let i = 0; i < 150; i++) {
  logs.insertOne({ message: `Log ${i}` });
}

logs.count(); // 100 (oldest 50 were evicted)
```

## Error Format

Validation errors are thrown as standard `Error` objects. When multiple rules fail, all messages are joined with semicolons.

```js
try {
  users.insertOne({ age: 'not a number' });
} catch (e) {
  console.log(e.message);
  // "Validation error: name is required; age must be of type Number"
}
```

The error message format is:

```
Validation error: {field} {message}[; {field} {message}]...
```
