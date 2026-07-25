// ------------------------------------------------------------------
// MOCK DATA — Demo "Il Tuo Noleggio"
// Tutti i dati qui sono interamente inventati a scopo dimostrativo:
// nomi, numeri di telefono, indirizzi, importi e statistiche non
// corrispondono a persone, luoghi o prenotazioni reali.
// ------------------------------------------------------------------

const AGENTS = ["Sara", "Marco", "Giulia"];

const VEHICLES = [
  { id: "citroen-c4-1", name: "Citroen C4 1", cat: "AUTOVEICOLI", price: 68, bari: 1, monopoli: 0 },
  { id: "fiat-500x-1", name: "Fiat 500X 1", cat: "AUTOVEICOLI", price: 74, bari: 1, monopoli: 0 },
  { id: "ford-puma-1", name: "Ford Puma 1", cat: "AUTOVEICOLI", price: 82, bari: 0, monopoli: 1 },
  { id: "jeep-renegade-1", name: "Jeep Renegade 1", cat: "AUTOVEICOLI", price: 92, bari: 1, monopoli: 0 },
  { id: "toyota-yaris-1", name: "Toyota Yaris 1", cat: "AUTOVEICOLI", price: 78, bari: 0, monopoli: 1 },
  { id: "opel-corsa-1", name: "Opel Corsa 1", cat: "AUTOVEICOLI", price: 62, bari: 1, monopoli: 0 },
  { id: "peugeot-traveller-1", name: "Peugeot Traveller 9p", cat: "AUTOVEICOLI", price: 145, bari: 0, monopoli: 1 },
  { id: "vespa-primavera-3", name: "Vespa Primavera 125 3", cat: "SCOOTER", price: 68, bari: 0, monopoli: 6 },
  { id: "piaggio-medley-1", name: "Piaggio Medley 125CC", cat: "SCOOTER", price: 63, bari: 0, monopoli: 9 },
];

const CUSTOMERS = [
  { name: "Tommaso Ferraro", phone: "+39 320 555 0142" },
  { name: "Ilse Van der Berg", phone: "+31 6 5550 1187" },
  { name: "Nadia Kowalski", phone: "+48 512 550 341" },
  { name: "Emil Johansson", phone: "+46 70 550 2214" },
  { name: "Noah Fischer", phone: "+49 151 5502 987" },
  { name: "Camilla Esposito", phone: "+39 347 555 0623" },
  { name: "Bartek Nowak", phone: "+48 601 550 774" },
  { name: "Zsófia Tóth", phone: "+36 30 555 0491" },
  { name: "Riccardo Gallo", phone: "+44 7700 900 512" },
  { name: "Andrei Popescu", phone: "+40 722 550 318" },
  { name: "Grace Whitfield", phone: "+1 415 555 0198" },
  { name: "Louis Fontaine", phone: "+33 6 5501 2277" },
  { name: "Marion Lambert", phone: "+33 6 5502 8841" },
  { name: "Sofie Willems", phone: "+32 470 550 265" },
];

const LOCATIONS = ["Aeroporto di Costalunga", "Stazione di Marenova", "Via dei Gerani, 12, Costalunga", "Corso Italia, 45, Marenova"];

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
      id: 4200 + i,
      customer: cust.name,
      phone: cust.phone,
      vehicle: veh.name,
      start, end, days,
      location: pick(LOCATIONS, i),
      agent: pick(AGENTS, i),
      status,
      total: seededAmount(i + 1, 60, 1100),
      extra: i % 5 === 0 ? "Seggiolino Bimbo (€3)" : null,
    });
  }
})();

const BOOKING_REQUESTS = [
  {
    id: 9501,
    customer: "Valentina Russo",
    phone: "+39 328 555 0456",
    vehicle: "Vespa Primavera 125 3",
    start: new Date(new Date().setDate(new Date().getDate() + 4)),
    end: new Date(new Date().setDate(new Date().getDate() + 6)),
    location: "Stazione di Marenova",
    total: 136,
  },
];

// --- Logistica: to-do list operativo (oggi) ---
const LOGISTICS_TODAY = [
  { time: "00:00", type: "consegna", vehicle: "Toyota Yaris", code: 1, customer: "Tommaso Ferraro", phone: "+39 320 555 0142", agent: "Sara", ref: "DM204", price: 158.5, location: "Aeroporto di Costalunga" },
  { time: "06:30", type: "ritiro", vehicle: "Toyota Yaris Cross 1", code: 1, customer: "Noah Fischer", phone: "+49 151 5502 987", agent: "Marco", ref: "DM211", price: 560, location: "Aeroporto di Costalunga", tag: "Seggiolino / Rialzo" },
  { time: "08:30", type: "consegna", vehicle: "Opel Grandland - Executive", code: null, customer: "Zsófia Tóth", phone: "+36 30 555 0491", agent: "Marco", ref: "DM217", price: 205, location: "Marenova" },
  { time: "09:00", type: "consegna", vehicle: "Piaggio Medley 125CC", code: 28, customer: "Emil Johansson", phone: "+46 70 550 2214", agent: "Sara", ref: "DM225", price: 128, location: "Marenova" },
  { time: "09:00", type: "consegna", vehicle: "Vespa Primavera 125CC", code: 3, customer: "Riccardo Gallo", phone: "+44 7700 900 512", agent: "Giulia", ref: "DM230", price: 138, location: "Aeroporto di Costalunga" },
  { time: "09:30", type: "ritiro", vehicle: "Fiat 500X 1", code: 1, customer: "Louis Fontaine", phone: "+33 6 5501 2277", agent: "Sara", ref: "DM188", price: 222, location: "Aeroporto di Costalunga" },
  { time: "11:00", type: "consegna", vehicle: "Citroen C4 1", code: 1, customer: "Sofie Willems", phone: "+32 470 550 265", agent: "Marco", ref: "DM241", price: 172, location: "Marenova" },
  { time: "12:15", type: "ritiro", vehicle: "Jeep Renegade 1", code: 1, customer: "Nadia Kowalski", phone: "+48 512 550 341", agent: "Sara", ref: "DM199", price: 376, location: "Aeroporto di Costalunga" },
  { time: "14:00", type: "consegna", vehicle: "Ford Puma 1", code: 1, customer: "Ilse Van der Berg", phone: "+31 6 5550 1187", agent: "Marco", ref: "DM248", price: 250, location: "Marenova" },
  { time: "16:00", type: "ritiro", vehicle: "Peugeot Traveller 9p", code: null, customer: "Grace Whitfield", phone: "+1 415 555 0198", agent: "Giulia", ref: "DM160", price: 740, location: "Aeroporto di Costalunga" },
  { time: "19:30", type: "ritiro", vehicle: "Opel Corsa 1", code: 1, customer: "Andrei Popescu", phone: "+40 722 550 318", agent: "Sara", ref: "DM172", price: 163.9, location: "Marenova" },
];

// Arricchisce ogni movimento con i dati necessari al dettaglio (date, indirizzi,
// email...) senza doverli ripetere a mano per ogni riga sopra.
(function enrichLogistics() {
  const CLIENT_STREETS = ["Norwood Road 4B", "Rue de la Paix 12", "Musterstraße 8", "Ulica Kwiatowa 21", "Utca Fő utca 15", "Calle Mayor 9", "Strada Verde 3", "Kerkstraat 22"];
  function emailFrom(name) {
    const stripDiacritics = new RegExp("[\\u0300-\\u036f]", "g");
    return name.toLowerCase().normalize("NFD").replace(stripDiacritics, "").replace(/[^a-z\s]/g, "").trim().split(/\s+/).join(".") + "@example.com";
  }
  LOGISTICS_TODAY.forEach((x, i) => {
    const [hh, mm] = x.time.split(":").map(Number);
    const deliveryDateTime = new Date();
    deliveryDateTime.setHours(hh, mm, 0, 0);
    const rentalDays = 1 + (i % 4);
    const returnDateTime = new Date(deliveryDateTime);
    returnDateTime.setDate(returnDateTime.getDate() + rentalDays);
    returnDateTime.setHours(17, 0, 0, 0);
    const received = new Date();
    received.setDate(received.getDate() - (2 + (i % 5)));

    x.email = emailFrom(x.customer);
    x.clientAddress = pick(CLIENT_STREETS, i);
    x.deliveryAddress = x.location + (i % 3 === 0 ? "" : ", Zona Arrivi");
    x.returnAddress = i % 4 === 0 ? pick(CLIENT_STREETS, i + 2) : x.deliveryAddress;
    x.deliveryDateTime = deliveryDateTime;
    x.returnDateTime = returnDateTime;
    x.receivedDate = received;
  });
})();

// --- Noleggi attivi ---
const ACTIVE_RENTALS = [
  { vehicle: "Toyota Yaris Cros", code: "auto13", start: "24/07/2026 09:30", end: "24/07/2026 22:30", remaining: "5h 35min", customer: "Riccardo Gallo", phone: "+44 7700 900 512", agent: "Giulia" },
  { vehicle: "Vespa Primavera 125CC", code: "Vespa Primavera 125 3", start: "24/07/2026 09:00", end: "24/07/2026 21:00", remaining: "4h 5min", customer: "Ilse Van der Berg", phone: "+31 6 5550 1187", agent: "Marco" },
  { vehicle: "Opel Mokka", code: "auto3", start: "22/07/2026 15:30", end: "24/07/2026 19:00", remaining: "2h 5min", customer: "~Nadia Kowalski", phone: "+48 512 550 341", agent: "Sara" },
  { vehicle: "Peugeot 2008", code: "Peugeot 2008 1", start: "20/07/2026 15:00", end: "24/07/2026 19:00", remaining: "2h 5min", customer: "Andrei Popescu", phone: "+40 722 550 318", agent: "Marco" },
  { vehicle: "Piaggio Medley 125CC", code: "auto28", start: "24/07/2026 09:00", end: "24/07/2026 22:00", remaining: "5h 5min", customer: "~Emil Johansson", phone: "+46 70 550 2214", agent: "Sara" },
  { vehicle: "Toyota Yaris", code: "Yaris 1", start: "24/07/2026 00:00", end: "24/07/2026 19:00", remaining: "1h 5min", customer: "Tommaso Ferraro", phone: "+39 320 555 0142", agent: "Sara" },
];

// --- Voucher ---
const VOUCHERS = [
  { vehicle: "Nissan Juke", customer: "~Diego Marino", start: "05/10/2026", end: "10/10/2026", location: "Viale delle Magnolie, 8, Costalunga", amount: 540 },
  { vehicle: "Peugeot 208", customer: "Nova Rent Broker", start: "07/08/2026", end: "07/08/2026", location: "Via Europa, 15/F, Marenova", amount: 98 },
  { vehicle: "Peugeot 2008", customer: "FRANCESCA IANNONE", start: "25/07/2026", end: "29/07/2026", location: "Villa Aurora Resort", amount: 405.5 },
  { vehicle: "Peugeot 2008", customer: "FRANCESCA IANNONE", start: "23/07/2026", end: "23/07/2026", location: "Villa Aurora Resort", amount: 102 },
  { vehicle: "2 Veicoli (Scali)", customer: "Gruppo Bertoni", start: "26/09/2026", end: "04/10/2026", location: "Viale delle Magnolie, 8, Costalunga", amount: 1620.9 },
  { vehicle: "Nissan Juke", customer: "~Gruppo Bertoni", start: "26/09/2026", end: "04/10/2026", location: "Viale delle Magnolie, 8, Costalunga", amount: 768.4 },
];

// --- Clienti ---
const CUSTOMERS_TABLE = [
  { name: "Louis FONTAINE", email: "louis.fontaine@example.com", phone: "+33 6 5501 2277", bookings: 7, last: "22/07/2026" },
  { name: "Bartek NOWAK", email: "bartek.nowak@example.com", phone: "+48 601 550 774", bookings: 6, last: "13/03/2026" },
  { name: "MARE&VIAGGI SRL", email: "info@marevviaggi.example", phone: "+1 650 555 0233", bookings: 6, last: "14/05/2026" },
  { name: "GRUPPO BERTONI", email: "eventi@gruppobertoni.example", phone: "+33 6 5509 4150", bookings: 6, last: "08/06/2026" },
  { name: "FRANCESCA IANNONE", email: "f.iannone@example.com", phone: "+39 333 555 8652", bookings: 4, last: "06/07/2026" },
  { name: "Sofie Willems", email: "sofie.willems@example.com", phone: "+32 470 550 265", bookings: 4, last: "19/03/2026" },
  { name: "Zsófia Tóth", email: "zsofia.toth@example.com", phone: "+36 30 555 0491", bookings: 3, last: "02/06/2026" },
  { name: "Tommaso Ferraro", email: "tommaso.ferraro@example.com", phone: "+39 320 555 0142", bookings: 2, last: "24/07/2026" },
];
// Numero totale di clienti in anagrafica: la tabella sopra mostra solo un estratto.
let CUSTOMERS_TOTAL_COUNT = 486;

// --- Partner / Codici Promo ---
const PROMO_CODES = [
  { code: "VILLAAURORA10", discount: -10, created: "23/07/2026", uses: 4, revenue: 507.5, status: "ACTIVE" },
  { code: "PARTNER5", discount: -5, created: "20/07/2026", uses: 12, revenue: 1980, status: "ACTIVE" },
  { code: "NOVARENT15", discount: -15, created: "28/06/2026", uses: 9, revenue: 1840, status: "ACTIVE" },
  { code: "ESTATE26", discount: -20, created: "01/06/2026", uses: 21, revenue: 3990, status: "ACTIVE" },
  { code: "BENVENUTO10", discount: -10, created: "12/02/2026", uses: 38, revenue: 5820.5, status: "SCADUTO" },
];

const PARTNERS = [
  { name: "Villa Aurora Resort", type: "Resort", contact: "info@villaaurora.example", commission: "10%", bookings: 6 },
  { name: "Tenuta Belvento", type: "Hotel", contact: "booking@tenutabelvento.example", commission: "8%", bookings: 3 },
  { name: "Nova Rent Broker", type: "Broker", contact: "hello@novarent.example", commission: "12%", bookings: 9 },
];

// --- Recensioni ---
const REVIEWS = [
  { name: "Chiara V.", stars: 5, date: "18/07/2026", text: "Servizio impeccabile, consegna in aeroporto puntualissima. Consiglio vivamente!" },
  { name: "Fabio S.", stars: 4, date: "12/07/2026", text: "Auto pulita e in ottime condizioni, unico neo il ritiro leggermente in ritardo." },
  { name: "Amelie D.", stars: 5, date: "05/07/2026", text: "Ottimo rapporto qualità prezzo, personale gentilissimo. Torneremo sicuramente." },
  { name: "Davide M.", stars: 5, date: "29/06/2026", text: "Prenotazione facile online, tutto chiaro e trasparente. Top!" },
  { name: "Petra K.", stars: 3, date: "20/06/2026", text: "Scooter comodo ma la comunicazione whatsapp poteva essere più rapida." },
];

// --- Chat Clienti: conversazioni del chatbot automatico integrato nel sito ---
// "botActive": true  -> il bot risponde in autonomia ai messaggi del cliente
// "botActive": false -> un operatore ha preso in carico la conversazione
const CHATS = [
  { name: "Riccardo Gallo", last: "Perfetto, a che ora possiamo ritirare l'auto?", unread: 2, botActive: true, messages: [
    { from: "them", text: "Ciao! Confermo la prenotazione per domani.", time: "09:12" },
    { from: "bot", text: "Perfetto Riccardo! Il ritiro è confermato per le 09:30 in Aeroporto di Costalunga. Vuoi aggiungere un seggiolino o altri extra?", time: "09:12" },
    { from: "them", text: "Perfetto, a che ora possiamo ritirare l'auto?", time: "09:20" },
  ]},
  { name: "Ilse Van der Berg", last: "Grazie mille, tutto chiaro!", unread: 0, botActive: true, messages: [
    { from: "them", text: "Salve, la vespa ha il bauletto incluso?", time: "ieri" },
    { from: "bot", text: "Sì Ilse, il bauletto è incluso senza costi aggiuntivi 😊", time: "ieri" },
    { from: "them", text: "Grazie mille, tutto chiaro!", time: "ieri" },
  ]},
  { name: "Nadia Kowalski", last: "Ok vi mando la carta d'identità ora", unread: 1, botActive: false, messages: [
    { from: "them", text: "Buongiorno, devo caricare un documento per il noleggio?", time: "07:55" },
    { from: "bot", text: "Ciao Nadia! Per la verifica del documento ti metto in contatto con un operatore del nostro staff.", time: "07:56" },
    { from: "system", text: "Un operatore ha preso in carico la conversazione", time: "08:00" },
    { from: "me", text: "Buongiorno, ci servirebbe una copia del documento prima del ritiro.", time: "08:02" },
    { from: "them", text: "Ok vi mando la carta d'identità ora", time: "08:10" },
  ]},
  { name: "Francesca Iannone", last: "Va bene, confermo il voucher", unread: 0, botActive: true, messages: [
    { from: "them", text: "Buongiorno, avrei bisogno del voucher per Villa Aurora Resort.", time: "lun" },
    { from: "bot", text: "Certo Francesca! Il voucher verrà inviato automaticamente alla tua email entro oggi.", time: "lun" },
    { from: "them", text: "Va bene, confermo il voucher", time: "lun" },
  ]},
  { name: "Grace Whitfield", last: "Perfect, thank you so much for your help!", unread: 0, botActive: true, messages: [
    { from: "them", text: "Hi! I'd like to know if I can add a second driver to my booking.", time: "14:02" },
    { from: "bot", text: "Hello Grace! Yes, you can add a second driver for €15 total for the whole rental. Would you like me to add it now?", time: "14:03" },
    { from: "them", text: "Yes please, my husband will be driving too sometimes.", time: "14:05" },
    { from: "bot", text: "Done! I've added a second driver to your Peugeot Traveller 9p booking. Please remember to bring both driving licences at pickup.", time: "14:05" },
    { from: "them", text: "Great. One more thing - is the airport pickup point inside the terminal or outside?", time: "14:10" },
    { from: "bot", text: "Our desk is right outside Arrivals, next to the car rental kiosks - you'll see our orange sign 🚗", time: "14:11" },
    { from: "them", text: "Perfect, thank you so much for your help!", time: "14:12" },
  ]},
  { name: "Marion Lambert", last: "D'accord, merci beaucoup !", unread: 0, botActive: true, messages: [
    { from: "them", text: "Bonjour, je voudrais savoir si le GPS est inclus avec la voiture ?", time: "10:30" },
    { from: "bot", text: "Bonjour Marion ! Le GPS n'est pas inclus de base, mais vous pouvez l'ajouter pour 5€/jour. Souhaitez-vous que je l'ajoute à votre réservation ?", time: "10:31" },
    { from: "them", text: "Oui, ajoutez-le s'il vous plaît. Et le paiement se fait comment ?", time: "10:33" },
    { from: "bot", text: "Très bien, GPS ajouté ✅ Le paiement se fait par carte bancaire directement au comptoir lors du retrait du véhicule, ou en ligne dès maintenant si vous préférez.", time: "10:34" },
    { from: "them", text: "Je préfère payer sur place. Merci !", time: "10:36" },
    { from: "bot", text: "Parfait, c'est noté. Vous recevrez un e-mail de confirmation avec tous les détails de la réservation.", time: "10:36" },
    { from: "them", text: "D'accord, merci beaucoup !", time: "10:40" },
  ]},
  { name: "Noah Fischer", last: "Alles klar, vielen Dank!", unread: 1, botActive: true, messages: [
    { from: "them", text: "Hallo, ich wollte fragen, ob eine Vollkaskoversicherung verfügbar ist?", time: "16:20" },
    { from: "bot", text: "Hallo Noah! Ja, wir bieten eine Vollkaskoversicherung mit Selbstbeteiligung von nur 100€ für 8€ pro Tag an. Möchten Sie diese hinzufügen?", time: "16:21" },
    { from: "them", text: "Ja, das klingt gut. Können Sie das für die ganze Mietdauer hinzufügen?", time: "16:23" },
    { from: "bot", text: "Erledigt! Die Vollkaskoversicherung wurde für die gesamte Mietdauer (6 Tage) hinzugefügt. Gesamtkosten: 48€.", time: "16:24" },
    { from: "them", text: "Super. Und wo genau finde ich das Fahrzeug bei der Abholung?", time: "16:26" },
    { from: "bot", text: "Sie finden unseren Schalter direkt am Flughafenterminal, Ausgang B, gegenüber vom Café.", time: "16:27" },
    { from: "them", text: "Alles klar, vielen Dank!", time: "16:28" },
  ]},
  { name: "Sofie Willems", last: "Top, bedankt voor de snelle hulp!", unread: 0, botActive: false, messages: [
    { from: "them", text: "Hoi, ik wil mijn huurperiode graag met 2 dagen verlengen. Kan dat nog?", time: "11:05" },
    { from: "bot", text: "Hoi Sofie! Een verlenging kan zeker, maar omdat het minder dan 48 uur voor je terugkeer is, verbind ik je door met een medewerker om de beschikbaarheid te bevestigen.", time: "11:06" },
    { from: "system", text: "Un operatore ha preso in carico la conversazione", time: "11:10" },
    { from: "me", text: "Hallo Sofie, ik heb het nagekeken: de Citroën C4 is nog beschikbaar. Ik verleng je boeking met 2 dagen, dat komt neer op €136 extra.", time: "11:14" },
    { from: "them", text: "Perfect, dat is goed. Kunnen jullie de bevestiging naar mijn e-mail sturen?", time: "11:16" },
    { from: "me", text: "Zeker, de bevestiging is net verstuurd naar je e-mailadres.", time: "11:18" },
    { from: "them", text: "Top, bedankt voor de snelle hulp!", time: "11:20" },
  ]},
];

// Risposte automatiche di esempio che il bot invia quando si simula un nuovo messaggio cliente
const BOT_AUTO_REPLIES = [
  "Grazie per il messaggio! Un attimo che controllo la disponibilità 🚗",
  "Certo, posso confermartelo subito: il veicolo risulta disponibile per le date richieste.",
  "Ricevuto! Se vuoi posso anche inviarti il preventivo aggiornato via email.",
  "Perfetto, ho segnato la tua richiesta. Ti risponderà a breve anche un operatore se necessario.",
];

// --- Notifiche ---
const NOTIFICATIONS = [
  { title: "Nuova richiesta di prenotazione da Valentina Russo", time: "10 minuti fa", icon: "event_available" },
  { title: "Ritiro Toyota Yaris Cross 1 tra 30 minuti", time: "28 minuti fa", icon: "local_shipping" },
  { title: "Recensione 5 stelle ricevuta da Davide M.", time: "2 ore fa", icon: "star" },
  { title: "Voucher Nissan Juke in scadenza tra 3 giorni", time: "5 ore fa", icon: "confirmation_number" },
  { title: "Pagamento ricevuto da Bartek Nowak — €82,30", time: "ieri", icon: "payments" },
];
