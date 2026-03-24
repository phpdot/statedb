import { describe, test, expect } from 'vitest';
import { StateDB } from '../src/index';

let _dbCounter = 0;
function createTestDB(options?: ConstructorParameters<typeof StateDB>[1]) {
  return new StateDB('test_' + ++_dbCounter, options);
}

describe('Phase 1: Foundation', () => {
  test('StateDB can be instantiated with a name', () => {
    const db = new StateDB('foundation_test');
    expect(db).toBeInstanceOf(StateDB);
    expect(db._name).toBe('foundation_test');
  });

  test('createCollection creates a new collection', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    expect(users).not.toBeNull();
  });

  test('getCollection returns existing collection', () => {
    const db = createTestDB();
    const users = db.createCollection('users');
    const same = db.getCollection('users');
    expect(users).toBe(same);
  });

  test('listCollections returns all collection names', () => {
    const db = createTestDB();
    db.createCollection('users');
    db.createCollection('posts');
    expect(db.listCollections()).toEqual(['users', 'posts']);
  });

  test('dropCollection removes a collection', () => {
    const db = createTestDB();
    db.createCollection('users');
    db.dropCollection('users');
    expect(db.getCollection('users')).toBeNull();
  });

  test('drop removes all collections', () => {
    const db = createTestDB();
    db.createCollection('users');
    db.createCollection('posts');
    db.drop();
    expect(db.listCollections()).toEqual([]);
  });
});
