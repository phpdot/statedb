import type { Document, WatcherCallback, WatcherEntry, WatcherEvent, WatcherOptions } from './types';

export class Watcher {
  private _watchers: Map<number, WatcherEntry>;
  private _nextId: number;

  constructor() {
    this._watchers = new Map();
    this._nextId = 1;
  }

  watch(callback: WatcherCallback, options: WatcherOptions = {}): number {
    const id = this._nextId++;
    this._watchers.set(id, {
      callback,
      ops: options.ops || null,
    });
    return id;
  }

  unwatch(id?: number): void {
    if (id === undefined) {
      this._watchers.clear();
    } else {
      this._watchers.delete(id);
    }
  }

  emit(event: WatcherEvent, docs: Document[], prevDocs: Document[] | null = null): void {
    for (const [, watcher] of this._watchers) {
      if (watcher.ops === null || watcher.ops.includes(event)) {
        try {
          watcher.callback(event, docs, prevDocs);
        } catch (e) {
          console.error('Watcher error:', e);
        }
      }
    }
  }

  count(): number {
    return this._watchers.size;
  }
}
