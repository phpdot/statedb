# Examples

Four practical examples showing StateDB in action with vanilla JavaScript. All examples use safe DOM APIs (no `innerHTML`).

## 1. Todo App

A reactive todo list with add, toggle, and delete functionality.

```html
<div id="todo-app">
  <h2>Todos</h2>
  <form id="todo-form">
    <input type="text" id="todo-input" placeholder="What needs to be done?">
    <button type="submit">Add</button>
  </form>
  <ul id="todo-list"></ul>
  <p id="todo-count"></p>
</div>

<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
<script>
  var db = new StateDB('todos-app', { persistent: true });
  var todos = db.createCollection('todos');

  var form = document.getElementById('todo-form');
  var input = document.getElementById('todo-input');
  var list = document.getElementById('todo-list');
  var countEl = document.getElementById('todo-count');

  function render() {
    var items = todos.find().sort({ __inc: -1 }).toArray();
    var remaining = todos.count({ done: false });

    list.textContent = '';

    items.forEach(function(todo) {
      var li = document.createElement('li');
      li.style.cursor = 'pointer';

      var label = document.createElement('span');
      label.textContent = todo.text;
      if (todo.done) {
        label.style.textDecoration = 'line-through';
        label.style.opacity = '0.5';
      }

      label.addEventListener('click', function() {
        todos.updateOne({ __inc: todo.__inc }, { $set: { done: !todo.done } });
      });

      var btn = document.createElement('button');
      btn.textContent = 'x';
      btn.style.marginLeft = '8px';
      btn.addEventListener('click', function() {
        todos.deleteOne({ __inc: todo.__inc });
      });

      li.appendChild(label);
      li.appendChild(btn);
      list.appendChild(li);
    });

    countEl.textContent = remaining + ' item' + (remaining !== 1 ? 's' : '') + ' left';
  }

  // Re-render on every change
  todos.watch(render);
  render();

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    todos.insertOne({ text: text, done: false });
    input.value = '';
  });
</script>
```

## 2. Live Search

Search through a list of items in real time using `$regex`.

```html
<div id="search-app">
  <input type="text" id="search-input" placeholder="Search products...">
  <ul id="search-results"></ul>
</div>

<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
<script>
  var db = new StateDB('search-demo');
  var products = db.createCollection('products');

  // Seed data
  products.insertMany([
    { name: 'MacBook Pro 16"', category: 'Laptops', price: 2499 },
    { name: 'MacBook Air M3', category: 'Laptops', price: 1099 },
    { name: 'iPad Pro 12.9"', category: 'Tablets', price: 1099 },
    { name: 'iPhone 16 Pro', category: 'Phones', price: 999 },
    { name: 'AirPods Max', category: 'Audio', price: 549 },
    { name: 'Apple Watch Ultra', category: 'Wearables', price: 799 },
    { name: 'Studio Display', category: 'Displays', price: 1599 },
    { name: 'Magic Keyboard', category: 'Accessories', price: 299 },
  ]);

  var searchInput = document.getElementById('search-input');
  var resultsList = document.getElementById('search-results');

  function search(term) {
    resultsList.textContent = '';

    var query = {};
    if (term) {
      query = { name: { $regex: new RegExp(term, 'i') } };
    }

    var results = products.find(query).sort({ name: 1 }).toArray();

    results.forEach(function(product) {
      var li = document.createElement('li');

      var nameSpan = document.createElement('strong');
      nameSpan.textContent = product.name;

      var detailSpan = document.createElement('span');
      detailSpan.textContent = ' - ' + product.category + ' - $' + product.price;

      li.appendChild(nameSpan);
      li.appendChild(detailSpan);
      resultsList.appendChild(li);
    });

    if (results.length === 0) {
      var li = document.createElement('li');
      li.textContent = 'No results found';
      li.style.color = '#999';
      resultsList.appendChild(li);
    }
  }

  searchInput.addEventListener('input', function() {
    search(searchInput.value.trim());
  });

  // Show all on load
  search('');
</script>
```

## 3. Dashboard Stats

A dashboard that updates multiple stat counters reactively using watchers.

```html
<div id="dashboard">
  <h2>Order Dashboard</h2>
  <div id="stats" style="display: flex; gap: 20px; margin-bottom: 20px;"></div>
  <button id="add-order">Add Random Order</button>
</div>

<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
<script>
  var db = new StateDB('dashboard');
  var orders = db.createCollection('orders');

  var statsEl = document.getElementById('stats');

  function createStatCard(label, value) {
    var card = document.createElement('div');
    card.style.cssText = 'padding: 16px; border: 1px solid #ddd; border-radius: 8px; min-width: 120px;';

    var valueEl = document.createElement('div');
    valueEl.style.cssText = 'font-size: 24px; font-weight: bold;';
    valueEl.textContent = value;

    var labelEl = document.createElement('div');
    labelEl.style.color = '#666';
    labelEl.textContent = label;

    card.appendChild(valueEl);
    card.appendChild(labelEl);
    return card;
  }

  function renderStats() {
    var total = orders.count();
    var pending = orders.count({ status: 'pending' });
    var shipped = orders.count({ status: 'shipped' });
    var delivered = orders.count({ status: 'delivered' });

    var amounts = orders.find().map(function(o) { return o.amount; });
    var revenue = amounts.reduce(function(sum, a) { return sum + a; }, 0);

    statsEl.textContent = '';
    statsEl.appendChild(createStatCard('Total Orders', total));
    statsEl.appendChild(createStatCard('Pending', pending));
    statsEl.appendChild(createStatCard('Shipped', shipped));
    statsEl.appendChild(createStatCard('Delivered', delivered));
    statsEl.appendChild(createStatCard('Revenue', '$' + revenue.toFixed(2)));
  }

  // Re-render stats on every change
  orders.watch(renderStats);
  renderStats();

  // Seed some orders
  var statuses = ['pending', 'shipped', 'delivered'];
  for (var i = 0; i < 10; i++) {
    orders.insertOne({
      item: 'Product ' + (i + 1),
      amount: Math.round(Math.random() * 200 * 100) / 100,
      status: statuses[Math.floor(Math.random() * 3)],
    });
  }

  document.getElementById('add-order').addEventListener('click', function() {
    orders.insertOne({
      item: 'Product ' + (orders.count() + 1),
      amount: Math.round(Math.random() * 200 * 100) / 100,
      status: 'pending',
    });
  });
</script>
```

## 4. Sorted Table

A sortable data table. Click any column header to sort ascending/descending.

```html
<div id="table-app">
  <h2>Employees</h2>
  <table id="emp-table" style="border-collapse: collapse; width: 100%;">
    <thead id="emp-head"></thead>
    <tbody id="emp-body"></tbody>
  </table>
</div>

<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
<script>
  var db = new StateDB('table-demo');
  var employees = db.createCollection('employees');

  employees.insertMany([
    { name: 'Omar', department: 'Engineering', salary: 120000, hired: 2019 },
    { name: 'Sara', department: 'Design', salary: 95000, hired: 2020 },
    { name: 'Ali', department: 'Engineering', salary: 110000, hired: 2021 },
    { name: 'Noor', department: 'Marketing', salary: 85000, hired: 2022 },
    { name: 'Zain', department: 'Engineering', salary: 130000, hired: 2018 },
    { name: 'Lina', department: 'Design', salary: 98000, hired: 2021 },
    { name: 'Rami', department: 'Marketing', salary: 78000, hired: 2023 },
  ]);

  var columns = ['name', 'department', 'salary', 'hired'];
  var sortField = 'name';
  var sortDir = 1;

  var thead = document.getElementById('emp-head');
  var tbody = document.getElementById('emp-body');

  function renderHeader() {
    thead.textContent = '';
    var tr = document.createElement('tr');

    columns.forEach(function(col) {
      var th = document.createElement('th');
      th.style.cssText = 'padding: 8px 12px; border-bottom: 2px solid #333; cursor: pointer; text-align: left; user-select: none;';

      var label = col.charAt(0).toUpperCase() + col.slice(1);
      if (sortField === col) {
        label += sortDir === 1 ? ' ▲' : ' ▼';
      }
      th.textContent = label;

      th.addEventListener('click', function() {
        if (sortField === col) {
          sortDir = sortDir * -1;
        } else {
          sortField = col;
          sortDir = 1;
        }
        renderTable();
      });

      tr.appendChild(th);
    });

    thead.appendChild(tr);
  }

  function renderTable() {
    renderHeader();

    var sortSpec = {};
    sortSpec[sortField] = sortDir;

    var rows = employees.find().sort(sortSpec).toArray();

    tbody.textContent = '';

    rows.forEach(function(emp) {
      var tr = document.createElement('tr');

      columns.forEach(function(col) {
        var td = document.createElement('td');
        td.style.cssText = 'padding: 8px 12px; border-bottom: 1px solid #eee;';

        var value = emp[col];
        if (col === 'salary') {
          td.textContent = '$' + value.toLocaleString();
        } else {
          td.textContent = value;
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  // Re-render when data changes
  employees.watch(renderTable);
  renderTable();
</script>
```
