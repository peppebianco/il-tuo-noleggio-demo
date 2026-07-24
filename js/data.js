// ------------------------------------------------------------------
// MOCK DATA — Demo "Il Tuo Noleggio"
// Tutti i dati qui sono di esempio e vengono rigenerati ad ogni sessione.
// ------------------------------------------------------------------

const AGENTS = ["Vanny", "Nicola", "Anna"];

const VEHICLES = [
  { id: "citroen-c4-1", name: "Citroen C4 1", cat: "AUTOVEICOLI", price: 70, bari: 1, monopoli: 0 },
  { id: "fiat-500x-1", name: "Fiat 500X 1", cat: "AUTOVEICOLI", price: 75, bari: 1, monopoli: 0 },
  { id: "ford-puma-1", name: "Ford Puma 1", cat: "AUTOVEICOLI", price: 85, bari: 0, monopoli: 1 },
  { id: "jeep-renegade-1", name: "Jeep Renegade 1", cat: "AUTOVEICOLI", price: 95, bari: 1, monopoli: 0 },
  { id: "toyota-yaris-1", name: "Toyota Yaris 1", cat: "AUTOVEICOLI", price: 80, bari: 0, monopoli: 1 },
  { id: "opel-corsa-1", name: "Opel Corsa 1", cat: "AUTOVEICOLI", price: 65, bari: 1, monopoli: 0 },
  { id: "peugeot-traveller-1", name: "Peugeot Traveller 9p", cat: "AUTOVEICOLI", price: 150, bari: 0, monopoli: 1 },
  { id: "vespa-primavera-3", name: "Vespa Primavera 125 3", cat: "SCOOTER", price: 70, bari: 0, monopoli: 6 },
  { id: "piaggio-medley-1", name: "Piaggio Medley 125CC", cat: "SCOOTER", price: 65, bari: 0, monopoli: 9 },
];

const CUSTOMERS = [
  { name: "Jack Barstead", phone: "+44 07470094786" },
  { name: "Benedek-Gősi Cintia", phone: "+36 30 708 7302" },
  { name: "Zsuzsa", phone: "+36 30 500 2290" },
  { name: "Sandor Kuli", phone: "+36 30 932 8664" },
  { name: "Linus Åhman", phone: "+46 73 946 08 58" },
  { name: "Mauro Crosio", phone: "+39 348 220 6516" },
  { name: "Wojciech Lewandowski", phone: "+48 505 464 425" },
  { name: "Kristof Sulcz", phone: "+36 30 725 7851" },
  { name: "Daniele Fulgoni", phone: "+44 7973 924044" },
  { name: "Paul Ardelean", phone: "+40 771 290156" },
  { name: "Kevin Thomas", phone: "+1 209 485 8289" },
  { name: "Jean-Marc Lecubin", phone: "+33 615 911281" },
  { name: "Renald Keurinck", phone: "+33 760 350642" },
  { name: "Murielle Golinvaux", phone: "+32 471 519261" },
];

const LOCATIONS = ["Aeroporto di Bari", "Stazione di Monopoli", "Via Vittorio Veneto, 29A, Bari", "Via Santa Maria, 24, Monopoli"];

function pick(arr, i) { return arr[i % arr.length]; }
function seededAmount(seed, min, max) {
  const x = Math.sin(seed) * 10000;
  const f = x - Math.floor(x);
  return Math.round((min + f * (max - min)) * 100) / 100;
}

// --- Prenotazioni (bookings) ---
const STATUS_LIST = ["Confermata", "Attiva", "Completata", "Annullata"];
const BOOKINGS = [];
(function buildBookings() {
  const today = new Date();
  for (let i = 0; i < 42; i++) {
    const veh = pick(VEHICLES, i);
    const cust = pick(CUSTOMERS, i);
    const start = new Date(today);
    start.setDate(start.getDate() + (i % 30) - 10);
    const days = 1 + (i % 6);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    const status = STATUS_LIST[i % STATUS_LIST.length];
    BOOKINGS.push({
      id: 1200 + i,
      customer: cust.name,
      phone: cust.phone,
      vehicle: veh.name,
      start, end, days,
      location: pick(LOCATIONS, i),
      agent: pick(AGENTS, i),
      status,
      total: seededAmount(i + 1, 60, 1300),
      extra: i % 5 === 0 ? "Porta Telefono (€3)" : null,
    });
  }
})();

const BOOKING_REQUESTS = [
  {
    id: 9001,
    customer: "Elena Marchetti",
    phone: "+39 347 112 9034",
    vehicle: "Vespa Primavera 125 3",
    start: new Date(new Date().setDate(new Date().getDate() + 4)),
    end: new Date(new Date().setDate(new Date().getDate() + 6)),
    location: "Stazione di Monopoli",
    total: 140,
  },
];

// --- Logistica: to-do list operativo (oggi) ---
const LOGISTICS_TODAY = [
  { time: "00:00", type: "consegna", vehicle: "Toyota Yaris", code: 1, customer: "Mauro Crosio", phone: "+39 348 220 6516", agent: "Vanny", ref: "FR619", price: 160.2, location: "Aeroporto di Bari" },
  { time: "06:30", type: "ritiro", vehicle: "Toyota Yaris Cross 1", code: 1, customer: "Wojciech Lewandowski", phone: "+48 505 464 425", agent: "Nicola", ref: "1244", price: 570, location: "Aeroporto di Bari", tag: "Booster / Alzatina" },
  { time: "08:30", type: "consegna", vehicle: "Opel Grandland - Tartarelli", code: null, customer: "Kristof Sulcz", phone: "+36 307 257851", agent: "Nicola", ref: "1311", price: 210, location: "Monopoli" },
  { time: "09:00", type: "consegna", vehicle: "Piaggio Medley 125CC", code: 28, customer: "Linus Åhman", phone: "+46 73 946 08 58", agent: "Vanny", ref: "1290", price: 130, location: "Monopoli" },
  { time: "09:00", type: "consegna", vehicle: "Vespa Primavera 125CC", code: 3, customer: "Jack Barstead", phone: "+44 07470094786", agent: "Anna", ref: "1301", price: 140, location: "Aeroporto di Bari" },
  { time: "09:30", type: "ritiro", vehicle: "Fiat 500X 1", code: 1, customer: "Renald Keurinck", phone: "+33 760 350642", agent: "Vanny", ref: "1180", price: 225, location: "Aeroporto di Bari" },
  { time: "11:00", type: "consegna", vehicle: "Citroen C4 1", code: 1, customer: "Murielle Golinvaux", phone: "+32 471 519261", agent: "Nicola", ref: "1322", price: 175, location: "Monopoli" },
  { time: "12:15", type: "ritiro", vehicle: "Jeep Renegade 1", code: 1, customer: "Sandor Kuli", phone: "+36 309 328664", agent: "Vanny", ref: "1205", price: 380, location: "Aeroporto di Bari" },
  { time: "14:00", type: "consegna", vehicle: "Ford Puma 1", code: 1, customer: "Zsuzsa", phone: "+36 30 500 2290", agent: "Nicola", ref: "1330", price: 255, location: "Monopoli" },
  { time: "16:00", type: "ritiro", vehicle: "Peugeot Traveller 9p", code: null, customer: "Jean-Marc Lecubin", phone: "+33 615 911281", agent: "Anna", ref: "1150", price: 750, location: "Aeroporto di Bari" },
  { time: "19:30", type: "ritiro", vehicle: "Opel Corsa 1", code: 1, customer: "Paul Ardelean", phone: "+40 771 290156", agent: "Vanny", ref: "1160", price: 166.48, location: "Monopoli" },
];

// --- Noleggi attivi ---
const ACTIVE_RENTALS = [
  { vehicle: "Toyota Yaris Cros", code: "auto13", start: "24/07/2026 09:30", end: "24/07/2026 22:30", remaining: "5h 35min", customer: "Jack Barstead", phone: "+44 07470094786", agent: "Anna" },
  { vehicle: "Vespa Primavera 125CC", code: "Vespa Primavera 125 3", start: "24/07/2026 09:00", end: "24/07/2026 21:00", remaining: "4h 5min", customer: "Benedek-Gősi Cintia", phone: "+36 30 708 7302", agent: "Nicola" },
  { vehicle: "Opel Mokka", code: "auto3", start: "22/07/2026 15:30", end: "24/07/2026 19:00", remaining: "2h 5min", customer: "~Zsuzsa", phone: "+36 30 500 2290", agent: "Vanny" },
  { vehicle: "Peugeot 2008", code: "Peugeot 2008 1", start: "20/07/2026 15:00", end: "24/07/2026 19:00", remaining: "2h 5min", customer: "Sandor Kuli", phone: "+36 30 932 8664", agent: "Nicola" },
  { vehicle: "Piaggio Medley 125CC", code: "auto28", start: "24/07/2026 09:00", end: "24/07/2026 22:00", remaining: "5h 5min", customer: "~Linus Åhman", phone: "+46 73 946 08 58", agent: "Vanny" },
  { vehicle: "Toyota Yaris", code: "Yaris 1", start: "24/07/2026 00:00", end: "24/07/2026 19:00", remaining: "1h 5min", customer: "Mauro Crosio", phone: "+39 348 220 6516", agent: "Vanny" },
];

// --- Voucher ---
const VOUCHERS = [
  { vehicle: "Nissan Juke", customer: "~Pablo Vega", start: "05/10/2026", end: "10/10/2026", location: "Viale Enzo Ferrari, 70128 Bari BA, Italia", amount: 550 },
  { vehicle: "Peugeot 208", customer: "Let's rent", start: "07/08/2026", end: "07/08/2026", location: "Via Europa Libera, 15/F, 70043 Monopoli BA, Italia", amount: 100 },
  { vehicle: "Peugeot 2008", customer: "PIERO UVA", start: "25/07/2026", end: "29/07/2026", location: "Elaia Domos", amount: 412.25 },
  { vehicle: "Peugeot 2008", customer: "PIERO UVA", start: "23/07/2026", end: "23/07/2026", location: "Elaia Domos", amount: 105 },
  { vehicle: "2 Veicoli (Scali)", customer: "Margi", start: "26/09/2026", end: "04/10/2026", location: "Viale Enzo Ferrari, 70128 Bari BA, Italia", amount: 1651.4 },
  { vehicle: "Nissan Juke", customer: "~Margi", start: "26/09/2026", end: "04/10/2026", location: "Viale Enzo Ferrari, 70128 Bari BA, Italia", amount: 782.05 },
];

// --- Clienti ---
const CUSTOMERS_TABLE = [
  { name: "Jean-Marc LECUBIN", email: "jeanmarc.l@jml.fr", phone: "+33 615 911281", bookings: 7, last: "22/07/2026" },
  { name: "Renald KEURINCK", email: "gravinad@yahoo.fr", phone: "+33 760 350642", bookings: 6, last: "13/03/2026" },
  { name: "PUGLIAMARE", email: "lia@pugliamare.it", phone: "+1 650 922 9383", bookings: 6, last: "14/05/2026" },
  { name: "PASCAL", email: "laurence38150@gmail.com", phone: "+33 609 417850", bookings: 6, last: "08/06/2026" },
  { name: "PREZIOSO MARCELLO", email: "archhorniakovalucia@gmail.com", phone: "+39 333 668 8652", bookings: 4, last: "06/07/2026" },
  { name: "Murielle Golinvaux", email: "murielle.golinvaux@gmail.com", phone: "+32 471 519261", bookings: 4, last: "19/03/2026" },
  { name: "Kristof Sulcz", email: "kristof.s@gmail.com", phone: "+36 307 257851", bookings: 3, last: "02/06/2026" },
  { name: "Mauro Crosio", email: "mauro.crosio@gmail.com", phone: "+39 348 220 6516", bookings: 2, last: "24/07/2026" },
];

// --- Partner / Codici Promo ---
const PROMO_CODES = [
  { code: "ELAIA DOMOS", discount: -10, created: "23/07/2026", uses: 4, revenue: 517.25, status: "ACTIVE" },
  { code: "PARTNER", discount: -5, created: "20/07/2026", uses: 12, revenue: 2140, status: "ACTIVE" },
  { code: "RENTPARTNER", discount: -15, created: "28/06/2026", uses: 9, revenue: 1980, status: "ACTIVE" },
  { code: "SUMMER26", discount: -20, created: "01/06/2026", uses: 21, revenue: 4310, status: "ACTIVE" },
  { code: "WELCOME10", discount: -10, created: "12/02/2026", uses: 38, revenue: 6250.75, status: "SCADUTO" },
];

const PARTNERS = [
  { name: "Elaia Domos", type: "Resort", contact: "info@elaiadomos.it", commission: "10%", bookings: 6 },
  { name: "Masseria Torrepietra", type: "Hotel", contact: "booking@torrepietra.it", commission: "8%", bookings: 3 },
  { name: "Let's Rent", type: "Broker", contact: "hello@letsrent.com", commission: "12%", bookings: 9 },
];

// --- Recensioni ---
const REVIEWS = [
  { name: "Marta B.", stars: 5, date: "18/07/2026", text: "Servizio impeccabile, consegna in aeroporto puntualissima. Consiglio vivamente!" },
  { name: "Giovanni R.", stars: 4, date: "12/07/2026", text: "Auto pulita e in ottime condizioni, unico neo il ritiro leggermente in ritardo." },
  { name: "Sophie L.", stars: 5, date: "05/07/2026", text: "Ottimo rapporto qualità prezzo, personale gentilissimo. Torneremo sicuramente." },
  { name: "Andrea T.", stars: 5, date: "29/06/2026", text: "Prenotazione facile online, tutto chiaro e trasparente. Top!" },
  { name: "Klara M.", stars: 3, date: "20/06/2026", text: "Scooter comodo ma la comunicazione whatsapp poteva essere più rapida." },
];

// --- Chat clienti ---
const CHATS = [
  { name: "Jack Barstead", last: "Perfetto, a che ora possiamo ritirare l'auto?", unread: 2, messages: [
    { from: "them", text: "Ciao! Confermo la prenotazione per domani.", time: "09:12" },
    { from: "me", text: "Perfetto Jack, vi aspettiamo in aeroporto alle 09:30.", time: "09:14" },
    { from: "them", text: "Perfetto, a che ora possiamo ritirare l'auto?", time: "09:20" },
  ]},
  { name: "Benedek-Gősi Cintia", last: "Grazie mille, tutto chiaro!", unread: 0, messages: [
    { from: "them", text: "Salve, la vespa ha il bauletto incluso?", time: "ieri" },
    { from: "me", text: "Sì, è incluso senza costi aggiuntivi.", time: "ieri" },
    { from: "them", text: "Grazie mille, tutto chiaro!", time: "ieri" },
  ]},
  { name: "Sandor Kuli", last: "Ok vi mando la carta d'identità ora", unread: 1, messages: [
    { from: "me", text: "Buongiorno, ci servirebbe una copia del documento prima del ritiro.", time: "08:02" },
    { from: "them", text: "Ok vi mando la carta d'identità ora", time: "08:10" },
  ]},
  { name: "Piero Uva", last: "Va bene, confermo il voucher", unread: 0, messages: [
    { from: "them", text: "Buongiorno, avrei bisogno del voucher per Elaia Domos.", time: "lun" },
    { from: "me", text: "Certamente, lo inviamo entro oggi via email.", time: "lun" },
    { from: "them", text: "Va bene, confermo il voucher", time: "lun" },
  ]},
];

// --- Notifiche ---
const NOTIFICATIONS = [
  { title: "Nuova richiesta di prenotazione da Elena Marchetti", time: "10 minuti fa", icon: "event_available" },
  { title: "Ritiro Toyota Yaris Cross 1 tra 30 minuti", time: "28 minuti fa", icon: "local_shipping" },
  { title: "Recensione 5 stelle ricevuta da Andrea T.", time: "2 ore fa", icon: "star" },
  { title: "Voucher Nissan Juke in scadenza tra 3 giorni", time: "5 ore fa", icon: "confirmation_number" },
  { title: "Pagamento ricevuto da Kevin Thomas — €95,46", time: "ieri", icon: "payments" },
];
