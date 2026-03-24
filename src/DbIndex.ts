import { Query } from './Query';
import type { Document, IndexOptions, QueryFilter } from './types';

export class Index {
  fields: string[];
  unique: boolean;
  map: Map<unknown, Set<number>>;
  name: string;

  constructor(fields: string | string[], options: IndexOptions = {}) {
    this.fields = Array.isArray(fields) ? fields : [fields];
    this.unique = options.unique || false;
    this.map = new Map();
    this.name = this.fields.join('_');
  }

  getKey(doc: Document): unknown {
    if (this.fields.length === 1) {
      return Query.getNestedValue(doc as unknown as Record<string, unknown>, this.fields[0]);
    }
    return this.fields
      .map((f) => Query.getNestedValue(doc as unknown as Record<string, unknown>, f))
      .join('\0');
  }

  add(doc: Document): boolean {
    const key = this.getKey(doc);
    if (key === undefined) return true;

    if (this.unique) {
      if (this.map.has(key)) {
        const existing = this.map.get(key)!;
        if (existing.size > 0 && !existing.has(doc.__inc)) {
          throw new Error(`Duplicate key error: ${this.name} = ${key}`);
        }
      }
    }

    if (!this.map.has(key)) {
      this.map.set(key, new Set());
    }
    this.map.get(key)!.add(doc.__inc);
    return true;
  }

  remove(doc: Document): void {
    const key = this.getKey(doc);
    if (key === undefined) return;

    const set = this.map.get(key);
    if (set) {
      set.delete(doc.__inc);
      if (set.size === 0) {
        this.map.delete(key);
      }
    }
  }

  update(oldDoc: Document, newDoc: Document): void {
    this.remove(oldDoc);
    this.add(newDoc);
  }

  get(key: unknown): Set<number> {
    return this.map.get(key) || new Set();
  }

  getByPrefix(prefixKey: unknown, prefixLength: number): Set<number> {
    if (prefixLength === this.fields.length) {
      return this.get(prefixKey);
    }

    const result = new Set<number>();
    const prefix = prefixKey + '\0';

    for (const [key, incSet] of this.map) {
      if (key === prefixKey || (typeof key === 'string' && key.startsWith(prefix as string))) {
        for (const inc of incSet) {
          result.add(inc);
        }
      }
    }

    return result;
  }

  canUse(query: QueryFilter): boolean {
    if (!query || typeof query !== 'object') return false;

    let prefixLength = 0;
    for (const field of this.fields) {
      if (!Object.prototype.hasOwnProperty.call(query, field)) break;
      const condition = query[field];
      if (
        typeof condition === 'object' &&
        condition !== null &&
        (condition as Record<string, unknown>).$eq === undefined
      )
        break;
      prefixLength++;
    }

    return prefixLength > 0;
  }

  getPrefixLength(query: QueryFilter): number {
    let count = 0;
    for (const field of this.fields) {
      if (!Object.prototype.hasOwnProperty.call(query, field)) break;
      const condition = query[field];
      if (
        typeof condition === 'object' &&
        condition !== null &&
        (condition as Record<string, unknown>).$eq === undefined
      )
        break;
      count++;
    }
    return count;
  }

  getKeyFromQuery(query: QueryFilter): unknown {
    const prefixLength = this.getPrefixLength(query);
    const fieldsToUse = this.fields.slice(0, prefixLength);

    if (fieldsToUse.length === 1) {
      const field = fieldsToUse[0];
      const condition = query[field];
      if (typeof condition !== 'object' || condition === null) {
        return condition;
      }
      if ((condition as Record<string, unknown>).$eq !== undefined) {
        return (condition as Record<string, unknown>).$eq;
      }
    }

    return fieldsToUse
      .map((field) => {
        const condition = query[field];
        if (typeof condition !== 'object' || condition === null) {
          return condition;
        }
        return (condition as Record<string, unknown>).$eq;
      })
      .join('\0');
  }

  clear(): void {
    this.map.clear();
  }
}
