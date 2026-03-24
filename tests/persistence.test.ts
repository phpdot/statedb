import { describe, test, expect } from 'vitest';
import { StateDB } from '../src/index';

let _dbCounter = 0;
function createTestDB() {
  return new StateDB('test_p_' + ++_dbCounter);
}

describe('Phase 9: Persistence', () => {
  test('export returns clean data without __inc', () => {
    const db = createTestDB();
    const c = db.createCollection('users');
    c.insertOne({ name: 'Test' });
    const data = db.export();
    expect(data.users[0].__inc).toBeUndefined();
    expect(data.users[0].name).toBe('Test');
  });

  test('dump returns data with __inc', () => {
    const db = createTestDB();
    const c = db.createCollection('users');
    c.insertOne({ name: 'Test' });
    const data = db.dump();
    expect(data.users.documents[0].__inc).toBe(1);
  });

  test('import loads clean data', () => {
    const db = createTestDB();
    db.createCollection('users');
    db.import({ users: [{ name: 'A' }, { name: 'B' }] });
    expect(db.getCollection('users')!.count()).toBe(2);
  });

  test('restore loads dump data', () => {
    const db = createTestDB();
    db.createCollection('users');
    const dump = {
      users: { documents: [{ __inc: 5, name: 'Test' }], inc: 6 },
    };
    db.restore(dump);
    const c = db.getCollection('users')!;
    expect(c.count()).toBe(1);
    expect(c.first()!.__inc).toBe(5);
  });
});
