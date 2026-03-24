import { Collection } from './Collection';
import type {
  CollectionDump,
  CollectionOptions,
  DumpData,
  ExportData,
  ImportData,
  StateDBOptions,
} from './types';

export class StateDB {
  _name: string;
  private _persistent: boolean;
  private _storage: 'local' | 'session';
  private _debounce: number;
  _collections: Map<string, Collection>;
  private _saveTimeout: ReturnType<typeof setTimeout> | null;

  constructor(name = 'statedb', options: StateDBOptions = {}) {
    this._name = name;
    this._persistent = options.persistent || false;
    this._storage = options.storage || 'local';
    this._debounce = options.debounce || 100;
    this._collections = new Map();
    this._saveTimeout = null;

    if (this._persistent) {
      this.load();
    }

    if (this._persistent && typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.save());
    }
  }

  // ==================== Collection Management ====================

  createCollection(name: string, options: CollectionOptions = {}): Collection {
    if (this._collections.has(name)) {
      return this._collections.get(name)!;
    }

    const collection = new Collection(name, this, options);
    this._collections.set(name, collection);

    if (this._persistent) {
      const data = this._loadCollectionData(name);
      if (data) {
        collection._load(data);
      }
    }

    return collection;
  }

  getCollection(name: string): Collection | null {
    return this._collections.get(name) || null;
  }

  listCollections(): string[] {
    return Array.from(this._collections.keys());
  }

  dropCollection(name: string): boolean {
    const collection = this._collections.get(name);
    if (collection) {
      collection._watcher.emit('drop', collection._data, null);
      this._collections.delete(name);
      this._scheduleSave();
      return true;
    }
    return false;
  }

  drop(): boolean {
    for (const [, collection] of this._collections) {
      collection._watcher.emit('drop', collection._data, null);
    }
    this._collections.clear();
    this.flush();
    return true;
  }

  // ==================== Persistence ====================

  private _getStorageKey(): string {
    return `statedb_${this._name}`;
  }

  private _getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    return this._storage === 'session' ? sessionStorage : localStorage;
  }

  _scheduleSave(): void {
    if (!this._persistent) return;

    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
    }

    this._saveTimeout = setTimeout(() => {
      this.save();
    }, this._debounce);
  }

  save(): boolean {
    const storage = this._getStorage();
    if (!storage) return false;

    const data: Record<string, CollectionDump> = {};
    for (const [name, collection] of this._collections) {
      data[name] = collection._export();
    }

    try {
      storage.setItem(this._getStorageKey(), JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('StateDB save error:', e);
      return false;
    }
  }

  load(): boolean {
    const storage = this._getStorage();
    if (!storage) return false;

    try {
      const raw = storage.getItem(this._getStorageKey());
      if (!raw) return false;

      const data = JSON.parse(raw) as Record<string, CollectionDump>;
      for (const [name, collectionData] of Object.entries(data)) {
        let collection = this._collections.get(name);
        if (!collection) {
          collection = new Collection(name, this);
          this._collections.set(name, collection);
        }
        collection._load(collectionData);
      }
      return true;
    } catch (e) {
      console.error('StateDB load error:', e);
      return false;
    }
  }

  private _loadCollectionData(name: string): CollectionDump | null {
    const storage = this._getStorage();
    if (!storage) return null;

    try {
      const raw = storage.getItem(this._getStorageKey());
      if (!raw) return null;

      const data = JSON.parse(raw) as Record<string, CollectionDump>;
      return data[name] || null;
    } catch {
      return null;
    }
  }

  flush(): boolean {
    const storage = this._getStorage();
    if (!storage) return false;

    try {
      storage.removeItem(this._getStorageKey());
      return true;
    } catch {
      return false;
    }
  }

  // ==================== Export/Import ====================

  export(): ExportData {
    const result: ExportData = {};
    for (const [name, collection] of this._collections) {
      result[name] = collection._data.map((doc) => {
        const clean = { ...doc } as Record<string, unknown>;
        delete clean.__inc;
        return clean;
      });
    }
    return result;
  }

  dump(): DumpData {
    const result: DumpData = {};
    for (const [name, collection] of this._collections) {
      result[name] = {
        documents: [...collection._data],
        inc: collection._inc,
      };
    }
    return result;
  }

  import(data: ImportData): boolean {
    for (const [name, documents] of Object.entries(data)) {
      let collection = this._collections.get(name);
      if (!collection) {
        collection = this.createCollection(name);
      }
      collection.drop();
      for (const doc of documents) {
        collection.insertOne(doc);
      }
    }
    return true;
  }

  restore(dump: DumpData): boolean {
    for (const [name, collectionData] of Object.entries(dump)) {
      let collection = this._collections.get(name);
      if (!collection) {
        collection = new Collection(name, this);
        this._collections.set(name, collection);
      }
      collection._load(collectionData);
    }
    this._scheduleSave();
    return true;
  }
}
