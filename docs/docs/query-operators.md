# Query Operators

StateDB supports MongoDB-style query operators for filtering documents.

## Operator Reference

| Category | Operators |
|----------|-----------|
| **Comparison** | `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte` |
| **Inclusion** | `$in`, `$nin` |
| **Logical** | `$and`, `$or`, `$not`, `$nor` |
| **Element** | `$exists`, `$type` |
| **String** | `$regex` |
| **Array** | `$all`, `$elemMatch`, `$size` |

## Setup

```js
import { StateDB } from '@phpdot/statedb';

const db = new StateDB('demo');
const users = db.createCollection('users');

users.insertMany([
  { name: 'Omar', age: 30, role: 'admin', tags: ['js', 'ts'], address: { city: 'NYC' } },
  { name: 'Sara', age: 25, role: 'user', tags: ['python'], address: { city: 'LA' } },
  { name: 'Ali', age: 35, role: 'admin', tags: ['js', 'go'], address: { city: 'NYC' } },
  { name: 'Noor', age: 28, role: 'user', tags: ['js'], address: { city: 'SF' } },
]);
```

## Comparison Operators

### $eq

Matches values equal to the specified value. Implicit when using direct value matching.

```js
// These are equivalent
users.find({ role: 'admin' }).toArray();
users.find({ role: { $eq: 'admin' } }).toArray();
```

### $ne

Matches values not equal to the specified value.

```js
users.find({ role: { $ne: 'admin' } }).toArray();
// Sara, Noor
```

### $gt / $gte

Greater than / greater than or equal to.

```js
users.find({ age: { $gt: 28 } }).toArray();  // Omar, Ali
users.find({ age: { $gte: 28 } }).toArray(); // Omar, Ali, Noor
```

### $lt / $lte

Less than / less than or equal to.

```js
users.find({ age: { $lt: 30 } }).toArray();  // Sara, Noor
users.find({ age: { $lte: 30 } }).toArray(); // Omar, Sara, Noor
```

### Combining comparison operators

Use multiple operators on the same field to create ranges.

```js
users.find({ age: { $gte: 25, $lte: 30 } }).toArray();
// Omar, Sara, Noor
```

## Inclusion Operators

### $in

Matches any value in the array.

```js
users.find({ role: { $in: ['admin', 'moderator'] } }).toArray();
// Omar, Ali
```

### $nin

Matches values not in the array.

```js
users.find({ role: { $nin: ['admin'] } }).toArray();
// Sara, Noor
```

## Logical Operators

### $and

All conditions must match. Equivalent to listing multiple fields at the top level.

```js
// Explicit $and
users.find({
  $and: [
    { age: { $gte: 25 } },
    { role: 'admin' }
  ]
}).toArray();
// Omar, Ali

// Implicit $and (same result)
users.find({ age: { $gte: 25 }, role: 'admin' }).toArray();
```

Use explicit `$and` when you need multiple conditions on the same field:

```js
users.find({
  $and: [
    { age: { $gt: 20 } },
    { age: { $lt: 30 } }
  ]
}).toArray();
```

### $or

At least one condition must match.

```js
users.find({
  $or: [
    { role: 'admin' },
    { age: { $lt: 26 } }
  ]
}).toArray();
// Omar, Sara, Ali
```

### $not

Negates a query expression.

```js
users.find({
  $not: { role: 'admin' }
}).toArray();
// Sara, Noor
```

### $nor

None of the conditions must match.

```js
users.find({
  $nor: [
    { role: 'admin' },
    { age: { $lt: 26 } }
  ]
}).toArray();
// Noor
```

### Nesting logical operators

Logical operators can be nested to build complex queries.

```js
users.find({
  $or: [
    {
      $and: [
        { role: 'admin' },
        { age: { $gte: 35 } }
      ]
    },
    {
      $and: [
        { role: 'user' },
        { age: { $lte: 25 } }
      ]
    }
  ]
}).toArray();
// Ali (admin, 35), Sara (user, 25)
```

## Element Operators

### $exists

Matches documents where the field exists (or does not exist).

```js
users.find({ nickname: { $exists: false } }).toArray(); // all (no one has nickname)

users.updateOne({ name: 'Omar' }, { $set: { nickname: 'O' } });
users.find({ nickname: { $exists: true } }).toArray(); // Omar
```

### $type

Matches documents where the field is of the specified type. Supported type strings: `"string"`, `"number"`, `"boolean"`, `"object"`, `"array"`, `"date"`, `"null"`, `"undefined"`.

```js
users.find({ age: { $type: 'number' } }).toArray();  // all
users.find({ tags: { $type: 'array' } }).toArray();   // all
users.find({ address: { $type: 'object' } }).toArray(); // all
```

## String Operators

### $regex

Matches strings against a regular expression. Accepts a `RegExp` object or a string pattern.

```js
// RegExp object
users.find({ name: { $regex: /^[SO]/ } }).toArray();
// Sara, Omar

// String pattern
users.find({ name: { $regex: 'ar' } }).toArray();
// Omar, Sara, Noor

// Case-insensitive
users.find({ name: { $regex: /omar/i } }).toArray();
// Omar
```

## Array Operators

### $all

Matches arrays that contain all specified elements.

```js
users.find({ tags: { $all: ['js', 'ts'] } }).toArray();
// Omar (has both js and ts)
```

### $elemMatch

Matches arrays where at least one element satisfies all specified operator conditions.

```js
const scores = db.createCollection('scores');
scores.insertMany([
  { name: 'Omar', results: [85, 92, 78] },
  { name: 'Sara', results: [60, 55, 70] },
]);

scores.find({
  results: { $elemMatch: { $gte: 90 } }
}).toArray();
// Omar (has 92 which is >= 90)
```

### $size

Matches arrays with exactly the specified number of elements.

```js
users.find({ tags: { $size: 2 } }).toArray();
// Omar (2 tags), Ali (2 tags)

users.find({ tags: { $size: 1 } }).toArray();
// Sara, Noor
```

## Dot Notation for Nested Fields

Use dot notation to query nested object fields.

```js
// Query nested fields
users.find({ 'address.city': 'NYC' }).toArray();
// Omar, Ali

// Operators work with dot notation
users.find({ 'address.city': { $in: ['NYC', 'SF'] } }).toArray();
// Omar, Ali, Noor

// Deep nesting
const col = db.createCollection('deep');
col.insertOne({ a: { b: { c: 42 } } });
col.find({ 'a.b.c': { $gte: 40 } }).toArray();
```

## Direct Value Matching

When you pass a plain value (not an operator object), StateDB uses strict equality.

```js
// Primitive equality
users.find({ name: 'Omar' }).toArray();

// Array equality (order matters)
users.find({ tags: ['js', 'ts'] }).toArray();

// null matching
users.find({ deleted: null }).toArray();
```

## Empty Query

An empty query `{}` or no query matches all documents.

```js
users.find().toArray();    // all documents
users.find({}).toArray();  // all documents
users.count();             // total count
```
