import { describe, test, expect } from 'vitest';
import { StateDB } from '../src/index';

let _dbCounter = 0;
function createTestDB() {
  return new StateDB('test_ec_' + ++_dbCounter);
}

describe('Edge Cases: Insert', () => {
  test('insertOne rejects non-object', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    expect(() => c.insertOne('string' as never)).toThrow();
  });

  test('insertOne rejects array', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    expect(() => c.insertOne([1, 2, 3] as never)).toThrow();
  });

  test('insertMany rejects non-array', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    expect(() => c.insertMany({ a: 1 } as never)).toThrow();
  });

  test('__inc is always unique and incrementing', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{}, {}, {}]);
    c.deleteOne({ __inc: 2 });
    const doc = c.insertOne({});
    expect(doc!.__inc).toBe(4);
  });
});

describe('Edge Cases: Find', () => {
  test('findOne returns null when not found', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    expect(c.findOne({ x: 999 })).toBeNull();
  });

  test('find returns empty array when not found', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    expect(c.find({ x: 999 }).toArray()).toEqual([]);
  });

  test('first/last return null on empty collection', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    expect(c.first()).toBeNull();
    expect(c.last()).toBeNull();
  });

  test('sort handles missing fields', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ a: 3 }, { a: 1, b: 2 }, { b: 1 }]);
    const sorted = c.find().sort({ a: 1 }).toArray();
    expect(sorted.length).toBe(3);
  });

  test('combined skip and limit edge cases', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ n: 1 }, { n: 2 }, { n: 3 }]);
    expect(c.find().skip(10).toArray()).toEqual([]);
    expect(c.find().limit(0).toArray()).toEqual([]);
    expect(c.find().skip(1).limit(100).toArray().length).toBe(2);
  });
});

describe('Edge Cases: Update', () => {
  test('updateOne on non-existent returns zero', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    const result = c.updateOne({ x: 999 }, { y: 1 });
    expect(result.matchedCount).toBe(0);
  });

  test('$inc on non-existent field starts from 0', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'test' });
    c.updateOne({ name: 'test' }, { $inc: { count: 5 } });
    expect(c.first()!.count).toBe(5);
  });

  test('$push on non-existent field creates array', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'test' });
    c.updateOne({ name: 'test' }, { $push: { tags: 'new' } });
    expect(c.first()!.tags).toEqual(['new']);
  });

  test('$pull with no matches does nothing', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ tags: ['a', 'b'] });
    c.updateOne({ __inc: 1 }, { $pull: { tags: 'z' } });
    expect(c.first()!.tags).toEqual(['a', 'b']);
  });

  test('$addToSet with $each', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ tags: ['a'] });
    c.updateOne({ __inc: 1 }, { $addToSet: { tags: { $each: ['a', 'b', 'c'] } } });
    expect(c.first()!.tags).toEqual(['a', 'b', 'c']);
  });

  test('$rename field', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ oldName: 'value' });
    c.updateOne({ __inc: 1 }, { $rename: { oldName: 'newName' } });
    const doc = c.first()!;
    expect(doc.oldName).toBeUndefined();
    expect(doc.newName).toBe('value');
  });

  test('$currentDate sets date', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'test' });
    c.updateOne({ __inc: 1 }, { $currentDate: { updatedAt: true } });
    const doc = c.first()!;
    expect(doc.updatedAt).toBeInstanceOf(Date);
  });
});

describe('Edge Cases: Delete', () => {
  test('deleteOne on non-existent returns zero', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    const result = c.deleteOne({ x: 999 });
    expect(result.deletedCount).toBe(0);
  });

  test('deleteMany with empty query deletes all', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ a: 1 }, { a: 2 }]);
    c.deleteMany({});
    expect(c.count()).toBe(0);
  });
});

describe('Edge Cases: Query Operators', () => {
  test('$gt/$lt with null values', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ v: null }, { v: 5 }, { v: 10 }]);
    expect(c.count({ v: { $gt: 3 } })).toBe(2);
  });

  test('$in with empty array', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ x: 1 });
    expect(c.count({ x: { $in: [] } })).toBe(0);
  });

  test('$elemMatch with operators', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ scores: [10, 20, 30] }, { scores: [5, 15, 25] }]);
    expect(c.count({ scores: { $elemMatch: { $gte: 25 } } })).toBe(2);
  });

  test('nested $and/$or', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([
      { a: 1, b: 1, c: 1 },
      { a: 1, b: 2, c: 1 },
      { a: 2, b: 1, c: 2 },
    ]);
    const count = c.count({
      $and: [{ a: 1 }, { $or: [{ b: 1 }, { c: 1 }] }],
    });
    expect(count).toBe(2);
  });

  test('$nor operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ x: 1 }, { x: 2 }, { x: 3 }]);
    expect(c.count({ $nor: [{ x: 1 }, { x: 2 }] })).toBe(1);
  });
});

describe('Edge Cases: Indexes', () => {
  test('index maintained after updates', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ email: 1 }, { unique: true });
    c.insertOne({ email: 'a@test' });
    c.updateOne({ email: 'a@test' }, { $set: { email: 'b@test' } });
    c.insertOne({ email: 'a@test' });
    expect(c.count()).toBe(2);
  });

  test('index maintained after deletes', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ email: 1 }, { unique: true });
    c.insertOne({ email: 'test@test' });
    c.deleteOne({ email: 'test@test' });
    c.insertOne({ email: 'test@test' });
    expect(c.count()).toBe(1);
  });

  test('compound index works', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ country: 1, city: 1 });
    c.insertMany([
      { country: 'UAE', city: 'Dubai' },
      { country: 'UAE', city: 'Abu Dhabi' },
      { country: 'Egypt', city: 'Cairo' },
    ]);
    const result = c.find({ country: 'UAE', city: 'Dubai' }).toArray();
    expect(result.length).toBe(1);
  });

  test('index actually used for lookups (verifies internal state)', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ status: 1 });
    c.insertMany([
      { status: 'active', name: 'A' },
      { status: 'active', name: 'B' },
      { status: 'inactive', name: 'C' },
    ]);
    const index = c._indexes['status'];
    expect(index).toBeDefined();
    expect(index.map.size).toBe(2);
    expect(index.get('active').size).toBe(2);
    expect(index.get('inactive').size).toBe(1);
  });

  test('index returns correct results for non-unique values', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ category: 1 });
    c.insertMany([
      { category: 'A', value: 1 },
      { category: 'A', value: 2 },
      { category: 'A', value: 3 },
      { category: 'B', value: 4 },
    ]);
    const results = c.find({ category: 'A' }).toArray();
    expect(results.length).toBe(3);
    expect(results.map((r) => r.value).sort()).toEqual([1, 2, 3]);
  });

  test('index with $eq operator', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ type: 1 });
    c.insertMany([{ type: 'x' }, { type: 'y' }, { type: 'x' }]);
    const results = c.find({ type: { $eq: 'x' } }).toArray();
    expect(results.length).toBe(2);
  });

  test('index not used for $gt/$lt queries (full scan)', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ age: 1 });
    c.insertMany([{ age: 20 }, { age: 30 }, { age: 40 }]);
    const results = c.find({ age: { $gt: 25 } }).toArray();
    expect(results.length).toBe(2);
  });

  test('index handles undefined values (not indexed)', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ email: 1 }, { unique: true });
    c.insertOne({ name: 'A' });
    c.insertOne({ name: 'B' });
    c.insertOne({ email: 'test@test', name: 'C' });
    expect(c.count()).toBe(3);
  });

  test('index rebuilt on collection drop', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ id: 1 }, { unique: true });
    c.insertOne({ id: 1 });
    c.drop();
    c.insertOne({ id: 1 });
    expect(c.count()).toBe(1);
  });

  test('findOne uses index', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ code: 1 });
    c.insertMany([
      { code: 'AAA', value: 1 },
      { code: 'BBB', value: 2 },
      { code: 'CCC', value: 3 },
    ]);
    const doc = c.findOne({ code: 'BBB' });
    expect(doc).not.toBeNull();
    expect(doc!.value).toBe(2);
  });

  test('compound index supports prefix matching', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ a: 1, b: 1 });
    c.insertMany([
      { a: 1, b: 1, v: 'one' },
      { a: 1, b: 2, v: 'two' },
      { a: 2, b: 1, v: 'three' },
    ]);

    const r1 = c.find({ a: 1, b: 1 });
    const e1 = r1.explain();
    expect(r1.toArray().length).toBe(1);
    expect(e1.executionStats.indexUsed).toBe(true);
    expect(e1.executionStats.indexFields).toEqual(['a', 'b']);

    const r2 = c.find({ a: 1 });
    const e2 = r2.explain();
    expect(r2.toArray().length).toBe(2);
    expect(e2.executionStats.indexUsed).toBe(true);
    expect(e2.executionStats.indexFields).toEqual(['a']);

    const r3 = c.find({ b: 1 });
    const e3 = r3.explain();
    expect(r3.toArray().length).toBe(2);
    expect(e3.executionStats.indexUsed).toBe(false);
  });

  test('multiple indexes on same collection', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ email: 1 }, { unique: true });
    c.createIndex({ username: 1 }, { unique: true });
    c.insertOne({ email: 'a@test', username: 'userA' });
    c.insertOne({ email: 'b@test', username: 'userB' });

    expect(c.findOne({ email: 'a@test' })!.username).toBe('userA');
    expect(c.findOne({ username: 'userB' })!.email).toBe('b@test');

    expect(() => c.insertOne({ email: 'a@test', username: 'userC' })).toThrow();
    expect(() => c.insertOne({ email: 'c@test', username: 'userA' })).toThrow();
  });

  test('index updated correctly on updateMany', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ status: 1 });
    c.insertMany([{ status: 'pending' }, { status: 'pending' }, { status: 'done' }]);
    c.updateMany({ status: 'pending' }, { $set: { status: 'processing' } });

    const index = c._indexes['status'];
    expect(index.get('pending').size).toBe(0);
    expect(index.get('processing').size).toBe(2);
    expect(index.get('done').size).toBe(1);

    expect(c.count({ status: 'pending' })).toBe(0);
    expect(c.count({ status: 'processing' })).toBe(2);
  });
});

describe('Edge Cases: Schema', () => {
  test('schema with function default', () => {
    let callCount = 0;
    const db = createTestDB();
    const c = db.createCollection('c', {
      schema: { id: { default: () => ++callCount } },
    });
    c.insertOne({});
    c.insertOne({});
    expect(c.findOne({ __inc: 1 })!.id).toBe(1);
    expect(c.findOne({ __inc: 2 })!.id).toBe(2);
  });

  test('schema min/max for numbers', () => {
    const db = createTestDB();
    const c = db.createCollection('c', {
      schema: { age: { type: Number, min: 0, max: 120 } },
    });
    expect(() => c.insertOne({ age: -5 })).toThrow();
    expect(() => c.insertOne({ age: 150 })).toThrow();
  });

  test('schema regex match', () => {
    const db = createTestDB();
    const c = db.createCollection('c', {
      schema: { email: { type: String, match: /^.+@.+\..+$/ } },
    });
    expect(() => c.insertOne({ email: 'invalid' })).toThrow();
    c.insertOne({ email: 'test@example.com' });
    expect(c.count()).toBe(1);
  });

  test('schema array of type', () => {
    const db = createTestDB();
    const c = db.createCollection('c', {
      schema: { tags: { type: Array, of: String } },
    });
    expect(() => c.insertOne({ tags: ['a', 123, 'b'] })).toThrow();
  });
});

describe('Edge Cases: Watchers', () => {
  test('multiple watchers all fire', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    let count1 = 0;
    let count2 = 0;
    c.watch(() => count1++);
    c.watch(() => count2++);
    c.insertOne({ x: 1 });
    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });

  test('watcher receives correct prevDocs on update', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ value: 'old' });
    let prevValue: unknown = null;
    c.watch((event, _docs, prev) => {
      if (event === 'update') prevValue = prev![0].value;
    });
    c.updateOne({ __inc: 1 }, { $set: { value: 'new' } });
    expect(prevValue).toBe('old');
  });

  test('watcher error does not break other watchers', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    let goodWatcherFired = false;
    c.watch(() => {
      throw new Error('bad watcher');
    });
    c.watch(() => {
      goodWatcherFired = true;
    });
    c.insertOne({ x: 1 });
    expect(goodWatcherFired).toBe(true);
  });
});

describe('Edge Cases: Deep Nested', () => {
  test('deeply nested dot notation query', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ a: { b: { c: { d: 'value' } } } });
    const doc = c.findOne({ 'a.b.c.d': 'value' });
    expect(doc).not.toBeNull();
  });

  test('deeply nested dot notation update', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ a: { b: { c: 1 } } });
    c.updateOne({ __inc: 1 }, { $set: { 'a.b.c': 'updated', 'a.b.d': 'new' } });
    const doc = c.first()!;
    expect((doc.a as Record<string, unknown> as Record<string, Record<string, unknown>>).b.c).toBe(
      'updated',
    );
    expect((doc.a as Record<string, unknown> as Record<string, Record<string, unknown>>).b.d).toBe(
      'new',
    );
  });
});

describe('Edge Cases: Data Types', () => {
  test('handles Date objects', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    const date = new Date('2024-01-01');
    c.insertOne({ date });
    const doc = c.first()!;
    expect(doc.date).toBeInstanceOf(Date);
  });

  test('handles boolean values', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ flag: true }, { flag: false }]);
    expect(c.count({ flag: true })).toBe(1);
    expect(c.count({ flag: false })).toBe(1);
  });

  test('handles null values', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ value: null });
    expect(c.count({ value: null })).toBe(1);
  });

  test('handles nested arrays', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ matrix: [[1, 2], [3, 4]] });
    const doc = c.first()!;
    expect(doc.matrix).toEqual([[1, 2], [3, 4]]);
  });
});
