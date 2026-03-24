import { Query } from '../Query';
import { FindOperations } from './find';
import { InsertOperations } from './insert';
import type { Collection } from '../Collection';
import type { Document, UpdateResult, UpdateSpec } from '../types';

export const UpdateOperations = {
  applyUpdate(doc: Document, update: UpdateSpec): Document {
    const result = { ...doc } as Record<string, unknown>;
    let hasOperators = false;

    for (const key of Object.keys(update)) {
      if (key.startsWith('$')) {
        hasOperators = true;
        break;
      }
    }

    if (!hasOperators) {
      Object.assign(result, update);
      return result as Document;
    }

    for (const [op, spec] of Object.entries(update)) {
      switch (op) {
        case '$set':
          for (const [field, value] of Object.entries(spec as Record<string, unknown>)) {
            Query.setNestedValue(result, field, value);
          }
          break;

        case '$unset':
          for (const field of Object.keys(spec as Record<string, unknown>)) {
            Query.deleteNestedValue(result, field);
          }
          break;

        case '$rename':
          for (const [oldName, newName] of Object.entries(spec as Record<string, string>)) {
            const value = Query.getNestedValue(result, oldName);
            if (value !== undefined) {
              Query.deleteNestedValue(result, oldName);
              Query.setNestedValue(result, newName, value);
            }
          }
          break;

        case '$inc':
          for (const [field, amount] of Object.entries(spec as Record<string, number>)) {
            const current = (Query.getNestedValue(result, field) as number) || 0;
            Query.setNestedValue(result, field, current + amount);
          }
          break;

        case '$min':
          for (const [field, value] of Object.entries(spec as Record<string, unknown>)) {
            const current = Query.getNestedValue(result, field);
            if (current === undefined || (value as number) < (current as number)) {
              Query.setNestedValue(result, field, value);
            }
          }
          break;

        case '$max':
          for (const [field, value] of Object.entries(spec as Record<string, unknown>)) {
            const current = Query.getNestedValue(result, field);
            if (current === undefined || (value as number) > (current as number)) {
              Query.setNestedValue(result, field, value);
            }
          }
          break;

        case '$mul':
          for (const [field, value] of Object.entries(spec as Record<string, number>)) {
            const current = (Query.getNestedValue(result, field) as number) || 0;
            Query.setNestedValue(result, field, current * value);
          }
          break;

        case '$currentDate':
          for (const [field] of Object.entries(spec as Record<string, boolean>)) {
            Query.setNestedValue(result, field, new Date());
          }
          break;

        case '$push':
          for (const [field, value] of Object.entries(spec as Record<string, unknown>)) {
            let arr = Query.getNestedValue(result, field) as unknown[];
            if (!Array.isArray(arr)) {
              arr = [];
              Query.setNestedValue(result, field, arr);
            }

            if (
              value &&
              typeof value === 'object' &&
              (value as Record<string, unknown>).$each
            ) {
              const items = (value as Record<string, unknown>).$each as unknown[];
              const position =
                (value as Record<string, unknown>).$position !== undefined
                  ? ((value as Record<string, unknown>).$position as number)
                  : arr.length;
              arr.splice(position, 0, ...items);
            } else {
              arr.push(value);
            }
          }
          break;

        case '$addToSet':
          for (const [field, value] of Object.entries(spec as Record<string, unknown>)) {
            let arr = Query.getNestedValue(result, field) as unknown[];
            if (!Array.isArray(arr)) {
              arr = [];
              Query.setNestedValue(result, field, arr);
            }

            if (
              value &&
              typeof value === 'object' &&
              (value as Record<string, unknown>).$each
            ) {
              for (const item of (value as Record<string, unknown>).$each as unknown[]) {
                if (!arr.some((existing) => Query.isEqual(existing, item))) {
                  arr.push(item);
                }
              }
            } else {
              if (!arr.some((existing) => Query.isEqual(existing, value))) {
                arr.push(value);
              }
            }
          }
          break;

        case '$pull':
          for (const [field, condition] of Object.entries(spec as Record<string, unknown>)) {
            const arr = Query.getNestedValue(result, field);
            if (Array.isArray(arr)) {
              const newArr = arr.filter((item: unknown) => {
                if (typeof condition === 'object' && condition !== null) {
                  return !Query.matchOperators(
                    item,
                    condition as Record<string, unknown>,
                  );
                }
                return !Query.isEqual(item, condition);
              });
              Query.setNestedValue(result, field, newArr);
            }
          }
          break;

        case '$pullAll':
          for (const [field, values] of Object.entries(spec as Record<string, unknown[]>)) {
            const arr = Query.getNestedValue(result, field);
            if (Array.isArray(arr)) {
              const newArr = arr.filter(
                (item: unknown) => !values.some((v) => Query.isEqual(item, v)),
              );
              Query.setNestedValue(result, field, newArr);
            }
          }
          break;

        case '$pop':
          for (const [field, direction] of Object.entries(spec as Record<string, number>)) {
            const arr = Query.getNestedValue(result, field);
            if (Array.isArray(arr) && arr.length > 0) {
              if (direction === 1) {
                arr.pop();
              } else if (direction === -1) {
                arr.shift();
              }
            }
          }
          break;
      }
    }

    return result as Document;
  },

  updateOne(
    collection: Collection,
    query: Record<string, unknown>,
    update: UpdateSpec,
  ): UpdateResult {
    const doc = FindOperations.findOne(collection, query);
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };

    if (collection._runPreHooks('update', query, update) === false) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const prevDoc = { ...doc } as Document;
    const newDoc = UpdateOperations.applyUpdate(doc, update);
    newDoc.__inc = doc.__inc;

    if (collection._schema) {
      collection._schema.validate(newDoc as unknown as Record<string, unknown>, true);
    }

    for (const index of Object.values(collection._indexes)) {
      index.update(prevDoc, newDoc);
    }

    collection._primary.set(newDoc.__inc, newDoc);

    // Use indexOf with direct reference — O(n) but avoids closure allocation
    const idx = collection._data.indexOf(doc);
    if (idx !== -1) {
      collection._data[idx] = newDoc;
    }

    collection._watcher.emit('update', [newDoc], [prevDoc]);

    collection._db._scheduleSave();

    const result: UpdateResult = { matchedCount: 1, modifiedCount: 1 };

    collection._runPostHooks('update', result, query, update);

    return result;
  },

  updateMany(
    collection: Collection,
    query: Record<string, unknown>,
    update: UpdateSpec,
  ): UpdateResult {
    const docs = FindOperations.find(collection, query).toArray();
    if (docs.length === 0) return { matchedCount: 0, modifiedCount: 0 };

    if (collection._runPreHooks('update', query, update) === false) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    const updated: Document[] = [];
    const prevDocs: Document[] = [];

    // Build replacement map: __inc → newDoc
    const replacements = new Map<number, Document>();

    for (const doc of docs) {
      const prevDoc = { ...doc } as Document;
      prevDocs.push(prevDoc);

      const newDoc = UpdateOperations.applyUpdate(doc, update);
      newDoc.__inc = doc.__inc;

      if (collection._schema) {
        collection._schema.validate(newDoc as unknown as Record<string, unknown>, true);
      }

      for (const index of Object.values(collection._indexes)) {
        index.update(prevDoc, newDoc);
      }

      collection._primary.set(newDoc.__inc, newDoc);
      replacements.set(newDoc.__inc, newDoc);
      updated.push(newDoc);
    }

    // Single pass over _data to apply all replacements
    const data = collection._data;
    for (let i = 0; i < data.length; i++) {
      const replacement = replacements.get(data[i].__inc);
      if (replacement) data[i] = replacement;
    }

    collection._watcher.emit('update', updated, prevDocs);

    collection._db._scheduleSave();

    const result: UpdateResult = {
      matchedCount: docs.length,
      modifiedCount: docs.length,
    };

    collection._runPostHooks('update', result, query, update);

    return result;
  },

  replaceOne(
    collection: Collection,
    query: Record<string, unknown>,
    replacement: Record<string, unknown>,
  ): UpdateResult {
    const doc = FindOperations.findOne(collection, query);
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };

    const prevDoc = { ...doc } as Document;
    const newDoc = { ...replacement, __inc: doc.__inc } as Document;

    if (collection._schema) {
      Object.assign(newDoc, collection._schema.process(newDoc as unknown as Record<string, unknown>, false));
      collection._schema.validate(newDoc as unknown as Record<string, unknown>, false);
    }

    for (const index of Object.values(collection._indexes)) {
      index.update(prevDoc, newDoc);
    }

    collection._primary.set(newDoc.__inc, newDoc);

    const idx = collection._data.indexOf(doc);
    if (idx !== -1) {
      collection._data[idx] = newDoc;
    }

    collection._watcher.emit('update', [newDoc], [prevDoc]);

    collection._db._scheduleSave();

    return { matchedCount: 1, modifiedCount: 1 };
  },

  upsertOne(
    collection: Collection,
    query: Record<string, unknown>,
    doc: Record<string, unknown>,
  ): UpdateResult {
    const existing = FindOperations.findOne(collection, query);
    if (existing) {
      return UpdateOperations.replaceOne(collection, query, doc);
    }
    const inserted = InsertOperations.insertOne(collection, doc);
    return { matchedCount: 0, modifiedCount: 0, upsertedId: inserted?.__inc };
  },
};
