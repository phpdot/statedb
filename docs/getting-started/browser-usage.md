# Browser Usage

StateDB works in the browser with a single `<script>` tag — no build tools, no npm, no bundler.

## Loading

```html
<!-- Production (minified, ~20KB) -->
<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>

<!-- Development (readable) -->
<script src="https://unpkg.com/@phpdot/statedb/dist/index.js"></script>
```

After loading, `StateDB` is available as a global constructor:

```html
<script>
  const db = new StateDB('my-app');
  const users = db.createCollection('users');
  users.insertOne({ name: 'Omar' });
</script>
```

## Accessing Other Classes

All exports are attached to the `StateDB` global:

```js
StateDB.Collection   // Collection class
StateDB.Query        // Query engine
StateDB.Schema       // Schema class
StateDB.Index        // Index class
StateDB.Watcher      // Watcher class
StateDB.QueryResult  // QueryResult class
```

## Reactive Rendering Example

```html
<!DOCTYPE html>
<html>
<body>
  <input type="text" id="name-input" placeholder="Enter name">
  <button onclick="addUser()">Add</button>
  <ul id="user-list"></ul>

  <script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
  <script>
    var db = new StateDB('demo');
    var users = db.createCollection('users');

    // Re-render on every change
    users.watch(function() {
      var list = document.getElementById('user-list');
      list.textContent = '';
      users.find().sort({ __inc: -1 }).toArray().forEach(function(u) {
        var li = document.createElement('li');
        li.textContent = u.name;
        list.appendChild(li);
      });
    });

    function addUser() {
      var input = document.getElementById('name-input');
      var name = input.value.trim();
      if (!name) return;
      users.insertOne({ name: name });
      input.value = '';
    }
  </script>
</body>
</html>
```

## Using with Alpine.js

```html
<div x-data="userApp()">
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
  function userApp() {
    var db = new StateDB('alpine-demo');
    var col = db.createCollection('users');

    return {
      name: '',
      users: col.find().toArray(),
      init: function() {
        var self = this;
        col.watch(function() {
          self.users = col.find().toArray();
        });
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

## Using with jQuery

```html
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
<script>
  var db = new StateDB('jquery-demo');
  var todos = db.createCollection('todos');

  todos.watch(function() {
    var items = todos.find().sort({ __inc: -1 }).toArray();
    var html = '';
    items.forEach(function(t) {
      html += '<li>' + $('<span>').text(t.text).html() + '</li>';
    });
    $('#todo-list').html(html);
  });

  $('#add-btn').click(function() {
    var text = $('#todo-input').val().trim();
    if (text) {
      todos.insertOne({ text: text, done: false });
      $('#todo-input').val('');
    }
  });
</script>
```

## Self-Hosting

Download the files from npm or unpkg and serve them yourself:

```bash
# Download
curl -o statedb.min.js https://unpkg.com/@phpdot/statedb/dist/index.min.js
curl -o statedb.js https://unpkg.com/@phpdot/statedb/dist/index.js
```

```html
<script src="/js/statedb.min.js"></script>
```
