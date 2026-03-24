import { describe, test, expect } from 'vitest';
import { StateDB } from '../src/index';

let _dbCounter = 0;
function createTestDB(options?: ConstructorParameters<typeof StateDB>[1]) {
  return new StateDB('test_if_' + ++_dbCounter, options);
}

describe('Phase 2: Insert & Find', () => {
  test('insertOne adds document with __inc', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    const doc = users.insertOne({ name: 'Omar' });
    expect(doc!.__inc).toBe(1);
    expect(doc!.name).toBe('Omar');
  });

  test('insertMany adds multiple documents', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    const docs = users.insertMany([{ name: 'A' }, { name: 'B' }]);
    expect(docs.length).toBe(2);
    expect(docs[0].__inc).toBe(1);
    expect(docs[1].__inc).toBe(2);
  });

  test('find returns all documents', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertMany([{ name: 'A' }, { name: 'B' }]);
    const all = users.find().toArray();
    expect(all.length).toBe(2);
  });

  test('find with exact match', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertMany([{ name: 'Omar' }, { name: 'Ali' }]);
    const result = users.find({ name: 'Omar' }).toArray();
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Omar');
  });

  test('findOne by __inc (O(1) lookup)', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertMany([{ name: 'Omar' }, { name: 'Ali' }]);
    const doc = users.findOne({ __inc: 2 });
    expect(doc!.name).toBe('Ali');
  });

  test('QueryResult sort', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertMany([
      { name: 'C', age: 30 },
      { name: 'A', age: 25 },
      { name: 'B', age: 28 },
    ]);
    const sorted = users.find().sort({ age: 1 }).toArray();
    expect(sorted.map((u) => u.name)).toEqual(['A', 'B', 'C']);
  });

  test('QueryResult skip and limit', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertMany([{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }]);
    const result = users.find().skip(1).limit(2).toArray();
    expect(result.map((u) => u.n)).toEqual([2, 3]);
  });

  test('count returns document count', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertMany([{ a: 1 }, { a: 2 }]);
    expect(users.count()).toBe(2);
  });

  test('exists returns true/false', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertOne({ name: 'Omar' });
    expect(users.exists({ name: 'Omar' })).toBe(true);
    expect(users.exists({ name: 'Nobody' })).toBe(false);
  });

  test('first and last', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertMany([{ n: 1 }, { n: 2 }, { n: 3 }]);
    expect(users.first()!.n).toBe(1);
    expect(users.last()!.n).toBe(3);
  });
});
