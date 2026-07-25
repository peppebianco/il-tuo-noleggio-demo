// ------------------------------------------------------------------
// VIEWS: rendering delle singole sezioni del gestionale
// ------------------------------------------------------------------

const uiState = {
  planningWeekStart: (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })(),
  logisticsFilter: "tutti",
  prenotazioniTab: "prenotazioni",
  prenotazioniFilter: "tutte",
  prenotazioniSearch: "",
  analyticsPeriod: "30",
  analyticsMode: "grafico",
  analyticsRequestSort: "totale",
  partnerTab: "codici",
  chatActive: 0,
};

function seededRand(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function icon(name, extraClass = "") {
  return `<span class="material-symbols-outlined ${extraClass}">${name}</span>`;
}

const STATUS_PILL_CLASS = { "Confermata": "blue", "Attiva": "green", "Completata": "gray", "Annullata": "red" };

// ==================================================================
// PIANIFICAZIONE
// ==================================================================
function vehicleBookingRanges(vIndex) {
  const ranges = [];
  let cursor = -14;
  for (let i = 0; i < 6; i++) {
    const gap = Math.floor(seededRand(vIndex * 31 + i * 7) * 4) + 1;
    cursor += gap;
    const dur = Math.floor(seededRand(vIndex * 53 + i * 11) * 4) + 1;
    const pending = seededRand(vIndex * 17 + i * 3) > 0.85;
    ranges.push({ start: cursor, end: cursor + dur, pending });
    cursor += dur;
  }
  return ranges;
}

function view_pianificazione() {
  const start = uiState.planningWeekStart;
  const today = new Date(); today.setHours(0,0,0,0);
  const days = [];
  for (let i = 0; i < 7; i++) days.push(addDays(start, i));

  const headerCells = days.map(d => `
    <th>
      <span class="dow">${DOW_SHORT[d.getDay()]}</span>
      <span class="dnum">${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}</span>
    </th>
  `).join("");

  function renderCategory(catName, vehicles) {
    const catRow = `<tr class="category-row"><td colspan="8">${catName}</td></tr>`;
    const rows = vehicles.map((v, idx) => {
      const globalIdx = VEHICLES.indexOf(v);
      const ranges = vehicleBookingRanges(globalIdx);
      const dayOffsetBase = Math.round((start - today) / 86400000);
      const cells = days.map((d, dayIdx) => {
        const absOffset = dayOffsetBase + dayIdx;
        const range = ranges.find(r => absOffset >= r.start && absOffset <= r.end);
        if (!range) return `<td></td>`;
        let blocks = "";
        const cls = range.pending ? "pendente" : "confermata";
        const label = range.pending ? "RICHIESTA" : "CONSEGNA";
        if (absOffset === range.start) {
          blocks += `<div class="pg-block ${cls}" onclick="openInfoModal('${escapeHtml(v.name)}',[
            {label:'Evento', value:'${label}'},
            {label:'Veicolo', value:'${escapeHtml(v.name)}'},
            {label:'Cliente', value:'${escapeHtml(pick(CUSTOMERS, globalIdx + dayIdx).name)}'},
            {label:'Orario', value:'09:00'},
            {label:'Luogo', value:'${escapeHtml(pick(LOCATIONS, globalIdx).replace(/'/g,""))}'}
          ],'event')"><span class="t">${String(9).padStart(2,"0")}:00</span>${label}</div>`;
        }
        if (absOffset === range.end && range.end !== range.start) {
          blocks += `<div class="pg-block riconsegna" onclick="openInfoModal('${escapeHtml(v.name)}',[
            {label:'Evento', value:'RICONSEGNA'},
            {label:'Veicolo', value:'${escapeHtml(v.name)}'},
            {label:'Cliente', value:'${escapeHtml(pick(CUSTOMERS, globalIdx + dayIdx).name)}'},
            {label:'Orario', value:'19:00'}
          ],'event_busy')"><span class="t">19:00</span>RICONSEGNA</div>`;
        }
        if (absOffset > range.start && absOffset < range.end) {
          blocks += `<div class="pg-block ${cls}" style="height:36px;cursor:pointer;" onclick="openInfoModal('${escapeHtml(v.name)}',[{label:'Stato', value:'Veicolo occupato — noleggio in corso'}],'directions_car')"></div>`;
        }
        return `<td>${blocks}</td>`;
      }).join("");
      return `<tr><td class="veicolo-col">🚗 ${escapeHtml(v.name)}</td>${cells}</tr>`;
    }).join("");
    return catRow + rows;
  }

  const autoVehicles = VEHICLES.filter(v => v.cat === "AUTOVEICOLI");
  const scooterVehicles = VEHICLES.filter(v => v.cat === "SCOOTER");

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Pianificazione Flotta</h1>
        <p class="view-subtitle">Visualizza l'occupazione dei veicoli in tempo reale</p>
      </div>
      <div class="grid-toolbar" style="margin:0;">
        <div class="date-nav">
          <button onclick="planningShiftWeek(-7)">${icon("chevron_left")}</button>
          <span style="font-weight:700;font-size:13.5px;">${fmtDate(start)}</span>
          <button class="today-badge" onclick="planningGoToday()">OGGI</button>
          <button onclick="planningShiftWeek(7)">${icon("chevron_right")}</button>
        </div>
      </div>
    </div>

    <div class="planning-grid">
      <table class="pg-table">
        <thead><tr><th class="veicolo-col">Veicolo</th>${headerCells}</tr></thead>
        <tbody>
          ${renderCategory("AUTOVEICOLI", autoVehicles)}
          ${renderCategory("SCOOTER", scooterVehicles)}
        </tbody>
      </table>
    </div>
    <div class="legend">
      <span><span class="dot" style="background:var(--blue);"></span>CONFERMATA</span>
      <span><span class="dot" style="background:#b58a12;"></span>RICHIESTA / PENDENTE</span>
      <span><span class="dot" style="background:#c9601b;"></span>RICONSEGNA</span>
      <span><span class="dot" style="background:var(--card-2);border:1px solid var(--border);"></span>LIBERA</span>
    </div>
  `;
}
function planningShiftWeek(n) {
  uiState.planningWeekStart = addDays(uiState.planningWeekStart, n);
  renderView("pianificazione");
}
function planningGoToday() {
  const d = new Date(); d.setHours(0,0,0,0);
  uiState.planningWeekStart = d;
  renderView("pianificazione");
}

// ==================================================================
// LOGISTICA
// ==================================================================
function view_logistica() {
  const list = LOGISTICS_TODAY.filter(x => {
    if (uiState.logisticsFilter === "tutti") return true;
    return x.type === (uiState.logisticsFilter === "consegne" ? "consegna" : "ritiro");
  });
  const consegne = LOGISTICS_TODAY.filter(x => x.type === "consegna");
  const ritiri = LOGISTICS_TODAY.filter(x => x.type === "ritiro");
  const consegneTot = consegne.reduce((s, x) => s + x.price, 0);

  const rows = list.map((x) => {
    const idx = LOGISTICS_TODAY.indexOf(x);
    const isConsegna = x.type === "consegna";
    return `
    <div class="info-row ${x.type} vivid" onclick="openMovementDetail(${idx})">
      <div class="time-badge ${isConsegna ? "blue" : "orange"}">
        ${x.time}
        <span class="lbl">${isConsegna ? "CONSEGNA" : "RITIRO"}</span>
        <span class="amt">€${x.price}</span>
      </div>
      <div class="info-main">
        <div class="info-title-row">
          <span class="info-title">${escapeHtml(x.vehicle.toUpperCase())}</span>
          ${x.code ? `<span class="tag-vivid ${isConsegna ? "blue" : "orange"}">${x.code}</span>` : ""}
        </div>
        <div class="info-customer">
          <span>${icon("person")} ${escapeHtml(x.customer)} · ${escapeHtml(x.phone)}</span>
          <span class="tag-vivid agent">${x.agent}</span>
          <span class="tag">#${x.ref}</span>
        </div>
        <div class="info-loc">${icon("location_on")} ${escapeHtml(x.location)} ${x.tag ? `<span class="tag" style="margin-left:8px;">${x.tag}</span>` : ""}</div>
      </div>
      <div class="info-actions" onclick="event.stopPropagation()">
        <button class="icon-action blue" title="Allegati" onclick="showToast('Nessun allegato presente (demo)')">${icon("attach_file")}</button>
        <button class="icon-action orange" title="Modifica" onclick="openInfoModal('Modifica movimento',[{label:'Veicolo',value:'${escapeHtml(x.vehicle)}'},{label:'Cliente',value:'${escapeHtml(x.customer)}'},{label:'Orario',value:'${x.time}'}],'edit')">${icon("edit")}</button>
        <button class="icon-action wa" title="WhatsApp" onclick="showToast('Apertura chat WhatsApp con ${escapeHtml(x.customer)} (demo)','success','forum')">${icon("forum")}</button>
        <button class="icon-action blue" title="Apri" onclick="renderView('prenotazioni')">${icon("open_in_new")}</button>
        <button class="icon-action del" title="Elimina" onclick="confirmAction('Eliminare il movimento di ${escapeHtml(x.customer)}?', () => { showToast('Movimento eliminato (demo)','success','delete'); }, 'Elimina', true)">${icon("delete")}</button>
        <button class="btn-confirm-move ${isConsegna ? "blue" : "orange"}" onclick="confirmMovement(${idx})">${icon("check")} ${isConsegna ? "Consegna" : "Ritiro"}</button>
      </div>
    </div>
  `;
  }).join("");

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">To-Do List Operativo</h1>
        <p class="view-subtitle">Attività di logistica e flotta per giorno.</p>
      </div>
      <div class="date-field">${icon("calendar_month")} ${fmtDate(new Date())}</div>
    </div>

    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);">
      <div class="stat-card">
        <div class="stat-label">Totale <span class="stat-icon" style="background:var(--card-2);">${icon("checklist")}</span></div>
        <div class="stat-value">${LOGISTICS_TODAY.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Consegne <span class="stat-icon" style="background:var(--blue-soft);color:#7d9bff;">${icon("local_shipping")}</span></div>
        <div class="stat-value">${consegne.length}</div>
        <div class="stat-sub">${fmtEuro(consegneTot)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Ritiri <span class="stat-icon" style="background:var(--green-soft);color:var(--green);">${icon("swap_horiz")}</span></div>
        <div class="stat-value">${ritiri.length}</div>
      </div>
    </div>

    <div class="searchbar">
      ${icon("search")}
      <input placeholder="Cerca cliente, targa o veicolo..." oninput="logisticsSearch(this.value)">
    </div>
    <div class="chip-group" style="margin-bottom:18px;">
      <button class="chip ${uiState.logisticsFilter === 'tutti' ? 'active' : ''}" onclick="logisticsSetFilter('tutti')">Tutti <span class="count">(${LOGISTICS_TODAY.length})</span></button>
      <button class="chip ${uiState.logisticsFilter === 'consegne' ? 'active' : ''}" onclick="logisticsSetFilter('consegne')">Consegne <span class="count">(${consegne.length})</span></button>
      <button class="chip ${uiState.logisticsFilter === 'ritiri' ? 'active' : ''}" onclick="logisticsSetFilter('ritiri')">Ritiri <span class="count">(${ritiri.length})</span></button>
    </div>

    <div class="info-list" id="logisticsList">${rows || `<div class="empty-state">${icon('inbox')}<div>Nessun movimento</div></div>`}</div>
  `;
}
function logisticsSetFilter(f) { uiState.logisticsFilter = f; renderView("logistica"); }
function logisticsSearch(q) {
  q = q.toLowerCase();
  document.querySelectorAll("#logisticsList .info-row").forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}
function confirmMovement(idx) {
  const x = LOGISTICS_TODAY[idx];
  const label = x.type === "consegna" ? "Consegna" : "Ritiro";
  showToast(`${label} confermata per ${escapeHtml(x.customer)}`, "success", "check_circle");
}

function openMovementDetail(idx) {
  const x = LOGISTICS_TODAY[idx];
  const isConsegna = x.type === "consegna";
  const fmtDT = (d) => `${fmtDate(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  openModal(`
    <div class="modal-head movement-head">
      <span class="pill ${isConsegna ? "blue" : "orange"}" style="font-size:12px;padding:6px 12px;">${icon(isConsegna ? "local_shipping" : "swap_horiz", "")} ${isConsegna ? "CONSEGNA" : "RITIRO"}</span>
      <button class="modal-close" onclick="closeModal()">${icon("close")}</button>
    </div>
    <div class="modal-body">
      <div class="movement-title-row">
        <h2 class="movement-title">${escapeHtml(x.vehicle.toUpperCase())}</h2>
        <div class="movement-received">
          Ricevuta il ${fmtDate(x.receivedDate)}
          <span class="tag" style="margin-left:8px;">#${x.ref}</span>
        </div>
      </div>

      <div class="movement-field"><span class="material-symbols-outlined">event</span><div><label>Data</label><b>${fmtDate(x.deliveryDateTime)}</b></div></div>
      <div class="movement-field"><span class="material-symbols-outlined">schedule</span><div><label>Orario</label><b>${x.time}</b></div></div>
      <div class="movement-field"><span class="material-symbols-outlined">local_shipping</span><div><label>Data Consegna</label><b class="mv-blue">${fmtDT(x.deliveryDateTime)}</b></div></div>
      <div class="movement-field"><span class="material-symbols-outlined">assignment_return</span><div><label>Data Riconsegna</label><b class="mv-purple">${fmtDT(x.returnDateTime)}</b></div></div>
      <div class="movement-field"><span class="material-symbols-outlined">local_shipping</span><div><label>Consegna</label><b>${escapeHtml(x.deliveryAddress)} <a href="#" class="mv-link" onclick="event.preventDefault();showToast('Apertura Maps (demo)','info','map')">Maps</a></b></div></div>
      <div class="movement-field"><span class="material-symbols-outlined">near_me</span><div><label>Riconsegna</label><b>${escapeHtml(x.returnAddress)} <a href="#" class="mv-link" onclick="event.preventDefault();showToast('Apertura Maps (demo)','info','map')">Maps</a></b></div></div>
      <div class="movement-field"><span class="material-symbols-outlined">call</span><div><label>Telefono</label><b>${escapeHtml(x.phone)} <a href="#" class="mv-link mv-green" onclick="event.preventDefault();showToast('Apertura chat WhatsApp (demo)','success','forum')">WhatsApp</a></b></div></div>
      <div class="movement-field"><span class="material-symbols-outlined">mail</span><div><label>Email</label><b class="mv-blue">${escapeHtml(x.email)}</b></div></div>
      <div class="movement-field"><span class="material-symbols-outlined">home_pin</span><div><label>Indirizzo Cliente</label><b>${escapeHtml(x.clientAddress)}</b></div></div>
      ${x.tag ? `<div class="movement-field"><span class="material-symbols-outlined">info</span><div><label>Note</label><b>${escapeHtml(x.tag)}</b></div></div>` : ""}
    </div>
    <div class="modal-foot">
      <button class="btn subtle" onclick="closeModal()">Chiudi</button>
      <button class="btn-primary" onclick="closeModal(); confirmMovement(${idx});">${icon("check")} Conferma ${isConsegna ? "Consegna" : "Ritiro"}</button>
    </div>
  `, { width: "520px" });
}

// ==================================================================
// NOLEGGI ATTIVI
// ==================================================================
function view_attivi() {
  const rows = ACTIVE_RENTALS.map(r => `
    <div class="info-row">
      <div class="clock-chip">${icon("schedule")}<b>${r.remaining}</b><span>RIMASTO</span></div>
      <div class="info-main">
        <div class="info-title-row">
          <span class="info-title">${escapeHtml(r.vehicle.toUpperCase())}</span>
          <span class="tag">${escapeHtml(r.code)}</span>
        </div>
        <div class="info-customer"><span>${r.start} → ${r.end}</span></div>
        <div class="info-customer">
          <span>${icon("person")} ${escapeHtml(r.customer)} · ${escapeHtml(r.phone)}</span>
        </div>
      </div>
      <div class="info-actions">
        <button class="icon-action wa" title="WhatsApp" onclick="showToast('Apertura chat WhatsApp con ${escapeHtml(r.customer)} (demo)','success','forum')">${icon("forum")} WA</button>
        <select class="select-pill" onchange="showToast('Gestore aggiornato a ' + this.value,'success')">
          ${AGENTS.map(a => `<option ${a === r.agent ? "selected" : ""}>${a}</option>`).join("")}
        </select>
      </div>
    </div>
  `).join("");
  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Noleggi Attivi</h1>
        <p class="view-subtitle">Veicoli attualmente fuori sede.</p>
      </div>
    </div>
    <div class="searchbar">${icon("search")}<input id="attiviSearch" placeholder="Cerca veicolo, cliente o telefono..." oninput="attiviSearch(this.value)"></div>
    <div class="info-list" id="attiviList">${rows}</div>
  `;
}
function attiviSearch(q) {
  q = q.toLowerCase();
  document.querySelectorAll("#attiviList .info-row").forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

// ==================================================================
// PRENOTAZIONI
// ==================================================================
function view_prenotazioni() {
  const counts = {
    tutte: BOOKINGS.length,
    confermate: BOOKINGS.filter(b => b.status === "Confermata").length,
    "in corso": BOOKINGS.filter(b => b.status === "Attiva").length,
    completate: BOOKINGS.filter(b => b.status === "Completata").length,
    annullate: BOOKINGS.filter(b => b.status === "Annullata").length,
  };

  let filtered = BOOKINGS.filter(b => {
    if (uiState.prenotazioniFilter === "tutte") return true;
    if (uiState.prenotazioniFilter === "confermate") return b.status === "Confermata";
    if (uiState.prenotazioniFilter === "in corso") return b.status === "Attiva";
    if (uiState.prenotazioniFilter === "completate") return b.status === "Completata";
    if (uiState.prenotazioniFilter === "annullate") return b.status === "Annullata";
    return true;
  });
  if (uiState.prenotazioniSearch) {
    const q = uiState.prenotazioniSearch.toLowerCase();
    filtered = filtered.filter(b => (b.customer + b.vehicle + b.id).toLowerCase().includes(q));
  }

  const pillClass = STATUS_PILL_CLASS;

  const rowsHtml = filtered.slice(0, 60).map((b, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>
        <div class="cell-strong">${escapeHtml(b.customer)}</div>
        <div class="cell-sub">${escapeHtml(b.phone)}</div>
      </td>
      <td>
        <div class="cell-strong">${escapeHtml(b.vehicle)}</div>
        ${b.extra ? `<div class="tag" style="margin-top:4px;display:inline-block;">${escapeHtml(b.extra)}</div>` : ""}
      </td>
      <td>
        <div>${fmtDateShort(b.start)} → ${fmtDateShort(b.end)}</div>
        <div class="cell-sub">${b.days} giorni</div>
      </td>
      <td><div class="cell-sub" style="max-width:170px;">${icon("location_on","")} ${escapeHtml(b.location)}</div></td>
      <td>
        <select class="select-pill" onchange="showToast('Gestore aggiornato a ' + this.value,'success')">
          ${AGENTS.map(a => `<option ${a === b.agent ? "selected" : ""}>${a}</option>`).join("")}
        </select>
      </td>
      <td><span class="pill ${pillClass[b.status]}">${b.status}</span></td>
      <td class="cell-strong">${fmtEuro(b.total)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-action wa" title="WhatsApp" onclick="showToast('Apertura chat WhatsApp con ${escapeHtml(b.customer)} (demo)','success','forum')">${icon("forum")}</button>
          <button class="icon-action edit" title="Modifica" onclick="openInfoModal('Prenotazione #${b.id}',[
            {label:'Cliente', value:'${escapeHtml(b.customer)}'},
            {label:'Veicolo', value:'${escapeHtml(b.vehicle)}'},
            {label:'Periodo', value:'${fmtDate(b.start)} → ${fmtDate(b.end)}'},
            {label:'Totale', value:'${fmtEuro(b.total)}'},
            {label:'Stato', value:'${b.status}'}
          ],'edit')">${icon("edit")}</button>
          <button class="icon-action del" title="Elimina" onclick="deletePrenotazione(${b.id})">${icon("delete")}</button>
        </div>
      </td>
    </tr>
  `).join("");

  const reqRows = BOOKING_REQUESTS.map(r => `
    <div class="info-row">
      <div class="time-badge" style="background:var(--orange-soft);color:var(--orange);">${icon("schedule")}<span class="lbl">RICHIESTA</span></div>
      <div class="info-main">
        <div class="info-title-row"><span class="info-title">${escapeHtml(r.vehicle.toUpperCase())}</span></div>
        <div class="info-customer"><span>${icon("person")} ${escapeHtml(r.customer)} · ${escapeHtml(r.phone)}</span></div>
        <div class="info-loc">${icon("location_on")} ${escapeHtml(r.location)} · ${fmtDate(r.start)} → ${fmtDate(r.end)} · ${fmtEuro(r.total)}</div>
      </div>
      <div class="info-actions">
        <button class="btn green small" onclick="approveRequest(${r.id})">${icon("check")} Accetta</button>
        <button class="btn danger small" onclick="showToast('Richiesta rifiutata (demo)','error','close')">${icon("close")} Rifiuta</button>
      </div>
    </div>
  `).join("");

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Prenotazioni</h1>
        <p class="view-subtitle">Gestisci tutte le prenotazioni della flotta.</p>
      </div>
    </div>

    <div class="chip-group" style="margin-bottom:18px;">
      <button class="chip ${uiState.prenotazioniTab === 'richieste' ? 'active' : ''}" onclick="prenotazioniSetTab('richieste')">${icon('schedule')} Richieste <span class="count">${BOOKING_REQUESTS.length}</span></button>
      <button class="chip ${uiState.prenotazioniTab === 'prenotazioni' ? 'active' : ''}" onclick="prenotazioniSetTab('prenotazioni')">${icon('calendar_month')} Prenotazioni <span class="count">${BOOKINGS.length}</span></button>
    </div>

    ${uiState.prenotazioniTab === "richieste" ? `
      <div class="info-list">${reqRows || `<div class="empty-state">${icon('inbox')}<div>Nessuna richiesta in sospeso</div></div>`}</div>
    ` : `
      <div class="toolbar">
        <div class="searchbar" style="flex:1;min-width:220px;margin:0;">
          ${icon("search")}<input placeholder="Cerca cliente, ID o veicolo..." value="${escapeHtml(uiState.prenotazioniSearch)}" oninput="prenotazioniSearch(this.value)">
        </div>
        <div class="date-field">${icon("calendar_month")} gg/mm/aaaa</div>
      </div>
      <div class="chip-group" style="margin-bottom:18px;">
        <button class="chip ${uiState.prenotazioniFilter === 'tutte' ? 'active' : ''}" onclick="prenotazioniSetFilter('tutte')">Tutte <span class="count">${counts.tutte}</span></button>
        <button class="chip ${uiState.prenotazioniFilter === 'confermate' ? 'active' : ''}" onclick="prenotazioniSetFilter('confermate')">Confermate <span class="count">${counts.confermate}</span></button>
        <button class="chip ${uiState.prenotazioniFilter === 'in corso' ? 'active' : ''}" onclick="prenotazioniSetFilter('in corso')">In Corso <span class="count">${counts["in corso"]}</span></button>
        <button class="chip ${uiState.prenotazioniFilter === 'completate' ? 'active' : ''}" onclick="prenotazioniSetFilter('completate')">Completate <span class="count">${counts.completate}</span></button>
        <button class="chip ${uiState.prenotazioniFilter === 'annullate' ? 'active' : ''}" onclick="prenotazioniSetFilter('annullate')">Annullate <span class="count">${counts.annullate}</span></button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>N°</th><th>Cliente</th><th>Veicolo</th><th>Periodo</th><th>Logistica C/R</th><th>Gestore</th><th>Status</th><th>Totale</th><th></th></tr></thead>
          <tbody>${rowsHtml || `<tr><td colspan="9" style="text-align:center;color:var(--text-faint);padding:30px;">Nessuna prenotazione trovata</td></tr>`}</tbody>
        </table>
      </div>
    `}
  `;
}
function prenotazioniSetTab(t) { uiState.prenotazioniTab = t; renderView("prenotazioni"); }
function prenotazioniSetFilter(f) { uiState.prenotazioniFilter = f; renderView("prenotazioni"); }
function prenotazioniSearch(v) { uiState.prenotazioniSearch = v; renderView("prenotazioni"); }
function deletePrenotazione(id) {
  confirmAction("Eliminare definitivamente questa prenotazione?", () => {
    const idx = BOOKINGS.findIndex(b => b.id === id);
    if (idx > -1) BOOKINGS.splice(idx, 1);
    showToast("Prenotazione eliminata", "success", "delete");
    renderView("prenotazioni");
  }, "Elimina", true);
}
function approveRequest(id) {
  const idx = BOOKING_REQUESTS.findIndex(r => r.id === id);
  if (idx > -1) {
    const r = BOOKING_REQUESTS[idx];
    BOOKINGS.unshift({ id: r.id, customer: r.customer, phone: r.phone, vehicle: r.vehicle, start: r.start, end: r.end, days: 2, location: r.location, agent: "Sara", status: "Confermata", total: r.total, extra: null });
    BOOKING_REQUESTS.splice(idx, 1);
  }
  showToast("Richiesta accettata e trasformata in prenotazione", "success", "check_circle");
  renderView("prenotazioni");
}

// ==================================================================
// IN SOSPESO
// ==================================================================
function view_sospeso() {
  const pending = BOOKINGS.filter(b => b.status === "Confermata").slice(0, 8);
  const rows = pending.map(b => `
    <div class="info-row">
      <div class="time-badge" style="background:var(--orange-soft);color:var(--orange);">${icon("pending_actions")}<span class="lbl">ATTESA</span></div>
      <div class="info-main">
        <div class="info-title-row"><span class="info-title">${escapeHtml(b.vehicle.toUpperCase())}</span></div>
        <div class="info-customer"><span>${icon("person")} ${escapeHtml(b.customer)}</span><span class="tag">Pagamento da confermare</span></div>
        <div class="info-loc">${icon("event")} ${fmtDate(b.start)} → ${fmtDate(b.end)} · ${fmtEuro(b.total)}</div>
      </div>
      <div class="info-actions">
        <button class="btn green small" onclick="showToast('Segnato come saldato (demo)','success','done_all')">${icon("done_all")} Salda</button>
        <button class="icon-action" title="Promemoria" onclick="showToast('Promemoria inviato al cliente (demo)','success','notifications')">${icon("notifications")}</button>
      </div>
    </div>
  `).join("");
  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">In Sospeso</h1>
        <p class="view-subtitle">Pagamenti e conferme in attesa di chiusura.</p>
      </div>
    </div>
    <div class="info-list">${rows || `<div class="empty-state">${icon('task_alt')}<div>Nessun elemento in sospeso 🎉</div></div>`}</div>
  `;
}

// ==================================================================
// INVENTARIO
// ==================================================================
function view_inventario() {
  const cards = VEHICLES.map(v => {
    const totalAvail = v.bari + v.monopoli;
    const totalStock = Math.max(totalAvail, 1);
    const pct = Math.round((totalAvail / (totalStock + 1)) * 100);
    return `
    <div class="vehicle-card">
      <div class="vname">${escapeHtml(v.name.toUpperCase())}</div>
      <div class="vprice">€${v.price}<span>/g</span></div>
      <div class="vloc-row"><span>${icon("location_on")} Costalunga: ${v.bari}</span><span>${icon("location_on")} Marenova: ${v.monopoli}</span></div>
      <div class="disp-row"><span>Disponibilità</span><span>${totalAvail} / ${totalStock + 1}</span></div>
      <div class="progress"><div style="width:${pct}%;"></div></div>
      <div class="vcard-actions">
        <button class="icon-action" title="Anteprima" onclick="openVehicleDetail('${v.id}')">${icon("visibility")}</button>
        <button class="icon-action" title="Manutenzione" onclick="showToast('Veicolo segnato in manutenzione (demo)','success','build')">${icon("build")}</button>
        <button class="icon-action edit" title="Modifica" onclick="openEditVehicle('${v.id}')">${icon("edit")}</button>
        <button class="icon-action del" title="Elimina" onclick="confirmAction('Eliminare ${escapeHtml(v.name)} dall\\'inventario?', () => { showToast('Veicolo eliminato (demo)','success','delete'); }, 'Elimina', true)">${icon("delete")}</button>
      </div>
    </div>`;
  }).join("");

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Inventario</h1>
        <p class="view-subtitle">Gestione della flotta e stato disponibilità in tempo reale.</p>
      </div>
      <div class="header-actions">
        <button class="btn" onclick="showToast('Export CSV avviato (demo)','success','download')">${icon("download")} Export</button>
        <button class="btn purple" onclick="showToast('Gestore Prezzi aperto (demo)','info','bolt')">${icon("bolt")} Gestore Prezzi</button>
        <button class="btn green" onclick="showToast('Nuovo extra creato (demo)','success','add')">${icon("add")} Gestione Extra</button>
        <button class="btn-primary" onclick="openAddVehicle()">${icon("add")} Aggiungi Veicolo</button>
      </div>
    </div>
    <div class="searchbar"><input id="invSearch" placeholder="Cerca veicolo..." oninput="inventarioSearch(this.value)">${icon("schedule")}<span style="color:var(--text-faint);font-size:12.5px;">${fmtDate(new Date())}</span></div>
    <div class="vehicle-grid" id="invGrid">${cards}</div>
  `;
}
function inventarioSearch(q) {
  q = q.toLowerCase();
  document.querySelectorAll("#invGrid .vehicle-card").forEach(c => {
    c.style.display = c.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}
function vehicleFormFields(v) {
  const cat = v ? v.cat : "SCOOTER";
  const price = v ? v.price : "";
  const avail = v ? (v.bari + v.monopoli) : 1;
  return `
    <div class="form-field">
      <label>Nome Modello *</label>
      <input id="vehName" placeholder="Es. Vespa 125 Primavera" value="${v ? escapeHtml(v.name) : ""}">
    </div>
    <div class="form-row2">
      <div class="form-field">
        <label>Categoria</label>
        <select id="vehCat">
          <option value="AUTOVEICOLI" ${cat === "AUTOVEICOLI" ? "selected" : ""}>Auto</option>
          <option value="SCOOTER" ${cat === "SCOOTER" ? "selected" : ""}>Scooter</option>
        </select>
      </div>
      <div class="form-field">
        <label>Tipologia Breve</label>
        <input id="vehTipologia" placeholder="Es. Scooter 125cc">
      </div>
    </div>
    <div class="form-row2">
      <div class="form-field">
        <label>Badge (opzionale)</label>
        <input id="vehBadge" placeholder="Es. NOVITÀ, Premium, Hybrid...">
      </div>
      <div class="form-field">
        <label>Prezzo al giorno (€)</label>
        <input id="vehPrice" type="number" placeholder="25" value="${price}">
      </div>
    </div>
    <div class="form-row2">
      <div class="form-field">
        <label>Unità disponibili</label>
        <input id="vehAvail" type="number" min="0" value="${avail}">
      </div>
      <div class="form-field">
        <label>Unità totali</label>
        <input id="vehTotal" type="number" min="1" value="${avail || 1}">
      </div>
    </div>
    <div class="form-row2">
      <div class="form-field">
        <label>Alimentazione / Motore</label>
        <select id="vehEngine">
          <option value="">— Seleziona —</option>
          <option>Benzina</option>
          <option>Diesel</option>
          <option>Elettrico</option>
          <option>Ibrido</option>
          <option>GPL</option>
        </select>
      </div>
      <div class="form-field">
        <label>Cambio</label>
        <select id="vehGearbox">
          <option value="">— Seleziona —</option>
          <option>Manuale</option>
          <option>Automatico</option>
        </select>
      </div>
    </div>
    <div class="form-row2">
      <div class="form-field">
        <label>Posti</label>
        <select id="vehSeats">
          <option value="">— Seleziona —</option>
          <option>2</option>
          <option>4</option>
          <option>5</option>
          <option>7</option>
          <option>9</option>
        </select>
      </div>
      <div class="form-field">
        <label>Colore Identificativo (Logistica)</label>
        <div class="color-picker-row">
          <input id="vehColor" type="color" value="#ff5c00" oninput="document.getElementById('vehColorHex').textContent=this.value.toUpperCase()">
          <span class="color-hex" id="vehColorHex">#FF5C00</span>
        </div>
      </div>
    </div>
    <div class="form-field">
      <label>Foto Veicolo</label>
      <div class="photo-upload-row">
        <div class="photo-preview" id="vehPhotoPreview">No Foto</div>
        <div>
          <button type="button" class="btn" onclick="document.getElementById('vehPhotoInput').click()">${icon("add_photo_alternate")} Carica Foto</button>
          <input type="file" id="vehPhotoInput" accept="image/png,image/jpeg,image/webp" class="hidden" onchange="handleVehiclePhotoChange(this)">
          <div class="photo-hint">JPG, PNG o WebP. Max 5MB.</div>
        </div>
      </div>
    </div>
  `;
}

function handleVehiclePhotoChange(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast("Il file supera i 5MB consentiti", "error", "error");
    input.value = "";
    return;
  }
  const url = URL.createObjectURL(file);
  const preview = document.getElementById("vehPhotoPreview");
  preview.innerHTML = `<img src="${url}" alt="Anteprima veicolo">`;
}

function openAddVehicle() {
  openModal(`
    <div class="modal-head"><h2>${icon("add_circle")} Aggiungi Veicolo</h2><button class="modal-close" onclick="closeModal()">${icon("close")}</button></div>
    <div class="modal-body">
      <div class="form-grid">${vehicleFormFields(null)}</div>
    </div>
    <div class="modal-foot">
      <button class="btn subtle" onclick="closeModal()">Annulla</button>
      <button class="btn-primary" onclick="submitAddVehicle()">Salva Veicolo</button>
    </div>
  `, { width: "620px" });
}

function submitAddVehicle() {
  const name = document.getElementById("vehName").value.trim();
  if (!name) {
    showToast("Il nome del modello è obbligatorio", "error", "error");
    return;
  }
  const cat = document.getElementById("vehCat").value;
  const price = Number(document.getElementById("vehPrice").value) || 0;
  const avail = Number(document.getElementById("vehAvail").value) || 0;
  VEHICLES.push({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + (VEHICLES.length + 1),
    name, cat, price,
    bari: avail, monopoli: 0,
  });
  closeModal();
  showToast(`${name} aggiunto all'inventario`, "success", "check_circle");
  if (currentView === "inventario") renderView("inventario");
}

function openEditVehicle(id) {
  const v = VEHICLES.find(x => x.id === id);
  openModal(`
    <div class="modal-head"><h2>${icon("edit")} Modifica ${escapeHtml(v.name)}</h2><button class="modal-close" onclick="closeModal()">${icon("close")}</button></div>
    <div class="modal-body">
      <div class="form-grid">${vehicleFormFields(v)}</div>
    </div>
    <div class="modal-foot">
      <button class="btn subtle" onclick="closeModal()">Annulla</button>
      <button class="btn-primary" onclick="submitEditVehicle('${v.id}')">Salva Modifiche</button>
    </div>
  `, { width: "620px" });
}

function submitEditVehicle(id) {
  const v = VEHICLES.find(x => x.id === id);
  const name = document.getElementById("vehName").value.trim();
  if (!name) {
    showToast("Il nome del modello è obbligatorio", "error", "error");
    return;
  }
  v.name = name;
  v.cat = document.getElementById("vehCat").value;
  v.price = Number(document.getElementById("vehPrice").value) || v.price;
  v.bari = Number(document.getElementById("vehAvail").value) || 0;
  closeModal();
  showToast("Modifiche salvate", "success", "check_circle");
  if (currentView === "inventario") renderView("inventario");
}

// ==================================================================
// DETTAGLIO VEICOLO (drill-down dalla scheda Inventario)
// ==================================================================
const vehicleDetailState = {
  id: null,
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  unitsExpanded: {},
  bookingsExpanded: false,
};

function openVehicleDetail(id) {
  vehicleDetailState.id = id;
  const now = new Date();
  vehicleDetailState.calMonth = now.getMonth();
  vehicleDetailState.calYear = now.getFullYear();
  vehicleDetailState.unitsExpanded = {};
  vehicleDetailState.bookingsExpanded = false;
  renderVehicleDetail();
}

function renderVehicleDetail() {
  currentView = "inventario";
  const root = document.getElementById("viewRoot");
  root.innerHTML = view_vehicle_detail();
  root.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.dataset.view === "inventario");
  });
}

function vehicleDayOccupancy(vIndex, year, month, day) {
  const seed = vIndex * 401 + year * 17 + month * 31 + day * 7;
  const r = seededRand(seed);
  if (r > 0.86) return 3;
  if (r > 0.45) return 1 + Math.floor(seededRand(seed + 1) * 2);
  return 0;
}

function vehicleDetailCalendar(vIndex) {
  const { calMonth, calYear } = vehicleDetailState;
  const firstOfMonth = new Date(calYear, calMonth, 1);
  let startWeekday = firstOfMonth.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  let monthCount = 0;
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const occ = vehicleDayOccupancy(vIndex, calYear, calMonth, d);
    monthCount += occ;
    cells.push({ day: d, occ });
  }

  const dowHtml = DOW_SHORT.slice(1).concat(DOW_SHORT[0]).map(d => `<div class="vdetail-dow">${d.toUpperCase().slice(0, 2)}</div>`).join("");
  const cellsHtml = cells.map(c => {
    if (!c) return `<div class="vdetail-cal-day empty"></div>`;
    let cls = "vdetail-cal-day";
    if (c.occ === 0) cls += " free";
    else if (c.occ >= 3) cls += " high";
    else cls += " low";
    return `<div class="${cls}">${c.day}${c.occ > 0 ? `<span class="vdetail-cal-count">${c.occ}</span>` : ""}</div>`;
  }).join("");

  return { html: `<div class="vdetail-cal-grid">${dowHtml}${cellsHtml}</div>`, monthCount };
}

function vehicleDetailChangeMonth(delta) {
  vehicleDetailState.calMonth += delta;
  if (vehicleDetailState.calMonth < 0) { vehicleDetailState.calMonth = 11; vehicleDetailState.calYear--; }
  if (vehicleDetailState.calMonth > 11) { vehicleDetailState.calMonth = 0; vehicleDetailState.calYear++; }
  renderVehicleDetail();
}

function toggleVehicleUnit(i) {
  vehicleDetailState.unitsExpanded[i] = !vehicleDetailState.unitsExpanded[i];
  renderVehicleDetail();
}
function toggleVehicleBookingsList() {
  vehicleDetailState.bookingsExpanded = !vehicleDetailState.bookingsExpanded;
  renderVehicleDetail();
}

function view_vehicle_detail() {
  const v = VEHICLES.find(x => x.id === vehicleDetailState.id);
  if (!v) return `<div class="empty-state">${icon("error")}<div>Veicolo non trovato</div></div>`;
  const vIndex = VEHICLES.indexOf(v);
  const totalUnits = Math.max(v.bari + v.monopoli, 1);
  const lifetimeBookings = Math.round(18 + seededRand(vIndex + 1) * 55);
  const today = new Date();
  const upcoming = BOOKINGS.filter(b => b.vehicle === v.name && b.start >= today && (b.status === "Confermata" || b.status === "Attiva")).sort((a, b) => a.start - b.start);

  const { html: calGrid, monthCount } = vehicleDetailCalendar(vIndex);

  const unitsHtml = Array.from({ length: totalUnits }).map((_, i) => {
    const expanded = !!vehicleDetailState.unitsExpanded[i];
    const occupied = seededRand(vIndex * 71 + i * 13) > 0.4;
    const plate = `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(66 + ((i * 3) % 26))} ${100 + i * 37}${String.fromCharCode(88 + (i % 3))}`;
    const km = Math.round(8000 + seededRand(vIndex * 19 + i) * 60000).toLocaleString("it-IT");
    return `
      <div class="vdetail-unit">
        <div class="vdetail-unit-row" onclick="toggleVehicleUnit(${i})">
          <span class="pill blue">${i + 1}</span>
          <span class="tag" style="flex:1;">${escapeHtml(v.name)} (${v.cat === "SCOOTER" ? "Scooter" : "Auto"}) ${i + 1}</span>
          <select class="select-pill" onclick="event.stopPropagation()" onchange="showToast('Sede aggiornata a ' + this.value,'success')">
            <option>Non definita</option>
            ${LOCATIONS.map(l => `<option>${escapeHtml(l)}</option>`).join("")}
          </select>
          <span class="pill ${occupied ? "orange" : "green"}">${occupied ? "● OCCUPATA" : "● LIBERA"}</span>
          <span class="material-symbols-outlined vdetail-chevron ${expanded ? "open" : ""}">expand_more</span>
        </div>
        ${expanded ? `
          <div class="vdetail-unit-detail">
            <div><span>Targa</span><b>${plate}</b></div>
            <div><span>Chilometraggio</span><b>${km} km</b></div>
            <div><span>Ultima manutenzione</span><b>${fmtDate(addDays(today, -Math.round(10 + seededRand(vIndex + i) * 60)))}</b></div>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");

  const upcomingHtml = upcoming.length ? upcoming.map(b => `
    <div class="info-row" style="padding:12px 16px;">
      <div class="info-main">
        <div class="info-title-row"><span class="info-title" style="font-size:13.5px;">${escapeHtml(b.customer)}</span><span class="pill ${STATUS_PILL_CLASS[b.status]}">${b.status}</span></div>
        <div class="info-loc">${icon("event")} ${fmtDate(b.start)} → ${fmtDate(b.end)} · ${fmtEuro(b.total)}</div>
      </div>
    </div>
  `).join("") : `<div class="empty-state" style="padding:24px;">${icon("event_busy")}<div>Nessuna prenotazione futura per questo veicolo</div></div>`;

  return `
    <div class="vdetail-header">
      <button class="btn subtle vdetail-back" onclick="renderView('inventario')">${icon("arrow_back")}</button>
      <div style="flex:1;">
        <h1 class="view-title" style="display:inline;">${escapeHtml(v.name.toUpperCase())}</h1>
        <span class="vdetail-meta">(ID: ${escapeHtml(v.id)}, Prenotazioni: ${lifetimeBookings})</span>
        <p class="view-subtitle">Gestione completa unità, manutenzione e note.</p>
      </div>
      <div class="header-actions">
        <button class="btn danger-outline" onclick="confirmAction('Eliminare definitivamente il modello ${escapeHtml(v.name)} e tutte le sue unità?', () => { showToast('Modello eliminato (demo)','success','delete'); renderView('inventario'); }, 'Elimina', true)">${icon("delete")} Elimina Modello</button>
        <button class="btn-primary" onclick="showToast('Nuova unità aggiunta alla flotta (demo)','success','add')">${icon("add")} Aggiungi Unità</button>
      </div>
    </div>

    <div class="vdetail-grid">
      <div class="vdetail-col">
        <div class="vdetail-image">${icon(v.cat === "SCOOTER" ? "two_wheeler" : "directions_car")}</div>
        <div class="card vdetail-info-card">
          <div class="vdetail-info-row"><span>Categoria</span><b>${v.cat === "SCOOTER" ? "SCOOTER" : "AUTO"}</b></div>
          <div class="vdetail-info-row"><span>Prezzo/gg</span><b>€ ${v.price}</b></div>
          <div class="vdetail-info-row"><span>Totale Flotta</span><b>${totalUnits} unità</b></div>
          <div class="vdetail-info-row"><span>Attive</span><b>${totalUnits}</b></div>
          <div class="vdetail-info-row"><span>In Manutenzione</span><b>0</b></div>
        </div>

        <div class="card">
          <div class="vdetail-section-title">${icon("settings")} Azioni Rapide</div>
          <div class="vdetail-actions-stack">
            <button class="btn" onclick="showToast('Unità singola aggiunta (demo)','success','add')">${icon("add")} Aggiungi Unità Singola</button>
            <button class="btn on" onclick="showToast('Pianificazione ferie aperta (demo)','info','calendar_month')">${icon("calendar_month")} Pianifica Ferie</button>
            <button class="btn danger-outline" onclick="confirmAction('Eliminare l\\'intero modello ${escapeHtml(v.name)}?', () => { showToast('Modello eliminato (demo)','success','delete'); renderView('inventario'); }, 'Elimina', true)">${icon("delete")} Elimina Intero Modello</button>
          </div>
        </div>

        <div class="card">
          <div class="vdetail-section-title">${icon("event")} Ferie / Blocchi Attivi</div>
          <p style="color:var(--text-faint);font-size:13px;font-style:italic;margin:0;">Nessuna ferie pianificata</p>
        </div>
      </div>

      <div class="vdetail-col">
        <div class="vdetail-toolbar">
          <h3 style="margin:0;font-size:17px;">${icon("directions_car")} Monitoraggio Targhe</h3>
          <button class="btn small on" onclick="showToast('Nuova unità aggiunta (demo)','success','add')">${icon("add")} Unità</button>
          <select class="select-pill" style="margin-left:auto;" onchange="showToast('Filtro aggiornato: ' + this.value,'info')">
            <option>Tutte le unità</option>
            ${Array.from({ length: totalUnits }).map((_, i) => `<option>Unità ${i + 1}</option>`).join("")}
          </select>
          <span class="date-field">${fmtDate(new Date())}</span>
        </div>

        <div class="card">
          <div class="vdetail-cal-head">
            <div class="vdetail-section-title" style="margin:0;">${icon("calendar_month")} Calendario Disponibilità</div>
            <div class="date-nav" style="margin-left:auto;">
              <button onclick="vehicleDetailChangeMonth(-1)">${icon("chevron_left")}</button>
              <span style="font-weight:700;font-size:13.5px;">${MONTHS[vehicleDetailState.calMonth]} ${vehicleDetailState.calYear} <span style="color:var(--text-faint);font-weight:600;">(${monthCount})</span></span>
              <button onclick="vehicleDetailChangeMonth(1)">${icon("chevron_right")}</button>
            </div>
          </div>
          ${calGrid}
          <div class="legend" style="margin-top:18px;">
            <span><span class="dot" style="background:var(--card-2);border:1px solid var(--border);"></span>Libero</span>
            <span><span class="dot" style="background:var(--blue);"></span>1-2 Prenotazioni</span>
            <span><span class="dot" style="background:#c9601b;"></span>Alta Occupazione</span>
            <span>🌴 Ferie / Blocco</span>
          </div>
        </div>

        <div class="card" style="padding:0;overflow:hidden;">
          ${unitsHtml}
        </div>

        <div class="card">
          <div class="vdetail-section-title">${icon("payments")} Prezzi per Periodo</div>
          <p style="color:var(--text-faint);font-size:13px;margin:0 0 14px;">Nessuna regola — verrà usato il prezzo base del modello.</p>
          <button class="btn-primary small" onclick="showToast('Nuova regola prezzo creata (demo)','success','add')">${icon("add")} Nuova Regola</button>
        </div>

        <div class="card" style="padding:0;overflow:hidden;">
          <div class="vdetail-collapsible-head" onclick="toggleVehicleBookingsList()">
            <div class="vdetail-section-title" style="margin:0;">${icon("description")} Elenco Prossime Prenotazioni</div>
            <span class="pill blue">${upcoming.length} Totali</span>
            <span class="material-symbols-outlined vdetail-chevron ${vehicleDetailState.bookingsExpanded ? "open" : ""}">expand_more</span>
          </div>
          ${vehicleDetailState.bookingsExpanded ? `<div class="vdetail-bookings-list">${upcomingHtml}</div>` : ""}
        </div>
      </div>
    </div>
  `;
}

// ==================================================================
// VOUCHER
// ==================================================================
function view_voucher() {
  const rows = VOUCHERS.map((v, i) => `
    <div class="info-row">
      <div class="time-badge" style="background:var(--card-2);">🚗</div>
      <div class="info-main">
        <div class="info-title-row"><span class="info-title">${escapeHtml(v.vehicle.toUpperCase())}</span><span class="tag agent">VOUCHER</span></div>
        <div class="info-customer"><span>${icon("person")} ${escapeHtml(v.customer)}</span></div>
        <div class="info-loc">${icon("event")} ${v.start} → ${v.end} · ${icon("location_on")} ${escapeHtml(v.location)}</div>
      </div>
      <div class="info-actions">
        <span class="tag" style="color:var(--green);font-size:14px;">${fmtEuro(v.amount)}</span>
        <button class="icon-action del" title="Elimina" onclick="deleteVoucher(${i})">${icon("delete")}</button>
      </div>
    </div>
  `).join("");
  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Voucher Generati</h1>
        <p class="view-subtitle">Gestisci l'elenco completo dei voucher rimborsabili.</p>
      </div>
      <div class="header-actions"><button class="btn-primary" onclick="openNewVoucher()">${icon("add")} Nuovo Voucher</button></div>
    </div>
    <div class="info-list" id="voucherList">${rows || `<div class="empty-state">${icon('confirmation_number')}<div>Nessun voucher generato</div></div>`}</div>
  `;
}
function openNewVoucher() {
  openModal(`
    <div class="modal-head"><h2>${icon("confirmation_number")} Nuovo Voucher</h2><button class="modal-close" onclick="closeModal()">${icon("close")}</button></div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-field"><label>Cliente / Partner</label><input placeholder="Nome cliente"></div>
        <div class="form-row2">
          <div class="form-field"><label>Da</label><input type="date"></div>
          <div class="form-field"><label>A</label><input type="date"></div>
        </div>
        <div class="form-field"><label>Importo (€)</label><input type="number" placeholder="150"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn subtle" onclick="closeModal()">Annulla</button>
      <button class="btn-primary" onclick="closeModal(); showToast('Voucher generato (demo)','success','check_circle');">Genera Voucher</button>
    </div>
  `, { width: "480px" });
}
function deleteVoucher(i) {
  confirmAction("Eliminare questo voucher?", () => {
    VOUCHERS.splice(i, 1);
    showToast("Voucher eliminato", "success", "delete");
    renderView("voucher");
  }, "Elimina", true);
}

// ==================================================================
// ANALYTICS
// ==================================================================
let analyticsChart = null;
function view_analytics() {
  const periodLabels = { "7": "7 giorni", "30": "30 giorni", "90": "3 mesi", "180": "6 mesi", "year": "Quest'anno", "all": "Tutto" };
  const factor = { "7": 0.25, "30": 1, "90": 2.8, "180": 5.2, "year": 7.5, "all": 12 }[uiState.analyticsPeriod];
  const guadagnato = Math.round(58230.5 * factor);
  const futuro = Math.round(96380.75 * (factor > 3 ? 1 : factor));

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Analytics</h1>
        <p class="view-subtitle">Guadagni per veicolo — passato e futuro</p>
      </div>
      <div class="chip-group">
        ${Object.entries(periodLabels).map(([k, label]) => `<button class="chip ${uiState.analyticsPeriod === k ? "active" : ""}" onclick="analyticsSetPeriod('${k}')">${label}</button>`).join("")}
      </div>
    </div>

    <div class="highlight-box">
      <div>
        <div class="hb-title">${icon("bolt")} INCASSO DA OGGI AL 31/12/2026</div>
        <div class="hb-sub">Prenotazioni attive + future — ${BOOKINGS.length + 40} noleggi nel periodo</div>
      </div>
      <div class="hb-value">${fmtEuro(101450.25)}</div>
    </div>

    <div class="stat-grid" style="grid-template-columns:1fr 1fr;">
      <div class="stat-card">
        <div class="stat-label">Guadagnato (periodo) <span class="stat-icon" style="background:var(--green-soft);color:var(--green);">${icon("trending_up")}</span></div>
        <div class="stat-value">${fmtEuro(guadagnato)}</div>
        <div class="stat-sub">${Math.round(196 * factor)} noleggi</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Futuro confermato <span class="stat-icon" style="background:var(--blue-soft);color:#7d9bff;">${icon("trending_down")}</span></div>
        <div class="stat-value">${fmtEuro(futuro)}</div>
        <div class="stat-sub">231 noleggi</div>
      </div>
    </div>

    <div class="chart-card">
      <div class="chart-card-head">
        <div>
          <h3>Incassi per Mese</h3>
          <p>Suddivisione mensile tra incassato (passato) e da incassare (futuro)</p>
        </div>
        <div class="chart-toggle">
          <button class="${uiState.analyticsMode === 'grafico' ? 'active' : ''}" onclick="analyticsSetMode('grafico')">Grafico</button>
          <button class="${uiState.analyticsMode === 'tabella' ? 'active' : ''}" onclick="analyticsSetMode('tabella')">Tabella</button>
        </div>
      </div>
      ${uiState.analyticsMode === "grafico"
        ? `<div style="height:300px;"><canvas id="analyticsCanvas"></canvas></div>`
        : renderAnalyticsTable()}
    </div>

    ${renderRequestsSection()}
  `;
}

function vehicleRequestStats(vIndex, v) {
  const totale = Math.round(20 + seededRand(vIndex + 501) * 55);
  const chiusoPct = 0.3 + seededRand(vIndex + 502) * 0.35;
  const chiuso = Math.max(1, Math.round(totale * chiusoPct));
  const futuro = Math.max(0, totale - chiuso);
  const chiusoGiorni = chiuso * (1 + Math.round(seededRand(vIndex + 503) * 3));
  const futuroGiorni = futuro * (1 + Math.round(seededRand(vIndex + 504) * 3));
  const chiusoImporto = Math.round(chiusoGiorni * v.price * (0.85 + seededRand(vIndex + 505) * 0.3));
  const futuroImporto = Math.round(futuroGiorni * v.price * (0.85 + seededRand(vIndex + 506) * 0.3));
  const totaleImporto = chiusoImporto + futuroImporto;
  const pctPassato = totaleImporto > 0 ? Math.round((chiusoImporto / totaleImporto) * 100) : 0;
  return { totale, chiuso, futuro, chiusoGiorni, futuroGiorni, chiusoImporto, futuroImporto, totaleImporto, pctPassato };
}

function renderRequestsSection() {
  const stats = VEHICLES.map((v, i) => ({ v, i, ...vehicleRequestStats(i, v) }));
  const totRicevute = stats.reduce((s, x) => s + x.totale, 0);

  const sortKey = uiState.analyticsRequestSort;
  const sorted = [...stats].sort((a, b) => {
    if (sortKey === "chiuso") return b.chiusoImporto - a.chiusoImporto;
    if (sortKey === "futuro") return b.futuroImporto - a.futuroImporto;
    return b.totaleImporto - a.totaleImporto;
  });

  const rows = sorted.map(s => `
    <div class="request-row">
      <div class="request-row-head">
        <div>
          <div class="request-vname">${escapeHtml(s.v.name.toUpperCase())}</div>
          <div class="request-vsub">${s.totale} noleggi tot</div>
        </div>
        <div class="request-total">
          <span>TOTALE</span>
          <b>${fmtEuro(s.totaleImporto)}</b>
        </div>
      </div>
      <div class="request-split">
        <div class="request-split-col">
          <span class="request-split-label chiuso">CHIUSO</span>
          <b>${fmtEuro(s.chiusoImporto)}</b>
          <span class="request-split-sub">${s.chiuso} nol. · ${s.chiusoGiorni} gg</span>
        </div>
        <div class="request-split-col right">
          <span class="request-split-label futuro">FUTURO</span>
          <b>${fmtEuro(s.futuroImporto)}</b>
          <span class="request-split-sub">${s.futuro} nol. · ${s.futuroGiorni} gg</span>
        </div>
      </div>
      <div class="request-bar">
        <div class="request-bar-fill" style="width:${s.pctPassato}%;"></div>
      </div>
      <div class="request-bar-labels">
        <span class="chiuso">${s.pctPassato}% passato</span>
        <span class="futuro">${100 - s.pctPassato}% futuro</span>
      </div>
    </div>
  `).join("");

  return `
    <div class="requests-section">
      <div class="requests-title">${icon("public")} RICHIESTE — DAL ${fmtDate(addDays(new Date(), -122)).toUpperCase()}</div>
      <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);">
        <div class="stat-card requests-stat">
          <div class="stat-label">Ricevute dal sito <span class="stat-icon" style="background:var(--orange-soft);color:var(--orange);">${icon("public")}</span></div>
          <div class="stat-value">${totRicevute}</div>
          <div class="stat-sub" style="color:var(--green);">100% accettazione</div>
        </div>
        <div class="stat-card requests-stat">
          <div class="stat-label">Accettate <span class="stat-icon" style="background:var(--green-soft);color:var(--green);">${icon("check_circle")}</span></div>
          <div class="stat-value" style="color:var(--green);">${totRicevute}</div>
        </div>
        <div class="stat-card requests-stat">
          <div class="stat-label">Rifiutate <span class="stat-icon" style="background:var(--red-soft);color:#ff8080;">${icon("cancel")}</span></div>
          <div class="stat-value" style="color:#ff8080;">0</div>
        </div>
        <div class="stat-card requests-stat">
          <div class="stat-label">In Attesa <span class="stat-icon" style="background:var(--orange-soft);color:var(--orange);">${icon("schedule")}</span></div>
          <div class="stat-value" style="color:var(--orange);">0</div>
        </div>
      </div>

      <div class="chip-group" style="margin:18px 0;">
        <span style="color:var(--text-faint);font-size:12.5px;font-weight:700;align-self:center;margin-right:4px;">ORDINA PER:</span>
        <button class="chip ${sortKey === "totale" ? "active" : ""}" onclick="analyticsSetRequestSort('totale')">Totale</button>
        <button class="chip ${sortKey === "chiuso" ? "active" : ""}" onclick="analyticsSetRequestSort('chiuso')">Chiuso</button>
        <button class="chip ${sortKey === "futuro" ? "active" : ""}" onclick="analyticsSetRequestSort('futuro')">Futuro</button>
      </div>

      <div class="requests-list">${rows}</div>
    </div>
  `;
}
function analyticsSetRequestSort(s) { uiState.analyticsRequestSort = s; renderView("analytics"); }
const ANALYTICS_MONTHS = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const ANALYTICS_PAST = [8400, 15600, 26900, 38200, 41500, 44800, 35100];
const ANALYTICS_FUTURE = [0,0,0,0,0,9800,22300];
function renderAnalyticsTable() {
  const rows = ANALYTICS_MONTHS.slice(0, 7).map((m, i) => `
    <tr><td>${m}</td><td>${fmtEuroShort(ANALYTICS_PAST[i])}</td><td>${fmtEuroShort(ANALYTICS_FUTURE[i] || 0)}</td></tr>
  `).join("");
  return `<div class="table-wrap"><table><thead><tr><th>Mese</th><th>Incassato</th><th>Futuro</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function analyticsSetPeriod(p) { uiState.analyticsPeriod = p; renderView("analytics"); }
function analyticsSetMode(m) { uiState.analyticsMode = m; renderView("analytics"); }
function mountAnalyticsChart() {
  const canvas = document.getElementById("analyticsCanvas");
  if (!canvas || typeof Chart === "undefined") return;
  if (analyticsChart) analyticsChart.destroy();
  analyticsChart = new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ANALYTICS_MONTHS.slice(0, 7),
      datasets: [
        { label: "Incassato", data: ANALYTICS_PAST, backgroundColor: "#22c55e", borderRadius: 6, stack: "s" },
        { label: "Futuro", data: ANALYTICS_FUTURE, backgroundColor: "#3f6cf5", borderRadius: 6, stack: "s" },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "#a5a5aa" } } },
      scales: {
        x: { stacked: true, ticks: { color: "#a5a5aa" }, grid: { color: "#222225" } },
        y: { stacked: true, ticks: { color: "#a5a5aa" }, grid: { color: "#222225" } },
      },
    },
  });
}

// ==================================================================
// CLIENTI
// ==================================================================
function view_clienti() {
  const rows = CUSTOMERS_TABLE.map(c => `
    <tr>
      <td><div class="cell-strong">${escapeHtml(c.name)}</div></td>
      <td>
        <div class="cell-sub">${icon("mail","")} ${escapeHtml(c.email)}</div>
        <div class="cell-sub">${icon("call","")} ${escapeHtml(c.phone)}</div>
      </td>
      <td><span class="pill blue">${c.bookings}</span></td>
      <td>${c.last}</td>
      <td>
        <div class="row-actions">
          <button class="icon-action wa" title="WhatsApp" onclick="showToast('Apertura chat WhatsApp con ${escapeHtml(c.name)} (demo)','success','forum')">${icon("forum")}</button>
          <button class="icon-action" title="Storico" onclick="openInfoModal('${escapeHtml(c.name)}',[{label:'Email',value:'${escapeHtml(c.email)}'},{label:'Telefono',value:'${escapeHtml(c.phone)}'},{label:'Prenotazioni totali',value:'${c.bookings}'},{label:'Ultima prenotazione',value:'${c.last}'}],'person')">${icon("visibility")}</button>
        </div>
      </td>
    </tr>
  `).join("");
  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Clienti</h1>
        <p class="view-subtitle">Gestisci l'anagrafica clienti e la loro fidelizzazione. (${CUSTOMERS_TOTAL_COUNT} totali)</p>
      </div>
      <div class="header-actions">
        <button class="btn" onclick="showToast('Export CSV avviato (demo)','success','download')">${icon("download")} Export</button>
        <button class="btn-primary" onclick="openNewCustomer()">${icon("add")} Nuovo Cliente</button>
      </div>
    </div>
    <div class="searchbar" id="clientiSearchBar">${icon("search")}<input placeholder="Cerca nome, email o telefono..." oninput="clientiSearch(this.value)"></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Nome</th><th>Contatti</th><th>Prenotazioni</th><th>Ultima Prenotazione</th><th></th></tr></thead>
        <tbody id="clientiBody">${rows}</tbody>
      </table>
    </div>
  `;
}
function clientiSearch(q) {
  q = q.toLowerCase();
  document.querySelectorAll("#clientiBody tr").forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}
function openNewCustomer() {
  openModal(`
    <div class="modal-head"><h2>${icon("person_add")} Nuovo Cliente</h2><button class="modal-close" onclick="closeModal()">${icon("close")}</button></div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-field"><label>Nome e cognome</label><input id="custName" placeholder="Mario Rossi"></div>
        <div class="form-row2">
          <div class="form-field"><label>Email</label><input id="custEmail" type="email" placeholder="mario.rossi@email.com"></div>
          <div class="form-field"><label>Telefono</label><input id="custPhone" placeholder="+39 ..."></div>
        </div>
        <div class="form-field"><label>Note (opzionale)</label><textarea rows="2" placeholder="Note aggiuntive..."></textarea></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn subtle" onclick="closeModal()">Annulla</button>
      <button class="btn-primary" onclick="submitNewCustomer()">Salva Cliente</button>
    </div>
  `, { width: "480px" });
}
function submitNewCustomer() {
  const name = document.getElementById("custName").value.trim();
  if (!name) {
    showToast("Il nome del cliente è obbligatorio", "error", "error");
    return;
  }
  const email = document.getElementById("custEmail").value.trim() || "—";
  const phone = document.getElementById("custPhone").value.trim() || "—";
  CUSTOMERS_TABLE.unshift({ name, email, phone, bookings: 0, last: "—" });
  CUSTOMERS_TOTAL_COUNT++;
  closeModal();
  showToast(`${name} aggiunto all'anagrafica`, "success", "check_circle");
  if (currentView === "clienti") renderView("clienti");
}

// ==================================================================
// PARTNER
// ==================================================================
function view_partner() {
  const promoRows = PROMO_CODES.map((p, i) => `
    <tr>
      <td><span class="tag agent">🎟 ${escapeHtml(p.code)}</span></td>
      <td><span class="pill blue">${p.discount}%</span></td>
      <td>${p.created}</td>
      <td><span class="pill gray">${icon("group","")} ${p.uses}</span></td>
      <td class="cell-strong" style="color:var(--green);">${fmtEuro(p.revenue)}</td>
      <td><span class="pill ${p.status === "ACTIVE" ? "green" : "red"}">${p.status}</span></td>
      <td>
        <div class="row-actions">
          <button class="icon-action edit" onclick="openInfoModal('Codice ${escapeHtml(p.code)}',[{label:'Sconto',value:'${p.discount}%'},{label:'Utilizzi',value:'${p.uses}'},{label:'Incasso',value:'${fmtEuro(p.revenue)}'}],'edit')">${icon("edit")}</button>
          <button class="icon-action del" onclick="deletePromo(${i})">${icon("delete")}</button>
        </div>
      </td>
    </tr>
  `).join("");
  const partnerRows = PARTNERS.map(p => `
    <tr>
      <td class="cell-strong">${escapeHtml(p.name)}</td>
      <td><span class="pill gray">${escapeHtml(p.type)}</span></td>
      <td class="cell-sub">${escapeHtml(p.contact)}</td>
      <td><span class="pill blue">${p.commission}</span></td>
      <td>${p.bookings}</td>
    </tr>
  `).join("");
  const totRevenue = PROMO_CODES.reduce((s, p) => s + p.revenue, 0);

  return `
    <div class="view-header">
      <div><h1 class="view-title">Partners &amp; Promo</h1><p class="view-subtitle">Gestisci collaborazioni con hotel/partner e codici sconto.</p></div>
      <div class="header-actions"><button class="btn-primary" onclick="openNewPromo()">${icon("add")} Nuovo Codice</button></div>
    </div>
    <div class="chip-group" style="margin-bottom:18px;">
      <button class="chip ${uiState.partnerTab === 'codici' ? 'active' : ''}" onclick="partnerSetTab('codici')">${icon('confirmation_number')} Codici Promo</button>
      <button class="chip ${uiState.partnerTab === 'partner' ? 'active' : ''}" onclick="partnerSetTab('partner')">${icon('handshake')} Partner</button>
    </div>
    <div class="stat-grid" style="grid-template-columns:1fr 1fr;">
      <div class="stat-card"><div class="stat-label">Fatturato via Promo</div><div class="stat-value">${fmtEuro(totRevenue)}</div></div>
      <div class="stat-card"><div class="stat-label">Totale Codici attivi</div><div class="stat-value">${PROMO_CODES.filter(p=>p.status==='ACTIVE').length}</div></div>
    </div>
    <div class="searchbar"><input placeholder="Cerca codice o partner..." oninput="partnerSearch(this.value)">${icon("search")}</div>
    ${uiState.partnerTab === "codici" ? `
      <div class="table-wrap"><table>
        <thead><tr><th>Codice</th><th>Sconto</th><th>Data creazione</th><th>Utilizzi</th><th>Incasso</th><th>Stato</th><th>Azioni</th></tr></thead>
        <tbody id="promoBody">${promoRows}</tbody>
      </table></div>
    ` : `
      <div class="table-wrap"><table>
        <thead><tr><th>Nome</th><th>Tipo</th><th>Contatto</th><th>Commissione</th><th>Prenotazioni</th></tr></thead>
        <tbody id="promoBody">${partnerRows}</tbody>
      </table></div>
    `}
  `;
}
function partnerSetTab(t) { uiState.partnerTab = t; renderView("partner"); }
function partnerSearch(q) {
  q = q.toLowerCase();
  document.querySelectorAll("#promoBody tr").forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none"; });
}
function openNewPromo() {
  openModal(`
    <div class="modal-head"><h2>${icon("confirmation_number")} Nuovo Codice Promo</h2><button class="modal-close" onclick="closeModal()">${icon("close")}</button></div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-field"><label>Codice</label><input placeholder="ESTATE26"></div>
        <div class="form-field"><label>Sconto (%)</label><input type="number" placeholder="10"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn subtle" onclick="closeModal()">Annulla</button>
      <button class="btn-primary" onclick="closeModal(); showToast('Codice promo creato (demo)','success','check_circle');">Crea Codice</button>
    </div>
  `, { width: "440px" });
}
function deletePromo(i) {
  confirmAction("Eliminare questo codice promo?", () => {
    PROMO_CODES.splice(i, 1);
    showToast("Codice eliminato", "success", "delete");
    renderView("partner");
  }, "Elimina", true);
}

// ==================================================================
// RECENSIONI
// ==================================================================
function view_recensioni() {
  const avg = (REVIEWS.reduce((s, r) => s + r.stars, 0) / REVIEWS.length).toFixed(1);
  const cards = REVIEWS.map(r => `
    <div class="review-card">
      <div class="review-head">
        <span class="review-name">${escapeHtml(r.name)}</span>
        <span class="review-date">${r.date}</span>
      </div>
      <div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
      <div class="review-text">"${escapeHtml(r.text)}"</div>
      <div style="display:flex;gap:8px;"><button class="btn small subtle" onclick="showToast('Risposta inviata (demo)','success','reply')">${icon("reply")} Rispondi</button></div>
    </div>
  `).join("");
  return `
    <div class="view-header"><div><h1 class="view-title">Recensioni</h1><p class="view-subtitle">Feedback dei clienti sulle ultime esperienze.</p></div></div>
    <div class="stat-grid" style="grid-template-columns:repeat(2,1fr);">
      <div class="stat-card"><div class="stat-label">Valutazione media</div><div class="stat-value">⭐ ${avg} / 5</div></div>
      <div class="stat-card"><div class="stat-label">Recensioni totali</div><div class="stat-value">${REVIEWS.length}</div></div>
    </div>
    <div class="info-list">${cards}</div>
  `;
}

// ==================================================================
// CHAT CLIENTI
// ==================================================================
function view_chat() {
  const botCount = CHATS.filter(c => c.botActive).length;
  const manualCount = CHATS.length - botCount;

  const contacts = CHATS.map((c, i) => `
    <div class="chat-contact ${i === uiState.chatActive ? "active" : ""}" onclick="chatSelect(${i})">
      <div class="avatar" style="width:40px;height:40px;font-size:14px;">${c.name.charAt(0)}</div>
      <div style="flex:1;min-width:0;">
        <div class="cname">${escapeHtml(c.name)}</div>
        <div class="clast">${escapeHtml(c.last)}</div>
        <span class="bot-badge ${c.botActive ? "on" : "off"}">${c.botActive ? "🤖 Bot attivo" : "👤 Operatore"}</span>
      </div>
      ${c.unread ? `<span class="pill blue">${c.unread}</span>` : ""}
    </div>
  `).join("");

  const active = CHATS[uiState.chatActive];
  const messages = active.messages.map(m => {
    if (m.from === "system") {
      return `<div class="msg system">${escapeHtml(m.text)}</div>`;
    }
    const cls = m.from === "me" ? "out" : (m.from === "bot" ? "bot" : "in");
    const label = m.from === "bot" ? `<span class="msg-label">🤖 Chatbot</span>` : (m.from === "me" ? `<span class="msg-label">Tu (operatore)</span>` : "");
    return `<div class="msg ${cls}">${label}${escapeHtml(m.text)}<span class="mt">${m.time}</span></div>`;
  }).join("");

  return `
    <div class="view-header">
      <div>
        <h1 class="view-title">Chat Clienti</h1>
        <p class="view-subtitle">Conversazioni del chatbot automatico integrato nel tuo sito web.</p>
      </div>
    </div>

    <div class="chatbot-banner">
      <div class="chatbot-banner-icon">${icon("smart_toy")}</div>
      <div>
        <div class="chatbot-banner-title">Chatbot automatico sempre attivo</div>
        <div class="chatbot-banner-text">Il chatbot è integrato direttamente nel tuo sito e risponde da solo ai clienti 24/7 (disponibilità, prezzi, voucher...). Da questa sezione puoi leggere ogni conversazione in tempo reale, lasciare che sia il bot a rispondere oppure premere <b>"Prendi in carico"</b> per intervenire di persona quando serve.</div>
      </div>
    </div>

    <div class="stat-grid" style="grid-template-columns:repeat(2,1fr);">
      <div class="stat-card">
        <div class="stat-label">Gestite dal bot <span class="stat-icon" style="background:var(--green-soft);color:var(--green);">${icon("smart_toy")}</span></div>
        <div class="stat-value">${botCount}</div>
        <div class="stat-sub">su ${CHATS.length} conversazioni attive</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Prese in carico manualmente <span class="stat-icon" style="background:var(--orange-soft);color:var(--orange);">${icon("support_agent")}</span></div>
        <div class="stat-value">${manualCount}</div>
        <div class="stat-sub">da un operatore dello staff</div>
      </div>
    </div>

    <div class="chat-shell">
      <div class="chat-contacts">${contacts}</div>
      <div class="chat-panel">
        <div class="chat-head">
          <div class="avatar" style="width:34px;height:34px;font-size:13px;">${active.name.charAt(0)}</div>
          <div style="flex:1;">
            ${escapeHtml(active.name)}
            <div style="font-size:11px;font-weight:600;color:var(--text-faint);">${active.botActive ? "Il chatbot sta rispondendo automaticamente" : "Conversazione presa in carico da un operatore"}</div>
          </div>
          <button class="btn small ${active.botActive ? "green" : "on"}" onclick="toggleChatBot()">
            ${active.botActive ? icon("support_agent") + " Prendi in carico" : icon("smart_toy") + " Riattiva bot"}
          </button>
        </div>
        <div class="chat-messages" id="chatMessages">${messages}</div>
        <div class="chat-input">
          <button class="icon-action" id="chatSimulateBtn" title="Simula un nuovo messaggio del cliente" onclick="simulateIncomingMessage()">${icon("science")}</button>
          <input id="chatInput" placeholder="${active.botActive ? "Scrivi per rispondere tu al posto del bot..." : "Scrivi un messaggio..."}" onkeydown="if(event.key==='Enter') chatSend();">
          <button id="chatSendBtn" onclick="chatSend()">${icon("send")}</button>
        </div>
      </div>
    </div>
  `;
}
function chatSelect(i) { uiState.chatActive = i; renderView("chat"); }

function scrollChatToBottom() {
  const box = document.getElementById("chatMessages");
  if (box) box.scrollTop = box.scrollHeight;
}

function toggleChatBot() {
  const chat = CHATS[uiState.chatActive];
  chat.botActive = !chat.botActive;
  chat.messages.push({
    from: "system",
    text: chat.botActive ? "Il bot ha ripreso il controllo della conversazione" : "Un operatore ha preso in carico la conversazione",
    time: "ora",
  });
  showToast(chat.botActive ? "Bot riattivato per questa conversazione" : "Hai preso in carico la conversazione", "success", chat.botActive ? "smart_toy" : "support_agent");
  renderView("chat");
  scrollChatToBottom();
}

function chatSend() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
  const chat = CHATS[uiState.chatActive];

  const wasBotActive = chat.botActive;
  if (wasBotActive) {
    chat.botActive = false;
    chat.messages.push({ from: "system", text: "Un operatore ha preso in carico la conversazione", time: "ora" });
  }
  chat.messages.push({ from: "me", text, time: "ora" });
  chat.last = text;
  input.value = "";
  renderView("chat");
  scrollChatToBottom();
  if (wasBotActive) {
    showToast("Hai risposto tu: il bot si è messo in pausa per questa chat", "info", "support_agent");
  }
}

function simulateIncomingMessage() {
  const chat = CHATS[uiState.chatActive];
  const demoQuestions = [
    "È possibile avere l'auto anche di domenica?",
    "Quanto costa un giorno extra?",
    "Posso pagare con carta al ritiro?",
    "C'è penale per la restituzione in anticipo?",
  ];
  const question = demoQuestions[Math.floor(Math.random() * demoQuestions.length)];
  chat.messages.push({ from: "them", text: question, time: "ora" });
  chat.last = question;
  renderView("chat");
  scrollChatToBottom();

  if (chat.botActive) {
    setTimeout(() => {
      const reply = BOT_AUTO_REPLIES[Math.floor(Math.random() * BOT_AUTO_REPLIES.length)];
      chat.messages.push({ from: "bot", text: reply, time: "ora" });
      chat.last = reply;
      if (currentView === "chat") {
        renderView("chat");
        scrollChatToBottom();
      }
    }, 1100);
  } else {
    showToast("Nuovo messaggio cliente: nessuna risposta automatica, la chat è in gestione manuale", "info", "notifications");
  }
}
