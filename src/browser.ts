import { StateDB } from './StateDB';
import { Collection } from './Collection';
import { QueryResult } from './operations/find';
import { Query } from './Query';
import { Index } from './DbIndex';
import { Schema } from './Schema';
import { Watcher } from './Watcher';

// Attach all exports as static properties for IIFE access:
//   new StateDB(...)           — main class
//   StateDB.Collection         — also available
//   StateDB.Query, etc.
const SDB = StateDB as typeof StateDB & {
  Collection: typeof Collection;
  QueryResult: typeof QueryResult;
  Query: typeof Query;
  Index: typeof Index;
  Schema: typeof Schema;
  Watcher: typeof Watcher;
};

SDB.Collection = Collection;
SDB.QueryResult = QueryResult;
SDB.Query = Query;
SDB.Index = Index;
SDB.Schema = Schema;
SDB.Watcher = Watcher;

export default SDB;
