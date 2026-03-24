import { describe, test, expect } from 'vitest';
import { StateDB } from '../src/index';

let _dbCounter = 0;
function createTestDB() {
  return new StateDB('test_qo_' + ++_dbCounter);
}

describe('Phase 4: Query Operators', () => {
  test('$eq operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ age: 25 }, { age: 30 }, { age: 35 }]);
    expect(c.count({ age: { $eq: 30 } })).toBe(1);
  });

  test('$ne operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ age: 25 }, { age: 30 }, { age: 35 }]);
    expect(c.count({ age: { $ne: 30 } })).toBe(2);
  });

  test('$gt, $gte, $lt, $lte operators', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ n: 1 }, { n: 2 }, { n: 3 }, { n: 4 }, { n: 5 }]);
    expect(c.count({ n: { $gt: 3 } })).toBe(2);
    expect(c.count({ n: { $gte: 3 } })).toBe(3);
    expect(c.count({ n: { $lt: 3 } })).toBe(2);
    expect(c.count({ n: { $lte: 3 } })).toBe(3);
  });

  test('$in and $nin operators', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ s: 'a' }, { s: 'b' }, { s: 'c' }]);
    expect(c.count({ s: { $in: ['a', 'c'] } })).toBe(2);
    expect(c.count({ s: { $nin: ['a'] } })).toBe(2);
  });

  test('$and operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ a: 1, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 1 }]);
    expect(c.count({ $and: [{ a: 1 }, { b: 1 }] })).toBe(1);
  });

  test('$or operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ x: 1 }, { x: 2 }, { x: 3 }]);
    expect(c.count({ $or: [{ x: 1 }, { x: 3 }] })).toBe(2);
  });

  test('$not operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ active: true }, { active: false }]);
    expect(c.count({ $not: { active: true } })).toBe(1);
  });

  test('$exists operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ name: 'A' }, { name: 'B', email: 'b@test' }]);
    expect(c.count({ email: { $exists: true } })).toBe(1);
    expect(c.count({ email: { $exists: false } })).toBe(1);
  });

  test('$type operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ v: 123 }, { v: 'str' }, { v: true }]);
    expect(c.count({ v: { $type: 'number' } })).toBe(1);
    expect(c.count({ v: { $type: 'string' } })).toBe(1);
  });

  test('$regex operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ name: 'Omar' }, { name: 'Ali' }, { name: 'Oscar' }]);
    expect(c.count({ name: { $regex: /^O/i } })).toBe(2);
  });

  test('$all operator (array)', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ tags: ['a', 'b', 'c'] }, { tags: ['a', 'b'] }, { tags: ['b', 'c'] }]);
    expect(c.count({ tags: { $all: ['a', 'b'] } })).toBe(2);
  });

  test('$size operator (array)', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ arr: [1] }, { arr: [1, 2] }, { arr: [1, 2, 3] }]);
    expect(c.count({ arr: { $size: 2 } })).toBe(1);
  });
});
