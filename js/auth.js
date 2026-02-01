// Authentication module
let currentUser = null;

export function getCurrentUser() {
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  }
  return currentUser;
}

export function setCurrentUser(user) {
  currentUser = user;
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  } else {
    localStorage.removeItem("currentUser");
  }
}

export function isLoggedIn() {
  return getCurrentUser() !== null;
}

export function login(username, password) {
  // Simple demo authentication - in production, use real backend
  const users = JSON.parse(localStorage.getItem("users") || "[]");
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    setCurrentUser({ username: user.username, id: user.id });
    return true;
  }
  return false;
}

export function register(username, password) {
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  if (users.find((u) => u.username === username)) {
    return false; // User already exists
  }

  const newUser = {
    id: Date.now().toString(),
    username,
    password,
  };

  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
  return true;
}

export function logout() {
  setCurrentUser(null);
}
