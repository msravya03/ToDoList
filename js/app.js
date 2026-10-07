// Attractive To-Do List App JS with Task Editing, Due Dates, Search/Filtering & ML Categorization
import {
  renderTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  startEditingTodo,
  cancelEditingTodo,
  saveEditedTodo,
  setSearchFilter,
  setStatusFilter,
  setCategoryFilter,
  setPriorityFilter,
  setSortBy,
  resetAllFilters,
  updateLiveAiPreview,
  showLoginForm,
  showApp,
} from "./ui.js";
import { getTodos } from "./todoService.js";
import { isLoggedIn, logout, login, register } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  if (isLoggedIn()) {
    showApp();
    renderTodos(getTodos());
    setupTodoEvents();
    setupFilterAndSearchEvents();
    setupLogoutEvent();
  } else {
    showLoginForm();
    setupAuthEvents();
  }
}

/**
 * Event listeners for task creation, editing, toggling, and deletion.
 */
function setupTodoEvents() {
  const todoForm = document.getElementById("todo-form");
  const todoInput = document.getElementById("todo-input");
  const todoDueDate = document.getElementById("todo-due-date");
  const todoList = document.getElementById("todo-list");

  // Add task form submission
  if (todoForm) {
    todoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const text = todoInput ? todoInput.value.trim() : "";
      const dueDate = todoDueDate ? todoDueDate.value : null;

      if (text) {
        addTodo(text, dueDate);
        if (todoInput) todoInput.value = "";
        if (todoDueDate) todoDueDate.value = "";
        updateLiveAiPreview(""); // Hide AI prediction preview
      }
    });
  }

  // Live real-time ML prediction preview as user types
  if (todoInput) {
    todoInput.addEventListener("input", function (e) {
      updateLiveAiPreview(e.target.value);
    });
  }

  // Event delegation on todo list for toggling, deleting, and editing
  if (todoList) {
    // Click events
    todoList.addEventListener("click", function (e) {
      const target = e.target;

      // Toggle completed
      if (target.classList.contains("toggle") || target.closest(".toggle")) {
        const id = target.dataset.id || target.closest(".toggle").dataset.id;
        if (id) toggleTodo(id);
        return;
      }

      // Delete task
      if (target.classList.contains("delete") || target.closest(".delete")) {
        const id = target.dataset.id || target.closest(".delete").dataset.id;
        if (id) deleteTodo(id);
        return;
      }

      // Start editing
      if (target.classList.contains("edit") || target.closest(".edit")) {
        const id = target.dataset.id || target.closest(".edit").dataset.id;
        if (id) startEditingTodo(id);
        return;
      }

      // Cancel inline editing
      if (target.classList.contains("cancel-edit-btn")) {
        cancelEditingTodo();
        return;
      }
    });

    // Submit handler for inline edit forms
    todoList.addEventListener("submit", function (e) {
      const editForm = e.target.closest(".todo-inline-edit-form");
      if (!editForm) return;

      e.preventDefault();
      const id = editForm.dataset.id;
      const textInput = editForm.querySelector(".edit-text-input");
      const dateInput = editForm.querySelector(".edit-date-input");
      const catSelect = editForm.querySelector(".edit-category-select");
      const prioSelect = editForm.querySelector(".edit-priority-select");

      const newText = textInput ? textInput.value : "";
      const newDueDate = dateInput ? dateInput.value : null;
      const newCategory = catSelect ? catSelect.value : "General";
      const newPriority = prioSelect ? prioSelect.value : "Low";

      saveEditedTodo(id, newText, newDueDate, newCategory, newPriority);
    });

    // Keyboard navigation: Escape key cancels editing
    todoList.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        cancelEditingTodo();
      }
    });
  }
}

/**
 * Event listeners for search, filter dropdowns, and sorting.
 */
function setupFilterAndSearchEvents() {
  const searchInput = document.getElementById("todo-search");
  const clearSearchBtn = document.getElementById("search-clear-btn");
  const filterStatus = document.getElementById("filter-status");
  const filterCategory = document.getElementById("filter-category");
  const filterPriority = document.getElementById("filter-priority");
  const sortBy = document.getElementById("sort-by");
  const resetFiltersBtn = document.getElementById("reset-filters-btn");

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      setSearchFilter(e.target.value);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", function () {
      if (searchInput) {
        searchInput.value = "";
        searchInput.focus();
      }
      setSearchFilter("");
    });
  }

  if (filterStatus) {
    filterStatus.addEventListener("change", function (e) {
      setStatusFilter(e.target.value);
    });
  }

  if (filterCategory) {
    filterCategory.addEventListener("change", function (e) {
      setCategoryFilter(e.target.value);
    });
  }

  if (filterPriority) {
    filterPriority.addEventListener("change", function (e) {
      setPriorityFilter(e.target.value);
    });
  }

  if (sortBy) {
    sortBy.addEventListener("change", function (e) {
      setSortBy(e.target.value);
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener("click", function () {
      resetAllFilters();
    });
  }
}

function setupAuthEvents() {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("register-form").addEventListener("submit", handleRegister);
  document.getElementById("show-register").addEventListener("click", showRegisterForm);
  document.getElementById("show-login").addEventListener("click", showLoginFormOnly);
}

function setupLogoutEvent() {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  if (login(username, password)) {
    initializeApp();
  } else {
    document.getElementById("login-error").textContent = "Invalid username or password";
  }
}

function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  if (register(username, password)) {
    login(username, password);
    initializeApp();
  } else {
    document.getElementById("register-error").textContent = "Username already exists";
  }
}

function handleLogout() {
  logout();
  initializeApp();
}

function showRegisterForm() {
  document.getElementById("login-container").style.display = "none";
  document.getElementById("register-container").style.display = "block";
}

function showLoginFormOnly() {
  document.getElementById("register-container").style.display = "none";
  document.getElementById("login-container").style.display = "block";
}
