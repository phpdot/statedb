# With Livewire / HTMX

StateDB works alongside server-driven tools like **Laravel Livewire**, **HTMX**, and **Alpine.js**. Use it for client-side state that doesn't need to hit the server — filters, UI state, temp data, local caches.

## The Use Case

Server-driven tools handle server state. But sometimes you need client-side state:

- **Filters and search** that don't need a round-trip
- **Temporary form data** before submission
- **Client-side sorting/pagination** on data already fetched
- **UI state** like toggles, selections, active tabs
- **Offline cache** of API responses

StateDB fills this gap without adding React/Vue complexity.

## With Alpine.js

Alpine.js is commonly used alongside Livewire and HTMX. StateDB integrates naturally:

```html
<div x-data="app()">
  <input x-model="search" placeholder="Filter users..." @input="filter">

  <ul>
    <template x-for="user in filtered" :key="user.__inc">
      <li>
        <span x-text="user.name"></span>
        <button @click="remove(user.__inc)">Remove</button>
      </li>
    </template>
  </ul>

  <p x-text="filtered.length + ' users'"></p>
</div>

<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
<script src="https://unpkg.com/alpinejs" defer></script>
<script>
  function app() {
    var db = new StateDB('alpine-app');
    var users = db.createCollection('users');

    return {
      search: '',
      filtered: users.find().toArray(),

      init: function() {
        var self = this;
        users.watch(function() { self.filter(); });

        // Load from server once
        if (users.count() === 0) {
          fetch('/api/users')
            .then(function(r) { return r.json(); })
            .then(function(data) { users.insertMany(data); });
        }
      },

      filter: function() {
        var query = {};
        if (this.search) {
          query = { name: { $regex: new RegExp(this.search, 'i') } };
        }
        this.filtered = users.find(query).sort({ name: 1 }).toArray();
      },

      remove: function(id) {
        users.deleteOne({ __inc: id });
      },
    };
  }
</script>
```

## With Laravel Livewire

Use StateDB for client-side filtering while Livewire handles server mutations:

```html
<!-- Livewire component -->
<div>
  <!-- Server-rendered data passed to client -->
  <div id="user-data" style="display:none">@json($users)</div>

  <!-- Client-side filtering (no server round-trip) -->
  <input type="text" id="filter" placeholder="Quick filter..." oninput="filterUsers()">

  <table>
    <tbody id="user-table"></tbody>
  </table>

  <!-- Server mutation still goes through Livewire -->
  <button wire:click="addUser">Add User (Server)</button>
</div>

<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
<script>
  var db = new StateDB('livewire-cache');
  var users = db.createCollection('users');

  // Load server data into StateDB once
  var serverData = JSON.parse(document.getElementById('user-data').textContent);
  if (users.count() === 0) {
    users.insertMany(serverData);
  }

  users.watch(function() { renderTable(); });

  function filterUsers() {
    renderTable();
  }

  function renderTable() {
    var term = document.getElementById('filter').value;
    var query = term
      ? { name: { $regex: new RegExp(term, 'i') } }
      : {};

    var items = users.find(query).sort({ name: 1 }).toArray();
    var tbody = document.getElementById('user-table');
    tbody.textContent = '';

    items.forEach(function(u) {
      var tr = document.createElement('tr');
      var td1 = document.createElement('td');
      td1.textContent = u.name;
      var td2 = document.createElement('td');
      td2.textContent = u.email;
      tr.appendChild(td1);
      tr.appendChild(td2);
      tbody.appendChild(tr);
    });
  }

  renderTable();

  // Listen for Livewire updates and sync
  document.addEventListener('livewire:navigated', function() {
    var newData = JSON.parse(document.getElementById('user-data').textContent);
    users.drop();
    users.insertMany(newData);
  });
</script>
```

## With HTMX

Use StateDB to cache and filter data fetched via HTMX:

```html
<div>
  <!-- HTMX fetches data from server -->
  <button hx-get="/api/products"
          hx-trigger="click"
          hx-swap="none"
          hx-on::after-request="loadProducts(event)">
    Load Products
  </button>

  <!-- Client-side search (instant, no server) -->
  <input type="text" placeholder="Search products..." oninput="searchProducts(this.value)">
  <div id="products"></div>
</div>

<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
<script>
  var db = new StateDB('htmx-cache');
  var products = db.createCollection('products');

  products.watch(function() { renderProducts(''); });

  function loadProducts(event) {
    var data = JSON.parse(event.detail.xhr.responseText);
    products.drop();
    products.insertMany(data);
  }

  function searchProducts(term) {
    renderProducts(term);
  }

  function renderProducts(term) {
    var query = term
      ? { name: { $regex: new RegExp(term, 'i') } }
      : {};
    var items = products.find(query).sort({ name: 1 }).toArray();

    var container = document.getElementById('products');
    container.textContent = '';
    items.forEach(function(p) {
      var div = document.createElement('div');
      div.textContent = p.name + ' - $' + p.price;
      container.appendChild(div);
    });
  }
</script>
```

## When to Use StateDB vs Server State

| Scenario | Use StateDB | Use Livewire/HTMX |
|----------|------------|-------------------|
| Filter fetched data | Yes | No (unnecessary round-trip) |
| Sort a table client-side | Yes | No |
| Temporary form state | Yes | No |
| UI toggles, selections | Yes | No |
| Create/update/delete records | No | Yes (authoritative) |
| Authentication | No | Yes |
| Anything requiring server validation | No | Yes |

The rule: **StateDB for read/filter/sort on existing data. Server for mutations that matter.**
