import { describe, test, expect } from 'vitest';
import { StateDB } from '../src/index';

let _dbCounter = 0;
function createTestDB() {
  return new StateDB('test_ud_' + ++_dbCounter);
}

describe('Phase 3: Update & Delete', () => {
  test('updateOne modifies document', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertOne({ name: 'Omar', age: 30 });
    users.updateOne({ name: 'Omar' }, { age: 31 });
    expect(users.findOne({ name: 'Omar' })!.age).toBe(31);
  });

  test('updateMany modifies multiple documents', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertMany([{ status: 'pending' }, { status: 'pending' }, { status: 'active' }]);
    users.updateMany({ status: 'pending' }, { status: 'done' });
    expect(users.count({ status: 'done' })).toBe(2);
  });

  test('replaceOne replaces entire document', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertOne({ name: 'Omar', age: 30, extra: 'data' });
    users.replaceOne({ name: 'Omar' }, { name: 'Omar H', age: 31 });
    const doc = users.findOne({ __inc: 1 });
    expect(doc!.name).toBe('Omar H');
    expect(doc!.age).toBe(31);
    expect(doc!.extra).toBeUndefined();
  });

  test('upsertOne inserts when not found', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.upsertOne({ email: 'test@test.com' }, { name: 'New', email: 'test@test.com' });
    expect(users.count()).toBe(1);
    expect(users.first()!.name).toBe('New');
  });

  test('deleteOne removes one document', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertMany([{ n: 1 }, { n: 2 }]);
    users.deleteOne({ n: 1 });
    expect(users.count()).toBe(1);
    expect(users.first()!.n).toBe(2);
  });

  test('deleteMany removes multiple documents', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertMany([{ x: 1 }, { x: 1 }, { x: 2 }]);
    users.deleteMany({ x: 1 });
    expect(users.count()).toBe(1);
  });

  test('drop removes all documents', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    users.insertMany([{ a: 1 }, { b: 2 }]);
    users.drop();
    expect(users.count()).toBe(0);
  });
});
