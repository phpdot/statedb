import { StateDB } from '../src/index';

// ==================== Helpers ====================

function measure(fn: () => void, warmup = 3): number {
  // Warmup runs (let JIT optimize)
  for (let i = 0; i < warmup; i++) fn();
  // Actual measurement — best of 5
  let best = Infinity;
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    fn();
    const ms = performance.now() - start;
    if (ms < best) best = ms;
  }
  return best;
}

function measureOnce(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

function fmt(ms: number): string {
  return ms < 1 ? `${(ms * 1000).toFixed(0)}us` : `${ms.toFixed(2)}ms`;
}

function fmtOps(count: number, ms: number): string {
  if (ms === 0) return '-';
  return Math.round((count / ms) * 1000).toLocaleString() + ' ops/s';
}

function header(title: string) {
  console.log(`\n${'='.repeat(62)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(62));
}

function row(label: string, ms: number, ops?: string) {
  const line = `  ${label.padEnd(36)} ${fmt(ms).padStart(10)}`;
  console.log(ops ? `${line}  ${ops.padStart(14)}` : line);
}

// ==================== Data ====================

function makeDocs(n: number) {
  const docs = [];
  for (let i = 0; i < n; i++) {
    docs.push({
      name: 'User ' + i,
      email: 'user' + i + '@test.com',
      age: 18 + (i % 60),
      role: i % 5 === 0 ? 'admin' : 'user',
      active: i % 3 !== 0,
      score: Math.round(Math.random() * 1000),
      tags: ['tag' + (i % 10), 'tag' + (i % 20)],
      address: {
        city: ['Dubai', 'Cairo', 'London', 'Berlin', 'Tokyo'][i % 5],
        zip: String(10000 + i),
      },
    });
  }
  return docs;
}

function freshDB(name: string, n: number) {
  const db = new StateDB(name);
  const col = db.createCollection('c');
  col.insertMany(makeDocs(n));
  return { db, col };
}

// ==================== Benchmarks ====================

const N = 10_000;

console.log('\n  StateDB Benchmark');
console.log('  ' + new Date().toISOString());
console.log(`  Node ${process.version} | ${N.toLocaleString()} documents\n`);

// ---- INSERT ----
header('INSERT');

for (const size of [1_000, 10_000, 100_000]) {
  const docs = makeDocs(size);

  // insertOne — fresh collection each run, measured once (can't reuse)
  const db1 = new StateDB('ins1');
  const col1 = db1.createCollection('c');
  const msOne = measureOnce(() => {
    for (let i = 0; i < docs.length; i++) col1.insertOne(docs[i]);
  });
  row(`insertOne x${size.toLocaleString()}`, msOne, fmtOps(size, msOne));
  db1.drop();

  // insertMany — fresh collection, single call, measured once
  const db2 = new StateDB('ins2');
  const col2 = db2.createCollection('c');
  const msMany = measureOnce(() => {
    col2.insertMany(docs);
  });
  row(`insertMany x${size.toLocaleString()}`, msMany, fmtOps(size, msMany));
  db2.drop();
}

// ---- FIND ----
header(`FIND (${N.toLocaleString()} docs)`);

{
  const { db, col } = freshDB('find', N);
  const IT = 1_000;

  const msFindAll = measure(() => {
    for (let i = 0; i < IT; i++) col.find().toArray();
  });
  row('find({}).toArray()', msFindAll, fmtOps(IT, msFindAll));

  const msExact = measure(() => {
    for (let i = 0; i < IT; i++) col.find({ role: 'admin' }).toArray();
  });
  row('find({ role: "admin" })', msExact, fmtOps(IT, msExact));

  const msGt = measure(() => {
    for (let i = 0; i < IT; i++) col.find({ age: { $gt: 40 } }).toArray();
  });
  row('find({ age: { $gt: 40 } })', msGt, fmtOps(IT, msGt));

  const msIn = measure(() => {
    for (let i = 0; i < IT; i++) col.find({ city: { $in: ['Dubai', 'Cairo'] } }).toArray();
  });
  row('find({ city: { $in: [...] } })', msIn, '');

  const msAnd = measure(() => {
    for (let i = 0; i < IT; i++) {
      col.find({ $and: [{ role: 'admin' }, { $or: [{ active: true }, { age: { $lt: 30 } }] }] }).toArray();
    }
  });
  row('find({ $and + $or })', msAnd, fmtOps(IT, msAnd));

  const msDot = measure(() => {
    for (let i = 0; i < IT; i++) col.find({ 'address.city': 'Dubai' }).toArray();
  });
  row('find({ "address.city" })', msDot, fmtOps(IT, msDot));

  const msChain = measure(() => {
    for (let i = 0; i < IT; i++) {
      col.find({ active: true }).sort({ age: -1 }).skip(10).limit(20).toArray();
    }
  });
  row('find().sort().skip().limit()', msChain, fmtOps(IT, msChain));

  db.drop();
}

// ---- FIND ONE ----
header(`FIND ONE (${N.toLocaleString()} docs)`);

{
  const { db, col } = freshDB('findone', N);
  const IT = 5_000;

  const msPrimary = measure(() => {
    for (let i = 0; i < IT; i++) col.findOne({ __inc: (i % N) + 1 });
  });
  row('findOne({ __inc }) primary key', msPrimary, fmtOps(IT, msPrimary));

  const msScan = measure(() => {
    for (let i = 0; i < IT; i++) col.findOne({ email: 'user' + (i % N) + '@test.com' });
  });
  row('findOne({ email }) full scan', msScan, fmtOps(IT, msScan));

  col.createIndex('email', { unique: true });

  const msIdx = measure(() => {
    for (let i = 0; i < IT; i++) col.findOne({ email: 'user' + (i % N) + '@test.com' });
  });
  row('findOne({ email }) indexed', msIdx, fmtOps(IT, msIdx));

  const speedup = msScan / msIdx;
  console.log(`  ${'Index speedup'.padEnd(36)} ${(speedup.toFixed(1) + 'x').padStart(10)}`);

  col.createIndex({ 'address.city': 1, role: 1 });
  const msCompound = measure(() => {
    for (let i = 0; i < IT; i++) col.findOne({ 'address.city': 'Dubai', role: 'admin' });
  });
  row('findOne (compound index)', msCompound, fmtOps(IT, msCompound));

  db.drop();
}

// ---- UPDATE ----
header(`UPDATE (${N.toLocaleString()} docs)`);

{
  const { db, col } = freshDB('upd', N);
  const IT = 1_000;

  const msSet = measure(() => {
    for (let i = 0; i < IT; i++) {
      col.updateOne({ __inc: (i % N) + 1 }, { $set: { score: i } });
    }
  });
  row('updateOne({ __inc }, $set)', msSet, fmtOps(IT, msSet));

  const msInc = measure(() => {
    for (let i = 0; i < IT; i++) {
      col.updateOne({ __inc: (i % N) + 1 }, { $inc: { score: 1 } });
    }
  });
  row('updateOne({ __inc }, $inc)', msInc, fmtOps(IT, msInc));

  // updateMany — runs 10 times (each touches ~2000 admins)
  const msMany = measure(() => {
    for (let i = 0; i < 10; i++) {
      col.updateMany({ role: 'admin' }, { $set: { active: i % 2 === 0 } });
    }
  });
  row('updateMany x10 (~2k docs each)', msMany, fmtOps(10, msMany));

  db.drop();
}

// ---- DELETE ----
header(`DELETE`);

{
  // deleteOne — delete all 5k docs one by one
  const SIZE = 5_000;
  const { db: db1, col: col1 } = freshDB('del1', SIZE);
  const msOne = measureOnce(() => {
    for (let i = 1; i <= SIZE; i++) col1.deleteOne({ __inc: i });
  });
  row(`deleteOne x${SIZE.toLocaleString()} (one by one)`, msOne, fmtOps(SIZE, msOne));
  db1.drop();

  // deleteMany — single call
  const { db: db2, col: col2 } = freshDB('del2', SIZE);
  const matchCount = col2.count({ role: 'user' });
  const msMany = measureOnce(() => {
    col2.deleteMany({ role: 'user' });
  });
  row(`deleteMany (${matchCount.toLocaleString()} matched)`, msMany);
  db2.drop();
}

// ---- WATCHERS ----
header(`WATCHERS`);

{
  const SIZE = 5_000;
  const db = new StateDB('watch');
  const col = db.createCollection('c');
  const docs = makeDocs(SIZE);

  // 1 watcher
  let events = 0;
  col.watch(() => { events++; });

  const ms1 = measureOnce(() => {
    for (let i = 0; i < docs.length; i++) col.insertOne(docs[i]);
  });
  row(`insertOne x${SIZE.toLocaleString()} + 1 watcher`, ms1, `${events.toLocaleString()} events`);

  // 10 watchers
  events = 0;
  for (let w = 0; w < 9; w++) col.watch(() => { events++; });
  const IT = 1_000;
  const ms10 = measureOnce(() => {
    for (let i = 0; i < IT; i++) {
      col.updateOne({ __inc: (i % SIZE) + 1 }, { $inc: { score: 1 } });
    }
  });
  row(`updateOne x${IT.toLocaleString()} + 10 watchers`, ms10, `${events.toLocaleString()} events`);

  db.drop();
}

// ---- SCHEMA ----
header(`SCHEMA VALIDATION (${N.toLocaleString()} docs)`);

{
  const docs = [];
  for (let i = 0; i < N; i++) {
    docs.push({ name: 'User ' + i, email: 'u' + i + '@t.com', age: 20 + (i % 50), role: i % 5 === 0 ? 'admin' : 'user' });
  }

  const db1 = new StateDB('schema_no');
  const plain = db1.createCollection('c');
  const msNo = measureOnce(() => {
    for (let i = 0; i < docs.length; i++) plain.insertOne(docs[i]);
  });
  row('insertOne (no schema)', msNo, fmtOps(N, msNo));
  db1.drop();

  const db2 = new StateDB('schema_yes');
  const validated = db2.createCollection('c', {
    schema: {
      name: { type: String, required: true, minLength: 1 },
      email: { type: String, required: true },
      age: { type: Number, min: 0, max: 150 },
      role: { type: String, enum: ['admin', 'user'] },
    },
  });
  const msWith = measureOnce(() => {
    for (let i = 0; i < docs.length; i++) validated.insertOne(docs[i]);
  });
  row('insertOne (with schema)', msWith, fmtOps(N, msWith));

  console.log(`  ${'Schema overhead'.padEnd(36)} ${((msWith / msNo).toFixed(2) + 'x').padStart(10)}`);

  db2.drop();
}

console.log('\n' + '='.repeat(62));
console.log('  Done.');
console.log('='.repeat(62) + '\n');
