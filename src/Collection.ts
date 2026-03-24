import { Index } from './DbIndex';
import { Schema } from './Schema';
import { Watcher } from './Watcher';
import { InsertOperations } from './operations/insert';
import { FindOperations, QueryResult } from './operations/find';
import { UpdateOperations } from './operations/update';
import { DeleteOperations } from './operations/delete';
import type { StateDB } from './StateDB';
import type {
  CollectionDump,
  CollectionOptions,
  DeleteResult,
  Document,
  HookOperation,
  IndexOptions,
  PostHookCallback,
  PreHookCallback,
  ProjectionSpec,
  QueryFilter,
  UpdateResult,
  UpdateSpec,
  WatcherCallback,
  WatcherOptions,
} from './types';

export class Collection {
  _name: string;
  _db: StateDB;
  _data: Document[];
  _inc: number;
  _primary: Map<number, Document>;
  _indexes: Record<string, Index>;
  _watcher: Watcher;
  _schema: Schema | null;
  _loading: boolean;

  _hooks: {
    pre: Record<HookOperation, PreHookCallback[]>;
    post: Record<HookOperation, PostHookCallback[]>;
  };

  constructor(name: string, db: StateDB, options: CollectionOptions = {}) {
    this._name = name;
    this._db = db;
    this._data = [];
    this._inc = 1;
    this._primary = new Map();
    this._indexes = {};
    this._watcher = new Watcher();
    this._loading = false;

    this._hooks = {
      pre: { insert: [], update: [], delete: [] },
      post: { insert: [], update: [], delete: [] },
    };

    if (options.schema) {
      this._schema = new Schema(options.schema, {
        capped: options.capped,
        max: options.max,
      });
    } else {
      this._schema = null;
    }
  }

  // ==================== Insert Operations ====================

  insertOne(doc: Record<string, unknown>): Document | null {
    return InsertOperations.insertOne(this, doc);
  }

  insertMany(docs: Record<string, unknown>[]): Document[] {
    return InsertOperations.insertMany(this, docs);
  }

  // ==================== Find Operations ====================

  find(query?: QueryFilter, projection?: ProjectionSpec | null): QueryResult {
    return FindOperations.find(this, query, projection);
  }

  findOne(query?: QueryFilter): Document | null {
    return FindOperations.findOne(this, query);
  }

  count(query?: QueryFilter): number {
    return FindOperations.count(this, query);
  }

  exists(query?: QueryFilter): boolean {
    return FindOperations.exists(this, query);
  }

  first(): Document | null {
    return FindOperations.first(this);
  }

  last(): Document | null {
    return FindOperations.last(this);
  }

  // ==================== Update Operations ====================

  updateOne(query: QueryFilter, update: UpdateSpec): UpdateResult {
    return UpdateOperations.updateOne(this, query, update);
  }

  updateMany(query: QueryFilter, update: UpdateSpec): UpdateResult {
    return UpdateOperations.updateMany(this, query, update);
  }

  replaceOne(query: QueryFilter, replacement: Record<string, unknown>): UpdateResult {
    return UpdateOperations.replaceOne(this, query, replacement);
  }

  upsertOne(query: QueryFilter, doc: Record<string, unknown>): UpdateResult {
    return UpdateOperations.upsertOne(this, query, doc);
  }

  // ==================== Delete Operations ====================

  deleteOne(query: QueryFilter): DeleteResult {
    return DeleteOperations.deleteOne(this, query);
  }

  deleteMany(query: QueryFilter): DeleteResult {
    return DeleteOperations.deleteMany(this, query);
  }

  drop(): DeleteResult {
    return DeleteOperations.drop(this);
  }

  // ==================== Index Operations ====================

  createIndex(fields: string | string[] | Record<string, number>, options: IndexOptions = {}): string {
    let fieldArray: string[];
    if (typeof fields === 'string') {
      fieldArray = [fields];
    } else if (typeof fields === 'object' && !Array.isArray(fields)) {
      fieldArray = Object.keys(fields);
    } else {
      fieldArray = fields;
    }

    const indexName = fieldArray.join('_');

    if (this._indexes[indexName]) {
      return indexName;
    }

    const index = new Index(fieldArray, options);

    for (const doc of this._data) {
      index.add(doc);
    }

    this._indexes[indexName] = index;
    return indexName;
  }

  dropIndex(name: string): boolean {
    if (this._indexes[name]) {
      delete this._indexes[name];
      return true;
    }
    return false;
  }

  getIndexes(): string[] {
    return ['__inc', ...Object.keys(this._indexes)];
  }

  // ==================== Watcher Operations ====================

  watch(callback: WatcherCallback, options?: WatcherOptions): number {
    return this._watcher.watch(callback, options);
  }

  unwatch(id?: number): void {
    return this._watcher.unwatch(id);
  }

  // ==================== Middleware/Hooks ====================

  pre(operation: HookOperation, callback: PreHookCallback): this {
    if (this._hooks.pre[operation]) {
      this._hooks.pre[operation].push(callback);
    }
    return this;
  }

  post(operation: HookOperation, callback: PostHookCallback): this {
    if (this._hooks.post[operation]) {
      this._hooks.post[operation].push(callback);
    }
    return this;
  }

  removePre(operation: HookOperation, callback?: PreHookCallback): this {
    if (this._hooks.pre[operation]) {
      if (callback) {
        this._hooks.pre[operation] = this._hooks.pre[operation].filter((cb) => cb !== callback);
      } else {
        this._hooks.pre[operation] = [];
      }
    }
    return this;
  }

  removePost(operation: HookOperation, callback?: PostHookCallback): this {
    if (this._hooks.post[operation]) {
      if (callback) {
        this._hooks.post[operation] = this._hooks.post[operation].filter((cb) => cb !== callback);
      } else {
        this._hooks.post[operation] = [];
      }
    }
    return this;
  }

  _runPreHooks(operation: HookOperation, ...args: unknown[]): boolean {
    for (const hook of this._hooks.pre[operation] || []) {
      try {
        const result = hook(...args);
        if (result === false) return false;
      } catch (e) {
        console.error(`Pre-hook error (${operation}):`, e);
        throw e;
      }
    }
    return true;
  }

  _runPostHooks(operation: HookOperation, ...args: unknown[]): void {
    for (const hook of this._hooks.post[operation] || []) {
      try {
        hook(...args);
      } catch (e) {
        console.error(`Post-hook error (${operation}):`, e);
      }
    }
  }

  // ==================== Internal Methods ====================

  _load(data: CollectionDump): void {
    this._data = data.documents || [];
    this._inc = data.inc || 1;

    this._primary.clear();
    for (const doc of this._data) {
      this._primary.set(doc.__inc, doc);
    }

    for (const index of Object.values(this._indexes)) {
      index.clear();
      for (const doc of this._data) {
        index.add(doc);
      }
    }
  }

  _export(): CollectionDump {
    return {
      documents: this._data,
      inc: this._inc,
    };
  }
}
