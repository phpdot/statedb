import { describe, test, expect } from 'vitest';
import { StateDB } from '../src/index';

let _dbCounter = 0;
function createTestDB() {
  return new StateDB('test_sc_' + ++_dbCounter);
}

describe('Phase 7: Schema Validation', () => {
  test('schema validates required fields', () => {
    const db = createTestDB();
    const c = db.createCollection('users', {
      schema: { name: { type: String, required: true } },
    });
    expect(() => c.insertOne({})).toThrow(/required/);
  });

  test('schema validates type', () => {
    const db = createTestDB();
    const c = db.createCollection('users', {
      schema: { age: { type: Number } },
    });
    expect(() => c.insertOne({ age: 'not a number' })).toThrow();
  });

  test('schema applies defaults', () => {
    const db = createTestDB();
    const c = db.createCollection('users', {
      schema: { role: { type: String, default: 'user' } },
    });
    const doc = c.insertOne({ name: 'Test' });
    expect(doc!.role).toBe('user');
  });

  test('schema validates enum', () => {
    const db = createTestDB();
    const c = db.createCollection('users', {
      schema: { role: { type: String, enum: ['admin', 'user'] } },
    });
    expect(() => c.insertOne({ role: 'invalid' })).toThrow();
  });

  test('schema validates minLength/maxLength', () => {
    const db = createTestDB();
    const c = db.createCollection('users', {
      schema: { name: { type: String, minLength: 2, maxLength: 10 } },
    });
    expect(() => c.insertOne({ name: 'A' })).toThrow();
  });

  test('capped collection limits size', () => {
    const db = createTestDB();
    const c = db.createCollection('logs', {
      schema: {},
      capped: true,
      max: 3,
    });
    c.insertMany([{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }]);
    expect(c.count()).toBe(3);
    expect(c.first()!.n).toBe(3);
  });
});
