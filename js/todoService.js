// LocalStorage-based To-Do Service with user isolation
import { getCurrentUser } from "./auth.js";

/**
 * Retrieves all todos for the currently authenticated user.
 * Normalizes any legacy todos with default fields for backwards compatibility.
 * @returns {Array} Array of todo objects
 */
export function getTodos() {
  const user = getCurrentUser();
  if (!user) return [];
  const raw = JSON.parse(localStorage.getItem(`todos_${user.id}`) || "[]");
  return raw.map((todo) => ({
    id: todo.id,
    text: todo.text || "",
    completed: Boolean(todo.completed),
    category: todo.category || "General",
    categoryConfidence: typeof todo.categoryConfidence === "number" ? todo.categoryConfidence : 80,
    priority: todo.priority || "Low",
    dueDate: todo.dueDate || null,
    createdAt: todo.createdAt || new Date(Number(todo.id) || Date.now()).toISOString(),
  }));
}

/**
 * Saves all todos for the current user to localStorage.
 * @param {Array} todos - List of todos to persist
 */
export function saveTodos(todos) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem(`todos_${user.id}`, JSON.stringify(todos));
}

/**
 * Appends a new todo to the user's list.
 * @param {object} todoData - The todo fields
 * @returns {object} The newly created todo
 */
export function addTodoToStorage(todoData) {
  const todos = getTodos();
  const newTodo = {
    id: todoData.id || Date.now().toString(),
    text: todoData.text,
    completed: false,
    category: todoData.category || "General",
    categoryConfidence: todoData.categoryConfidence || 85,
    priority: todoData.priority || "Low",
    dueDate: todoData.dueDate || null,
    createdAt: new Date().toISOString(),
  };
  todos.push(newTodo);
  saveTodos(todos);
  return newTodo;
}

/**
 * Updates an existing todo by ID.
 * @param {string} id - ID of the todo to update
 * @param {object} updatedFields - Fields to update (e.g. text, dueDate, priority, category, completed)
 * @returns {object|null} The updated todo or null if not found
 */
export function updateTodoInStorage(id, updatedFields) {
  const todos = getTodos();
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return null;

  todos[index] = {
    ...todos[index],
    ...updatedFields,
    updatedAt: new Date().toISOString(),
  };

  saveTodos(todos);
  return todos[index];
}

/**
 * Deletes a todo by ID.
 * @param {string} id - ID of the todo to delete
 * @returns {Array} The remaining todos
 */
export function deleteTodoFromStorage(id) {
  let todos = getTodos();
  todos = todos.filter((t) => t.id !== id);
  saveTodos(todos);
  return todos;
}
