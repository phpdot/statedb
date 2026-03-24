import { describe, test, expect } from 'vitest';
import { StateDB } from '../src/index';

let _dbCounter = 0;
function createTestDB() {
  return new StateDB('test_uo_' + ++_dbCounter);
}

describe('Phase 5: Update Operators', () => {
  test('$set operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'Test' });
    c.updateOne({ name: 'Test' }, { $set: { name: 'Updated', age: 25 } });
    const doc = c.first()!;
    expect(doc.name).toBe('Updated');
    expect(doc.age).toBe(25);
  });

  test('$unset operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'Test', temp: 'value' });
    c.updateOne({ name: 'Test' }, { $unset: { temp: '' } });
    expect(c.first()!.temp).toBeUndefined();
  });

  test('$inc operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ count: 10 });
    c.updateOne({ __inc: 1 }, { $inc: { count: 5 } });
    expect(c.first()!.count).toBe(15);
  });

  test('$min and $max operators', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ low: 10, high: 10 });
    c.updateOne({ __inc: 1 }, { $min: { low: 5 }, $max: { high: 15 } });
    const doc = c.first()!;
    expect(doc.low).toBe(5);
    expect(doc.high).toBe(15);
  });

  test('$mul operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ price: 100 });
    c.updateOne({ __inc: 1 }, { $mul: { price: 2 } });
    expect(c.first()!.price).toBe(200);
  });

  test('$push operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ tags: ['a'] });
    c.updateOne({ __inc: 1 }, { $push: { tags: 'b' } });
    expect(c.first()!.tags).toEqual(['a', 'b']);
  });

  test('$push with $each and $position', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ arr: ['a', 'b'] });
    c.updateOne({ __inc: 1 }, { $push: { arr: { $each: ['x', 'y'], $position: 1 } } });
    expect(c.first()!.arr).toEqual(['a', 'x', 'y', 'b']);
  });

  test('$addToSet operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ tags: ['a', 'b'] });
    c.updateOne({ __inc: 1 }, { $addToSet: { tags: 'b' } }); // duplicate
    c.updateOne({ __inc: 1 }, { $addToSet: { tags: 'c' } }); // new
    expect(c.first()!.tags).toEqual(['a', 'b', 'c']);
  });

  test('$pull operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ tags: ['a', 'b', 'c'] });
    c.updateOne({ __inc: 1 }, { $pull: { tags: 'b' } });
    expect(c.first()!.tags).toEqual(['a', 'c']);
  });

  test('$pop operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ arr: [1, 2, 3] });
    c.updateOne({ __inc: 1 }, { $pop: { arr: 1 } }); // remove last
    expect(c.first()!.arr).toEqual([1, 2]);
    c.updateOne({ __inc: 1 }, { $pop: { arr: -1 } }); // remove first
    expect(c.first()!.arr).toEqual([2]);
  });
});
