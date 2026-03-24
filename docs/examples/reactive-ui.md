# Reactive UI Patterns

StateDB's watcher system makes it easy to build reactive UIs without a framework. Here are common patterns.

## The Core Pattern

```ts
const db = new StateDB('app');
const collection = db.createCollection('items');

// 1. Define how to render
function render() {
  const data = collection.find().toArray();
  // ...update the DOM
}

// 2. Watch for changes
collection.watch(() => render());

// 3. Initial render
render();

// 4. Any mutation now auto-renders
collection.insertOne({ ... }); // triggers render()
```

## Live Counter

```html
<div>
  <span id="count">0</span> users
  <button onclick="addUser()">Add User</button>
</div>

<script>
  var db = new StateDB('counter');
  var users = db.createCollection('users');

  users.watch(function() {
    document.getElementById('count').textContent = users.count();
  });

  function addUser() {
    users.insertOne({ name: 'User ' + (users.count() + 1) });
  }
</script>
```

## Filtered List

```html
<div>
  <button onclick="setFilter('all')">All</button>
  <button onclick="setFilter('active')">Active</button>
  <button onclick="setFilter('done')">Done</button>
  <ul id="list"></ul>
</div>

<script>
  var db = new StateDB('filters');
  var tasks = db.createCollection('tasks');
  var currentFilter = 'all';

  tasks.watch(function() { render(); });

  function setFilter(f) {
    currentFilter = f;
    render();
  }

  function render() {
    var query = {};
    if (currentFilter === 'active') query = { done: false };
    if (currentFilter === 'done') query = { done: true };

    var items = tasks.find(query).sort({ __inc: -1 }).toArray();
    var list = document.getElementById('list');
    list.textContent = '';

    items.forEach(function(t) {
      var li = document.createElement('li');
      li.textContent = t.text + (t.done ? ' (done)' : '');
      list.appendChild(li);
    });
  }

  // Seed
  tasks.insertMany([
    { text: 'Task 1', done: true },
    { text: 'Task 2', done: false },
    { text: 'Task 3', done: false },
  ]);
  render();
</script>
```

## Live Search

```html
<input type="text" id="search" placeholder="Search users..." oninput="render()">
<ul id="results"></ul>

<script>
  var db = new StateDB('search');
  var users = db.createCollection('users');

  users.insertMany([
    { name: 'Omar Hamdan', email: 'omar@test.com' },
    { name: 'Ali Hassan', email: 'ali@test.com' },
    { name: 'Sara Ahmed', email: 'sara@test.com' },
  ]);

  function render() {
    var term = document.getElementById('search').value.trim();
    var query = term ? { name: { $regex: new RegExp(term, 'i') } } : {};
    var items = users.find(query).toArray();

    var list = document.getElementById('results');
    list.textContent = '';
    items.forEach(function(u) {
      var li = document.createElement('li');
      li.textContent = u.name + ' (' + u.email + ')';
      list.appendChild(li);
    });
  }

  render();
</script>
```

## Dashboard Stats

```html
<div id="stats"></div>

<script>
  var db = new StateDB('dashboard');
  var orders = db.createCollection('orders');

  orders.watch(function() {
    var total = orders.count();
    var pending = orders.count({ status: 'pending' });
    var shipped = orders.count({ status: 'shipped' });
    var delivered = orders.count({ status: 'delivered' });

    document.getElementById('stats').textContent =
      'Total: ' + total +
      ' | Pending: ' + pending +
      ' | Shipped: ' + shipped +
      ' | Delivered: ' + delivered;
  });

  // Simulate data
  orders.insertMany([
    { item: 'Widget A', status: 'delivered' },
    { item: 'Widget B', status: 'shipped' },
    { item: 'Widget C', status: 'pending' },
    { item: 'Widget D', status: 'pending' },
  ]);
</script>
```

## Sorted Table

```html
<table>
  <thead>
    <tr>
      <th onclick="sortBy('name')">Name</th>
      <th onclick="sortBy('age')">Age</th>
      <th onclick="sortBy('role')">Role</th>
    </tr>
  </thead>
  <tbody id="tbody"></tbody>
</table>

<script>
  var db = new StateDB('table');
  var users = db.createCollection('users');
  var sortField = 'name';
  var sortDir = 1;

  users.watch(function() { render(); });

  function sortBy(field) {
    if (sortField === field) {
      sortDir = sortDir * -1;
    } else {
      sortField = field;
      sortDir = 1;
    }
    render();
  }

  function render() {
    var spec = {};
    spec[sortField] = sortDir;
    var items = users.find().sort(spec).toArray();
    var tbody = document.getElementById('tbody');
    tbody.textContent = '';

    items.forEach(function(u) {
      var tr = document.createElement('tr');
      ['name', 'age', 'role'].forEach(function(f) {
        var td = document.createElement('td');
        td.textContent = u[f];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  users.insertMany([
    { name: 'Omar', age: 30, role: 'admin' },
    { name: 'Ali', age: 25, role: 'user' },
    { name: 'Sara', age: 28, role: 'admin' },
    { name: 'Noor', age: 22, role: 'user' },
  ]);
  render();
</script>
```

## Multiple Collections

Watchers are per-collection. You can watch multiple collections independently:

```ts
var db = new StateDB('multi');
var users = db.createCollection('users');
var messages = db.createCollection('messages');

users.watch(function() { renderUserList(); });
messages.watch(function() { renderMessages(); });

// Inserting a user only triggers renderUserList
users.insertOne({ name: 'Omar' });

// Inserting a message only triggers renderMessages
messages.insertOne({ text: 'Hello' });
```
