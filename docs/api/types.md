# TypeScript Types

All types are exported from the package and can be imported directly.

```ts
import type { Document, QueryFilter, UpdateSpec } from '@phpdot/statedb';
```

## Document

```ts
interface Document {
  __inc: number;
  [key: string]: unknown;
}
```

Every document has an auto-incrementing `__inc` field. All other fields are user-defined.

## Query Types

### QueryFilter

```ts
interface QueryFilter {
  $and?: QueryFilter[];
  $or?: QueryFilter[];
  $not?: QueryFilter;
  $nor?: QueryFilter[];
  [key: string]: unknown;
}
```

### QueryOperators

```ts
interface QueryOperators {
  $eq?: unknown;
  $ne?: unknown;
  $gt?: unknown;
  $gte?: unknown;
  $lt?: unknown;
  $lte?: unknown;
  $in?: unknown[];
  $nin?: unknown[];
  $exists?: boolean;
  $type?: string;
  $regex?: RegExp | string;
  $all?: unknown[];
  $elemMatch?: QueryOperators;
  $size?: number;
}
```

## Update Types

### UpdateSpec

```ts
type UpdateSpec = UpdateOperators | Record<string, unknown>;
```

Either an object with `$` operators, or a plain object for field merge.

### UpdateOperators

```ts
interface UpdateOperators {
  $set?: Record<string, unknown>;
  $unset?: Record<string, unknown>;
  $rename?: Record<string, string>;
  $inc?: Record<string, number>;
  $min?: Record<string, unknown>;
  $max?: Record<string, unknown>;
  $mul?: Record<string, number>;
  $currentDate?: Record<string, boolean>;
  $push?: Record<string, unknown>;
  $addToSet?: Record<string, unknown>;
  $pull?: Record<string, unknown>;
  $pullAll?: Record<string, unknown[]>;
  $pop?: Record<string, 1 | -1>;
}
```

## Result Types

### UpdateResult

```ts
interface UpdateResult {
  matchedCount: number;
  modifiedCount: number;
  upsertedId?: number;
}
```

### DeleteResult

```ts
interface DeleteResult {
  deletedCount: number;
}
```

## Schema Types

### SchemaDefinition

```ts
type SchemaDefinition = Record<string, SchemaFieldDefinition>;
```

### SchemaFieldDefinition

```ts
interface SchemaFieldDefinition {
  type?: SchemaType;
  required?: boolean;
  default?: unknown | (() => unknown);
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  enum?: unknown[];
  match?: RegExp;
  of?: SchemaType;
}
```

### SchemaType

```ts
type SchemaType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | DateConstructor
  | ArrayConstructor
  | ObjectConstructor;
```

## Options Types

### StateDBOptions

```ts
interface StateDBOptions {
  persistent?: boolean;
  storage?: 'local' | 'session';
  debounce?: number;
}
```

### CollectionOptions

```ts
interface CollectionOptions {
  schema?: SchemaDefinition;
  capped?: boolean;
  max?: number;
}
```

### IndexOptions

```ts
interface IndexOptions {
  unique?: boolean;
}
```

## Watcher Types

### WatcherEvent

```ts
type WatcherEvent = 'insert' | 'update' | 'delete' | 'drop';
```

### WatcherCallback

```ts
type WatcherCallback = (
  event: WatcherEvent,
  docs: Document[],
  prevDocs: Document[] | null,
) => void;
```

### WatcherOptions

```ts
interface WatcherOptions {
  ops?: WatcherEvent[] | null;
}
```

## Hook Types

### HookOperation

```ts
type HookOperation = 'insert' | 'update' | 'delete';
```

### PreHookCallback

```ts
type PreHookCallback = (...args: unknown[]) => unknown;
```

Return `false` to abort the operation.

### PostHookCallback

```ts
type PostHookCallback = (...args: unknown[]) => void;
```

## Query Result Types

### ProjectionSpec

```ts
type ProjectionSpec = Record<string, 0 | 1 | boolean>;
```

### SortSpec

```ts
type SortSpec = Record<string, 1 | -1>;
```

### ExplainResult

```ts
interface ExplainResult {
  queryPlanner: {
    winningPlan: {
      stage: string;
      inputStage?: {
        stage: string;
        indexName: string | null;
        indexFields: string[] | null;
      };
    };
  };
  executionStats: {
    nReturned: number;
    totalDocsExamined: number;
    totalKeysExamined: number;
    indexUsed: boolean;
    indexName: string | null;
    indexFields: string[] | null;
    executionTimeMs: number;
  };
}
```

## Export Types

### ExportData

```ts
type ExportData = Record<string, Record<string, unknown>[]>;
```

### DumpData

```ts
type DumpData = Record<string, CollectionDump>;
```

### CollectionDump

```ts
interface CollectionDump {
  documents: Document[];
  inc: number;
}
```

### ImportData

```ts
type ImportData = Record<string, Record<string, unknown>[]>;
```
