# Schema Validation

Define schemas when creating collections to validate documents on every insert and update.

## Defining a Schema

```ts
const users = db.createCollection('users', {
  schema: {
    name:    { type: String, required: true, minLength: 2, maxLength: 50 },
    email:   { type: String, required: true, match: /^.+@.+\..+$/ },
    age:     { type: Number, min: 0, max: 150 },
    role:    { type: String, enum: ['admin', 'user', 'guest'], default: 'user' },
    tags:    { type: Array, of: String },
    bio:     { type: String },
    active:  { type: Boolean, default: true },
    joined:  { type: Date, default: () => new Date() },
  },
});
```

## Schema Rules

### type

Validate the field's JavaScript type.

```ts
{ name: { type: String } }    // must be a string
{ age: { type: Number } }     // must be a number (NaN rejected)
{ active: { type: Boolean } } // must be true or false
{ joined: { type: Date } }    // must be a Date instance
{ tags: { type: Array } }     // must be an array
{ meta: { type: Object } }    // must be a plain object (not array, not null)
```

### required

Field must be present and not `null` on insert. Not enforced on updates.

```ts
{ name: { type: String, required: true } }
```

```ts
users.insertOne({});
// Error: Validation error: name is required
```

### default

Applied on insert when the field is missing. Can be a static value or a function.

```ts
{ role: { default: 'user' } }
{ createdAt: { default: () => new Date() } }
{ id: { default: () => Math.random().toString(36).slice(2) } }
```

```ts
users.insertOne({ name: 'Omar', email: 'omar@test.com' });
// { name: 'Omar', email: 'omar@test.com', role: 'user', createdAt: Date, __inc: 1 }
```

::: tip
Function defaults are called on every insert, so each document gets a unique value.
:::

### min / max

For `Number` fields — validate the value range.

```ts
{ age: { type: Number, min: 0, max: 150 } }
```

```ts
users.insertOne({ age: -5 });
// Error: Validation error: age must be at least 0
```

### minLength / maxLength

For `String` fields — validate the string length.

```ts
{ name: { type: String, minLength: 2, maxLength: 50 } }
```

### enum

Field must be one of the specified values.

```ts
{ role: { type: String, enum: ['admin', 'user', 'guest'] } }
```

```ts
users.insertOne({ role: 'superadmin' });
// Error: Validation error: role must be one of: admin, user, guest
```

### match

For `String` fields — must match a regular expression.

```ts
{ email: { type: String, match: /^.+@.+\..+$/ } }
```

```ts
users.insertOne({ email: 'not-an-email' });
// Error: Validation error: email does not match required pattern
```

### of

For `Array` fields — validate the type of each element.

```ts
{ tags: { type: Array, of: String } }
```

```ts
users.insertOne({ tags: ['js', 123, 'ts'] });
// Error: Validation error: tags[1] must be of type String
```

## Rules Reference

| Rule | Applies to | Description |
|------|-----------|-------------|
| `type` | All | Type constructor (`String`, `Number`, `Boolean`, `Date`, `Array`, `Object`) |
| `required` | All | Must be present on insert |
| `default` | All | Value or `() => value` applied on insert |
| `min` | `Number` | Minimum value |
| `max` | `Number` | Maximum value |
| `minLength` | `String` | Minimum string length |
| `maxLength` | `String` | Maximum string length |
| `enum` | All | Array of allowed values |
| `match` | `String` | RegExp pattern |
| `of` | `Array` | Element type constructor |

## Validation on Updates

Schema is also validated on updates. However:

- `required` is **not** enforced on updates (you can update without including all required fields)
- `type`, `min`, `max`, `enum`, `match`, etc. **are** enforced on the resulting document

```ts
// This works — only sets age, doesn't need to include name
users.updateOne({ __inc: 1 }, { $set: { age: 31 } });

// This fails — age must be a Number
users.updateOne({ __inc: 1 }, { $set: { age: 'old' } });
// Error: Validation error: age must be of type Number
```

## Capped Collections

Capped collections automatically remove the oldest documents when a maximum size is reached.

```ts
const logs = db.createCollection('logs', {
  schema: {},    // schema object is required (can be empty)
  capped: true,
  max: 1000,
});
```

When the 1001st document is inserted, the oldest is removed:

```ts
for (let i = 0; i < 1500; i++) {
  logs.insertOne({ message: 'Log ' + i });
}

logs.count();     // 1000
logs.first();     // { message: 'Log 500', __inc: 501 }
```

Use cases:
- Application logs
- Recent activity feeds
- Chat message history
- Notification queues

## Error Handling

Validation errors throw an `Error` with a descriptive message. Multiple errors are joined with `;`.

```ts
try {
  users.insertOne({ name: 'A', age: -5, role: 'invalid' });
} catch (e) {
  console.log(e.message);
  // Validation error: name must be at least 2 characters; age must be at least 0; role must be one of: admin, user, guest
}
```
