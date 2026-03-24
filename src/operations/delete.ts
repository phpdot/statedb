import { FindOperations } from './find';
import type { Collection } from '../Collection';
import type { DeleteResult, QueryFilter } from '../types';

export const DeleteOperations = {
  deleteOne(collection: Collection, query: QueryFilter): DeleteResult {
    const doc = FindOperations.findOne(collection, query);
    if (!doc) return { deletedCount: 0 };

    if (collection._runPreHooks('delete', query) === false) {
      return { deletedCount: 0 };
    }

    for (const index of Object.values(collection._indexes)) {
      index.remove(doc);
    }

    collection._primary.delete(doc.__inc);

    const idx = collection._data.indexOf(doc);
    if (idx !== -1) {
      collection._data.splice(idx, 1);
    }

    collection._watcher.emit('delete', [doc], null);

    collection._db._scheduleSave();

    const result: DeleteResult = { deletedCount: 1 };

    collection._runPostHooks('delete', result, query);

    return result;
  },

  deleteMany(collection: Collection, query: QueryFilter): DeleteResult {
    const docs = FindOperations.find(collection, query).toArray();
    if (docs.length === 0) return { deletedCount: 0 };

    if (collection._runPreHooks('delete', query) === false) {
      return { deletedCount: 0 };
    }

    // Build Set of __inc to delete for O(1) lookup
    const deleteSet = new Set<number>();
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      deleteSet.add(doc.__inc);
      collection._primary.delete(doc.__inc);
      for (const index of Object.values(collection._indexes)) {
        index.remove(doc);
      }
    }

    // Single-pass filter instead of per-item splice
    collection._data = collection._data.filter((d) => !deleteSet.has(d.__inc));

    collection._watcher.emit('delete', docs, null);

    collection._db._scheduleSave();

    const result: DeleteResult = { deletedCount: docs.length };

    collection._runPostHooks('delete', result, query);

    return result;
  },

  drop(collection: Collection): DeleteResult {
    const count = collection._data.length;
    const docs = collection._data;

    collection._data = [];
    collection._primary.clear();
    collection._inc = 1;

    for (const index of Object.values(collection._indexes)) {
      index.clear();
    }

    if (count > 0) {
      collection._watcher.emit('drop', docs, null);
    }

    collection._db._scheduleSave();

    return { deletedCount: count };
  },
};
