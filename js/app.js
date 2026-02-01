// Attractive To-Do List App JS
import {
  renderTodos,
  addTodo,
  toggleTodo,
  deleteTodo,
  showLoginForm,
  showApp,
} from "./ui.js";
import { getTodos, saveTodos } from "./todoService.js";
import { isLoggedIn, getCurrentUser, logout, login, register } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  if (isLoggedIn()) {
    showApp();//show the main todo app
    renderTodos(getTodos());//get saved todos and draw them on screen 
    setupTodoEvents();//call function to setup event listener for todo actions(add,toggle,delete)
    setupLogoutEvent();//logout button
  } else {
    showLoginForm();//show login
    setupAuthEvents();//attach event listener to login/register button and forms
  }
}

function setupTodoEvents() {
  document.getElementById("todo-form").addEventListener("submit", function (e) {
    e.preventDefault();
    const input = document.getElementById("todo-input");//get i/p and store in var 
    if (input.value.trim()) {//check if not empty 
      addTodo(input.value.trim());//add todo function call
      input.value = "";//clear to take next i/p
    }
  });

  document.getElementById("todo-list").addEventListener("click", function (e) {
    if (e.target.classList.contains("toggle")) {
      toggleTodo(e.target.dataset.id);
    } else if (e.target.classList.contains("delete")) {
      deleteTodo(e.target.dataset.id);
    }
  });
}

function setupAuthEvents() {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document
    .getElementById("register-form")
    .addEventListener("submit", handleRegister);//register form submit-run handleregister
  document
    .getElementById("show-register")
    .addEventListener("click", showRegisterForm);//button to show register form
  document
    .getElementById("show-login")
    .addEventListener("click", showLoginFormOnly);//button to show login form
}

function setupLogoutEvent() {
  document.getElementById("logout-btn").addEventListener("click", handleLogout);//When the element with id logout-btn is clicked, call handleLogout()
}

function handleLogin(e) {//Define the function that runs when login form is submitted. It gets the event e.
  e.preventDefault();//Prevent page reload on form submit so JS can handle it.
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  if (login(username, password)) {//Call login(...) (from auth.js). If it returns true, the login worked.
    initializeApp();//Re-run initializeApp() to show the app now that the user is logged in.
  } else {
    document.getElementById("login-error").textContent =
      "Invalid username or password";
  }
}

function handleRegister(e) {//Define function to handle register form submit.
  e.preventDefault();//Stop default form submit behavior (no page reload).
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  if (register(username, password)) {
    login(username, password);
    initializeApp();//Show the main app now that registration/log-in succeeded.
  } else {
    document.getElementById("register-error").textContent =
      "Username already exists";
  }
}

function handleLogout() {//Define the function that runs when the user clicks logout.
  logout();
  initializeApp();//Re-run initialization to show the login screen instead of the app.
}

function showRegisterForm() {
  document.getElementById("login-container").style.display = "none";//Hide the login container by setting its CSS display to none.
  document.getElementById("register-container").style.display = "block";//Show the register container by making it visible (block
}

function showLoginFormOnly() {
  document.getElementById("register-container").style.display = "none";//Hide the register container.
  document.getElementById("login-container").style.display = "block";//Show the login container.
  
}
