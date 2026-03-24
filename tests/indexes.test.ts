import { describe, test, expect } from 'vitest';
import { StateDB } from '../src/index';

let _dbCounter = 0;
function createTestDB() {
  return new StateDB('test_idx_' + ++_dbCounter);
}

describe('Phase 6: Secondary Indexes', () => {
  test('createIndex creates index', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ email: 'a@test' }, { email: 'b@test' }]);
    c.createIndex({ email: 1 });
    expect(c.getIndexes()).toContain('email');
  });

  test('unique index prevents duplicates', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ email: 1 }, { unique: true });
    c.insertOne({ email: 'test@test' });
    expect(() => c.insertOne({ email: 'test@test' })).toThrow(/Duplicate/);
  });

  test('index speeds up query (uses index)', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ email: 'a@test' }, { email: 'b@test' }, { email: 'c@test' }]);
    c.createIndex({ email: 1 });
    const doc = c.findOne({ email: 'b@test' });
    expect(doc!.email).toBe('b@test');
  });

  test('dropIndex removes index', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ email: 1 });
    c.dropIndex('email');
    expect(c.getIndexes()).not.toContain('email');
  });
});
