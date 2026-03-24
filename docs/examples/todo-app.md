# Todo App

A complete todo application using StateDB with reactive rendering. No framework — just vanilla JavaScript.

## The Pattern

1. Create a collection
2. Set up a watcher that re-renders the UI
3. Mutate data — the UI updates automatically

```ts
const db = new StateDB('todo');
const todos = db.createCollection('todos');

// Re-render on any change
todos.watch(() => render());

function render() {
  const items = todos.find().sort({ __inc: -1 }).toArray();
  // ...update the DOM
}
```

## Full Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; }
    .add { display: flex; gap: 8px; margin-bottom: 16px; }
    .add input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 15px; }
    .add button { padding: 10px 20px; border: none; border-radius: 8px; background: #d97706; color: #fff; font-weight: 600; cursor: pointer; }
    .list { list-style: none; padding: 0; }
    .item { display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 8px; margin-bottom: 4px; }
    .item.done span { text-decoration: line-through; color: #aaa; }
    .item input[type=checkbox] { width: 18px; height: 18px; }
    .item span { flex: 1; }
    .item button { border: none; background: none; color: #ccc; cursor: pointer; font-size: 18px; }
    .item button:hover { color: #e00; }
    .footer { display: flex; justify-content: space-between; margin-top: 12px; color: #888; font-size: 13px; }
    .footer button { border: none; background: #eee; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <h2>Todos</h2>
  <div class="add">
    <input type="text" id="input" placeholder="What needs to be done?">
    <button onclick="addTodo()">Add</button>
  </div>
  <ul class="list" id="list"></ul>
  <div class="footer">
    <span id="count">0 remaining</span>
    <button onclick="clearDone()">Clear done</button>
  </div>

  <script src="https://unpkg.com/@phpdot/statedb/dist/index.min.js"></script>
  <script>
    var db = new StateDB('todo-app');
    var todos = db.createCollection('todos');

    // Reactive: re-render on every change
    todos.watch(function() { render(); });

    function addTodo() {
      var input = document.getElementById('input');
      var text = input.value.trim();
      if (!text) return;
      todos.insertOne({ text: text, done: false });
      input.value = '';
    }

    function toggle(id) {
      var t = todos.findOne({ __inc: id });
      todos.updateOne({ __inc: id }, { $set: { done: !t.done } });
    }

    function remove(id) {
      todos.deleteOne({ __inc: id });
    }

    function clearDone() {
      todos.deleteMany({ done: true });
    }

    function render() {
      var list = document.getElementById('list');
      var items = todos.find().sort({ __inc: -1 }).toArray();
      list.textContent = '';

      items.forEach(function(t) {
        var li = document.createElement('li');
        li.className = 'item' + (t.done ? ' done' : '');

        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = t.done;
        cb.addEventListener('change', function() { toggle(t.__inc); });

        var span = document.createElement('span');
        span.textContent = t.text;

        var del = document.createElement('button');
        del.textContent = '\u00D7';
        del.addEventListener('click', function() { remove(t.__inc); });

        li.appendChild(cb);
        li.appendChild(span);
        li.appendChild(del);
        list.appendChild(li);
      });

      document.getElementById('count').textContent =
        todos.count({ done: false }) + ' remaining';
    }

    // Enter key
    document.getElementById('input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') addTodo();
    });

    // Seed data
    if (todos.count() === 0) {
      todos.insertMany([
        { text: 'Learn StateDB', done: true },
        { text: 'Build something great', done: false },
        { text: 'Ship it', done: false },
      ]);
    }

    render();
  </script>
</body>
</html>
```

## Key StateDB Features Used

| Feature | How it's used |
|---------|--------------|
| `insertOne` | Add new todo |
| `findOne` + `updateOne` | Toggle done state with `$set` |
| `deleteOne` | Remove a todo |
| `deleteMany` | Clear all done todos |
| `find().sort().toArray()` | Fetch and sort for rendering |
| `count({ done: false })` | Count remaining items |
| `watch()` | Auto re-render on any change |
| `insertMany` | Seed initial data |
