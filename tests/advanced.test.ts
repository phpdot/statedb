import { describe, test, expect } from 'vitest';
import { StateDB } from '../src/index';

let _dbCounter = 0;
function createTestDB() {
  return new StateDB('test_adv_' + ++_dbCounter);
}

describe('Phase 10: Dot Notation', () => {
  test('find with dot notation', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ address: { city: 'Dubai', country: 'UAE' } });
    c.insertOne({ address: { city: 'Cairo', country: 'Egypt' } });
    const result = c.find({ 'address.city': 'Dubai' }).toArray();
    expect(result.length).toBe(1);
    expect((result[0].address as Record<string, unknown>).city).toBe('Dubai');
  });

  test('$set with dot notation', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ address: { city: 'Dubai' } });
    c.updateOne({ __inc: 1 }, { $set: { 'address.zip': '12345' } });
    expect((c.first()!.address as Record<string, unknown>).zip).toBe('12345');
  });
});

describe('Middleware/Hooks', () => {
  test('pre-insert hook modifies document', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.pre('insert', (doc: Record<string, unknown>) => {
      doc.createdAt = 'timestamp';
    });
    const result = c.insertOne({ name: 'Test' });
    expect(result!.createdAt).toBe('timestamp');
  });

  test('post-insert hook receives document', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    let received: Record<string, unknown> | null = null;
    c.post('insert', (doc: unknown) => {
      received = doc as Record<string, unknown>;
    });
    c.insertOne({ name: 'Test' });
    expect(received).not.toBeNull();
    expect(received!.name).toBe('Test');
    expect(received!.__inc).toBe(1);
  });

  test('pre-insert hook can abort operation', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.pre('insert', () => false);
    const result = c.insertOne({ name: 'Test' });
    expect(result).toBeNull();
    expect(c.count()).toBe(0);
  });

  test('pre-update hook receives query and update', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'Test' });
    let receivedQuery: unknown = null;
    let receivedUpdate: unknown = null;
    c.pre('update', (query: unknown, update: unknown) => {
      receivedQuery = query;
      receivedUpdate = update;
    });
    c.updateOne({ name: 'Test' }, { $set: { age: 30 } });
    expect(receivedQuery).toEqual({ name: 'Test' });
    expect((receivedUpdate as Record<string, unknown>).$set).toEqual({ age: 30 });
  });

  test('post-update hook receives result', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'Test' });
    let receivedResult: Record<string, unknown> | null = null;
    c.post('update', (result: unknown) => {
      receivedResult = result as Record<string, unknown>;
    });
    c.updateOne({ name: 'Test' }, { $set: { age: 30 } });
    expect(receivedResult!.matchedCount).toBe(1);
    expect(receivedResult!.modifiedCount).toBe(1);
  });

  test('pre-delete hook can abort', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'Test' });
    c.pre('delete', () => false);
    c.deleteOne({ name: 'Test' });
    expect(c.count()).toBe(1);
  });

  test('post-delete hook receives result', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'Test' });
    let receivedResult: Record<string, unknown> | null = null;
    c.post('delete', (result: unknown) => {
      receivedResult = result as Record<string, unknown>;
    });
    c.deleteOne({ name: 'Test' });
    expect(receivedResult!.deletedCount).toBe(1);
  });

  test('multiple hooks run in order', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    const order: number[] = [];
    c.pre('insert', () => { order.push(1); });
    c.pre('insert', () => { order.push(2); });
    c.post('insert', () => { order.push(3); });
    c.post('insert', () => { order.push(4); });
    c.insertOne({ name: 'Test' });
    expect(order).toEqual([1, 2, 3, 4]);
  });

  test('removePre removes hook', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    let called = false;
    const hook = () => { called = true; };
    c.pre('insert', hook);
    c.removePre('insert', hook);
    c.insertOne({ name: 'Test' });
    expect(called).toBe(false);
  });

  test('removePre without callback removes all', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    let count = 0;
    c.pre('insert', () => { count++; });
    c.pre('insert', () => { count++; });
    c.removePre('insert');
    c.insertOne({ name: 'Test' });
    expect(count).toBe(0);
  });

  test('auto-timestamp with hooks', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.pre('insert', (doc: Record<string, unknown>) => {
      doc.createdAt = new Date();
      doc.updatedAt = new Date();
    });
    c.pre('update', (_query: unknown, update: Record<string, unknown>) => {
      update.$set = (update.$set as Record<string, unknown>) || {};
      (update.$set as Record<string, unknown>).updatedAt = new Date();
    });
    const doc = c.insertOne({ name: 'Test' });
    expect(doc!.createdAt).toBeInstanceOf(Date);
    c.updateOne({ __inc: 1 }, { $set: { name: 'Updated' } });
    const updated = c.findOne({ __inc: 1 });
    expect(updated!.updatedAt).toBeInstanceOf(Date);
  });
});

describe('Projection', () => {
  test('projection include mode', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'Omar', email: 'omar@test', password: 'secret', age: 30 });
    const result = c.find({}, { name: 1, email: 1 }).toArray();
    expect(result[0].name).toBe('Omar');
    expect(result[0].email).toBe('omar@test');
    expect(result[0].password).toBeUndefined();
    expect(result[0].age).toBeUndefined();
    expect(result[0].__inc).toBe(1);
  });

  test('projection exclude mode', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'Omar', email: 'omar@test', password: 'secret' });
    const result = c.find({}, { password: 0 }).toArray();
    expect(result[0].name).toBe('Omar');
    expect(result[0].email).toBe('omar@test');
    expect(result[0].password).toBeUndefined();
  });

  test('projection with dot notation', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertOne({ name: 'Omar', address: { city: 'Dubai', country: 'UAE', zip: '12345' } });

    const r1 = c.find({}, { name: 1, 'address.city': 1 }).toArray();
    expect(r1[0].name).toBe('Omar');
    expect((r1[0].address as Record<string, unknown>).city).toBe('Dubai');
    expect((r1[0].address as Record<string, unknown>).country).toBeUndefined();

    const r2 = c.find({}, { 'address.zip': 0 }).toArray();
    expect((r2[0].address as Record<string, unknown>).city).toBe('Dubai');
    expect((r2[0].address as Record<string, unknown>).zip).toBeUndefined();
  });

  test('projection with chaining', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ name: 'A', age: 30 }, { name: 'B', age: 25 }, { name: 'C', age: 35 }]);
    const result = c.find().sort({ age: -1 }).limit(2).project({ name: 1 }).toArray();
    expect(result).toEqual([{ __inc: 3, name: 'C' }, { __inc: 1, name: 'A' }]);
  });
});

describe('Explain', () => {
  test('explain shows COLLSCAN without index', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ x: 1 }, { x: 2 }, { x: 3 }]);
    const explain = c.find({ x: 2 }).explain();
    expect(explain.queryPlanner.winningPlan.stage).toBe('COLLSCAN');
    expect(explain.executionStats.indexUsed).toBe(false);
    expect(explain.executionStats.totalDocsExamined).toBe(3);
  });

  test('explain shows IXSCAN with index', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.createIndex({ x: 1 });
    c.insertMany([{ x: 1 }, { x: 2 }, { x: 3 }]);
    const explain = c.find({ x: 2 }).explain();
    expect(explain.queryPlanner.winningPlan.stage).toBe('FETCH');
    expect(explain.queryPlanner.winningPlan.inputStage!.stage).toBe('IXSCAN');
    expect(explain.executionStats.indexUsed).toBe(true);
    expect(explain.executionStats.indexName).toBe('x');
    expect(explain.executionStats.nReturned).toBe(1);
  });

  test('explain shows execution time', () => {
    const db = createTestDB();
    const c = db.createCollection('c');
    c.insertMany([{ x: 1 }, { x: 2 }]);
    const explain = c.find({ x: 1 }).explain();
    expect(typeof explain.executionStats.executionTimeMs).toBe('number');
  });
});
