// ==================== Document Types ====================

export interface Document {
  __inc: number;
  [key: string]: unknown;
}

// ==================== Query Types ====================

export type QueryValue = unknown;

export interface QueryOperators {
  $eq?: QueryValue;
  $ne?: QueryValue;
  $gt?: QueryValue;
  $gte?: QueryValue;
  $lt?: QueryValue;
  $lte?: QueryValue;
  $in?: QueryValue[];
  $nin?: QueryValue[];
  $exists?: boolean;
  $type?: string;
  $regex?: RegExp | string;
  $all?: QueryValue[];
  $elemMatch?: QueryOperators;
  $size?: number;
}

export interface QueryFilter {
  $and?: QueryFilter[];
  $or?: QueryFilter[];
  $not?: QueryFilter;
  $nor?: QueryFilter[];
  [key: string]: QueryValue | QueryOperators | QueryFilter[] | QueryFilter | undefined;
}

// ==================== Update Types ====================

export interface PushModifiers {
  $each: unknown[];
  $position?: number;
}

export interface UpdateOperators {
  $set?: Record<string, unknown>;
  $unset?: Record<string, unknown>;
  $rename?: Record<string, string>;
  $inc?: Record<string, number>;
  $min?: Record<string, unknown>;
  $max?: Record<string, unknown>;
  $mul?: Record<string, number>;
  $currentDate?: Record<string, boolean>;
  $push?: Record<string, unknown | PushModifiers>;
  $addToSet?: Record<string, unknown | { $each: unknown[] }>;
  $pull?: Record<string, unknown>;
  $pullAll?: Record<string, unknown[]>;
  $pop?: Record<string, 1 | -1>;
}

export type UpdateSpec = UpdateOperators | Record<string, unknown>;

// ==================== Schema Types ====================

export type SchemaType =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | DateConstructor
  | ArrayConstructor
  | ObjectConstructor;

export interface SchemaFieldDefinition {
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

export type SchemaDefinition = Record<string, SchemaFieldDefinition>;

export interface SchemaOptions {
  capped?: boolean;
  max?: number;
}

// ==================== Index Types ====================

export interface IndexOptions {
  unique?: boolean;
}

// ==================== Watcher Types ====================

export type WatcherEvent = 'insert' | 'update' | 'delete' | 'drop';

export type WatcherCallback = (
  event: WatcherEvent,
  docs: Document[],
  prevDocs: Document[] | null,
) => void;

export interface WatcherOptions {
  ops?: WatcherEvent[] | null;
}

export interface WatcherEntry {
  callback: WatcherCallback;
  ops: WatcherEvent[] | null;
}

// ==================== Hook Types ====================

export type HookOperation = 'insert' | 'update' | 'delete';

export type PreHookCallback = (...args: unknown[]) => unknown;
export type PostHookCallback = (...args: unknown[]) => void;

export interface Hooks {
  pre: Record<HookOperation, PreHookCallback[]>;
  post: Record<HookOperation, PostHookCallback[]>;
}

// ==================== Result Types ====================

export interface UpdateResult {
  matchedCount: number;
  modifiedCount: number;
  upsertedId?: number;
}

export interface DeleteResult {
  deletedCount: number;
}

// ==================== Projection Types ====================

export type ProjectionSpec = Record<string, 0 | 1 | boolean>;

// ==================== Sort Types ====================

export type SortSpec = Record<string, 1 | -1>;

// ==================== Execution Stats ====================

export interface ExecutionStats {
  indexUsed: boolean;
  indexName: string | null;
  indexFields: string[] | null;
  docsExamined: number;
  keysExamined: number;
  executionTimeMs?: number;
}

// ==================== Explain Types ====================

export interface ExplainResult {
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

// ==================== Collection Options ====================

export interface CollectionOptions {
  schema?: SchemaDefinition;
  capped?: boolean;
  max?: number;
}

// ==================== StateDB Options ====================

export interface StateDBOptions {
  persistent?: boolean;
  storage?: 'local' | 'session';
  debounce?: number;
}

// ==================== Export/Dump Types ====================

export interface CollectionDump {
  documents: Document[];
  inc: number;
}

export type ExportData = Record<string, Record<string, unknown>[]>;
export type DumpData = Record<string, CollectionDump>;
export type ImportData = Record<string, Record<string, unknown>[]>;
