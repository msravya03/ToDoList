// LocalStorage-based To-Do Service
import { getCurrentUser } from "./auth.js";

export function getTodos() {
  const user = getCurrentUser();
  if (!user) return [];
  return JSON.parse(localStorage.getItem(`todos_${user.id}`) || "[]");
}

export function saveTodos(todos) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem(`todos_${user.id}`, JSON.stringify(todos));
}
