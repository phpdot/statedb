import type { QueryFilter, QueryOperators } from './types';

type Matcher = (doc: Record<string, unknown>) => boolean;

export const Query = {
  // Compile a query into an optimized matcher function.
  // Call once, run the returned function against every doc.
  compile(query: QueryFilter): Matcher {
    if (!query || typeof query !== 'object') {
      return _matchAll;
    }

    const keys = Object.keys(query);
    if (keys.length === 0) return _matchAll;

    // Single-key fast paths (most common queries)
    if (keys.length === 1) {
      const key = keys[0];
      const condition = query[key];

      // Logical operators
      if (key === '$and') {
        const subs = (condition as QueryFilter[]).map(q => Query.compile(q));
        return (doc) => {
          for (let i = 0; i < subs.length; i++) { if (!subs[i](doc)) return false; }
          return true;
        };
      }
      if (key === '$or') {
        const subs = (condition as QueryFilter[]).map(q => Query.compile(q));
        return (doc) => {
          for (let i = 0; i < subs.length; i++) { if (subs[i](doc)) return true; }
          return false;
        };
      }
      if (key === '$not') {
        const sub = Query.compile(condition as QueryFilter);
        return (doc) => !sub(doc);
      }
      if (key === '$nor') {
        const subs = (condition as QueryFilter[]).map(q => Query.compile(q));
        return (doc) => {
          for (let i = 0; i < subs.length; i++) { if (subs[i](doc)) return false; }
          return true;
        };
      }

      // Simple field equality (most common: { role: 'admin' })
      if (condition === null || typeof condition !== 'object') {
        const nested = key.indexOf('.') !== -1;
        if (nested) {
          return (doc) => Query.getNestedValue(doc, key) === condition;
        }
        return (doc) => doc[key] === condition;
      }

      // Operator object on single field
      if (!Array.isArray(condition) && !(condition instanceof RegExp) && !(condition instanceof Date)) {
        return _compileFieldOps(key, condition as QueryOperators);
      }

      // Array/RegExp/Date equality
      const nested = key.indexOf('.') !== -1;
      return nested
        ? (doc) => Query.isEqual(Query.getNestedValue(doc, key), condition)
        : (doc) => Query.isEqual(doc[key], condition);
    }

    // Multi-key: compile each field check
    const checks: Matcher[] = [];
    for (let i = 0; i < keys.length; i++) {
      checks.push(Query.compile({ [keys[i]]: query[keys[i]] } as QueryFilter));
    }
    return (doc) => {
      for (let i = 0; i < checks.length; i++) { if (!checks[i](doc)) return false; }
      return true;
    };
  },

  match(doc: Record<string, unknown>, query: QueryFilter): boolean {
    if (!query || typeof query !== 'object') {
      return true;
    }

    for (const key in query) {
      const condition = query[key];

      // Logical operators — check first char to avoid string comparison on data keys
      if (key.charCodeAt(0) === 36) { // '$'
        if (key === '$and') {
          const arr = condition as QueryFilter[];
          for (let i = 0; i < arr.length; i++) {
            if (!Query.match(doc, arr[i])) return false;
          }
          continue;
        }
        if (key === '$or') {
          const arr = condition as QueryFilter[];
          let found = false;
          for (let i = 0; i < arr.length; i++) {
            if (Query.match(doc, arr[i])) { found = true; break; }
          }
          if (!found) return false;
          continue;
        }
        if (key === '$not') {
          if (Query.match(doc, condition as QueryFilter)) return false;
          continue;
        }
        if (key === '$nor') {
          const arr = condition as QueryFilter[];
          for (let i = 0; i < arr.length; i++) {
            if (Query.match(doc, arr[i])) return false;
          }
          continue;
        }
      }

      // Get value — inline fast path for non-nested keys
      const value = key.charCodeAt(0) !== 46 && key.indexOf('.') === -1
        ? doc[key]
        : Query.getNestedValue(doc, key);

      // Direct equality fast path — most common case (primitives)
      if (condition === null || typeof condition !== 'object') {
        if (value !== condition) return false;
        continue;
      }

      // Array/RegExp/Date are direct equality
      if (Array.isArray(condition) || condition instanceof RegExp || condition instanceof Date) {
        if (!Query.isEqual(value, condition)) return false;
        continue;
      }

      // Operator object
      if (!Query.matchOperators(value, condition as QueryOperators)) return false;
    }

    return true;
  },

  getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    if (path.indexOf('.') === -1) {
      return obj[path];
    }
    const parts = path.split('.');
    let current: unknown = obj;
    for (let i = 0; i < parts.length; i++) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[parts[i]];
    }
    return current;
  },

  setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    if (path.indexOf('.') === -1) {
      obj[path] = value;
      return;
    }
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || current[part] === null) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  },

  deleteNestedValue(obj: Record<string, unknown>, path: string): void {
    if (path.indexOf('.') === -1) {
      delete obj[path];
      return;
    }
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || current[part] === null) return;
      current = current[part] as Record<string, unknown>;
    }
    delete current[parts[parts.length - 1]];
  },

  matchOperators(value: unknown, operators: QueryOperators): boolean {
    for (const op in operators) {
      const expected = (operators as Record<string, unknown>)[op];

      switch (op) {
        case '$eq':
          if (value !== expected && !Query.isEqual(value, expected)) return false;
          break;
        case '$ne':
          if (value === expected || Query.isEqual(value, expected)) return false;
          break;
        case '$gt':
          if (value === undefined || value === null || (value as number) <= (expected as number))
            return false;
          break;
        case '$gte':
          if (value === undefined || value === null || (value as number) < (expected as number))
            return false;
          break;
        case '$lt':
          if (value === undefined || value === null || (value as number) >= (expected as number))
            return false;
          break;
        case '$lte':
          if (value === undefined || value === null || (value as number) > (expected as number))
            return false;
          break;

        case '$in': {
          if (!Array.isArray(expected)) return false;
          let found = false;
          for (let i = 0; i < expected.length; i++) {
            if (value === expected[i] || Query.isEqual(value, expected[i])) { found = true; break; }
          }
          if (!found) return false;
          break;
        }
        case '$nin': {
          if (!Array.isArray(expected)) return false;
          for (let i = 0; i < expected.length; i++) {
            if (value === expected[i] || Query.isEqual(value, expected[i])) return false;
          }
          break;
        }

        case '$exists':
          if (expected && value === undefined) return false;
          if (!expected && value !== undefined) return false;
          break;
        case '$type':
          if (!Query.matchType(value, expected as string)) return false;
          break;

        case '$regex': {
          if (typeof value !== 'string') return false;
          const regex = expected instanceof RegExp ? expected : new RegExp(expected as string);
          if (!regex.test(value)) return false;
          break;
        }

        case '$all':
          if (!Array.isArray(value) || !Array.isArray(expected)) return false;
          for (let i = 0; i < expected.length; i++) {
            let has = false;
            for (let j = 0; j < value.length; j++) {
              if (Query.isEqual(value[j], expected[i])) { has = true; break; }
            }
            if (!has) return false;
          }
          break;
        case '$elemMatch':
          if (!Array.isArray(value)) return false;
          {
            let matched = false;
            for (let i = 0; i < value.length; i++) {
              if (Query.matchOperators(value[i], expected as QueryOperators)) { matched = true; break; }
            }
            if (!matched) return false;
          }
          break;
        case '$size':
          if (!Array.isArray(value) || value.length !== expected) return false;
          break;

        default:
          return false;
      }
    }
    return true;
  },

  matchType(value: unknown, expectedType: string): boolean {
    if (value === null) return expectedType === 'null';
    if (value === undefined) return expectedType === 'undefined';
    if (Array.isArray(value)) return expectedType === 'array';
    if (value instanceof Date) return expectedType === 'date';
    return typeof value === expectedType;
  },

  getType(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  },

  isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined) return false;

    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }

    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!Query.isEqual(a[i], b[i])) return false;
      }
      return true;
    }

    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a as Record<string, unknown>);
      const keysB = Object.keys(b as Record<string, unknown>);
      if (keysA.length !== keysB.length) return false;
      for (let i = 0; i < keysA.length; i++) {
        if (
          !Query.isEqual(
            (a as Record<string, unknown>)[keysA[i]],
            (b as Record<string, unknown>)[keysA[i]],
          )
        )
          return false;
      }
      return true;
    }

    return false;
  },
};

// ==================== Compiled query helpers ====================

function _matchAll(): boolean {
  return true;
}

function _getValue(doc: Record<string, unknown>, key: string): unknown {
  return key.indexOf('.') === -1 ? doc[key] : Query.getNestedValue(doc, key);
}

function _compileFieldOps(key: string, ops: QueryOperators): Matcher {
  const nested = key.indexOf('.') !== -1;
  const entries = Object.keys(ops);

  // Single operator fast path
  if (entries.length === 1) {
    const op = entries[0];
    const expected = (ops as Record<string, unknown>)[op];
    return _compileSingleOp(key, nested, op, expected);
  }

  // Multiple operators on same field
  const checks: Matcher[] = [];
  for (let i = 0; i < entries.length; i++) {
    const op = entries[i];
    const expected = (ops as Record<string, unknown>)[op];
    checks.push(_compileSingleOp(key, nested, op, expected));
  }
  return (doc) => {
    for (let i = 0; i < checks.length; i++) { if (!checks[i](doc)) return false; }
    return true;
  };
}

function _compileSingleOp(key: string, nested: boolean, op: string, expected: unknown): Matcher {
  switch (op) {
    case '$eq':
      return nested
        ? (doc) => { const v = Query.getNestedValue(doc, key); return v === expected || Query.isEqual(v, expected); }
        : (doc) => { const v = doc[key]; return v === expected || Query.isEqual(v, expected); };
    case '$ne':
      return nested
        ? (doc) => { const v = Query.getNestedValue(doc, key); return v !== expected && !Query.isEqual(v, expected); }
        : (doc) => { const v = doc[key]; return v !== expected && !Query.isEqual(v, expected); };
    case '$gt':
      return nested
        ? (doc) => { const v = Query.getNestedValue(doc, key); return v !== undefined && v !== null && (v as number) > (expected as number); }
        : (doc) => { const v = doc[key]; return v !== undefined && v !== null && (v as number) > (expected as number); };
    case '$gte':
      return nested
        ? (doc) => { const v = Query.getNestedValue(doc, key); return v !== undefined && v !== null && (v as number) >= (expected as number); }
        : (doc) => { const v = doc[key]; return v !== undefined && v !== null && (v as number) >= (expected as number); };
    case '$lt':
      return nested
        ? (doc) => { const v = Query.getNestedValue(doc, key); return v !== undefined && v !== null && (v as number) < (expected as number); }
        : (doc) => { const v = doc[key]; return v !== undefined && v !== null && (v as number) < (expected as number); };
    case '$lte':
      return nested
        ? (doc) => { const v = Query.getNestedValue(doc, key); return v !== undefined && v !== null && (v as number) <= (expected as number); }
        : (doc) => { const v = doc[key]; return v !== undefined && v !== null && (v as number) <= (expected as number); };
    case '$in': {
      const arr = expected as unknown[];
      // Optimize: build Set for primitive values
      const allPrimitive = arr.every(e => e === null || typeof e !== 'object');
      if (allPrimitive) {
        const set = new Set(arr);
        return nested
          ? (doc) => set.has(Query.getNestedValue(doc, key) as string)
          : (doc) => set.has(doc[key] as string);
      }
      return (doc) => {
        const v = nested ? Query.getNestedValue(doc, key) : doc[key];
        for (let i = 0; i < arr.length; i++) { if (v === arr[i] || Query.isEqual(v, arr[i])) return true; }
        return false;
      };
    }
    case '$nin': {
      const arr = expected as unknown[];
      const allPrimitive = arr.every(e => e === null || typeof e !== 'object');
      if (allPrimitive) {
        const set = new Set(arr);
        return nested
          ? (doc) => !set.has(Query.getNestedValue(doc, key) as string)
          : (doc) => !set.has(doc[key] as string);
      }
      return (doc) => {
        const v = nested ? Query.getNestedValue(doc, key) : doc[key];
        for (let i = 0; i < arr.length; i++) { if (v === arr[i] || Query.isEqual(v, arr[i])) return false; }
        return true;
      };
    }
    case '$exists':
      return nested
        ? (doc) => expected ? Query.getNestedValue(doc, key) !== undefined : Query.getNestedValue(doc, key) === undefined
        : (doc) => expected ? doc[key] !== undefined : doc[key] === undefined;
    case '$type': {
      const t = expected as string;
      return (doc) => Query.matchType(nested ? Query.getNestedValue(doc, key) : doc[key], t);
    }
    case '$regex': {
      const regex = expected instanceof RegExp ? expected : new RegExp(expected as string);
      return nested
        ? (doc) => { const v = Query.getNestedValue(doc, key); return typeof v === 'string' && regex.test(v); }
        : (doc) => { const v = doc[key]; return typeof v === 'string' && regex.test(v as string); };
    }
    case '$size':
      return (doc) => { const v = nested ? Query.getNestedValue(doc, key) : doc[key]; return Array.isArray(v) && v.length === expected; };
    case '$all': {
      const arr = expected as unknown[];
      return (doc) => {
        const v = nested ? Query.getNestedValue(doc, key) : doc[key];
        if (!Array.isArray(v)) return false;
        for (let i = 0; i < arr.length; i++) {
          let has = false;
          for (let j = 0; j < v.length; j++) { if (Query.isEqual(v[j], arr[i])) { has = true; break; } }
          if (!has) return false;
        }
        return true;
      };
    }
    case '$elemMatch': {
      const subOps = expected as QueryOperators;
      return (doc) => {
        const v = nested ? Query.getNestedValue(doc, key) : doc[key];
        if (!Array.isArray(v)) return false;
        for (let i = 0; i < v.length; i++) { if (Query.matchOperators(v[i], subOps)) return true; }
        return false;
      };
    }
    default:
      return () => false;
  }
}
