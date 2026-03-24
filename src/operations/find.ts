import { Query } from '../Query';
import type { Index } from '../DbIndex';
import type { Collection } from '../Collection';
import type {
  Document,
  ExecutionStats,
  ExplainResult,
  ProjectionSpec,
  QueryFilter,
  SortSpec,
} from '../types';

export class QueryResult {
  _docs: Document[];
  private _skip: number;
  private _limit: number;
  private _sort: SortSpec | null;
  private _projection: ProjectionSpec | null;
  private _executionStats: ExecutionStats | null;
  private _dirty: boolean;

  constructor(docs: Document[], executionStats: ExecutionStats | null = null) {
    this._docs = docs;
    this._skip = 0;
    this._limit = Infinity;
    this._sort = null;
    this._projection = null;
    this._executionStats = executionStats;
    this._dirty = false;
  }

  project(spec: ProjectionSpec): this {
    this._projection = spec;
    this._dirty = true;
    return this;
  }

  skip(n: number): this {
    this._skip = n;
    this._dirty = true;
    return this;
  }

  limit(n: number): this {
    this._limit = n;
    this._dirty = true;
    return this;
  }

  sort(spec: SortSpec): this {
    this._sort = spec;
    this._dirty = true;
    return this;
  }

  private _applyProjection(doc: Document): Document {
    if (!this._projection) return doc;

    const keys = Object.keys(this._projection);
    if (keys.length === 0) return doc;

    const firstValue = this._projection[keys[0]];
    const isInclude = firstValue === 1 || firstValue === true;

    if (isInclude) {
      const result: Record<string, unknown> = { __inc: doc.__inc };
      for (const key of keys) {
        if (this._projection[key] === 1 || this._projection[key] === true) {
          const value = Query.getNestedValue(doc as unknown as Record<string, unknown>, key);
          if (value !== undefined) {
            Query.setNestedValue(result, key, value);
          }
        }
      }
      return result as Document;
    } else {
      const result = { ...doc } as Record<string, unknown>;
      for (const key of keys) {
        if (this._projection[key] === 0 || this._projection[key] === false) {
          Query.deleteNestedValue(result, key);
        }
      }
      return result as Document;
    }
  }

  toArray(): Document[] {
    // Fast path: no modifiers applied, return docs directly (no copy)
    if (!this._dirty) {
      return this._docs;
    }

    let results: Document[];

    if (this._sort) {
      // Only copy when we need to sort (sort mutates)
      results = this._docs.slice();
      const fields = Object.keys(this._sort);
      const sortSpec = this._sort;
      results.sort((a, b) => {
        for (let i = 0; i < fields.length; i++) {
          const field = fields[i];
          const direction = sortSpec[field];
          const aVal = Query.getNestedValue(
            a as unknown as Record<string, unknown>,
            field,
          ) as number;
          const bVal = Query.getNestedValue(
            b as unknown as Record<string, unknown>,
            field,
          ) as number;

          if (aVal < bVal) return -1 * direction;
          if (aVal > bVal) return 1 * direction;
        }
        return 0;
      });
    } else {
      results = this._docs;
    }

    // Apply skip/limit only if needed
    if (this._skip > 0 || this._limit < results.length) {
      results = results.slice(this._skip, this._skip + this._limit);
    }

    if (this._projection) {
      results = results.map((doc) => this._applyProjection(doc));
    }

    return results;
  }

  forEach(callback: (doc: Document, index: number, array: Document[]) => void): this {
    this.toArray().forEach(callback);
    return this;
  }

  map<T>(callback: (doc: Document, index: number, array: Document[]) => T): T[] {
    return this.toArray().map(callback);
  }

  filter(callback: (doc: Document, index: number, array: Document[]) => boolean): Document[] {
    return this.toArray().filter(callback);
  }

  count(): number {
    if (!this._dirty) return this._docs.length;
    return this.toArray().length;
  }

  first(): Document | null {
    if (!this._dirty) return this._docs[0] || null;
    return this.toArray()[0] || null;
  }

  last(): Document | null {
    if (!this._dirty) {
      return this._docs[this._docs.length - 1] || null;
    }
    const arr = this.toArray();
    return arr[arr.length - 1] || null;
  }

  explain(): ExplainResult {
    const stats = this._executionStats || ({} as ExecutionStats);
    return {
      queryPlanner: {
        winningPlan: stats.indexUsed
          ? {
              stage: 'FETCH',
              inputStage: {
                stage: 'IXSCAN',
                indexName: stats.indexName,
                indexFields: stats.indexFields,
              },
            }
          : {
              stage: 'COLLSCAN',
            },
      },
      executionStats: {
        nReturned: this._docs.length,
        totalDocsExamined: stats.docsExamined || this._docs.length,
        totalKeysExamined: stats.keysExamined || 0,
        indexUsed: stats.indexUsed || false,
        indexName: stats.indexName || null,
        indexFields: stats.indexFields || null,
        executionTimeMs: stats.executionTimeMs || 0,
      },
    };
  }
}

// Check if query is empty ({} or no keys)
function isEmptyQuery(query: QueryFilter): boolean {
  for (const _key in query) return false;
  return true;
}

export const FindOperations = {
  find(
    collection: Collection,
    query: QueryFilter = {},
    projection: ProjectionSpec | null = null,
  ): QueryResult {
    const startTime =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    let docs: Document[];
    const executionStats: ExecutionStats = {
      indexUsed: false,
      indexName: null,
      indexFields: null,
      docsExamined: 0,
      keysExamined: 0,
    };

    // Fast path: empty query returns all docs directly
    if (isEmptyQuery(query)) {
      executionStats.docsExamined = collection._data.length;
      docs = collection._data;
    } else {
      const index = FindOperations.findUsableIndex(collection, query);

      if (index) {
        const key = index.getKeyFromQuery(query);
        const prefixLength = index.getPrefixLength(query);
        const incSet = index.getByPrefix(key, prefixLength);
        docs = [];
        executionStats.indexUsed = true;
        executionStats.indexName = index.name;
        executionStats.indexFields = index.fields.slice(0, prefixLength);
        executionStats.keysExamined = incSet.size;

        for (const inc of incSet) {
          const doc = collection._primary.get(inc);
          executionStats.docsExamined++;
          if (doc && Query.match(doc as unknown as Record<string, unknown>, query)) {
            docs.push(doc);
          }
        }
      } else {
        // Compile query once, run against every doc
        const matcher = Query.compile(query);
        const data = collection._data;
        executionStats.docsExamined = data.length;
        docs = [];
        for (let i = 0; i < data.length; i++) {
          if (matcher(data[i] as unknown as Record<string, unknown>)) docs.push(data[i]);
        }
      }
    }

    executionStats.executionTimeMs =
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;

    const result = new QueryResult(docs, executionStats);
    if (projection) {
      result.project(projection);
    }
    return result;
  },

  findOne(collection: Collection, query: QueryFilter = {}): Document | null {
    if (
      query.__inc !== undefined &&
      typeof query.__inc !== 'object'
    ) {
      return collection._primary.get(query.__inc as number) || null;
    }

    const index = FindOperations.findUsableIndex(collection, query);

    if (index) {
      const key = index.getKeyFromQuery(query);
      const prefixLength = index.getPrefixLength(query);
      const incSet = index.getByPrefix(key, prefixLength);
      for (const inc of incSet) {
        const doc = collection._primary.get(inc);
        if (doc && Query.match(doc as unknown as Record<string, unknown>, query)) {
          return doc;
        }
      }
      return null;
    }

    for (const doc of collection._data) {
      if (Query.match(doc as unknown as Record<string, unknown>, query)) {
        return doc;
      }
    }
    return null;
  },

  findUsableIndex(collection: Collection, query: QueryFilter): Index | null {
    for (const index of Object.values(collection._indexes)) {
      if (index.canUse(query)) {
        return index;
      }
    }
    return null;
  },

  count(collection: Collection, query: QueryFilter = {}): number {
    if (isEmptyQuery(query)) return collection._data.length;
    return FindOperations.find(collection, query).count();
  },

  exists(collection: Collection, query: QueryFilter = {}): boolean {
    return FindOperations.findOne(collection, query) !== null;
  },

  first(collection: Collection): Document | null {
    return collection._data[0] || null;
  },

  last(collection: Collection): Document | null {
    return collection._data[collection._data.length - 1] || null;
  },
};
