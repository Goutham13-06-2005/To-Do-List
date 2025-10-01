(() => {
  'use strict';

  // State
  const STORAGE_KEY = 'todo-list-v1';
  let todos = [];
  let filter = 'all'; // 'all' | 'active' | 'completed'

  // Elements
  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const addBtn = document.getElementById('add-btn');
  const listEl = document.getElementById('todo-list');
  const template = document.getElementById('todo-item-template');
  const itemsLeftEl = document.getElementById('items-left');
  const clearCompletedBtn = document.getElementById('clear-completed');
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));

  // Init
  load();
  render();

  // Event: enable/disable Add button
  input.addEventListener('input', () => {
    addBtn.disabled = input.value.trim().length === 0;
  });

  // Event: add new todo
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addTodo(text);
    input.value = '';
    addBtn.disabled = true;
    input.focus();
  });

  // Event: clear completed
  clearCompletedBtn.addEventListener('click', () => {
    todos = todos.filter(t => !t.completed);
    save();
    render();
  });

  // Event: filter changes
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.filter);
    });
  });

  // Event delegation for list actions
  listEl.addEventListener('click', (e) => {
    const itemEl = e.target.closest('.todo-item');
    if (!itemEl) return;
    const id = itemEl.dataset.id;

    if (e.target.closest('.delete-btn')) {
      deleteTodo(id);
    } else if (e.target.closest('.edit-btn')) {
      enterEditMode(itemEl, id);
    } else if (e.target.closest('.checkbox')) {
      toggleTodo(id);
    }
  });

  // Keyboard: label Enter to edit
  listEl.addEventListener('keydown', (e) => {
    const itemEl = e.target.closest('.todo-item');
    if (!itemEl) return;
    const id = itemEl.dataset.id;

    if (e.target.classList.contains('label') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      enterEditMode(itemEl, id);
    }
  });

  // Helpers
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      todos = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    } catch {
      todos = [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function addTodo(text) {
    const todo = {
      id: String(Date.now()) + Math.random().toString(36).slice(2, 8),
      text,
      completed: false,
      createdAt: Date.now()
    };
    todos.unshift(todo);
    save();
    render();
  }

  function toggleTodo(id) {
    const t = todos.find(t => t.id === id);
    if (!t) return;
    t.completed = !t.completed;
    save();
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    save();
    render();
  }

  function updateTodo(id, newText) {
    const t = todos.find(t => t.id === id);
    if (!t) return;
    t.text = newText;
    save();
    render();
  }

  function setFilter(next) {
    filter = next;
    filterButtons.forEach(btn => {
      const active = btn.dataset.filter === filter;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    render();
  }

  function filteredTodos() {
    if (filter === 'active') return todos.filter(t => !t.completed);
    if (filter === 'completed') return todos.filter(t => t.completed);
    return todos;
  }

  function enterEditMode(itemEl, id) {
    itemEl.classList.add('editing');
    const inputEl = itemEl.querySelector('.edit-input');
    const labelEl = itemEl.querySelector('.label');
    inputEl.value = labelEl.textContent;
    inputEl.focus();
    inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);

    const commit = () => {
      const val = inputEl.value.trim();
      itemEl.classList.remove('editing');
      if (!val) {
        deleteTodo(id);
      } else {
        updateTodo(id, val);
      }
    };

    const cancel = () => {
      itemEl.classList.remove('editing');
      render();
    };

    const onKey = (e) => {
      if (e.key === 'Enter') commit();
      if (e.key === 'Escape') cancel();
    };

    inputEl.addEventListener('keydown', onKey, { once: false });
    inputEl.addEventListener('blur', commit, { once: true });
  }

  function render() {
    // Build list
    listEl.innerHTML = '';
    const items = filteredTodos();

    if (items.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'todo-item';
      empty.innerHTML = `<div class="content"><span class="label" style="color: var(--muted)">No tasks here — add one above.</span></div>`;
      listEl.appendChild(empty);
    } else {
      const frag = document.createDocumentFragment();
      items.forEach(t => {
        const node = template.content.firstElementChild.cloneNode(true);
        node.dataset.id = t.id;
        node.classList.toggle('completed', t.completed);
        node.querySelector('.toggle').checked = t.completed;
        node.querySelector('.label').textContent = t.text;
        frag.appendChild(node);
      });
      listEl.appendChild(frag);
    }

    // Counters and controls
    const remaining = todos.filter(t => !t.completed).length;
    itemsLeftEl.textContent = String(remaining);
    clearCompletedBtn.disabled = todos.every(t => !t.completed);
  }

  // Accessibility: restore focus after render if possible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && document.activeElement === document.body) {
      input.focus();
    }
  });
})();
