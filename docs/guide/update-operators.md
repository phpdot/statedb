# Update Operators

StateDB supports MongoDB-style update operators. When an update object contains keys starting with `$`, they are treated as operators. Otherwise, the update is a simple field merge.

## Simple Merge (No Operators)

When no `$` operators are present, the update object is merged into the document:

```ts
users.updateOne({ __inc: 1 }, { age: 31, city: 'Dubai' });
// Merges age and city into the existing document
```

::: warning
Simple merge does not remove existing fields — it only adds or overwrites. Use `$unset` to remove fields, or `replaceOne` to replace the entire document.
:::

## Field Operators

### $set

Set one or more fields. Supports dot notation for nested fields.

```ts
users.updateOne({ __inc: 1 }, {
  $set: {
    name: 'Omar H',
    'address.city': 'Dubai',
    active: true,
  },
});
```

### $unset

Remove fields from the document.

```ts
users.updateOne({ __inc: 1 }, {
  $unset: { tempField: '', debugInfo: '' },
});
```

The value doesn't matter — only the key is used.

### $rename

Rename a field.

```ts
users.updateOne({ __inc: 1 }, {
  $rename: { oldFieldName: 'newFieldName' },
});
```

### $currentDate

Set a field to the current date (`new Date()`).

```ts
users.updateOne({ __inc: 1 }, {
  $currentDate: { updatedAt: true },
});
```

## Numeric Operators

### $inc

Increment a numeric field. Use negative values to decrement.

```ts
users.updateOne({ __inc: 1 }, { $inc: { loginCount: 1 } });
users.updateOne({ __inc: 1 }, { $inc: { balance: -50 } });
```

If the field doesn't exist, it's initialized to the increment value (starting from 0):

```ts
// Document: { name: 'Omar' }
users.updateOne({ name: 'Omar' }, { $inc: { score: 10 } });
// Document: { name: 'Omar', score: 10 }
```

### $mul

Multiply a numeric field.

```ts
users.updateOne({ __inc: 1 }, { $mul: { price: 1.1 } });
// price = price * 1.1
```

### $min

Update only if the new value is **lower** than the current value.

```ts
users.updateOne({ __inc: 1 }, { $min: { lowestScore: 42 } });
// lowestScore is set to 42 only if current value > 42 or field doesn't exist
```

### $max

Update only if the new value is **higher** than the current value.

```ts
users.updateOne({ __inc: 1 }, { $max: { highestScore: 99 } });
```

## Array Operators

### $push

Append a value to an array. Creates the array if it doesn't exist.

```ts
users.updateOne({ __inc: 1 }, { $push: { tags: 'new-tag' } });
```

#### $each — Push Multiple Values

```ts
users.updateOne({ __inc: 1 }, {
  $push: { tags: { $each: ['tag-a', 'tag-b', 'tag-c'] } },
});
```

#### $position — Insert at Index

```ts
users.updateOne({ __inc: 1 }, {
  $push: { tags: { $each: ['first', 'second'], $position: 0 } },
});
// Inserts at the beginning of the array
```

### $addToSet

Add a value to an array only if it doesn't already exist.

```ts
users.updateOne({ __inc: 1 }, { $addToSet: { tags: 'unique' } });
// No duplicates — 'unique' is only added if not already in tags
```

With `$each`:

```ts
users.updateOne({ __inc: 1 }, {
  $addToSet: { tags: { $each: ['a', 'b', 'c'] } },
});
// Each value is added only if not already present
```

### $pull

Remove all occurrences of a value from an array.

```ts
users.updateOne({ __inc: 1 }, { $pull: { tags: 'old-tag' } });
```

With operators:

```ts
users.updateOne({ __inc: 1 }, {
  $pull: { scores: { $lt: 50 } },
});
// Removes all scores below 50
```

### $pullAll

Remove all matching values from an array.

```ts
users.updateOne({ __inc: 1 }, {
  $pullAll: { tags: ['tag-a', 'tag-b'] },
});
```

### $pop

Remove the first or last element of an array.

```ts
// Remove last element
users.updateOne({ __inc: 1 }, { $pop: { tags: 1 } });

// Remove first element
users.updateOne({ __inc: 1 }, { $pop: { tags: -1 } });
```

## Combining Operators

Multiple operators can be used in a single update:

```ts
users.updateOne({ __inc: 1 }, {
  $set: { name: 'Omar H' },
  $inc: { loginCount: 1 },
  $push: { tags: 'verified' },
  $currentDate: { updatedAt: true },
});
```

## Dot Notation in Updates

All operators support dot notation for nested fields:

```ts
users.updateOne({ __inc: 1 }, {
  $set: { 'address.city': 'Dubai', 'settings.theme': 'dark' },
  $unset: { 'address.zip': '' },
  $inc: { 'stats.views': 1 },
});
```

If intermediate objects don't exist, `$set` creates them:

```ts
// Document: { name: 'Omar' }
users.updateOne({ name: 'Omar' }, {
  $set: { 'address.city': 'Dubai' },
});
// Document: { name: 'Omar', address: { city: 'Dubai' } }
```
