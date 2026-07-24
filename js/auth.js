// ------------------------------------------------------------------
// AUTH: login demo (solo lato client, a scopo dimostrativo)
// ------------------------------------------------------------------

const AUTH_SESSION_KEY = "iltuonoleggio_auth";
const DEMO_EMAIL = "prova@gmail.com";
const DEMO_PASSWORD = "prova123";

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
}

function showApp() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  bootApp();
}

function logout() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      errorBox.classList.add("hidden");
      sessionStorage.setItem(AUTH_SESSION_KEY, "1");
      showApp();
    } else {
      errorBox.classList.remove("hidden");
      document.querySelector(".login-card").classList.remove("shake");
      void document.querySelector(".login-card").offsetWidth;
      document.querySelector(".login-card").classList.add("shake");
      passwordInput.value = "";
      passwordInput.focus();
    }
  });

  if (isAuthenticated()) {
    showApp();
  }
});
