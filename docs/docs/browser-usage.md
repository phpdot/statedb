# Browser Usage

StateDB works in the browser with a single `<script>` tag — no build tools needed.

## Loading

```html
<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
<script>
  const db = new StateDB('my-app');
  const users = db.createCollection('users');
  users.insertOne({ name: 'Omar' });
</script>
```

## Accessing Classes

All exports are available on the global `StateDB` object:

```js
StateDB.Collection    // Collection class
StateDB.Query         // Query engine
StateDB.Schema        // Schema class
StateDB.Index         // Index class
StateDB.Watcher       // Watcher class
```

## With Alpine.js

```html
<div x-data="app()">
  <input x-model="name" @keydown.enter="add">
  <button @click="add">Add</button>
  <ul>
    <template x-for="user in users" :key="user.__inc">
      <li x-text="user.name"></li>
    </template>
  </ul>
</div>

<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
<script src="https://unpkg.com/alpinejs" defer></script>
<script>
  function app() {
    var db = new StateDB('alpine');
    var col = db.createCollection('users');
    return {
      name: '',
      users: col.find().toArray(),
      init: function() {
        var self = this;
        col.watch(function() { self.users = col.find().toArray(); });
      },
      add: function() {
        if (!this.name.trim()) return;
        col.insertOne({ name: this.name });
        this.name = '';
      },
    };
  }
</script>
```

## With jQuery

```js
var db = new StateDB('app');
var todos = db.createCollection('todos');

todos.watch(function() {
  var items = todos.find().sort({ __inc: -1 }).toArray();
  var list = $('#todo-list');
  list.empty();
  items.forEach(function(t) {
    list.append('<li>' + $('<span>').text(t.text).html() + '</li>');
  });
});
```

## Self-Hosting

```bash
curl -o statedb.min.js https://unpkg.com/@phpdot/statedb/dist/index.min.js
```

```html
<script src="/js/statedb.min.js"></script>
```
