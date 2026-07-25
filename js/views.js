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

  const rows = list.map((x, i) => `
    <div class="info-row ${x.type}">
      <div class="time-badge">
        ${x.time}
        <span class="lbl">${x.type === "consegna" ? "CONSEGNA" : "RITIRO"}</span>
        <span class="amt">€${x.price}</span>
      </div>
      <div class="info-main">
        <div class="info-title-row">
          <span class="info-title">${escapeHtml(x.vehicle.toUpperCase())}</span>
          ${x.code ? `<span class="tag">${x.code}</span>` : ""}
        </div>
        <div class="info-customer">
          <span>${icon("person")} ${escapeHtml(x.customer)} · ${escapeHtml(x.phone)}</span>
          <span class="tag agent">${x.agent}</span>
          <span class="tag">#${x.ref}</span>
        </div>
        <div class="info-loc">${icon("location_on")} ${escapeHtml(x.location)} ${x.tag ? `<span class="tag" style="margin-left:8px;">${x.tag}</span>` : ""}</div>
      </div>
      <div class="info-actions">
        <button class="icon-action" title="Allegati" onclick="showToast('Nessun allegato presente (demo)')">${icon("attach_file")}</button>
        <button class="icon-action edit" title="Modifica" onclick="openInfoModal('Modifica movimento',[{label:'Veicolo',value:'${escapeHtml(x.vehicle)}'},{label:'Cliente',value:'${escapeHtml(x.customer)}'},{label:'Orario',value:'${x.time}'}],'edit')">${icon("edit")}</button>
        <button class="icon-action wa" title="WhatsApp" onclick="showToast('Apertura chat WhatsApp con ${escapeHtml(x.customer)} (demo)','success','forum')">${icon("forum")}</button>
        <button class="icon-action" title="Apri" onclick="renderView('prenotazioni')">${icon("open_in_new")}</button>
        <button class="icon-action del" title="Elimina" onclick="confirmAction('Eliminare il movimento di ${escapeHtml(x.customer)}?', () => { showToast('Movimento eliminato (demo)','success','delete'); }, 'Elimina', true)">${icon("delete")}</button>
      </div>
    </div>
  `).join("");

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

  const pillClass = { "Confermata": "blue", "Attiva": "green", "Completata": "gray", "Annullata": "red" };

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
        <button class="icon-action" title="Anteprima" onclick="openInfoModal('${escapeHtml(v.name)}',[{label:'Prezzo/giorno',value:'€${v.price}'},{label:'Costalunga',value:'${v.bari} disponibili'},{label:'Marenova',value:'${v.monopoli} disponibili'}],'visibility')">${icon("visibility")}</button>
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
function openAddVehicle() {
  openModal(`
    <div class="modal-head"><h2>${icon("add_circle")} Aggiungi Veicolo</h2><button class="modal-close" onclick="closeModal()">${icon("close")}</button></div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-field"><label>Nome veicolo</label><input placeholder="Es. Fiat Panda 2"></div>
        <div class="form-row2">
          <div class="form-field"><label>Prezzo / giorno (€)</label><input type="number" placeholder="60"></div>
          <div class="form-field"><label>Categoria</label><select><option>AUTOVEICOLI</option><option>SCOOTER</option></select></div>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn subtle" onclick="closeModal()">Annulla</button>
      <button class="btn-primary" onclick="closeModal(); showToast('Veicolo aggiunto (demo)','success','check_circle');">Salva Veicolo</button>
    </div>
  `, { width: "480px" });
}
function openEditVehicle(id) {
  const v = VEHICLES.find(x => x.id === id);
  openModal(`
    <div class="modal-head"><h2>${icon("edit")} Modifica ${escapeHtml(v.name)}</h2><button class="modal-close" onclick="closeModal()">${icon("close")}</button></div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-field"><label>Nome veicolo</label><input value="${escapeHtml(v.name)}"></div>
        <div class="form-field"><label>Prezzo / giorno (€)</label><input type="number" value="${v.price}"></div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn subtle" onclick="closeModal()">Annulla</button>
      <button class="btn-primary" onclick="closeModal(); showToast('Modifiche salvate (demo)','success','check_circle');">Salva Modifiche</button>
    </div>
  `, { width: "480px" });
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
  `;
}
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
    <div class="view-header"><div><h1 class="view-title">Clienti</h1><p class="view-subtitle">Anagrafica e storico prenotazioni.</p></div></div>
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
