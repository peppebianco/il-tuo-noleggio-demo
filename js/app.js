// ------------------------------------------------------------------
// APP: routing, navigazione, topbar
// ------------------------------------------------------------------

const VIEW_RENDERERS = {
  pianificazione: view_pianificazione,
  logistica: view_logistica,
  attivi: view_attivi,
  prenotazioni: view_prenotazioni,
  sospeso: view_sospeso,
  inventario: view_inventario,
  voucher: view_voucher,
  analytics: view_analytics,
  clienti: view_clienti,
  partner: view_partner,
  recensioni: view_recensioni,
  chat: view_chat,
};

let currentView = "pianificazione";

// Sezioni in cui ha senso creare una nuova prenotazione al volo.
// Nelle altre (inventario, voucher, analytics, clienti, partner, recensioni,
// chat) il pulsante in alto viene nascosto perché fuori contesto.
const NEW_BOOKING_BTN_VIEWS = new Set(["pianificazione", "logistica", "attivi", "prenotazioni", "sospeso"]);

function renderView(name) {
  if (!VIEW_RENDERERS[name]) name = "pianificazione";
  currentView = name;
  const root = document.getElementById("viewRoot");
  root.innerHTML = VIEW_RENDERERS[name]();
  root.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.view === name);
  });

  document.getElementById("newBookingBtn").classList.toggle("hidden", !NEW_BOOKING_BTN_VIEWS.has(name));

  if (location.hash.replace("#", "") !== name) {
    history.replaceState(null, "", "#" + name);
  }

  if (name === "analytics") {
    setTimeout(mountAnalyticsChart, 0);
  }

  const sidebar = document.getElementById("sidebar");
  if (sidebar.classList.contains("open")) sidebar.classList.remove("open");
}

function initNav() {
  document.getElementById("nav").addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-item");
    if (!btn) return;
    renderView(btn.dataset.view);
  });
}

function initTopbar() {
  document.getElementById("newBookingBtn").addEventListener("click", openBookingWizard);

  const notifBtn = document.getElementById("notifBtn");
  const notifPanel = document.getElementById("notifPanel");
  notifPanel.innerHTML = NOTIFICATIONS.map(n => `
    <div class="notif-item">
      <div class="notif-icon"><span class="material-symbols-outlined">${n.icon}</span></div>
      <div>
        <div class="notif-title">${escapeHtml(n.title)}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join("");

  notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    notifPanel.classList.toggle("hidden");
  });
  document.addEventListener("click", (e) => {
    if (!notifPanel.contains(e.target) && e.target !== notifBtn) {
      notifPanel.classList.add("hidden");
    }
  });

  const search = document.getElementById("globalSearch");
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && search.value.trim()) {
      uiState.prenotazioniSearch = search.value.trim();
      uiState.prenotazioniTab = "prenotazioni";
      uiState.prenotazioniFilter = "tutte";
      renderView("prenotazioni");
      showToast(`Risultati per "${search.value.trim()}"`, "info", "search");
    }
  });
}

function initSidebarUser() {
  document.getElementById("userMenuBtn").addEventListener("click", () => {
    openInfoModal("Sara Moretti", [
      { label: "Email", value: "sara@iltuonoleggio.demo" },
      { label: "Ruolo", value: "Amministratore" },
      { label: "Ultimo accesso", value: fmtDate(new Date()) },
    ], "account_circle");
  });
  document.getElementById("logoutBtn").addEventListener("click", () => {
    confirmAction("Vuoi davvero uscire dalla demo?", () => {
      logout();
    }, "Esci");
  });
}

function initMobileNav() {
  const toggle = document.getElementById("mobileNavToggle");
  const sidebar = document.getElementById("sidebar");
  toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
}

let appBooted = false;
function bootApp() {
  if (appBooted) return;
  appBooted = true;
  initNav();
  initTopbar();
  initSidebarUser();
  initMobileNav();

  const initial = location.hash.replace("#", "");
  renderView(VIEW_RENDERERS[initial] ? initial : "pianificazione");
}
