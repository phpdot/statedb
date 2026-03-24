# Update Operators

StateDB supports MongoDB-style update operators for modifying documents in place.

## Operator Reference

| Category | Operators |
|----------|-----------|
| **Field** | `$set`, `$unset`, `$rename`, `$currentDate` |
| **Numeric** | `$inc`, `$mul`, `$min`, `$max` |
| **Array** | `$push`, `$addToSet`, `$pull`, `$pullAll`, `$pop` |

## Setup

```js
import { StateDB } from '@phpdot/statedb';

const db = new StateDB('demo');
const users = db.createCollection('users');

users.insertOne({ name: 'Omar', age: 30, tags: ['js'], stats: { logins: 0 } });
```

## Simple Merge (No Operators)

When the update object contains no `$` operators, it is merged into the document using `Object.assign`.

```js
users.updateOne({ name: 'Omar' }, { age: 31, role: 'admin' });
// { name: 'Omar', age: 31, role: 'admin', tags: ['js'], stats: { logins: 0 }, __inc: 1 }
```

::: warning
Simple merge does not deep-merge nested objects. Use `$set` with dot notation for nested updates.
:::

## Field Operators

### $set

Sets the value of one or more fields. Creates the field if it does not exist.

```js
users.updateOne({ name: 'Omar' }, {
  $set: { age: 31, role: 'admin' }
});
```

Supports dot notation for nested fields:

```js
users.updateOne({ name: 'Omar' }, {
  $set: { 'stats.logins': 5, 'address.city': 'NYC' }
});
// stats.logins is set to 5; address.city is created
```

### $unset

Removes one or more fields from the document. The value in the spec is ignored.

```js
users.updateOne({ name: 'Omar' }, {
  $unset: { role: '', 'address.city': '' }
});
```

### $rename

Renames a field. The value is moved to the new key and the old key is deleted.

```js
users.updateOne({ name: 'Omar' }, {
  $rename: { name: 'fullName' }
});
// 'name' is removed, 'fullName' is set to 'Omar'
```

### $currentDate

Sets a field to the current `Date` object.

```js
users.updateOne({ name: 'Omar' }, {
  $currentDate: { lastModified: true, 'audit.updatedAt': true }
});
```

## Numeric Operators

### $inc

Increments a field by the specified amount. If the field does not exist, it is initialized to 0 before incrementing. Use negative values to decrement.

```js
users.updateOne({ name: 'Omar' }, {
  $inc: { 'stats.logins': 1, age: -1 }
});
```

### $mul

Multiplies a field by the specified value. If the field does not exist, it is initialized to 0.

```js
users.updateOne({ name: 'Omar' }, {
  $mul: { age: 2 }
});
// age becomes 60
```

### $min

Updates the field only if the specified value is less than the current value. If the field does not exist, it is set to the specified value.

```js
users.updateOne({ name: 'Omar' }, {
  $min: { age: 25 }
});
// age becomes 25 (was 30)
```

### $max

Updates the field only if the specified value is greater than the current value. If the field does not exist, it is set to the specified value.

```js
users.updateOne({ name: 'Omar' }, {
  $max: { age: 40 }
});
// age becomes 40 (was 30)
```

## Array Operators

### $push

Appends a value to an array. If the field is not an array, it is initialized to an empty array first.

```js
// Push a single value
users.updateOne({ name: 'Omar' }, {
  $push: { tags: 'ts' }
});
// tags: ['js', 'ts']
```

#### $push with $each

Push multiple values at once.

```js
users.updateOne({ name: 'Omar' }, {
  $push: { tags: { $each: ['go', 'rust'] } }
});
// tags: ['js', 'ts', 'go', 'rust']
```

#### $push with $position

Insert values at a specific index.

```js
users.updateOne({ name: 'Omar' }, {
  $push: { tags: { $each: ['python'], $position: 0 } }
});
// tags: ['python', 'js', 'ts', 'go', 'rust']
```

### $addToSet

Adds a value to an array only if it does not already exist (set semantics).

```js
users.updateOne({ name: 'Omar' }, {
  $addToSet: { tags: 'js' }
});
// tags unchanged (js already exists)

users.updateOne({ name: 'Omar' }, {
  $addToSet: { tags: 'vue' }
});
// tags: ['js', 'vue']
```

#### $addToSet with $each

Add multiple unique values.

```js
users.updateOne({ name: 'Omar' }, {
  $addToSet: { tags: { $each: ['js', 'react', 'vue'] } }
});
// Only 'react' is added (js and vue already exist)
```

### $pull

Removes all elements from an array that match a value or condition.

```js
// Remove by value
users.updateOne({ name: 'Omar' }, {
  $pull: { tags: 'js' }
});

// Remove by condition
users.updateOne({ name: 'Omar' }, {
  $pull: { scores: { $lt: 50 } }
});
```

### $pullAll

Removes all elements that match any value in the specified array.

```js
users.updateOne({ name: 'Omar' }, {
  $pullAll: { tags: ['js', 'ts'] }
});
```

### $pop

Removes the first or last element of an array.

```js
// Remove last element
users.updateOne({ name: 'Omar' }, {
  $pop: { tags: 1 }
});

// Remove first element
users.updateOne({ name: 'Omar' }, {
  $pop: { tags: -1 }
});
```

## Combining Operators

Multiple operators can be used in a single update.

```js
users.updateOne({ name: 'Omar' }, {
  $set: { role: 'admin' },
  $inc: { 'stats.logins': 1 },
  $push: { tags: 'leadership' },
  $currentDate: { lastModified: true }
});
```

## Dot Notation Support

All operators support dot notation for nested fields.

```js
users.updateOne({ name: 'Omar' }, {
  $set: { 'address.city': 'NYC', 'address.zip': '10001' },
  $inc: { 'stats.logins': 1 },
  $unset: { 'stats.temp': '' }
});
```

Intermediate objects are created automatically if they do not exist.

## updateOne vs updateMany

- `updateOne` applies the update to the **first** matching document.
- `updateMany` applies the update to **all** matching documents.

```js
// Update all admins
users.updateMany(
  { role: 'admin' },
  { $inc: { 'stats.logins': 1 } }
);
```
