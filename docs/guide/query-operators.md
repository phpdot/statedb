# Query Operators

StateDB supports MongoDB-style query operators for filtering documents.

## Comparison Operators

### $eq — Equal

```ts
users.find({ age: { $eq: 30 } });

// Equivalent to direct equality:
users.find({ age: 30 });
```

### $ne — Not Equal

```ts
users.find({ role: { $ne: 'admin' } });
```

### $gt / $gte — Greater Than

```ts
users.find({ age: { $gt: 25 } });   // age > 25
users.find({ age: { $gte: 25 } });  // age >= 25
```

### $lt / $lte — Less Than

```ts
users.find({ age: { $lt: 30 } });   // age < 30
users.find({ age: { $lte: 30 } });  // age <= 30
```

### Combining Comparison Operators

Multiple operators on the same field are combined with AND logic:

```ts
users.find({ age: { $gte: 18, $lt: 65 } });
// age >= 18 AND age < 65
```

### $in — In Array

Match any value in the array:

```ts
users.find({ status: { $in: ['active', 'pending'] } });
```

### $nin — Not In Array

Exclude values in the array:

```ts
users.find({ role: { $nin: ['banned', 'suspended'] } });
```

## Logical Operators

### $and

All conditions must match:

```ts
users.find({
  $and: [
    { age: { $gte: 18 } },
    { role: 'admin' },
  ],
});
```

::: tip
Implicit AND is applied when you specify multiple fields:
```ts
// These are equivalent:
users.find({ role: 'admin', active: true });
users.find({ $and: [{ role: 'admin' }, { active: true }] });
```
:::

### $or

At least one condition must match:

```ts
users.find({
  $or: [
    { role: 'admin' },
    { age: { $gte: 30 } },
  ],
});
```

### $not

Inverts the query:

```ts
users.find({ $not: { role: 'admin' } });
// All non-admin users
```

### $nor

None of the conditions must match:

```ts
users.find({
  $nor: [
    { status: 'deleted' },
    { status: 'banned' },
  ],
});
```

### Nesting Logical Operators

Logical operators can be nested arbitrarily:

```ts
users.find({
  $and: [
    { active: true },
    {
      $or: [
        { role: 'admin' },
        { age: { $gte: 21 } },
      ],
    },
  ],
});
```

## Element Operators

### $exists

Check if a field exists:

```ts
users.find({ email: { $exists: true } });   // has email field
users.find({ email: { $exists: false } });  // missing email field
```

### $type

Match by value type:

```ts
users.find({ age: { $type: 'number' } });
users.find({ name: { $type: 'string' } });
users.find({ tags: { $type: 'array' } });
```

Supported types: `'string'`, `'number'`, `'boolean'`, `'object'`, `'array'`, `'null'`, `'undefined'`, `'date'`.

## Evaluation Operators

### $regex

Match strings against a regular expression:

```ts
// RegExp object
users.find({ name: { $regex: /^om/i } });

// String pattern
users.find({ email: { $regex: '@gmail\\.com$' } });
```

## Array Operators

### $all

Array must contain all specified values:

```ts
users.find({ tags: { $all: ['javascript', 'typescript'] } });
```

### $elemMatch

At least one array element must match the operators:

```ts
users.find({ scores: { $elemMatch: { $gte: 90 } } });
// Matches if any score is >= 90
```

### $size

Array must have the exact length:

```ts
users.find({ tags: { $size: 3 } });
// Only documents with exactly 3 tags
```

## Dot Notation

Query nested fields using dot notation:

```ts
users.insertOne({
  name: 'Omar',
  address: {
    city: 'Dubai',
    country: 'UAE',
  },
  settings: {
    theme: {
      color: 'dark',
    },
  },
});

// Query nested fields
users.find({ 'address.city': 'Dubai' });
users.find({ 'settings.theme.color': 'dark' });

// Operators work with dot notation
users.find({ 'address.city': { $in: ['Dubai', 'Cairo'] } });
```

::: tip Performance
Dot notation queries scan nested paths on every document. For frequently queried nested fields, create an index:
```ts
users.createIndex({ 'address.city': 1 });
```
:::
