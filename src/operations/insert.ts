import type { Collection } from '../Collection';
import type { Document } from '../types';

export const InsertOperations = {
  insertOne(collection: Collection, doc: unknown): Document | null {
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
      throw new Error('Document must be an object');
    }

    let newDoc = { ...doc } as Record<string, unknown>;

    if (collection._runPreHooks('insert', newDoc) === false) {
      return null;
    }

    if (collection._schema) {
      newDoc = collection._schema.process(newDoc, false);
      collection._schema.validate(newDoc, false);
    }

    if (collection._schema && collection._schema.capped) {
      while (collection._data.length >= collection._schema.max) {
        const oldest = collection._data.shift()!;
        collection._primary.delete(oldest.__inc);
        for (const index of Object.values(collection._indexes)) {
          index.remove(oldest);
        }
      }
    }

    (newDoc as Document).__inc = collection._inc++;

    const typedDoc = newDoc as Document;

    collection._primary.set(typedDoc.__inc, typedDoc);

    for (const index of Object.values(collection._indexes)) {
      index.add(typedDoc);
    }

    collection._data.push(typedDoc);

    collection._watcher.emit('insert', [typedDoc], null);

    collection._db._scheduleSave();

    collection._runPostHooks('insert', typedDoc);

    return typedDoc;
  },

  insertMany(collection: Collection, docs: unknown): Document[] {
    if (!Array.isArray(docs)) {
      throw new Error('Documents must be an array');
    }

    const hasHooks = collection._hooks.pre.insert.length > 0 || collection._hooks.post.insert.length > 0;
    const hasSchema = collection._schema !== null;
    const hasCapped = hasSchema && collection._schema!.capped;
    const indexes = Object.values(collection._indexes);
    const hasIndexes = indexes.length > 0;

    // If hooks exist, fall back to per-item insert (hooks may abort/modify individually)
    if (hasHooks) {
      const inserted: Document[] = [];
      for (let i = 0; i < docs.length; i++) {
        const result = InsertOperations.insertOne(collection, docs[i]);
        if (result) inserted.push(result);
      }
      return inserted;
    }

    const inserted: Document[] = [];

    for (let i = 0; i < docs.length; i++) {
      const raw = docs[i];
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error('Document must be an object');
      }

      let newDoc = { ...raw } as Record<string, unknown>;

      if (hasSchema) {
        newDoc = collection._schema!.process(newDoc, false);
        collection._schema!.validate(newDoc, false);
      }

      if (hasCapped) {
        while (collection._data.length >= collection._schema!.max) {
          const oldest = collection._data.shift()!;
          collection._primary.delete(oldest.__inc);
          for (let j = 0; j < indexes.length; j++) indexes[j].remove(oldest);
        }
      }

      (newDoc as Document).__inc = collection._inc++;
      const typedDoc = newDoc as Document;

      collection._primary.set(typedDoc.__inc, typedDoc);

      if (hasIndexes) {
        for (let j = 0; j < indexes.length; j++) indexes[j].add(typedDoc);
      }

      collection._data.push(typedDoc);
      inserted.push(typedDoc);
    }

    // Single watcher emit + single save for entire batch
    if (inserted.length > 0) {
      collection._watcher.emit('insert', inserted, null);
      collection._db._scheduleSave();
    }

    return inserted;
  },
};
