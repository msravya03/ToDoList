// UI functions for To-Do List
import { getTodos, saveTodos } from "./todoService.js";
import { predictCategory, predictPriority } from "./aiCategorizer.js";
import { getCurrentUser } from "./auth.js";

export function renderTodos(todos) {
  const list = document.getElementById("todo-list");
  list.innerHTML = "";
  // Sort todos by priority: High first, then Low
  const sorted = [...todos].sort((a, b) => {
    const pa = (a.priority || "Low").toLowerCase();
    const pb = (b.priority || "Low").toLowerCase();
    if (pa === pb) return 0;
    if (pa === "high") return -1;
    if (pb === "high") return 1;
    return 0;
  });
  sorted.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");
    li.innerHTML = `
      <div class="todo-main">
        <span>${todo.text}</span>
        <span class="priority priority-${(
          todo.priority || "Low"
        ).toLowerCase()}">${todo.priority || "Low"}</span>
      </div>
      <div class="todo-actions">
        <button class="toggle" data-id="${todo.id}">${
      todo.completed ? "Undo" : "Done"
    }</button>
        <button class="delete" data-id="${todo.id}">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });
}

export function addTodo(text) {
  const todos = getTodos();
  const newTodo = {
    id: Date.now().toString(),
    text,
    completed: false,
    category: predictCategory(text),
    priority: predictPriority(text),
  };
  todos.push(newTodo);
  saveTodos(todos);
  renderTodos(todos);
}

export function toggleTodo(id) {
  const todos = getTodos();
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos(todos);
    renderTodos(todos);
  }
}

export function deleteTodo(id) {
  let todos = getTodos();
  todos = todos.filter((t) => t.id !== id);
  saveTodos(todos);
  renderTodos(todos);
}

export function showLoginForm() {
  document.getElementById("auth-section").style.display = "block";
  document.getElementById("app-section").style.display = "none";
  document.getElementById("login-container").style.display = "block";
  document.getElementById("register-container").style.display = "none";
}

export function showApp() {
  document.getElementById("auth-section").style.display = "none";
  document.getElementById("app-section").style.display = "block";
  const user = getCurrentUser();
  document.getElementById(
    "welcome-user"
  ).textContent = `Welcome, ${user.username}!`;
}
