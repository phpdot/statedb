import { describe, test, expect } from 'vitest';
import { StateDB } from '../src/index';

let _dbCounter = 0;
function createTestDB() {
  return new StateDB('test_w_' + ++_dbCounter);
}

describe('Phase 8: Reactivity & Watchers', () => {
  test('watch fires on insert', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    let fired = false;
    let eventType: string | null = null;
    c.watch((event) => {
      fired = true;
      eventType = event;
    });
    c.insertOne({ name: 'Test' });
    expect(fired).toBe(true);
    expect(eventType).toBe('insert');
  });

  test('watch fires on update', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'Test' });
    let eventType: string | null = null;
    c.watch((event) => {
      eventType = event;
    });
    c.updateOne({ name: 'Test' }, { name: 'Updated' });
    expect(eventType).toBe('update');
  });

  test('watch fires on delete', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'Test' });
    let eventType: string | null = null;
    c.watch((event) => {
      eventType = event;
    });
    c.deleteOne({ name: 'Test' });
    expect(eventType).toBe('delete');
  });

  test('watch with ops filter', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    let insertFired = false;
    let updateFired = false;
    c.watch(
      (event) => {
        if (event === 'insert') insertFired = true;
        if (event === 'update') updateFired = true;
      },
      { ops: ['insert'] },
    );
    c.insertOne({ name: 'Test' });
    c.updateOne({ name: 'Test' }, { name: 'Updated' });
    expect(insertFired).toBe(true);
    expect(updateFired).toBe(false);
  });

  test('unwatch removes watcher', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    let count = 0;
    const id = c.watch(() => {
      count++;
    });
    c.insertOne({ a: 1 });
    c.unwatch(id);
    c.insertOne({ a: 2 });
    expect(count).toBe(1);
  });
});
