// ------------------------------------------------------------------
// WIZARD: Nuova Prenotazione (multi-step modal)
// ------------------------------------------------------------------

const wizardState = {
  step: 1,
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  start: null,
  end: null,
  tripType: "diretto",
  vehicleId: null,
};

function resetWizard() {
  const now = new Date();
  wizardState.step = 1;
  wizardState.calMonth = now.getMonth();
  wizardState.calYear = now.getFullYear();
  wizardState.start = null;
  wizardState.end = null;
  wizardState.tripType = "diretto";
  wizardState.vehicleId = null;
}

function openBookingWizard() {
  resetWizard();
  renderWizard();
}

function renderWizard() {
  if (wizardState.step === 1) return renderWizardStep1();
  if (wizardState.step === 2) return renderWizardStep2();
  return renderWizardStep3();
}

function buildMiniCalendar() {
  const { calMonth, calYear, start, end } = wizardState;
  const firstOfMonth = new Date(calYear, calMonth, 1);
  let startWeekday = firstOfMonth.getDay() - 1; // week starts Monday
  if (startWeekday < 0) startWeekday = 6;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

  let cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: daysInPrevMonth - startWeekday + i + 1, other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, other: false, date: new Date(calYear, calMonth, d) });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - startWeekday - daysInMonth + 1, other: true });
  }

  const today = new Date();
  const dowHtml = DOW_SHORT.slice(1).concat(DOW_SHORT[0]).map(d => `<div class="dow">${d.toUpperCase()}</div>`).join("");

  const cellsHtml = cells.map(c => {
    if (c.other) return `<div class="day other">${c.day}</div>`;
    let cls = "day";
    if (sameDay(c.date, today)) cls += " today";
    if (wizardState.start && sameDay(c.date, wizardState.start)) cls += " selected";
    if (wizardState.end && sameDay(c.date, wizardState.end)) cls += " selected";
    if (wizardState.start && wizardState.end && c.date > wizardState.start && c.date < wizardState.end) cls += " in-range";
    return `<div class="${cls}" onclick="wizardPickDate(${c.date.getFullYear()},${c.date.getMonth()},${c.date.getDate()})">${c.day}</div>`;
  }).join("");

  return `
    <div class="mini-cal">
      <div class="mini-cal-head">
        <button onclick="wizardChangeMonth(-1)"><span class="material-symbols-outlined">chevron_left</span></button>
        <span>${MONTHS[calMonth].toUpperCase()} ${calYear}</span>
        <button onclick="wizardChangeMonth(1)"><span class="material-symbols-outlined">chevron_right</span></button>
      </div>
      <div class="mini-cal-grid">${dowHtml}${cellsHtml}</div>
    </div>
  `;
}

function wizardChangeMonth(delta) {
  wizardState.calMonth += delta;
  if (wizardState.calMonth < 0) { wizardState.calMonth = 11; wizardState.calYear--; }
  if (wizardState.calMonth > 11) { wizardState.calMonth = 0; wizardState.calYear++; }
  renderWizard();
}

function wizardPickDate(y, m, d) {
  const picked = new Date(y, m, d);
  if (!wizardState.start || (wizardState.start && wizardState.end)) {
    wizardState.start = picked;
    wizardState.end = null;
  } else if (picked < wizardState.start) {
    wizardState.end = wizardState.start;
    wizardState.start = picked;
  } else if (sameDay(picked, wizardState.start)) {
    wizardState.end = addDays(picked, 1);
  } else {
    wizardState.end = picked;
  }
  renderWizard();
}

function renderWizardStep1() {
  const canContinue = wizardState.start && wizardState.end;
  openModal(`
    <div class="modal-head">
      <div>
        <h2><span class="material-symbols-outlined">location_on</span> Seleziona Date e Veicolo</h2>
        <div class="crumb">VEICOLO <span class="dim">&gt;</span> <span class="dim">DETTAGLI</span></div>
      </div>
      <button class="modal-close" onclick="closeModal()"><span class="material-symbols-outlined">close</span></button>
    </div>
    <div class="modal-body">
      <div class="step-label">1. QUANDO È IL RITIRO?</div>
      ${buildMiniCalendar()}
    </div>
    <div class="modal-foot">
      <div style="flex:1;color:var(--text-faint);font-size:12.5px;display:flex;align-items:center;">Passaggio 1 di 3</div>
      <button class="btn subtle" onclick="closeModal()">Annulla</button>
      <button class="btn-primary" ${canContinue ? "" : "disabled style='opacity:.4;'"} onclick="wizardGoStep2()">Continua <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward</span></button>
    </div>
  `, { width: "520px" });
}

function wizardGoStep2() {
  if (!wizardState.start || !wizardState.end) return;
  wizardState.step = 2;
  renderWizard();
}

function renderWizardStep2() {
  const days = Math.max(1, Math.round((wizardState.end - wizardState.start) / 86400000));
  const available = VEHICLES.filter(v => (wizardState.tripType === "diretto" ? true : true));
  const rows = available.map(v => `
    <div class="veh-option ${wizardState.vehicleId === v.id ? "selected" : ""}" onclick="wizardSelectVehicle('${v.id}')">
      <div class="veh-radio"></div>
      <div class="vname">${escapeHtml(v.name)}<div class="vavail">${(v.bari + v.monopoli) || 1} LIBERI</div></div>
      <div class="vprice">€${v.price * days}</div>
    </div>
  `).join("");

  openModal(`
    <div class="modal-head">
      <div>
        <h2><span class="material-symbols-outlined">location_on</span> Seleziona Date e Veicolo</h2>
        <div class="crumb" style="color:var(--accent);">VEICOLO <span class="dim">&gt;</span> <span class="dim">DETTAGLI</span></div>
      </div>
      <button class="modal-close" onclick="closeModal()"><span class="material-symbols-outlined">close</span></button>
    </div>
    <div class="modal-body">
      <div class="summary-row">
        <span>${days} giorni (${fmtDate(wizardState.start)} → ${fmtDate(wizardState.end)})</span>
        <a style="color:var(--accent);font-weight:700;cursor:pointer;" onclick="wizardState.step=1;renderWizard();">Cambia</a>
      </div>
      <div class="trip-toggle">
        <button class="${wizardState.tripType === "diretto" ? "active" : ""}" onclick="wizardSetTrip('diretto')">DIRETTO</button>
        <button class="${wizardState.tripType === "scali" ? "active" : ""}" onclick="wizardSetTrip('scali')">CON SCALI</button>
      </div>
      <button class="ext-btn" onclick="showToast('Funzione prestito veicolo esterno (demo)','info','directions_car')">
        <span class="material-symbols-outlined">add</span> PRESTITO VEICOLO ESTERNO
      </button>
      ${rows}
    </div>
    <div class="modal-foot">
      <div style="flex:1;color:var(--text-faint);font-size:12.5px;display:flex;align-items:center;">Passaggio 2 di 3</div>
      <button class="btn subtle" onclick="wizardState.step=1;renderWizard();">Indietro</button>
      <button class="btn-primary" ${wizardState.vehicleId ? "" : "style='opacity:.4;'"} onclick="wizardGoStep3()">Dettagli <span class="material-symbols-outlined" style="font-size:16px;">arrow_forward</span></button>
    </div>
  `, { width: "560px" });
}

function wizardSetTrip(t) {
  wizardState.tripType = t;
  renderWizard();
}
function wizardSelectVehicle(id) {
  wizardState.vehicleId = id;
  renderWizard();
}
function wizardGoStep3() {
  if (!wizardState.vehicleId) return;
  wizardState.step = 3;
  renderWizard();
}

function renderWizardStep3() {
  const veh = VEHICLES.find(v => v.id === wizardState.vehicleId);
  const days = Math.max(1, Math.round((wizardState.end - wizardState.start) / 86400000));
  const total = veh.price * days;
  openModal(`
    <div class="modal-head">
      <div>
        <h2><span class="material-symbols-outlined">person</span> Dettagli Cliente</h2>
        <div class="crumb">VEICOLO <span class="dim">&gt;</span> DETTAGLI</div>
      </div>
      <button class="modal-close" onclick="closeModal()"><span class="material-symbols-outlined">close</span></button>
    </div>
    <div class="modal-body">
      <div class="summary-row">
        <span>${escapeHtml(veh.name)} · ${days}g</span>
        <span style="color:var(--accent);">${fmtEuro(total)}</span>
      </div>
      <div class="form-grid">
        <div class="form-row2">
          <div class="form-field"><label>Nome cliente</label><input id="wzName" placeholder="Mario Rossi"></div>
          <div class="form-field"><label>Telefono</label><input id="wzPhone" placeholder="+39 ..."></div>
        </div>
        <div class="form-field"><label>Email</label><input id="wzEmail" placeholder="mario.rossi@email.com"></div>
        <div class="form-field"><label>Luogo di consegna</label>
          <select id="wzLocation">
            ${LOCATIONS.map(l => `<option>${escapeHtml(l)}</option>`).join("")}
          </select>
        </div>
        <div class="form-field"><label>Gestore</label>
          <select id="wzAgent">${AGENTS.map(a => `<option>${a}</option>`).join("")}</select>
        </div>
        <div class="form-field"><label>Note (opzionale)</label><textarea id="wzNotes" rows="2" placeholder="Note aggiuntive..."></textarea></div>
      </div>
    </div>
    <div class="modal-foot">
      <div style="flex:1;color:var(--text-faint);font-size:12.5px;display:flex;align-items:center;">Passaggio 3 di 3</div>
      <button class="btn subtle" onclick="wizardState.step=2;renderWizard();">Indietro</button>
      <button class="btn-primary" onclick="wizardConfirmBooking()">Conferma Prenotazione</button>
    </div>
  `, { width: "560px" });
}

function wizardConfirmBooking() {
  const name = document.getElementById("wzName").value.trim() || "Cliente Demo";
  const phone = document.getElementById("wzPhone").value.trim() || "+39 000 0000000";
  const agent = document.getElementById("wzAgent").value;
  const location = document.getElementById("wzLocation").value;
  const veh = VEHICLES.find(v => v.id === wizardState.vehicleId);
  const days = Math.max(1, Math.round((wizardState.end - wizardState.start) / 86400000));

  BOOKINGS.unshift({
    id: 1200 + BOOKINGS.length + 1,
    customer: name,
    phone,
    vehicle: veh.name,
    start: wizardState.start,
    end: wizardState.end,
    days,
    location,
    agent,
    status: "Confermata",
    total: veh.price * days,
    extra: null,
  });

  closeModal();
  showToast(`Prenotazione creata per ${name}`, "success", "check_circle");
  if (currentView === "prenotazioni") renderView("prenotazioni");
  if (currentView === "pianificazione") renderView("pianificazione");
}
