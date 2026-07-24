// ------------------------------------------------------------------
// UTILS: formattazione, toast, modali
// ------------------------------------------------------------------

const DOW = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const DOW_SHORT = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

function fmtEuro(n) {
  return "€ " + Number(n).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtEuroShort(n) {
  return "€" + Number(n).toLocaleString("it-IT", { maximumFractionDigits: 2 });
}
function fmtDate(d) {
  const dt = (d instanceof Date) ? d : new Date(d);
  return dt.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtDateShort(d) {
  const dt = (d instanceof Date) ? d : new Date(d);
  return dt.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" });
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------------- TOAST ----------------
function showToast(message, type = "info", icon = "check_circle") {
  const stack = document.getElementById("toastStack");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="material-symbols-outlined">${icon}</span><span>${escapeHtml(message)}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    el.style.transition = "all .25s ease";
    setTimeout(() => el.remove(), 260);
  }, 3200);
}

// ---------------- MODAL ----------------
function openModal(html, opts = {}) {
  const overlay = document.getElementById("modalOverlay");
  const content = document.getElementById("modalContent");
  content.innerHTML = html;
  if (opts.width) content.style.maxWidth = opts.width;
  overlay.classList.remove("hidden");
  requestAnimationFrame(() => overlay.classList.add("visible"));
}
function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  overlay.classList.add("hidden");
  document.getElementById("modalContent").innerHTML = "";
  document.getElementById("modalContent").style.maxWidth = "";
}
document.addEventListener("click", (e) => {
  if (e.target.id === "modalOverlay") closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// generic confirm-detail modal used across sections for "view" style buttons
function openInfoModal(title, rows, icon = "info") {
  const rowsHtml = rows.map(r => `
    <div class="form-field" style="margin-bottom:12px;">
      <label>${escapeHtml(r.label)}</label>
      <div style="font-size:14.5px;font-weight:600;">${escapeHtml(r.value)}</div>
    </div>`).join("");
  openModal(`
    <div class="modal-head">
      <h2><span class="material-symbols-outlined">${icon}</span> ${escapeHtml(title)}</h2>
      <button class="modal-close" onclick="closeModal()"><span class="material-symbols-outlined">close</span></button>
    </div>
    <div class="modal-body">${rowsHtml}</div>
    <div class="modal-foot">
      <button class="btn-primary" style="width:100%;" onclick="closeModal()">Chiudi</button>
    </div>
  `, { width: "480px" });
}

function confirmAction(message, onConfirm, confirmLabel = "Conferma", danger = false) {
  openModal(`
    <div class="modal-head">
      <h2><span class="material-symbols-outlined">${danger ? "warning" : "help"}</span> Conferma</h2>
      <button class="modal-close" onclick="closeModal()"><span class="material-symbols-outlined">close</span></button>
    </div>
    <div class="modal-body"><p style="color:var(--text-dim);font-size:14.5px;">${escapeHtml(message)}</p></div>
    <div class="modal-foot">
      <button class="btn subtle" onclick="closeModal()">Annulla</button>
      <button class="btn-primary" id="confirmActionBtn" style="${danger ? "background:linear-gradient(135deg,#ff5b5b,#c62828);" : ""}">${escapeHtml(confirmLabel)}</button>
    </div>
  `, { width: "420px" });
  document.getElementById("confirmActionBtn").addEventListener("click", () => {
    closeModal();
    onConfirm();
  });
}
