// UI functions for To-Do List with Editing, Due Dates, Search/Filtering, and ML Inference
import {
  getTodos,
  saveTodos,
  addTodoToStorage,
  updateTodoInStorage,
  deleteTodoFromStorage,
} from "./todoService.js";
import {
  predictTask,
  trainModelFromFeedback,
} from "./aiCategorizer.js";
import { getCurrentUser } from "./auth.js";

// Active filter & search state
let currentFilters = {
  search: "",
  status: "all",
  category: "all",
  priority: "all",
  sortBy: "priority",
};

// ID of todo item currently being edited inline
let editingTodoId = null;

/**
 * Returns today's date formatted as YYYY-MM-DD in local timezone.
 */
function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD string into user-friendly localized format.
 */
function formatDueDateDisplay(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Computes overdue, today, or upcoming status for a due date.
 */
function getDueDateBadgeInfo(dueDateStr, isCompleted) {
  if (!dueDateStr) return null;
  const today = getLocalDateString();
  const formatted = formatDueDateDisplay(dueDateStr);

  if (isCompleted) {
    return { label: `📅 Due: ${formatted}`, statusClass: "due-completed" };
  }
  if (dueDateStr < today) {
    return { label: `⚠️ Overdue (${formatted})`, statusClass: "due-overdue" };
  }
  if (dueDateStr === today) {
    return { label: `⏰ Due Today`, statusClass: "due-today" };
  }
  return { label: `📅 Due: ${formatted}`, statusClass: "due-upcoming" };
}

/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Applies active search, filter, and sort criteria to todos array.
 */
function getFilteredAndSortedTodos(todos) {
  const searchLower = currentFilters.search.trim().toLowerCase();

  // 1. Filter
  let filtered = todos.filter((todo) => {
    // Search match on text or category
    if (searchLower) {
      const matchText = (todo.text || "").toLowerCase().includes(searchLower);
      const matchCategory = (todo.category || "").toLowerCase().includes(searchLower);
      if (!matchText && !matchCategory) return false;
    }

    // Status filter
    if (currentFilters.status === "active" && todo.completed) return false;
    if (currentFilters.status === "completed" && !todo.completed) return false;

    // Category filter
    if (
      currentFilters.category !== "all" &&
      (todo.category || "General").toLowerCase() !== currentFilters.category.toLowerCase()
    ) {
      return false;
    }

    // Priority filter
    if (
      currentFilters.priority !== "all" &&
      (todo.priority || "Low").toLowerCase() !== currentFilters.priority.toLowerCase()
    ) {
      return false;
    }

    return true;
  });

  // 2. Sort
  filtered.sort((a, b) => {
    const pOrder = { high: 1, medium: 2, low: 3 };

    if (currentFilters.sortBy === "priority") {
      const pa = pOrder[(a.priority || "Low").toLowerCase()] || 3;
      const pb = pOrder[(b.priority || "Low").toLowerCase()] || 3;
      if (pa !== pb) return pa - pb;
      // Secondary sort: due date earliest first
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return (b.id || "").localeCompare(a.id || "");
    }

    if (currentFilters.sortBy === "dueDate") {
      // Due dates first (earliest first), items with no due date last
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      // Then priority
      const pa = pOrder[(a.priority || "Low").toLowerCase()] || 3;
      const pb = pOrder[(b.priority || "Low").toLowerCase()] || 3;
      return pa - pb;
    }

    if (currentFilters.sortBy === "newest") {
      return (b.id || "").localeCompare(a.id || "");
    }

    if (currentFilters.sortBy === "alphabetical") {
      return (a.text || "").localeCompare(b.text || "");
    }

    return 0;
  });

  return filtered;
}

/**
 * Updates stats and filter reset button.
 */
function updateTaskStatsBar(allTodos, filteredTodos) {
  const statsElem = document.getElementById("task-stats-text");
  const resetBtn = document.getElementById("reset-filters-btn");
  const clearSearchBtn = document.getElementById("search-clear-btn");

  if (!statsElem) return;

  const total = allTodos.length;
  const showing = filteredTodos.length;
  const completedCount = allTodos.filter((t) => t.completed).length;
  const todayStr = getLocalDateString();
  const overdueCount = allTodos.filter(
    (t) => !t.completed && t.dueDate && t.dueDate < todayStr
  ).length;

  let statsMessage = `Showing ${showing} of ${total} task${total === 1 ? "" : "s"}`;
  if (completedCount > 0) {
    statsMessage += ` • ${completedCount} completed`;
  }
  if (overdueCount > 0) {
    statsMessage += ` • <span class="overdue-highlight">${overdueCount} overdue</span>`;
  }

  statsElem.innerHTML = statsMessage;

  // Toggle clear search button
  if (clearSearchBtn) {
    clearSearchBtn.style.display = currentFilters.search.trim() ? "inline-block" : "none";
  }

  // Toggle reset filters button if filters are active
  const hasActiveFilters =
    Boolean(currentFilters.search.trim()) ||
    currentFilters.status !== "all" ||
    currentFilters.category !== "all" ||
    currentFilters.priority !== "all" ||
    currentFilters.sortBy !== "priority";

  if (resetBtn) {
    resetBtn.style.display = hasActiveFilters ? "inline-block" : "none";
  }
}

/**
 * Main render function. Refreshes the task list with current filters and sort options applied.
 */
export function renderTodos(todos) {
  const allTodos = todos || getTodos();
  const filteredTodos = getFilteredAndSortedTodos(allTodos);
  const list = document.getElementById("todo-list");
  if (!list) return;

  list.innerHTML = "";

  updateTaskStatsBar(allTodos, filteredTodos);

  if (filteredTodos.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "empty-state-card";
    if (allTodos.length === 0) {
      emptyLi.innerHTML = `
        <div class="empty-icon">📝</div>
        <p class="empty-title">No tasks yet!</p>
        <p class="empty-subtitle">Add your first task above. The ML engine will automatically predict category & priority.</p>
      `;
    } else {
      emptyLi.innerHTML = `
        <div class="empty-icon">🔍</div>
        <p class="empty-title">No matching tasks</p>
        <p class="empty-subtitle">Try adjusting your search query or filter selections.</p>
        <button type="button" class="empty-reset-btn" id="empty-reset-btn">Clear All Filters</button>
      `;
      setTimeout(() => {
        const btn = document.getElementById("empty-reset-btn");
        if (btn) btn.addEventListener("click", resetAllFilters);
      }, 0);
    }
    list.appendChild(emptyLi);
    return;
  }

  filteredTodos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.completed ? "completed" : ""}`;
    li.dataset.id = todo.id;

    // Check if this item is currently in edit mode
    if (editingTodoId === todo.id) {
      li.classList.add("is-editing");
      li.innerHTML = renderEditFormHtml(todo);
    } else {
      li.innerHTML = renderTodoItemHtml(todo);
    }

    list.appendChild(li);
  });
}

/**
 * Generates the HTML for a normal (non-editing) todo card.
 */
function renderTodoItemHtml(todo) {
  const categoryName = todo.category || "General";
  const categoryClass = `category-${categoryName.toLowerCase()}`;
  const priorityName = todo.priority || "Low";
  const priorityClass = `priority-${priorityName.toLowerCase()}`;
  const dueInfo = getDueDateBadgeInfo(todo.dueDate, todo.completed);
  const confidence = typeof todo.categoryConfidence === "number" ? todo.categoryConfidence : 85;

  return `
    <div class="todo-item-content">
      <div class="todo-main-row">
        <label class="checkbox-container">
          <input type="checkbox" class="task-checkbox toggle" data-id="${todo.id}" ${
            todo.completed ? "checked" : ""
          } />
          <span class="custom-checkmark"></span>
        </label>
        <span class="todo-text ${todo.completed ? "strikethrough" : ""}">${escapeHtml(
          todo.text
        )}</span>
      </div>

      <div class="todo-meta-tags">
        <span class="category-badge ${categoryClass}" title="ML Predicted Category (${confidence}% confidence)">
          🏷️ ${categoryName} <span class="badge-confidence">${confidence}%</span>
        </span>
        <span class="priority-badge ${priorityClass}" title="Priority: ${priorityName}">
          ⚡ ${priorityName}
        </span>
        ${
          dueInfo
            ? `<span class="due-badge ${dueInfo.statusClass}" title="Due Date">
                ${dueInfo.label}
              </span>`
            : ""
        }
      </div>
    </div>

    <div class="todo-actions">
      <button class="action-btn edit-btn edit" data-id="${todo.id}" title="Edit task">
        ✏️ Edit
      </button>
      <button class="action-btn toggle-btn toggle" data-id="${todo.id}" title="${
        todo.completed ? "Mark as active" : "Mark as completed"
      }">
        ${todo.completed ? "Undo" : "Done"}
      </button>
      <button class="action-btn delete-btn delete" data-id="${todo.id}" title="Delete task">
        🗑️
      </button>
    </div>
  `;
}

/**
 * Generates the HTML for the inline task editing form.
 */
function renderEditFormHtml(todo) {
  const category = todo.category || "General";
  const priority = todo.priority || "Low";
  const dueDate = todo.dueDate || "";

  const categories = ["Work", "Personal", "Shopping", "Health", "Finance", "Education", "General"];
  const priorities = ["High", "Medium", "Low"];

  const categoryOptions = categories
    .map(
      (c) =>
        `<option value="${c}" ${c.toLowerCase() === category.toLowerCase() ? "selected" : ""}>${c}</option>`
    )
    .join("");

  const priorityOptions = priorities
    .map(
      (p) =>
        `<option value="${p}" ${p.toLowerCase() === priority.toLowerCase() ? "selected" : ""}>${p}</option>`
    )
    .join("");

  return `
    <form class="todo-inline-edit-form" data-id="${todo.id}">
      <div class="edit-fields-container">
        <div class="edit-input-group">
          <label class="edit-label">Task Title</label>
          <input
            type="text"
            class="edit-text-input"
            value="${escapeHtml(todo.text)}"
            required
            autocomplete="off"
          />
        </div>

        <div class="edit-selectors-row">
          <div class="edit-input-group">
            <label class="edit-label">Due Date</label>
            <input
              type="date"
              class="edit-date-input"
              value="${dueDate}"
            />
          </div>

          <div class="edit-input-group">
            <label class="edit-label">Category</label>
            <select class="edit-category-select">
              ${categoryOptions}
            </select>
          </div>

          <div class="edit-input-group">
            <label class="edit-label">Priority</label>
            <select class="edit-priority-select">
              ${priorityOptions}
            </select>
          </div>
        </div>
      </div>

      <div class="edit-buttons-row">
        <button type="submit" class="save-edit-btn">💾 Save Changes</button>
        <button type="button" class="cancel-edit-btn" data-id="${todo.id}">Cancel</button>
      </div>
    </form>
  `;
}

/**
 * Adds a new task using the ML classifier for categorization and priority prediction.
 */
export function addTodo(text, dueDate = null) {
  if (!text || !text.trim()) return;

  // Run real on-device ML model inference
  const prediction = predictTask(text.trim());

  const newTodo = {
    id: Date.now().toString(),
    text: text.trim(),
    dueDate: dueDate || null,
    category: prediction.category,
    categoryConfidence: prediction.categoryConfidence,
    priority: prediction.priority,
    completed: false,
  };

  addTodoToStorage(newTodo);
  renderTodos();
}

/**
 * Toggles a task's completed state.
 */
export function toggleTodo(id) {
  const todos = getTodos();
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    updateTodoInStorage(id, { completed: !todo.completed });
    renderTodos();
  }
}

/**
 * Deletes a task by ID.
 */
export function deleteTodo(id) {
  if (editingTodoId === id) {
    editingTodoId = null;
  }
  deleteTodoFromStorage(id);
  renderTodos();
}

/**
 * Switches a task to inline edit mode.
 */
export function startEditingTodo(id) {
  editingTodoId = id;
  renderTodos();

  // Auto-focus the text input
  setTimeout(() => {
    const editInput = document.querySelector(`.todo-item[data-id="${id}"] .edit-text-input`);
    if (editInput) {
      editInput.focus();
      editInput.select();
    }
  }, 0);
}

/**
 * Cancels active editing mode.
 */
export function cancelEditingTodo() {
  editingTodoId = null;
  renderTodos();
}

/**
 * Commits changes made in the edit form.
 */
export function saveEditedTodo(id, newText, newDueDate, newCategory, newPriority) {
  if (!newText || !newText.trim()) return;

  const trimmedText = newText.trim();
  const todos = getTodos();
  const currentTodo = todos.find((t) => t.id === id);

  // If user changed category or priority manually, feed it back into the ML model for active learning!
  if (
    currentTodo &&
    (currentTodo.category !== newCategory || currentTodo.priority !== newPriority)
  ) {
    trainModelFromFeedback(trimmedText, newCategory, newPriority);
  }

  updateTodoInStorage(id, {
    text: trimmedText,
    dueDate: newDueDate || null,
    category: newCategory,
    priority: newPriority,
    categoryConfidence: currentTodo?.category === newCategory ? currentTodo.categoryConfidence : 95,
  });

  editingTodoId = null;
  renderTodos();
}

/**
 * Updates search filter term.
 */
export function setSearchFilter(term) {
  currentFilters.search = term;
  renderTodos();
}

/**
 * Updates status filter (all, active, completed).
 */
export function setStatusFilter(status) {
  currentFilters.status = status;
  renderTodos();
}

/**
 * Updates category filter.
 */
export function setCategoryFilter(category) {
  currentFilters.category = category;
  renderTodos();
}

/**
 * Updates priority filter.
 */
export function setPriorityFilter(priority) {
  currentFilters.priority = priority;
  renderTodos();
}

/**
 * Updates sort criteria.
 */
export function setSortBy(sortBy) {
  currentFilters.sortBy = sortBy;
  renderTodos();
}

/**
 * Resets all search and filter controls to default.
 */
export function resetAllFilters() {
  currentFilters = {
    search: "",
    status: "all",
    category: "all",
    priority: "all",
    sortBy: "priority",
  };

  // Sync DOM elements
  const searchInput = document.getElementById("todo-search");
  if (searchInput) searchInput.value = "";

  const statusSelect = document.getElementById("filter-status");
  if (statusSelect) statusSelect.value = "all";

  const categorySelect = document.getElementById("filter-category");
  if (categorySelect) categorySelect.value = "all";

  const prioritySelect = document.getElementById("filter-priority");
  if (prioritySelect) prioritySelect.value = "all";

  const sortSelect = document.getElementById("sort-by");
  if (sortSelect) sortSelect.value = "priority";

  renderTodos();
}

/**
 * Updates the live AI preview box while typing in the add-task input.
 */
export function updateLiveAiPreview(text) {
  const previewContainer = document.getElementById("ai-live-preview");
  const catBadge = document.getElementById("preview-category-badge");
  const prioBadge = document.getElementById("preview-priority-badge");
  const confText = document.getElementById("preview-confidence");

  if (!previewContainer || !catBadge || !prioBadge || !confText) return;

  if (!text || text.trim().length < 3) {
    previewContainer.style.display = "none";
    return;
  }

  const prediction = predictTask(text.trim());

  catBadge.textContent = `🏷️ ${prediction.category}`;
  catBadge.className = `badge category-${prediction.category.toLowerCase()}`;

  prioBadge.textContent = `⚡ ${prediction.priority}`;
  prioBadge.className = `badge priority-${prediction.priority.toLowerCase()}`;

  confText.textContent = `${prediction.categoryConfidence}% confident`;
  previewContainer.style.display = "block";
}

/**
 * Shows the login / registration view.
 */
export function showLoginForm() {
  document.getElementById("auth-section").style.display = "flex";
  document.getElementById("app-section").style.display = "none";
  document.getElementById("login-container").style.display = "block";
  document.getElementById("register-container").style.display = "none";
}

/**
 * Shows the main application view.
 */
export function showApp() {
  document.getElementById("auth-section").style.display = "none";
  document.getElementById("app-section").style.display = "block";
  const user = getCurrentUser();
  const welcome = document.getElementById("welcome-user");
  if (welcome && user) {
    welcome.textContent = `Welcome, ${user.username}!`;
  }
}
