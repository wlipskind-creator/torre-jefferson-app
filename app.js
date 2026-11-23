// Torre Jefferson · App (piloto) — Firebase Auth + Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, getDocs, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const CFG = window.TJ_CONFIG;
const fb = initializeApp(CFG.firebaseConfig);
const auth = getAuth(fb);
const db = getFirestore(fb);
setPersistence(auth, browserLocalPersistence).catch(() => {});
let storageMod = null;
async function storage() {
  if (!storageMod) {
    const m = await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js");
    storageMod = { m, s: m.getStorage(fb) };
  }
  return storageMod;
}

/* ---------------- Utilidades ---------------- */
const TEL = CFG.telefonoRecepcion;
const ICONS = {
  home: '<path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cal: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><path d="M17 11a3 3 0 1 0 0-6M22 21c0-3-2-5-5-5.5"/>',
  mega: '<path d="M3 11l18-8v18L3 13z"/><path d="M7 12v6a2 2 0 0 0 4 0v-5"/>',
  desk: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  shield: '<path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/>',
  video: '<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 10c0-4.4-4.5-8-10-8z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  print: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'
};
const ic = (n, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const addDays = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const today = () => ymd(new Date());
const DOW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const dlabel = (s) => { const p = s.split('-'); const d = new Date(+p[0], +p[1] - 1, +p[2], 12); return DOW[d.getDay()] + ' ' + d.getDate() + '/' + (d.getMonth() + 1); };
const ddmm = (s) => { if (!s) return ''; const p = s.split('-'); return p[2] + '/' + p[1]; };
const hhmm = (ts) => { const d = new Date(ts); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const when = (ts) => { const d = new Date(ts); return (ymd(d) === today() ? 'hoy' : dlabel(ymd(d))) + ' ' + hhmm(ts); };
const count = (a, f) => a.filter(f).length;

const SPACES = {
  gym: { name: 'Gimnasio', cap: 4, rules: 'Horario: [A DEFINIR]. Capacidad por turno: 4 personas (ejemplo). Menores de [EDAD] solo acompañados por un adulto. Traer toalla y dejar los equipos en su lugar.' },
  cowork: { name: 'Cowork', cap: 6, rules: 'Horario: [A DEFINIR]. Puestos por turno: 6 (ejemplo). Hablar en voz baja; llamadas fuera de la sala. Dejar el puesto limpio al terminar.' },
  sauna: { name: 'Sauna', cap: 2, rules: 'Horario: [A DEFINIR]. Capacidad por turno: 2 personas (ejemplo). Ducharse antes de ingresar; uso con toalla. No recomendado para menores ni embarazadas.' },
  masajes: { name: 'Sala de masajes', cap: 1, rules: 'Horario: [A DEFINIR]. Un turno por vez (ejemplo). El masajista lo coordina cada vecino; dejar la sala ordenada.' }
};
const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const ROLES = { vecino: 'Vecino', portero: 'Portero', encargado: 'Encargado de portería', recepcion: 'Recepción', comision: 'Comisión' };
const PED_TIPOS = ['Autorizar visita', 'Aviso de llegada o salida', 'Reportar un problema', 'Otro pedido'];
const AV_TIPOS = ['Paquete', 'Visita en recepción', 'Delivery', 'Otro'];
const NOV_TIPOS = ['Incidente', 'Rotura', 'Visita / proveedor', 'Otro'];
const COLS = ['reservas', 'pedidos', 'avisos', 'ocupantes', 'comunicados', 'novedades', 'observaciones', 'unidades', 'residentes', 'vehiculos', 'autorizaciones', 'tareas', 'tareasHechas', 'llaves', 'llavesMov', 'llavesControl', 'proveedores', 'visitasProv', 'servicioMucama', 'agendaMucama', 'mucamaHechos', 'personal', 'turnosPersonal', 'cajaMov', 'materiales', 'matMov'];

function validApto(a) { const n = parseInt(a, 10); if (!/^\d{3,4}$/.test(a)) return false; const piso = Math.floor(n / 100), u = n % 100; return piso >= 1 && piso <= 17 && u >= 7 && u <= 12; }
function emailFor(rol, apto) { return (rol === 'vecino' ? 'apto' + apto : rol) + '@' + CFG.dominio; }
function whoFromEmail(email) {
  const u = (email || '').split('@')[0];
  if (/^apto\d+$/.test(u)) return { rol: 'vecino', apto: u.slice(4) };
  if (ROLES[u]) return { rol: u, apto: null };
  return null;
}
const isStaff = () => who && (who.rol === 'portero' || who.rol === 'encargado' || who.rol === 'recepcion');

/* ---------------- Estado ---------------- */
let who = null;
const S = {}; COLS.forEach((c) => (S[c] = []));
const loaded = new Set();
let unsubs = [];
const ui = { tab: null, space: 'gym', day: 0, regMode: 'aviso', regKind: 'Paquete', pedKind: 'Autorizar visita', bitDate: today(), ocKind: 'Familia', novKind: 'Incidente', ficha: null, tTurno: null, tFecha: null, gsub: null, mFecha: null, semana: null, area: null, cMes: null, cTipo: 'Gasto', loginRol: 'vecino', loginErr: '', busy: false };
const videoUrls = {};

function listen() {
  unsubs.forEach((u) => u()); unsubs = []; loaded.clear();
  COLS.forEach((c) => (S[c] = []));
  const mine = (c) => query(collection(db, c), where('apto', '==', who.apto));
  const all = (c) => collection(db, c);
  let plan = {};
  if (who.rol === 'vecino') plan = { reservas: all('reservas'), pedidos: mine('pedidos'), avisos: mine('avisos'), ocupantes: mine('ocupantes'), comunicados: all('comunicados'), observaciones: all('observaciones') };
  else if (who.rol === 'comision') plan = { comunicados: all('comunicados'), novedades: all('novedades'), observaciones: all('observaciones'), cajaMov: all('cajaMov') };
  else {
    plan = { reservas: all('reservas'), pedidos: all('pedidos'), avisos: all('avisos'), ocupantes: all('ocupantes'), comunicados: all('comunicados'), novedades: all('novedades'), observaciones: all('observaciones'),
      unidades: all('unidades'), residentes: all('residentes'), vehiculos: all('vehiculos'), autorizaciones: all('autorizaciones'), tareas: all('tareas'),
      tareasHechas: query(collection(db, 'tareasHechas'), where('fecha', '>=', ymd(addDays(-30)))), llaves: all('llaves'),
      llavesMov: query(collection(db, 'llavesMov'), where('ts', '>=', Date.now() - 30 * 86400000)), llavesControl: query(collection(db, 'llavesControl'), where('ts', '>=', Date.now() - 30 * 86400000)),
      proveedores: all('proveedores'), visitasProv: all('visitasProv'), servicioMucama: all('servicioMucama'), agendaMucama: query(collection(db, 'agendaMucama'), where('fecha', '>=', ymd(addDays(-30)))),
      mucamaHechos: query(collection(db, 'mucamaHechos'), where('fecha', '>=', ymd(addDays(-30)))), personal: all('personal'), turnosPersonal: query(collection(db, 'turnosPersonal'), where('fecha', '>=', ymd(addDays(-60)))),
      cajaMov: all('cajaMov'), materiales: all('materiales'), matMov: query(collection(db, 'matMov'), where('ts', '>=', Date.now() - 60 * 86400000)) };
  }
  Object.keys(plan).forEach((c) => {
    unsubs.push(onSnapshot(plan[c], (snap) => {
      S[c] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      loaded.add(c); scheduleRender();
    }, (err) => { console.error(c, err); toast('No se pudo leer ' + c + ': ' + friendly(err)); }));
  });
}

/* ---------------- Render diferido (no pisa lo que se está escribiendo) ---------------- */
let pending = false;
function editing() { const a = document.activeElement; return (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.closest('form')) || document.getElementById('layer').innerHTML; }
function scheduleRender() { if (editing()) { pending = true; return; } render(); }
document.addEventListener('focusout', () => setTimeout(() => { if (pending && !editing()) { pending = false; render(); } }, 150));

/* ---------------- UI helpers ---------------- */
function toast(msg) { const l = document.createElement('div'); l.className = 'toast'; l.setAttribute('role', 'status'); l.textContent = msg; document.body.appendChild(l); setTimeout(() => l.remove(), 2800); }
function modal(html, onSubmit) {
  const L = document.getElementById('layer');
  L.innerHTML = '<div class="modal-bg" data-close="1"><form class="modal" id="mform">' + html + '</form></div>';
  const f = document.getElementById('mform'); const first = f.querySelector('textarea,input,button'); if (first) first.focus();
  L.querySelector('.modal-bg').addEventListener('click', (e) => { if (e.target.dataset.close || e.target.closest('[data-cancel]')) closeModal(); });
  f.addEventListener('submit', async (e) => { e.preventDefault(); const r = await onSubmit(new FormData(f)); if (r !== false) closeModal(); });
}
function closeModal() { document.getElementById('layer').innerHTML = ''; if (pending) { pending = false; render(); } }
function confirmBox(text, okLabel, fn) { modal('<h2>' + esc(text) + '</h2><div class="row"><button type="button" class="btn ghost" data-cancel="1">Volver</button><button class="btn">' + esc(okLabel) + '</button></div>', fn); }
function estadoTag(e) { const c = { 'Pendiente': 't-warn', 'En curso': '', 'Atendido': 't-ok', 'Para retirar': 't-warn', 'Retirado': 't-ok', 'Informado': 't-ok', 'Abierta': 't-bad', 'Resuelta': 't-ok' }[e]; return '<span class="tag ' + (c || '') + '">' + esc(e) + '</span>'; }
function friendly(err) {
  const c = (err && err.code) || '';
  if (c.includes('permission-denied')) return 'sin permiso para esta acción';
  if (c.includes('network') || c.includes('unavailable')) return 'sin conexión, probá de nuevo';
  if (c.includes('too-many-requests')) return 'demasiados intentos, esperá un minuto';
  return (err && err.message) || 'error desconocido';
}
async function run(fn, ok) { try { await fn(); if (ok) toast(ok); } catch (e) { console.error(e); toast('No se pudo guardar: ' + friendly(e)); } }

/* ---------------- Vistas ---------------- */
function vLogin() {
  const r = ui.loginRol;
  const roles = [['vecino', 'Vecino', 'home'], ['portero', 'Portero', 'desk'], ['encargado', 'Encargado', 'shield'], ['recepcion', 'Recepción', 'desk'], ['comision', 'Comisión', 'mega']];
  return '<header class="top"><div class="top-in"><div class="brand"><small>Torre Jefferson</small><b>Ingresar</b></div><button class="btn-top" data-a="look" aria-label="Apariencia">' + ic('palette', 16) + 'Apariencia</button></div></header>' +
    '<main><form class="login" data-f="login"><div class="card"><h2>Bienvenido</h2>' +
    '<div class="pills" role="group" aria-label="Quién sos">' + roles.map((x) => '<button type="button" class="pill' + (r === x[0] ? ' on' : '') + '" data-a="loginRol" data-r="' + x[0] + '">' + esc(x[1]) + '</button>').join('') + '</div>' +
    (r === 'vecino' ? '<label>Número de apartamento<input name="apto" inputmode="numeric" autocomplete="username" required placeholder="Ej.: 1207"></label>' : '<p class="muted">Ingreso de ' + esc(ROLES[r].toLowerCase()) + '.</p>') +
    '<label>Código<input name="codigo" type="password" autocomplete="current-password" required></label>' +
    (ui.loginErr ? '<div class="err" role="alert">' + esc(ui.loginErr) + '</div>' : '') +
    '<button class="btn"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Ingresando…' : 'Ingresar') + '</button>' +
    '<span class="muted">Versión piloto. Si no tenés el código, pedilo en portería.</span></div></form>' +
    '<div class="login"><div class="card"><h2>' + ic('help', 18) + ' ¿Cómo ingreso?</h2>' + HELP_LOGIN + '</div></div></main>';
}

function tabsFor() {
  if (who.rol === 'vecino') {
    const pend = count(S.avisos, (a) => a.estado === 'Para retirar');
    return [['inicio', 'Inicio', 'home', pend], ['reservas', 'Reservas', 'cal'], ['porteria', 'Portería', 'chat'], ['ocupantes', 'Ocupantes', 'users'], ['comunicados', 'Comunicados', 'mega'], ['ayuda', 'Ayuda', 'help']];
  }
  if (who.rol === 'comision') return [['comunicados', 'Comunicados', 'mega'], ['novedades', 'Novedades', 'video'], ['caja', 'Caja chica', 'list'], ['observaciones', 'Observaciones', 'list', S.observaciones.length], ['ayuda', 'Ayuda', 'help']];
  const p = count(S.pedidos, (x) => x.estado !== 'Atendido'); const n = count(S.novedades, (x) => x.estado !== 'Resuelta');
  const fuera = count(S.llaves, (l) => l.estado === 'Prestada');
  const t = [['panel', 'Panel', 'desk', p], ['novedades', 'Novedades', 'video', n], ['aptos', 'Apartamentos', 'home'], ['autorizaciones', 'Autorizaciones', 'shield'], ['vehiculos', 'Vehículos', 'list'], ['tareas', 'Tareas', 'list'], ['llaves', 'Llaves', 'key', fuera], ['reservasP', 'Reservas', 'cal'], ['gestion', 'Gestión', 'book', count(S.proveedores, (x) => provEstado(x).k === 'venc') + count(S.materiales, (m) => (+m.stock || 0) <= (+m.minimo || 0))]];
  if (who.rol === 'encargado') t.push(['bitacora', 'Bitácora diaria', 'book'], ['observaciones', 'Observaciones', 'list', S.observaciones.length], ['datos', 'Datos de prueba', 'list']);
  t.push(['ayuda', 'Ayuda', 'help']);
  return t;
}

function vShell() {
  const tabs = tabsFor(); if (!ui.tab || !tabs.some((t) => t[0] === ui.tab)) ui.tab = tabs[0][0];
  const label = ROLES[who.rol] + (who.rol === 'vecino' ? ' · apto ' + who.apto : '');
  let h = '<header class="top"><div class="top-in"><div class="brand"><small>Torre Jefferson</small><b>' + (who.rol === 'vecino' ? 'Mi edificio' : 'Portería') + '</b></div><span class="chip-role">' + esc(label) + '</span><button class="btn-top" data-a="look" aria-label="Apariencia">' + ic('palette', 16) + '</button><button class="btn-top" data-a="logout">' + ic('out', 16) + 'Salir</button></div></header>';
  h += '<nav class="tabs" aria-label="Secciones"><div class="tabs-in">' + tabs.map((t) => '<button class="tab' + (t[0] === ui.tab ? ' on' : '') + '" data-a="tab" data-t="' + t[0] + '">' + ic(t[2], 18) + esc(t[1]) + (t[3] ? '<span class="badge">' + t[3] + '</span>' : '') + '</button>').join('') + '</div></nav>';
  h += '<main>' + (loaded.size ? VIEWS[ui.tab]() : '<div class="loading">Cargando datos…</div>') + '</main>';
  h += '<button class="fab no-print" data-a="obs">' + ic('pen', 18) + 'Anotar observación</button>';
  return h;
}

const VIEWS = {};
const sortTs = (a, b) => (b.creado || 0) - (a.creado || 0);

VIEWS.inicio = () => {
  const av = S.avisos.slice().sort(sortTs);
  const res = S.reservas.filter((r) => r.apto === who.apto && r.fecha >= today()).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  const com = S.comunicados.slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))[0];
  return '<div class="hello"><h1>Hola, apto ' + esc(who.apto) + '</h1><span class="muted">' + esc(dlabel(today())) + '</span></div><div class="grid">' +
    '<div class="card"><h2>Portería te avisa</h2>' + (av.length ? av.slice(0, 5).map((a) => '<div class="item"><div class="item-h"><span class="item-t">' + esc(a.tipo) + '</span>' + estadoTag(a.estado) + '</div>' + (a.detalle ? '<span>' + esc(a.detalle) + '</span>' : '') + '<span class="muted">' + esc(when(a.creado)) + '</span>' + (a.estado === 'Para retirar' ? '<div><button class="btn sm" data-a="retirado" data-id="' + a.id + '">Ya lo retiré</button></div>' : '') + '</div>').join('') : '<span class="empty">No tenés avisos.</span>') + '</div>' +
    '<div class="card"><h2>Mis próximas reservas</h2>' + (res.length ? res.map((r) => '<div class="item"><div class="item-h"><span class="item-t">' + esc(SPACES[r.espacio].name) + ' · ' + esc(dlabel(r.fecha)) + ' · ' + esc(r.hora) + '</span><button class="btn danger sm" data-a="cancelRes" data-id="' + r.id + '">Cancelar</button></div></div>').join('') : '<span class="empty">No tenés reservas.</span>') + '<div><button class="btn ghost sm" data-a="tab" data-t="reservas">Reservar</button></div></div>' +
    (com ? '<div class="card"><h2>Último comunicado</h2><div class="item"><div class="item-h"><span class="item-t">' + esc(com.titulo) + '</span><span class="tag">' + esc(com.etiqueta) + '</span></div><span>' + esc(com.texto) + '</span></div></div>' : '') +
    '<div class="card"><h2>Recepción 24 horas</h2><span>Si preferís, llamá a recepción: <b>' + esc(TEL) + '</b></span></div></div>';
};

VIEWS.reservas = () => {
  const sp = SPACES[ui.space]; const date = ymd(addDays(ui.day));
  let days = ''; for (let i = 0; i < 7; i++) { const d = addDays(i); days += '<button class="day' + (i === ui.day ? ' on' : '') + '" data-a="day" data-i="' + i + '"><small>' + (i === 0 ? 'Hoy' : DOW[d.getDay()]) + '</small><b>' + d.getDate() + '</b></button>'; }
  const nowH = pad(new Date().getHours()) + ':00';
  const slots = HOURS.map((h) => {
    const taken = S.reservas.filter((r) => r.espacio === ui.space && r.fecha === date && r.hora === h);
    const mine = taken.some((r) => r.apto === who.apto); const past = ui.day === 0 && h <= nowH; const full = taken.length >= sp.cap;
    const cls = 'slot' + (mine ? ' mine' : (full || past ? ' full' : ''));
    const lab = mine ? 'Tu reserva' : (past ? 'Pasado' : (full ? 'Completo' : (sp.cap - taken.length) + ' libres'));
    return '<button class="' + cls + '" data-a="slot" data-h="' + h + '"' + ((full || past) && !mine ? ' disabled' : '') + '><b>' + h + '</b><small>' + lab + '</small></button>';
  }).join('');
  const mine = S.reservas.filter((r) => r.apto === who.apto && r.fecha >= today()).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  return '<div class="grid"><div class="card wide"><h2>Reservar</h2><div class="seg seg4">' + Object.keys(SPACES).map((k) => '<button class="' + (ui.space === k ? 'on' : '') + '" data-a="space" data-s="' + k + '">' + SPACES[k].name + '</button>').join('') + '</div>' +
    '<div class="days">' + days + '</div><span class="muted">Turnos de 1 hora (horarios de ejemplo). Tocá un horario para reservarlo; tocá tu reserva para cancelarla.</span><div class="slots">' + slots + '</div>' +
    '<div class="rules"><b>Normas de uso · ' + esc(sp.name) + '</b><br>' + esc(sp.rules) + '</div></div>' +
    '<div class="card"><h2>Mis reservas</h2>' + (mine.length ? mine.map((r) => '<div class="item"><div class="item-h"><span class="item-t">' + esc(SPACES[r.espacio].name) + ' · ' + esc(dlabel(r.fecha)) + ' · ' + esc(r.hora) + '</span><button class="btn danger sm" data-a="cancelRes" data-id="' + r.id + '">Cancelar</button></div></div>').join('') : '<span class="empty">No tenés reservas.</span>') + '</div></div>';
};

VIEWS.porteria = () => {
  const mine = S.pedidos.slice().sort(sortTs);
  const h = new Date().getHours(); const night = h >= 22 || h < 6;
  return '<div class="grid"><form class="card" data-f="pedido"><h2>Nuevo pedido</h2><div class="pills">' + PED_TIPOS.map((t) => '<button type="button" class="pill' + (ui.pedKind === t ? ' on' : '') + '" data-a="pick" data-k="pedKind" data-v="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' +
    '<label>Detalle<textarea name="detalle" required placeholder="Ej.: llega mi hija con dos nietos el sábado a las 15 h."></textarea></label><button class="btn">Enviar a portería</button>' +
    '<div class="note">' + (night ? '<b>Ahora hay un solo portero (22 a 6).</b> ' : '') + 'De 22 a 6 hay un solo portero: los pedidos no urgentes se atienden a la mañana. Urgencias: llamá a recepción (' + esc(TEL) + ').</div></form>' +
    '<div class="card wide"><h2>Mis pedidos</h2>' + (mine.length ? mine.map((p) => '<div class="item"><div class="item-h"><span class="item-t">' + esc(p.tipo) + '</span>' + estadoTag(p.estado) + '</div><span>' + esc(p.detalle) + '</span>' + (p.nota ? '<span class="note">Portería: ' + esc(p.nota) + '</span>' : '') + '<span class="muted">' + esc(when(p.creado)) + ' · ' + esc(p.origen) + '</span></div>').join('') : '<span class="empty">No hiciste pedidos.</span>') + '</div></div>';
};

VIEWS.ocupantes = () => {
  const mine = S.ocupantes.filter((o) => o.hasta >= today()).sort((a, b) => a.desde.localeCompare(b.desde));
  return '<div class="grid"><div class="card"><h2>Ocupantes registrados</h2><span class="muted">Portería los ve. Se dan de baja al terminar la estadía.</span>' + (mine.length ? mine.map((o) => '<div class="item"><div class="item-h"><span class="item-t">' + esc(o.responsable) + '</span><span class="tag t-ok">' + esc(o.tipo) + '</span></div><span>' + o.personas + ' personas · ' + esc(ddmm(o.desde)) + ' al ' + esc(ddmm(o.hasta)) + '</span><span class="muted">Tel. ' + esc(o.tel) + '</span><div><button class="btn danger sm" data-a="delOc" data-id="' + o.id + '">Quitar</button></div></div>').join('') : '<span class="empty">No hay ocupantes registrados.</span>') + '</div>' +
    '<form class="card" data-f="ocupante"><h2>Registrar ocupantes</h2><div class="seg"><button type="button" class="' + (ui.ocKind === 'Familia' ? 'on' : '') + '" data-a="pick" data-k="ocKind" data-v="Familia">Familia</button><button type="button" class="' + (ui.ocKind === 'Inquilinos' ? 'on' : '') + '" data-a="pick" data-k="ocKind" data-v="Inquilinos">Inquilinos</button></div>' +
    '<label>Nombre del responsable<input name="responsable" required></label><label>Teléfono (con código de país)<input name="tel" type="tel" required placeholder="+598 o +54"></label>' +
    '<div class="row"><label>Personas<input name="personas" type="number" min="1" value="2" required></label><label>Desde<input name="desde" type="date" required value="' + today() + '"></label><label>Hasta<input name="hasta" type="date" required value="' + ymd(addDays(7)) + '"></label></div><button class="btn">Registrar</button></form></div>';
};

VIEWS.comunicados = () => {
  const list = S.comunicados.slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || sortTs(a, b));
  const canPub = who.rol === 'comision';
  const form = canPub ? '<form class="card" data-f="comunicado"><h2>Publicar comunicado</h2><label>Título<input name="titulo" required></label><label>Etiqueta<select name="etiqueta"><option>Importante</option><option>Mantenimiento</option><option>Convivencia</option><option>General</option></select></label><label>Texto<textarea name="texto" required></textarea></label><button class="btn">Publicar</button><span class="muted">Los comunicados no admiten comentarios.</span></form>' : '';
  return '<div class="grid">' + form + '<div class="card wide"><h2>Comunicados</h2>' + (list.length ? list.map((c) => '<div class="item"><div class="item-h"><span class="item-t">' + esc(c.titulo) + '</span><span class="tag ' + (c.etiqueta === 'Importante' ? 't-warn' : '') + '">' + esc(c.etiqueta) + '</span></div><span>' + esc(c.texto) + '</span><span class="muted">' + esc(c.fecha ? dlabel(c.fecha) : '') + '</span>' + (canPub ? '<div><button class="btn danger sm" data-a="delCom" data-id="' + c.id + '">Eliminar</button></div>' : '') + '</div>').join('') : '<span class="empty">No hay comunicados.</span>') + (who.rol === 'vecino' ? '<span class="muted">Los publica la comisión. Para consultas, escribí a portería.</span>' : '') + '</div></div>';
};

VIEWS.panel = () => {
  const pend = S.pedidos.filter((p) => p.estado !== 'Atendido').sort((a, b) => a.creado - b.creado);
  const done = count(S.pedidos, (p) => p.estado === 'Atendido' && p.atendido && ymd(new Date(p.atendido)) === today());
  const avHoy = S.avisos.filter((a) => ymd(new Date(a.creado)) === today()).sort(sortTs);
  const kinds = ui.regMode === 'aviso' ? AV_TIPOS : PED_TIPOS; if (kinds.indexOf(ui.regKind) < 0) ui.regKind = kinds[0];
  const resHoy = S.reservas.filter((r) => r.fecha === today()).sort((a, b) => a.hora.localeCompare(b.hora));
  return '<div class="grid"><div class="card wide"><div class="item-h"><h2>Pedidos pendientes</h2><span class="muted">Atendidos hoy: ' + done + '</span></div>' +
    (pend.length ? pend.map((p) => '<div class="item"><div class="item-h" style="align-items:center"><div style="display:flex;gap:12px;align-items:center"><div class="apt"><small>Apto</small><b>' + esc(p.apto) + '</b></div><div><div class="item-t">' + esc(p.tipo) + '</div><span class="muted">' + esc(when(p.creado)) + ' · ' + esc(p.origen) + '</span></div></div>' + estadoTag(p.estado) + '</div><span>' + esc(p.detalle) + '</span>' + (p.nota ? '<span class="note">Nota: ' + esc(p.nota) + '</span>' : '') +
      '<div class="row">' + (p.estado === 'Pendiente' ? '<button class="btn ghost sm" data-a="pedEstado" data-id="' + p.id + '" data-e="En curso">Tomar (en curso)</button>' : '') + '<button class="btn ghost sm" data-a="pedNota" data-id="' + p.id + '">Agregar nota</button><button class="btn sm" data-a="pedEstado" data-id="' + p.id + '" data-e="Atendido">Marcar atendido</button></div></div>').join('') : '<span class="empty">No hay pedidos pendientes.</span>') + '</div>' +
    '<form class="card" data-f="registro"><h2>Registrar</h2><div class="seg"><button type="button" class="' + (ui.regMode === 'aviso' ? 'on' : '') + '" data-a="regMode" data-m="aviso">Aviso al vecino</button><button type="button" class="' + (ui.regMode === 'tel' ? 'on' : '') + '" data-a="regMode" data-m="tel">Pedido por teléfono</button></div>' +
    '<span class="muted">' + (ui.regMode === 'aviso' ? 'El vecino lo ve en su app al instante.' : 'Para quien llama a recepción: queda registrado para el turno.') + '</span>' +
    '<label>Apartamento<input name="apto" required inputmode="numeric" placeholder="Ej.: 1207"></label><div class="pills">' + kinds.map((k) => '<button type="button" class="pill' + (ui.regKind === k ? ' on' : '') + '" data-a="pick" data-k="regKind" data-v="' + esc(k) + '">' + esc(k) + '</button>').join('') + '</div>' +
    '<label>Detalle' + (ui.regMode === 'aviso' ? ' (opcional)' : '') + '<input name="detalle"' + (ui.regMode === 'tel' ? ' required' : '') + '></label><button class="btn">' + (ui.regMode === 'aviso' ? 'Enviar aviso' : 'Registrar pedido') + '</button>' +
    '<h3 style="font-size:15px;margin-top:6px">Avisos enviados hoy</h3>' + (avHoy.length ? avHoy.map((a) => '<div class="item-h"><span>' + esc(hhmm(a.creado)) + ' · Apto ' + esc(a.apto) + ' · ' + esc(a.tipo) + '</span>' + estadoTag(a.estado) + '</div>').join('') : '<span class="empty">Ninguno todavía.</span>') + '</form>' +
    '<div class="card"><h2>Reservas de hoy</h2>' + (resHoy.length ? '<div class="scroll"><table><tr><th>Hora</th><th>Espacio</th><th>Apto</th></tr>' + resHoy.map((r) => '<tr><td><b>' + r.hora + '</b></td><td>' + SPACES[r.espacio].name + '</td><td>' + esc(r.apto) + '</td></tr>').join('') + '</table></div>' : '<span class="empty">No hay reservas hoy.</span>') + '</div></div>';
};

VIEWS.novedades = () => {
  const canEdit = isStaff();
  const list = S.novedades.slice().sort(sortTs);
  const vidField = CFG.videos ? '<label>Adjuntar video (de las cámaras o del celular, hasta 50 MB)<input name="video" type="file" accept="video/*" multiple></label>' : '<span class="muted">' + ic('video', 14) + ' Adjuntar videos: se activa en la próxima etapa.</span>';
  const form = canEdit ? '<form class="card" data-f="novedad"><h2>Registrar novedad</h2><label>Qué pasó<input name="titulo" required placeholder="Ej.: se trabó la puerta del garaje"></label><div class="pills">' + NOV_TIPOS.map((t) => '<button type="button" class="pill' + (ui.novKind === t ? ' on' : '') + '" data-a="pick" data-k="novKind" data-v="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' +
    '<label>Apartamento (si corresponde)<input name="apto" inputmode="numeric" placeholder="Ej.: 1207 — queda en el historial de la unidad"></label><label>Detalle<textarea name="detalle"></textarea></label><label>Estado<select name="estado"><option>Abierta</option><option>En curso</option><option>Resuelta</option></select></label>' + vidField + '<button class="btn">Guardar novedad</button></form>' : '';
  const seeVideos = who.rol === 'encargado' || who.rol === 'comision';
  return '<div class="grid">' + form + '<div class="card wide"><h2>Novedades</h2>' + (who.rol === 'comision' ? '<span class="muted">Solo lectura.</span>' : '') +
    (list.length ? list.map((n) => '<div class="item"><div class="item-h"><span class="item-t">' + esc(n.titulo) + '</span>' + (canEdit ? '<select aria-label="Estado" data-c="novEstado" data-id="' + n.id + '" style="width:auto;min-height:38px">' + ['Abierta', 'En curso', 'Resuelta'].map((e) => '<option' + (e === n.estado ? ' selected' : '') + '>' + e + '</option>').join('') + '</select>' : estadoTag(n.estado)) + '</div>' +
      (n.detalle ? '<span>' + esc(n.detalle) + '</span>' : '') + '<span class="muted">' + esc(when(n.creado)) + ' · ' + esc(n.autor) + ' · ' + esc(n.tipo) + (n.apto ? ' · <b>Apto ' + esc(n.apto) + '</b>' : '') + '</span>' +
      (n.videos || []).map((v) => seeVideos ? '<div class="vid">' + ic('video', 16) + esc(v.name) + '</div><video controls preload="metadata" data-path="' + esc(v.path) + '"></video>' : '<span class="vid">' + ic('video', 16) + esc(v.name) + ' (lo ven el encargado y la comisión)</span>').join('') + '</div>').join('') : '<span class="empty">No hay novedades.</span>') + '</div></div>';
};

VIEWS.reservasP = () => {
  const list = S.reservas.filter((r) => r.fecha >= today()).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  return '<div class="card"><h2>Próximas reservas</h2>' + (list.length ? '<div class="scroll"><table><tr><th>Día</th><th>Hora</th><th>Espacio</th><th>Apto</th><th></th></tr>' + list.map((r) => '<tr><td>' + esc(dlabel(r.fecha)) + '</td><td><b>' + r.hora + '</b></td><td>' + SPACES[r.espacio].name + '</td><td>' + esc(r.apto) + '</td><td><button class="btn ghost sm" data-a="cancelRes" data-id="' + r.id + '">Cancelar</button></td></tr>').join('') + '</table></div>' : '<span class="empty">No hay reservas.</span>') + '</div>';
};

VIEWS.ocupantesP = () => {
  const t = today();
  const vig = S.ocupantes.filter((o) => o.desde <= t && o.hasta >= t).sort((a, b) => a.apto.localeCompare(b.apto, undefined, { numeric: true }));
  const prox = S.ocupantes.filter((o) => o.desde > t).sort((a, b) => a.desde.localeCompare(b.desde));
  const tbl = (l) => l.length ? '<div class="scroll"><table style="min-width:560px"><tr><th>Apto</th><th>Responsable</th><th>Tipo</th><th>Personas</th><th>Desde</th><th>Hasta</th><th>Teléfono</th></tr>' + l.map((o) => '<tr><td><b>' + esc(o.apto) + '</b></td><td>' + esc(o.responsable) + '</td><td>' + esc(o.tipo) + '</td><td>' + o.personas + '</td><td>' + ddmm(o.desde) + '</td><td>' + ddmm(o.hasta) + '</td><td>' + esc(o.tel) + '</td></tr>').join('') + '</table></div>' : '<span class="empty">Ninguno.</span>';
  return '<div class="grid"><div class="card wide"><h2>Ocupantes vigentes</h2>' + tbl(vig) + '</div><div class="card wide"><h2>Próximas llegadas</h2>' + tbl(prox) + '</div></div>';
};

function bitSheet(date) {
  const on = (ts) => ts && ymd(new Date(ts)) === date;
  const nov = S.novedades.filter((n) => on(n.creado)).sort((a, b) => a.creado - b.creado);
  const ped = S.pedidos.filter((p) => on(p.creado)).sort((a, b) => a.creado - b.creado);
  const av = S.avisos.filter((a) => on(a.creado)).sort((a, b) => a.creado - b.creado);
  const res = S.reservas.filter((r) => r.fecha === date).sort((a, b) => a.hora.localeCompare(b.hora));
  const th = S.tareasHechas.filter((h) => h.fecha === date).sort((a, b) => a.turno - b.turno || a.ts - b.ts);
  const lm = S.llavesMov.filter((m) => on(m.ts)).sort((a, b) => a.ts - b.ts);
  const lc = S.llavesControl.filter((m) => on(m.ts)).sort((a, b) => a.ts - b.ts);
  const ing = S.autorizaciones.filter((x) => on(x.usada)).sort((a, b) => a.usada - b.usada);
  const vp = S.visitasProv.filter((v) => v.fecha === date);
  const cm = S.cajaMov.filter((m) => m.fecha === date);
  const mm = S.matMov.filter((m) => on(m.ts)).sort((a, b) => a.ts - b.ts);
  const mh = S.mucamaHechos.filter((h) => h.fecha === date);
  const t = (head, rows) => rows.length ? '<table><tr>' + head.map((h) => '<th>' + h + '</th>').join('') + '</tr>' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</table>' : '<p class="empty">Sin registros.</p>';
  return '<div class="sheet"><div class="item-h sheet-top"><div><div class="sheet-kick">Torre Jefferson</div><div style="font-size:20px;font-weight:800">Bitácora de portería</div></div><div style="text-align:right;font-size:13px">' + esc(dlabel(date)) + '<br>Encargado de portería</div></div>' +
    '<div class="stats"><div class="stat"><b>' + nov.length + '</b><span>novedades</span></div><div class="stat"><b>' + count(nov, (n) => n.estado !== 'Resuelta') + '</b><span>sin resolver</span></div><div class="stat"><b>' + ped.length + '</b><span>pedidos de vecinos</span></div><div class="stat"><b>' + av.length + '</b><span>avisos enviados</span></div><div class="stat"><b>' + res.length + '</b><span>reservas</span></div></div>' +
    '<h3>Novedades</h3>' + t(['Hora', 'Novedad', 'Tipo', 'Estado', 'Video'], nov.map((n) => [hhmm(n.creado), n.titulo + (n.detalle ? ' — ' + n.detalle : ''), n.tipo, n.estado, (n.videos || []).length ? 'Sí (' + n.videos.length + ')' : '—'])) +
    '<h3>Pedidos de vecinos</h3>' + t(['Hora', 'Apto', 'Pedido', 'Origen', 'Estado'], ped.map((p) => [hhmm(p.creado), p.apto, p.tipo + ': ' + p.detalle, p.origen, p.estado])) +
    '<h3>Avisos a vecinos</h3>' + t(['Hora', 'Apto', 'Aviso', 'Estado'], av.map((a) => [hhmm(a.creado), a.apto, a.tipo + (a.detalle ? ': ' + a.detalle : ''), a.estado])) +
    '<h3>Reservas</h3>' + t(['Hora', 'Espacio', 'Apto'], res.map((r) => [r.hora, (SPACES[r.espacio] || { name: r.espacio }).name, r.apto])) +
    '<h3>Tareas de recepción realizadas</h3>' + t(['Turno', 'Hora', 'Tarea', 'Quién', 'Comentario'], th.map((h) => [TURNOS[h.turno] || '', hhmm(h.ts), h.tarea + (h.n > 1 ? ' (' + h.n + ')' : ''), h.quien, h.comentario || ''])) +
    '<h3>Ingresos autorizados</h3>' + t(['Hora', 'Apto', 'Persona', 'Tipo', 'Registró'], ing.map((x) => [hhmm(x.usada), x.apto, x.nombre, x.tipo, x.porteroIngreso || ''])) +
    '<h3>Llaves</h3>' + t(['Hora', 'Movimiento', 'Llave', 'Persona', 'Registró'], lm.map((m) => [hhmm(m.ts), m.accion, m.llave, m.persona, m.quien])) +
    '<h3>Visitas de proveedores</h3>' + t(['Proveedor', 'Trabajo', 'Registró'], vp.map((v) => [v.proveedor, v.trabajo || '', v.quien || ''])) +
    '<h3>Caja chica</h3>' + t(['Tipo', 'Concepto', 'Monto', 'Registró'], cm.map((m) => [m.tipo, m.concepto, money(m.monto), m.quien || ''])) +
    '<h3>Materiales de limpieza</h3>' + t(['Hora', 'Movimiento', 'Material', 'Cantidad', 'Destino'], mm.map((m) => [hhmm(m.ts), m.tipo, m.material, String(m.cantidad), m.destino || ''])) +
    '<p class="muted">Servicios de mucama realizados: ' + mh.length + '.</p>' +
    (lc.length ? t(['Control', 'Quién', 'Resultado'], lc.map((c) => [hhmm(c.ts), c.quien, c.faltantes.length ? 'Faltaban: ' + c.faltantes.join(', ') : 'Todo en orden'])) : '') +
    '<div class="item-h muted" style="font-size:12px;margin-top:16px"><span>Firma del encargado: ______________________</span><span>Generada ' + esc(when(Date.now())) + '</span></div></div>';
}
VIEWS.bitacora = () => '<div class="card no-print" style="margin-bottom:16px"><h2>Bitácora diaria</h2><span class="muted">Solo para el encargado de portería. Resume novedades con su estado, pedidos, avisos, reservas, tareas, ingresos y llaves del día.</span><div class="row" style="align-items:flex-end"><label style="flex:0 1 220px">Día<input type="date" data-c="bitDate" value="' + ui.bitDate + '"></label><button class="btn dark" data-a="print">' + ic('print', 18) + 'Imprimir o guardar PDF</button></div></div>' + bitSheet(ui.bitDate);

VIEWS.observaciones = () => {
  const o = S.observaciones.slice().sort(sortTs);
  return '<div class="card"><div class="item-h"><h2>Observaciones de la prueba (' + o.length + ')</h2>' + (o.length ? '<button class="btn ghost sm" data-a="obsCopy">Copiar todas</button>' : '') + '</div>' +
    (o.length ? o.map((x) => '<div class="item"><span class="muted">' + esc(when(x.creado)) + ' · ' + esc(x.rol) + ' · ' + esc(x.pantalla) + '</span><span>' + esc(x.texto) + '</span></div>').join('') : '<span class="empty">Todavía no hay observaciones.</span>') + '</div>';
};

VIEWS.datos = () => {
  const n = COLS.reduce((s, c) => s + S[c].length, 0);
  return '<div class="grid"><div class="card"><h2>Datos de ejemplo</h2><span>Carga datos de ejemplo de todas las secciones: reservas, pedidos, avisos, fichas, autorizaciones, tareas, llaves, proveedores, mucamas, turnos, caja chica y materiales.</span><span class="muted">Registros actuales: ' + n + '.</span><div><button class="btn" data-a="seed"' + (ui.busy ? ' disabled' : '') + '>Cargar datos de ejemplo</button></div></div>' +
    '<div class="card"><h2>Empezar de cero</h2><span>Borra todos los registros de la prueba (no borra usuarios ni observaciones).</span><div><button class="btn danger" data-a="wipe"' + (ui.busy ? ' disabled' : '') + '>Borrar datos de prueba</button></div></div></div>';
};

/* =====================================================================
   ETAPA 1 · Operativa de recepción
   Ficha del apartamento (residentes, vehículos, autorizaciones, estado, historial),
   tareas por turno y control de llaves.
   ===================================================================== */
const APTOS = []; for (let p = 1; p <= 17; p++) for (let u = 7; u <= 12; u++) APTOS.push(String(p * 100 + u));
const RES_TIPOS = ['Propietario', 'Familiar', 'Inquilino'];
const AUT_TIPOS = ['Inmobiliaria', 'Inquilino', 'Proveedor', 'Visita', 'Otro'];
const TURNOS = CFG.turnos || ['Mañana (6 a 14)', 'Tarde (14 a 22)', 'Noche (22 a 6)'];
const FRECS = ['Cada turno', 'Diaria', 'Semanal', 'Quincenal'];
const canFicha = () => who && (who.rol === 'encargado' || who.rol === 'recepcion');
const opt = (list, sel) => list.map((x) => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('');
const val = (fd, k) => String(fd.get(k) || '').trim();
const fdate = (s) => s ? ddmm(s) + '/' + s.slice(2, 4) : '';
function turnoAhora() { const h = new Date().getHours(); if (h >= 6 && h < 14) return { idx: 0, fecha: today() }; if (h >= 14 && h < 22) return { idx: 1, fecha: today() }; return { idx: 2, fecha: h < 6 ? ymd(addDays(-1)) : today() }; }
function vigente(desde, hasta) { const t = today(); return (!desde || desde <= t) && (!hasta || hasta >= t); }

/* ----- Nombre de quien está de turno (hasta tener usuarios individuales) ----- */
function nombreTurno() { try { return localStorage.getItem('tj-nombre') || ''; } catch (_) { return ''; } }
function pedirNombre(then) {
  modal('<h2>¿Quién está de turno?</h2><span class="muted">Queda registrado en las tareas y en el control de llaves. Se guarda en este dispositivo.</span><label>Nombre<input name="nombre" required value="' + esc(nombreTurno()) + '" autocomplete="name"></label><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar</button></div>',
    (fd) => { try { localStorage.setItem('tj-nombre', val(fd, 'nombre')); } catch (_) {} setTimeout(() => { render(); if (then) then(); }, 50); });
}
function conNombre(fn) { if (nombreTurno()) fn(); else pedirNombre(fn); }
const turnoBar = () => '<div class="note no-print" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span>De turno: <b>' + (esc(nombreTurno()) || 'sin indicar') + '</b></span><button class="btn ghost sm" data-b="nombre">Cambiar</button></div>';

/* ----- Apartamentos: tablero ----- */
function unidad(a) { return S.unidades.find((u) => u.id === a) || { id: a, estado: '', ingreso: '', notas: '' }; }
function vAptos() {
  const est = (a) => unidad(a).estado;
  const oc = count(APTOS, (a) => est(a) === 'Ocupada'), va = count(APTOS, (a) => est(a) === 'Vacía');
  const prox = S.ocupantes.filter((o) => o.desde > today()).sort((a, b) => a.desde.localeCompare(b.desde)).slice(0, 8);
  let grid = '';
  for (let p = 17; p >= 1; p--) {
    grid += '<div class="floor"><span class="floor-n">Piso ' + p + '</span>' + APTOS.filter((a) => Math.floor(+a / 100) === p).map((a) => {
      const e = est(a), nres = count(S.residentes, (r) => r.apto === a && vigente(r.desde, r.hasta)), naut = count(S.autorizaciones, (x) => x.apto === a && autActiva(x));
      return '<button class="unit ' + (e === 'Ocupada' ? 'u-oc' : e === 'Vacía' ? 'u-va' : '') + '" data-b="ficha" data-apto="' + a + '" data-s="' + a + ' ' + esc(S.residentes.filter((r) => r.apto === a).map((r) => r.nombre + ' ' + r.apellido).join(' ')) + ' ' + esc(S.vehiculos.filter((v) => v.apto === a).map((v) => v.matricula).join(' ')) + '"><b>' + a + '</b><small>' + (e || 'Sin dato') + '</small>' + (nres || naut ? '<i>' + (nres ? nres + ' res.' : '') + (nres && naut ? ' · ' : '') + (naut ? naut + ' aut.' : '') + '</i>' : '') + '</button>';
    }).join('') + '</div>';
  }
  return '<div class="hello"><h1>Apartamentos</h1><span class="muted">' + oc + ' ocupados · ' + va + ' vacíos · ' + (APTOS.length - oc - va) + ' sin dato. Tocá un apartamento para ver su ficha.</span></div>' +
    '<div class="card" style="margin-bottom:16px"><label>Buscar por apartamento, nombre o matrícula<input data-filter=".unit" placeholder="Ej.: 1207, Pérez o SBA 1234"></label></div>' +
    '<div class="grid"><div class="card wide"><div class="legend"><span class="unit u-oc mini"></span>Ocupado <span class="unit u-va mini"></span>Vacío <span class="unit mini"></span>Sin dato</div><div class="building">' + grid + '</div></div>' +
    '<div class="card"><h2>Próximas llegadas anunciadas</h2>' + (prox.length ? prox.map((o) => '<div class="item"><div class="item-h"><span class="item-t">Apto ' + esc(o.apto) + ' · ' + esc(o.responsable) + '</span><span class="tag">' + esc(o.tipo) + '</span></div><span class="muted">' + o.personas + ' personas · ' + ddmm(o.desde) + ' al ' + ddmm(o.hasta) + ' · Tel. ' + esc(o.tel) + '</span></div>').join('') : '<span class="empty">Ninguna.</span>') + '</div></div>';
}

/* ----- Ficha del apartamento ----- */
function autActiva(x) { return !x.usada && vigente(x.desde, x.hasta); }
function vFicha(a) {
  const u = unidad(a), cf = canFicha();
  const res = S.residentes.filter((r) => r.apto === a).sort((x, y) => RES_TIPOS.indexOf(x.tipo) - RES_TIPOS.indexOf(y.tipo));
  const veh = S.vehiculos.filter((v) => v.apto === a);
  const aut = S.autorizaciones.filter((x) => x.apto === a).sort((x, y) => (autActiva(y) - autActiva(x)) || sortTs(x, y));
  const ocu = S.ocupantes.filter((o) => o.apto === a && o.hasta >= today());
  const hist = [].concat(
    S.novedades.filter((n) => n.apto === a).map((n) => ({ ts: n.creado, t: 'Novedad', d: n.titulo + (n.detalle ? ' — ' + n.detalle : ''), e: n.estado })),
    S.pedidos.filter((p) => p.apto === a).map((p) => ({ ts: p.creado, t: 'Pedido', d: p.tipo + ': ' + p.detalle, e: p.estado })),
    S.avisos.filter((x) => x.apto === a).map((x) => ({ ts: x.creado, t: 'Aviso', d: x.tipo + (x.detalle ? ': ' + x.detalle : ''), e: x.estado })),
    S.autorizaciones.filter((x) => x.apto === a && x.usada).map((x) => ({ ts: x.usada, t: 'Ingreso', d: x.tipo + ': ' + x.nombre, e: 'Ingresó' }))
  ).sort((x, y) => y.ts - x.ts).slice(0, 40);
  const vencTag = (h) => h && h < today() ? '<span class="tag t-bad">Vencido</span>' : '';
  return '<div class="no-print" style="margin-bottom:12px"><button class="btn ghost sm" data-b="aptos">‹ Todos los apartamentos</button></div>' +
    '<div class="hello"><h1>Apartamento ' + a + '</h1><span class="muted">Piso ' + Math.floor(+a / 100) + (u.actualizado ? ' · actualizado ' + when(u.actualizado) : '') + '</span></div><div class="grid">' +
    '<form class="card" data-g="unidad" data-apto="' + a + '"><h2>Estado</h2><div class="row"><label>Ocupación<select name="estado"' + (cf ? '' : ' disabled') + '>' + opt([['', 'Sin dato'], 'Ocupada', 'Vacía'], u.estado) + '</select></label><label>Fecha de ingreso (si se conoce)<input type="date" name="ingreso" value="' + esc(u.ingreso || '') + '"' + (cf ? '' : ' disabled') + '></label></div><label>Notas<textarea name="notas"' + (cf ? '' : ' disabled') + ' placeholder="Ej.: propietario viene en enero; llave en la inmobiliaria">' + esc(u.notas || '') + '</textarea></label>' + (cf ? '<button class="btn">Guardar estado</button>' : '<span class="muted">Solo el encargado y recepción modifican la ficha.</span>') + '</form>' +
    '<div class="card"><div class="item-h"><h2>Residentes</h2>' + (cf ? '<button class="btn sm" data-b="resNew" data-apto="' + a + '">Agregar</button>' : '') + '</div>' +
    (res.length ? res.map((r) => '<div class="item"><div class="item-h"><span class="item-t">' + esc(r.nombre + ' ' + r.apellido) + '</span><span class="tag ' + (r.tipo === 'Inquilino' ? 't-warn' : 't-ok') + '">' + esc(r.tipo) + '</span></div>' +
      '<span>' + [r.tel ? 'Tel. ' + esc(r.tel) : '', r.email ? esc(r.email) : '', r.nacimiento ? 'Cumple ' + ddmm(r.nacimiento) : ''].filter(Boolean).join(' · ') + '</span>' +
      (r.tipo === 'Inquilino' ? '<span class="muted">Del ' + fdate(r.desde) + ' al ' + fdate(r.hasta) + ' ' + vencTag(r.hasta) + '</span>' : '') +
      (cf ? '<div class="row"><button class="btn ghost sm" data-b="resEdit" data-id="' + r.id + '">Editar</button><button class="btn danger sm" data-b="del" data-col="residentes" data-id="' + r.id + '">Quitar</button></div>' : '') + '</div>').join('') : '<span class="empty">Sin residentes cargados.</span>') + '</div>' +
    '<div class="card"><div class="item-h"><h2>Vehículos</h2>' + (cf ? '<button class="btn sm" data-b="vehNew" data-apto="' + a + '">Agregar</button>' : '') + '</div>' +
    (veh.length ? veh.map((v) => '<div class="item"><div class="item-h"><span class="item-t plate">' + esc(v.matricula) + '</span><span class="tag ' + (v.tipo === 'Inquilino' ? 't-warn' : 't-ok') + '">' + esc(v.tipo) + '</span></div><span>' + esc([v.marca, v.modelo, v.color].filter(Boolean).join(' · ')) + '</span><span class="muted">Titular: ' + esc(v.titular) + ' · ' + (v.tipo === 'Inquilino' ? 'del ' + fdate(v.alta) + ' al ' + fdate(v.baja) : 'permanente desde ' + fdate(v.alta)) + ' ' + vencTag(v.tipo === 'Inquilino' ? v.baja : '') + '</span>' +
      (cf ? '<div class="row"><button class="btn ghost sm" data-b="vehEdit" data-id="' + v.id + '">Editar</button><button class="btn danger sm" data-b="del" data-col="vehiculos" data-id="' + v.id + '">Quitar</button></div>' : '') + '</div>').join('') : '<span class="empty">Sin vehículos cargados.</span>') + '</div>' +
    '<div class="card"><div class="item-h"><h2>Autorizaciones de ingreso</h2><button class="btn sm" data-b="autNew" data-apto="' + a + '">Agregar</button></div>' + (aut.length ? aut.map(autItem).join('') : '<span class="empty">Sin autorizaciones.</span>') + '</div>' +
    (ocu.length ? '<div class="card"><h2>Ocupantes anunciados por el propietario</h2>' + ocu.map((o) => '<div class="item"><span class="item-t">' + esc(o.responsable) + ' · ' + esc(o.tipo) + '</span><span class="muted">' + o.personas + ' personas · ' + ddmm(o.desde) + ' al ' + ddmm(o.hasta) + ' · Tel. ' + esc(o.tel) + '</span></div>').join('') + '</div>' : '') +
    '<div class="card wide"><h2>Historial de la unidad</h2>' + (hist.length ? '<div class="scroll"><table><tr><th>Fecha</th><th>Tipo</th><th>Detalle</th><th>Estado</th></tr>' + hist.map((h) => '<tr><td>' + esc(when(h.ts)) + '</td><td>' + h.t + '</td><td>' + esc(h.d) + '</td><td>' + esc(h.e) + '</td></tr>').join('') + '</table></div>' : '<span class="empty">Sin movimientos registrados.</span>') + '</div></div>';
}
function autItem(x) {
  const act = autActiva(x);
  return '<div class="item' + (act ? '' : ' off') + '" data-s="' + esc(x.apto + ' ' + x.nombre + ' ' + (x.documento || '') + ' ' + x.tipo) + '"><div class="item-h"><span class="item-t">' + esc(x.nombre) + (x.documento ? ' <span class="muted">· ' + esc(x.documento) + '</span>' : '') + '</span><span class="tag ' + (act ? 't-ok' : '') + '">' + (act ? 'Activa' : x.usada ? 'Usada' : 'Vencida') + '</span></div>' +
    '<span>Apto <b>' + esc(x.apto) + '</b> · ' + esc(x.tipo) + ' · ' + (x.unaVez ? 'una sola vez' + (x.desde ? ' (' + fdate(x.desde) + ')' : '') : 'desde ' + fdate(x.desde) + (x.hasta ? ' hasta ' + fdate(x.hasta) : ' sin fecha de fin')) + '</span>' +
    (x.notas ? '<span class="muted">' + esc(x.notas) + '</span>' : '') + (x.usada ? '<span class="muted">Ingresó ' + esc(when(x.usada)) + (x.porteroIngreso ? ' · registró ' + esc(x.porteroIngreso) : '') + '</span>' : '') +
    '<div class="row">' + (act && x.unaVez ? '<button class="btn sm" data-b="autUsar" data-id="' + x.id + '">Registrar ingreso</button>' : '') + (act ? '<button class="btn ghost sm" data-b="autBaja" data-id="' + x.id + '">Dar de baja</button>' : '') + (canFicha() ? '<button class="btn danger sm" data-b="del" data-col="autorizaciones" data-id="' + x.id + '">Borrar</button>' : '') + '</div></div>';
}
VIEWS.aptos = () => ui.ficha ? vFicha(ui.ficha) : vAptos();

/* ----- Formularios (modales) de la ficha ----- */
function resForm(a, r) {
  r = r || { tipo: 'Propietario' };
  modal('<h2>' + (r.id ? 'Editar' : 'Agregar') + ' residente · Apto ' + a + '</h2><label>Tipo<select name="tipo">' + opt(RES_TIPOS, r.tipo) + '</select></label>' +
    '<div class="row"><label>Nombre<input name="nombre" required value="' + esc(r.nombre || '') + '"></label><label>Apellido<input name="apellido" required value="' + esc(r.apellido || '') + '"></label></div>' +
    '<div class="row"><label>Teléfono (con código)<input name="tel" type="tel" value="' + esc(r.tel || '') + '" placeholder="+598 / +54"></label><label>Correo<input name="email" type="email" value="' + esc(r.email || '') + '"></label></div>' +
    '<label>Fecha de nacimiento (cumpleaños)<input name="nacimiento" type="date" value="' + esc(r.nacimiento || '') + '"></label>' +
    '<div class="row"><label>Desde (inquilinos)<input name="desde" type="date" value="' + esc(r.desde || '') + '"></label><label>Hasta (inquilinos)<input name="hasta" type="date" value="' + esc(r.hasta || '') + '"></label></div>' +
    '<label class="check"><input type="checkbox" name="consent" ' + (r.consentimiento ? 'checked' : '') + ' required> La persona aceptó que sus datos se guarden para la gestión de la torre.</label>' +
    '<div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar</button></div>',
    (fd) => {
      const d = { apto: a, tipo: val(fd, 'tipo'), nombre: val(fd, 'nombre'), apellido: val(fd, 'apellido'), tel: val(fd, 'tel'), email: val(fd, 'email'), nacimiento: val(fd, 'nacimiento'), desde: val(fd, 'desde'), hasta: val(fd, 'hasta'), consentimiento: true, actualizado: Date.now() };
      if (d.tipo === 'Inquilino' && (!d.desde || !d.hasta)) { toast('Para inquilinos, completá desde y hasta'); return false; }
      if (d.tipo !== 'Inquilino') { d.desde = ''; d.hasta = ''; }
      return run(() => r.id ? updateDoc(doc(db, 'residentes', r.id), d) : addDoc(collection(db, 'residentes'), { ...d, creado: Date.now() }), 'Residente guardado');
    });
}
function vehForm(a, v) {
  v = v || { tipo: 'Propietario', alta: today() };
  modal('<h2>' + (v.id ? 'Editar' : 'Agregar') + ' vehículo · Apto ' + a + '</h2><div class="row"><label>Matrícula<input name="matricula" required value="' + esc(v.matricula || '') + '" style="text-transform:uppercase"></label><label>Tipo<select name="tipo">' + opt(['Propietario', 'Inquilino'], v.tipo) + '</select></label></div>' +
    '<label>Titular<input name="titular" required value="' + esc(v.titular || '') + '"></label>' +
    '<div class="row"><label>Marca<input name="marca" value="' + esc(v.marca || '') + '"></label><label>Modelo<input name="modelo" value="' + esc(v.modelo || '') + '"></label><label>Color<input name="color" value="' + esc(v.color || '') + '"></label></div>' +
    '<div class="row"><label>Fecha de alta<input name="alta" type="date" required value="' + esc(v.alta || today()) + '"></label><label>Fecha de baja (inquilinos)<input name="baja" type="date" value="' + esc(v.baja || '') + '"></label></div>' +
    '<span class="muted">El vehículo del propietario queda permanente hasta que avise un cambio.</span><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar</button></div>',
    (fd) => {
      const d = { apto: a, matricula: val(fd, 'matricula').toUpperCase(), tipo: val(fd, 'tipo'), titular: val(fd, 'titular'), marca: val(fd, 'marca'), modelo: val(fd, 'modelo'), color: val(fd, 'color'), alta: val(fd, 'alta'), baja: val(fd, 'baja'), actualizado: Date.now() };
      if (d.tipo === 'Inquilino' && !d.baja) { toast('Para inquilinos, completá la fecha de baja'); return false; }
      if (d.tipo !== 'Inquilino') d.baja = '';
      return run(() => v.id ? updateDoc(doc(db, 'vehiculos', v.id), d) : addDoc(collection(db, 'vehiculos'), { ...d, creado: Date.now() }), 'Vehículo guardado');
    });
}
function autForm(a) {
  modal('<h2>Nueva autorización de ingreso</h2><label>Apartamento<input name="apto" inputmode="numeric" required value="' + esc(a || '') + '" placeholder="Ej.: 1207"></label>' +
    '<div class="row"><label>Nombre (persona o empresa)<input name="nombre" required></label><label>Documento (opcional)<input name="documento"></label></div><label>Tipo<select name="tipo">' + opt(AUT_TIPOS, 'Visita') + '</select></label>' +
    '<label class="check"><input type="checkbox" name="unaVez"> Visita de una sola vez</label>' +
    '<div class="row"><label>Desde<input name="desde" type="date" required value="' + today() + '"></label><label>Hasta (vacío = sin fecha de fin)<input name="hasta" type="date"></label></div>' +
    '<label>Notas<input name="notas" placeholder="Ej.: autoriza el propietario por WhatsApp; retira llave"></label><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar</button></div>',
    (fd) => {
      const ap = val(fd, 'apto'); if (!validApto(ap)) { toast('Apartamento inválido (del 107 al 1712)'); return false; }
      const una = !!fd.get('unaVez');
      const d = { apto: ap, nombre: val(fd, 'nombre'), documento: val(fd, 'documento'), tipo: val(fd, 'tipo'), unaVez: una, desde: val(fd, 'desde'), hasta: una ? val(fd, 'desde') : val(fd, 'hasta'), notas: val(fd, 'notas'), usada: null, creado: Date.now(), autor: ROLES[who.rol] };
      if (d.hasta && d.hasta < d.desde) { toast('La fecha "hasta" es anterior a "desde"'); return false; }
      return run(() => addDoc(collection(db, 'autorizaciones'), d), 'Autorización guardada');
    });
}

/* ----- Autorizaciones (todas) ----- */
VIEWS.autorizaciones = () => {
  const act = S.autorizaciones.filter(autActiva).sort((x, y) => x.apto.localeCompare(y.apto, undefined, { numeric: true }));
  const inact = S.autorizaciones.filter((x) => !autActiva(x)).sort(sortTs).slice(0, 30);
  return '<div class="hello"><h1>Autorizaciones de ingreso</h1><span class="muted">' + act.length + ' activas hoy. Las de una sola vez y las vencidas pasan solas a inactivas.</span></div>' +
    '<div class="card" style="margin-bottom:16px"><div class="row" style="align-items:flex-end"><label style="flex:3 1 260px">Buscar por apartamento, nombre o documento<input data-filter=".aut-list .item" placeholder="Ej.: 1207 o Inmobiliaria Sol"></label><button class="btn" data-b="autNew">Nueva autorización</button></div></div>' +
    '<div class="grid aut-list"><div class="card wide"><h2>Activas</h2>' + (act.length ? act.map(autItem).join('') : '<span class="empty">No hay autorizaciones activas.</span>') + '</div>' +
    '<div class="card"><h2>Vencidas o usadas (últimas)</h2>' + (inact.length ? inact.map(autItem).join('') : '<span class="empty">Ninguna.</span>') + '</div></div>';
};

/* ----- Vehículos: listado para seguridad ----- */
function vehVigentes() { return S.vehiculos.filter((v) => (!v.alta || v.alta <= today()) && (!v.baja || v.baja >= today())).sort((x, y) => x.apto.localeCompare(y.apto, undefined, { numeric: true })); }
function vehTexto() {
  const t = today(), d7 = ymd(addDays(-7));
  const altas = S.vehiculos.filter((v) => v.alta >= d7 && v.alta <= t), bajas = S.vehiculos.filter((v) => v.baja && v.baja >= d7 && v.baja <= t);
  const line = (v) => [v.matricula, v.marca, v.modelo, v.color, v.titular, 'Apto ' + v.apto, v.tipo, 'alta ' + fdate(v.alta), v.baja ? 'baja ' + fdate(v.baja) : 'permanente'].join(' | ');
  return 'TORRE JEFFERSON – Vehículos autorizados al ' + ddmm(t) + '\n\n' + vehVigentes().map(line).join('\n') +
    '\n\nALTAS últimos 7 días:\n' + (altas.map(line).join('\n') || '—') + '\n\nBAJAS últimos 7 días:\n' + (bajas.map(line).join('\n') || '—');
}
VIEWS.vehiculos = () => {
  const v = vehVigentes();
  return '<div class="hello"><h1>Vehículos autorizados</h1><span class="muted">' + v.length + ' vigentes. Este listado es el que se envía a seguridad del complejo para el alta en las barreras.</span></div>' +
    '<div class="card no-print" style="margin-bottom:16px"><div class="row" style="align-items:flex-end"><label style="flex:3 1 260px">Buscar<input data-filter=".veh-row" placeholder="Matrícula, apartamento o titular"></label><button class="btn" data-b="vehCopy">Copiar listado para seguridad</button><button class="btn dark" data-a="print">' + ic('print', 18) + 'Imprimir</button></div></div>' +
    '<div class="card sheet-card"><div class="scroll"><table style="min-width:640px"><tr><th>Matrícula</th><th>Vehículo</th><th>Titular</th><th>Apto</th><th>Tipo</th><th>Alta</th><th>Baja</th></tr>' +
    v.map((x) => '<tr class="veh-row" data-s="' + esc(x.matricula + ' ' + x.apto + ' ' + x.titular) + '"><td><b class="plate">' + esc(x.matricula) + '</b></td><td>' + esc([x.marca, x.modelo, x.color].filter(Boolean).join(' ')) + '</td><td>' + esc(x.titular) + '</td><td>' + esc(x.apto) + '</td><td>' + esc(x.tipo) + '</td><td>' + fdate(x.alta) + '</td><td>' + (x.baja ? fdate(x.baja) : 'Permanente') + '</td></tr>').join('') + '</table></div>' + (v.length ? '' : '<span class="empty">No hay vehículos cargados. Se cargan desde la ficha de cada apartamento.</span>') + '</div>';
};

/* ----- Tareas por turno ----- */
function tareaToca(t, fecha, idx) {
  if (!t.activa) return false;
  if (t.turno !== 'Todos' && String(t.turno) !== String(idx)) return false;
  if (t.frecuencia === 'Cada turno' || t.frecuencia === 'Diaria') return true;
  const dias = t.frecuencia === 'Semanal' ? 7 : 14;
  const ult = S.tareasHechas.filter((h) => h.tareaId === t.id && h.fecha < fecha).map((h) => h.fecha).sort().pop();
  if (!ult) return true;
  const diff = (new Date(fecha + 'T12:00') - new Date(ult + 'T12:00')) / 86400000;
  return diff >= dias || S.tareasHechas.some((h) => h.tareaId === t.id && h.fecha === fecha);
}
VIEWS.tareas = () => {
  if (ui.tTurno == null) { const a = turnoAhora(); ui.tTurno = a.idx; ui.tFecha = a.fecha; }
  const f = ui.tFecha, i = ui.tTurno;
  const lista = S.tareas.filter((t) => tareaToca(t, f, i)).sort((a, b) => (a.orden || 0) - (b.orden || 0));
  const noToca = S.tareas.filter((t) => t.activa && !lista.includes(t) && (t.turno === 'Todos' || String(t.turno) === String(i)));
  let total = 0, hechas = 0;
  const items = lista.map((t) => {
    const n = Math.max(1, +t.veces || 1); total += n;
    const hs = S.tareasHechas.filter((h) => h.tareaId === t.id && h.fecha === f && String(h.turno) === String(i));
    let boxes = '';
    for (let k = 1; k <= n; k++) {
      const h = hs.find((x) => +x.n === k); if (h) hechas++;
      boxes += '<button class="tick' + (h ? ' done' : '') + '" data-b="tick" data-id="' + t.id + '" data-n="' + k + '"' + (h ? ' data-h="' + h.id + '"' : '') + ' aria-label="' + esc(t.nombre) + (n > 1 ? ' vez ' + k : '') + '">' + (h ? '✓' : '') + '</button>' +
        (h ? '<span class="muted tick-who">' + esc(h.quien) + ' · ' + hhmm(h.ts) + (h.comentario ? ' · “' + esc(h.comentario) + '”' : '') + '</span>' : '');
    }
    return '<div class="item"><div class="item-h"><span class="item-t">' + esc(t.nombre) + '</span><span class="tag">' + esc(t.frecuencia) + (n > 1 ? ' · ' + n + ' veces' : '') + '</span></div>' + (t.detalle ? '<span class="muted">' + esc(t.detalle) + '</span>' : '') + '<div class="ticks">' + boxes + '</div></div>';
  }).join('');
  const admin = who.rol === 'encargado' ? '<div class="card"><div class="item-h"><h2>Administrar tareas</h2><button class="btn sm" data-b="tareaNew">Agregar</button></div>' + S.tareas.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0)).map((t) => '<div class="item' + (t.activa ? '' : ' off') + '"><div class="item-h"><span class="item-t">' + esc(t.nombre) + '</span><span class="tag">' + (t.activa ? 'Activa' : 'Pausada') + '</span></div><span class="muted">' + (t.turno === 'Todos' ? 'Todos los turnos' : esc(TURNOS[+t.turno])) + ' · ' + esc(t.frecuencia) + ' · ' + (t.veces || 1) + ' vez/veces</span><div class="row"><button class="btn ghost sm" data-b="tareaEdit" data-id="' + t.id + '">Editar</button><button class="btn danger sm" data-b="del" data-col="tareas" data-id="' + t.id + '">Borrar</button></div></div>').join('') + '</div>' : '';
  return '<div class="hello"><h1>Tareas del turno</h1><span class="muted">' + hechas + ' de ' + total + ' hechas · ' + esc(dlabel(f)) + ' · ' + esc(TURNOS[i]) + '</span></div>' + turnoBar() +
    '<div class="card no-print" style="margin:16px 0"><div class="row" style="align-items:flex-end"><label>Día<input type="date" data-c2="tFecha" value="' + f + '"></label><label>Turno<select data-c2="tTurno">' + opt(TURNOS.map((x, k) => [k, x]), i) + '</select></label></div></div>' +
    '<div class="grid"><div class="card wide"><h2>Para hacer en este turno</h2>' + (items || '<span class="empty">No hay tareas para este turno.</span>') +
    (noToca.length ? '<span class="muted">No tocan hoy: ' + noToca.map((t) => esc(t.nombre) + ' (' + t.frecuencia.toLowerCase() + ')').join(', ') + '</span>' : '') + '</div>' + admin + '</div>';
};
function tareaForm(t) {
  t = t || { turno: 'Todos', frecuencia: 'Cada turno', veces: 1, activa: true };
  modal('<h2>' + (t.id ? 'Editar' : 'Nueva') + ' tarea</h2><label>Tarea<input name="nombre" required value="' + esc(t.nombre || '') + '"></label><label>Detalle (opcional)<input name="detalle" value="' + esc(t.detalle || '') + '"></label>' +
    '<div class="row"><label>Turno<select name="turno">' + opt([['Todos', 'Todos los turnos']].concat(TURNOS.map((x, k) => [String(k), x])), t.turno) + '</select></label><label>Frecuencia<select name="frecuencia">' + opt(FRECS, t.frecuencia) + '</select></label><label>Veces por turno<input name="veces" type="number" min="1" max="6" value="' + (t.veces || 1) + '"></label></div>' +
    '<label class="check"><input type="checkbox" name="activa" ' + (t.activa !== false ? 'checked' : '') + '> Activa</label><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar</button></div>',
    (fd) => { const d = { nombre: val(fd, 'nombre'), detalle: val(fd, 'detalle'), turno: val(fd, 'turno'), frecuencia: val(fd, 'frecuencia'), veces: Math.max(1, +fd.get('veces') || 1), activa: !!fd.get('activa') };
      return run(() => t.id ? updateDoc(doc(db, 'tareas', t.id), d) : addDoc(collection(db, 'tareas'), { ...d, orden: S.tareas.length + 1, creado: Date.now() }), 'Tarea guardada'); });
}

/* ----- Llaves ----- */
VIEWS.llaves = () => {
  const ls = S.llaves.slice().sort((a, b) => (b.estado === 'Prestada') - (a.estado === 'Prestada') || a.nombre.localeCompare(b.nombre));
  const fuera = count(ls, (l) => l.estado === 'Prestada');
  const movs = S.llavesMov.slice().sort((a, b) => b.ts - a.ts).slice(0, 15);
  const ctrl = S.llavesControl.slice().sort((a, b) => b.ts - a.ts)[0];
  return '<div class="hello"><h1>Llaves</h1><span class="muted">' + (ls.length - fuera) + ' en recepción · ' + fuera + ' prestadas</span></div>' + turnoBar() +
    '<div class="grid" style="margin-top:16px"><div class="card wide"><div class="item-h"><h2>Tablero de llaves</h2><button class="btn sm" data-b="llaveCtrl">Control de inventario</button></div>' +
    (ls.length ? ls.map((l) => '<div class="item"><div class="item-h"><span class="item-t">' + esc(l.nombre) + '</span><span class="tag ' + (l.estado === 'Prestada' ? 't-warn' : 't-ok') + '">' + esc(l.estado) + '</span></div>' +
      (l.estado === 'Prestada' ? '<span>A: <b>' + esc(l.prestadaA) + '</b>' + (l.motivo ? ' · ' + esc(l.motivo) : '') + '</span><span class="muted">Desde ' + esc(when(l.desde)) + ' · entregó ' + esc(l.entrego || '') + '</span>' : '') +
      '<div class="row">' + (l.estado === 'Prestada' ? '<button class="btn sm" data-b="llaveDev" data-id="' + l.id + '">Registrar devolución</button>' : '<button class="btn ghost sm" data-b="llavePres" data-id="' + l.id + '">Prestar</button>') + (who.rol === 'encargado' ? '<button class="btn danger sm" data-b="del" data-col="llaves" data-id="' + l.id + '">Quitar del tablero</button>' : '') + '</div></div>').join('') : '<span class="empty">No hay llaves cargadas.</span>') +
    (who.rol === 'encargado' ? '<form class="row" data-g="llaveNew" style="align-items:flex-end;margin-top:6px"><label style="flex:3 1 220px">Agregar llave al tablero<input name="nombre" required placeholder="Ej.: Azotea, Apto 1207 (copia)"></label><button class="btn">Agregar</button></form>' : '') + '</div>' +
    '<div class="card"><h2>Último control</h2>' + (ctrl ? '<span>' + esc(when(ctrl.ts)) + ' · ' + esc(ctrl.quien) + '</span>' + (ctrl.faltantes.length ? '<div class="err">Faltaban: ' + esc(ctrl.faltantes.join(', ')) + '</div>' : '<div class="note">Todas las llaves en su lugar.</div>') : '<span class="empty">Todavía no se hizo ningún control.</span>') +
    '<h2 style="margin-top:8px">Movimientos recientes</h2>' + (movs.length ? movs.map((m) => '<div class="item-h"><span>' + esc(when(m.ts)) + ' · <b>' + esc(m.accion) + '</b> ' + esc(m.llave) + ' · ' + esc(m.persona) + '</span></div>').join('') : '<span class="empty">Sin movimientos.</span>') + '</div></div>';
};

/* ----- Eventos de la Etapa 1 ----- */
document.addEventListener('input', (e) => {
  const sel = e.target.dataset.filter; if (!sel) return;
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll(sel).forEach((el) => { el.style.display = !q || (el.dataset.s || el.textContent).toLowerCase().includes(q) ? '' : 'none'; });
});
document.addEventListener('change', (e) => {
  const c = e.target.dataset.c2; if (!c) return;
  if (c === 'tFecha') ui.tFecha = e.target.value || today();
  if (c === 'tTurno') ui.tTurno = +e.target.value;
  if (c === 'mFecha') ui.mFecha = e.target.value || today();
  if (c === 'cMes') ui.cMes = e.target.value || today().slice(0, 7);
  e.target.blur(); render();
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-g]'); if (!f) return; e.preventDefault();
  const fd = new FormData(f), g = f.dataset.g;
  if (g === 'unidad') { const a = f.dataset.apto; run(() => setDoc(doc(db, 'unidades', a), { apto: a, estado: val(fd, 'estado'), ingreso: val(fd, 'ingreso'), notas: val(fd, 'notas'), actualizado: Date.now() }, { merge: true }), 'Estado guardado').then(() => { document.activeElement && document.activeElement.blur(); render(); }); }
  if (g === 'llaveNew') { run(() => addDoc(collection(db, 'llaves'), { nombre: val(fd, 'nombre'), estado: 'En recepción', prestadaA: '', motivo: '', desde: null, creado: Date.now() }), 'Llave agregada').then(() => { f.reset(); document.activeElement && document.activeElement.blur(); render(); }); }
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-b]'); if (!b) return; const a = b.dataset.b, id = b.dataset.id;
  const find = (c) => S[c].find((x) => x.id === id);
  if (a === 'ficha') { ui.ficha = b.dataset.apto; go(); }
  else if (a === 'aptos') { ui.ficha = null; go(); }
  else if (a === 'nombre') pedirNombre();
  else if (a === 'resNew') resForm(b.dataset.apto);
  else if (a === 'resEdit') { const r = find('residentes'); if (r) resForm(r.apto, r); }
  else if (a === 'vehNew') vehForm(b.dataset.apto);
  else if (a === 'vehEdit') { const v = find('vehiculos'); if (v) vehForm(v.apto, v); }
  else if (a === 'autNew') autForm(b.dataset.apto || (ui.tab === 'aptos' ? ui.ficha : ''));
  else if (a === 'autUsar') conNombre(() => run(() => updateDoc(doc(db, 'autorizaciones', id), { usada: Date.now(), porteroIngreso: nombreTurno() }), 'Ingreso registrado'));
  else if (a === 'autBaja') confirmBox('¿Dar de baja esta autorización?', 'Dar de baja', () => run(() => updateDoc(doc(db, 'autorizaciones', id), { hasta: ymd(addDays(-1)) }), 'Autorización dada de baja'));
  else if (a === 'del') confirmBox('¿Borrar este registro? No se puede deshacer.', 'Borrar', () => run(() => deleteDoc(doc(db, b.dataset.col, id)), 'Registro borrado'));
  else if (a === 'vehCopy') { const txt = vehTexto(); navigator.clipboard.writeText(txt).then(() => toast('Listado copiado: pegalo en WhatsApp o en un mail a seguridad'), () => modal('<h2>Copiá el listado</h2><textarea style="min-height:260px" readonly>' + esc(txt) + '</textarea><button class="btn">Cerrar</button>', () => {})); }
  else if (a === 'tareaNew') tareaForm();
  else if (a === 'tareaEdit') { const t = find('tareas'); if (t) tareaForm(t); }
  else if (a === 'tick') {
    const t = S.tareas.find((x) => x.id === id); const hId = b.dataset.h;
    if (hId) confirmBox('¿Desmarcar "' + t.nombre + '"?', 'Desmarcar', () => run(() => deleteDoc(doc(db, 'tareasHechas', hId)), 'Tarea desmarcada'));
    else conNombre(() => modal('<h2>' + esc(t.nombre) + '</h2><span class="muted">Hecha por ' + esc(nombreTurno()) + '.</span><label>Comentario (opcional)<input name="comentario" placeholder="Ej.: tanque 2 al 60 %"></label><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Marcar como hecha</button></div>',
      (fd) => run(() => addDoc(collection(db, 'tareasHechas'), { tareaId: id, tarea: t.nombre, fecha: ui.tFecha, turno: ui.tTurno, n: +b.dataset.n, quien: nombreTurno(), comentario: val(fd, 'comentario'), ts: Date.now() }), 'Tarea marcada')));
  }
  else if (a === 'llavePres') { const l = find('llaves'); conNombre(() => modal('<h2>Prestar: ' + esc(l.nombre) + '</h2><label>Se la lleva<input name="persona" required placeholder="Nombre y, si corresponde, apto o empresa"></label><label>Motivo (opcional)<input name="motivo" placeholder="Ej.: técnico de ascensores"></label><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Registrar préstamo</button></div>',
      (fd) => run(async () => { const p = val(fd, 'persona'); await updateDoc(doc(db, 'llaves', id), { estado: 'Prestada', prestadaA: p, motivo: val(fd, 'motivo'), desde: Date.now(), entrego: nombreTurno() }); await addDoc(collection(db, 'llavesMov'), { llaveId: id, llave: l.nombre, accion: 'Retiro', persona: p, quien: nombreTurno(), ts: Date.now() }); }, 'Préstamo registrado'))); }
  else if (a === 'llaveDev') { const l = find('llaves'); conNombre(() => run(async () => { await updateDoc(doc(db, 'llaves', id), { estado: 'En recepción', prestadaA: '', motivo: '', desde: null }); await addDoc(collection(db, 'llavesMov'), { llaveId: id, llave: l.nombre, accion: 'Devolución', persona: l.prestadaA || '', quien: nombreTurno(), ts: Date.now() }); }, 'Devolución registrada')); }
  else if (a === 'llaveCtrl') conNombre(() => {
    const ls = S.llaves.slice().sort((x, y) => x.nombre.localeCompare(y.nombre));
    modal('<h2>Control de inventario de llaves</h2><span class="muted">Marcá las llaves que están en el tablero. Las prestadas figuran aparte.</span>' +
      ls.filter((l) => l.estado !== 'Prestada').map((l) => '<label class="check"><input type="checkbox" name="k" value="' + esc(l.nombre) + '"> ' + esc(l.nombre) + '</label>').join('') +
      (ls.some((l) => l.estado === 'Prestada') ? '<span class="muted">Prestadas: ' + ls.filter((l) => l.estado === 'Prestada').map((l) => esc(l.nombre) + ' (' + esc(l.prestadaA) + ')').join(', ') + '</span>' : '') +
      '<div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar control</button></div>',
      (fd) => { const ok = fd.getAll('k'); const falt = ls.filter((l) => l.estado !== 'Prestada' && !ok.includes(l.nombre)).map((l) => l.nombre);
        return run(() => addDoc(collection(db, 'llavesControl'), { ts: Date.now(), quien: nombreTurno(), presentes: ok.length, faltantes: falt }), falt.length ? 'Control guardado: faltan ' + falt.length : 'Control guardado: todo en orden'); });
  });
});


/* =====================================================================
   ETAPA 2 · Gestión interna
   Proveedores de servicio, servicio de mucamas, turnos del personal,
   caja chica y materiales de limpieza.
   ===================================================================== */
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const GSUBS = [['prov', 'Proveedores'], ['muc', 'Mucamas'], ['turnos', 'Turnos del personal'], ['caja', 'Caja chica'], ['mat', 'Materiales']];
const money = (n) => '$ ' + (Math.round((+n || 0) * 100) / 100).toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 86400000);
const addTo = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return ymd(d); };
const isEnc = () => who && who.rol === 'encargado';

VIEWS.gestion = () => {
  if (!ui.gsub) ui.gsub = 'prov';
  const nav = '<div class="pills no-print" role="tablist" style="margin-bottom:16px">' + GSUBS.map((g) => '<button class="pill' + (ui.gsub === g[0] ? ' on' : '') + '" data-b="gsub" data-v="' + g[0] + '">' + g[1] + gBadge(g[0]) + '</button>').join('') + '</div>';
  return nav + ({ prov: vProv, muc: vMuc, turnos: vTurnos, caja: vCaja, mat: vMat })[ui.gsub]();
};
function gBadge(k) {
  let n = 0;
  if (k === 'prov') n = count(S.proveedores, (p) => provEstado(p).k === 'venc');
  if (k === 'mat') n = count(S.materiales, (m) => (+m.stock || 0) <= (+m.minimo || 0));
  return n ? ' <span class="badge">' + n + '</span>' : '';
}

/* ----- Proveedores de servicio ----- */
function provUltima(p) { return S.visitasProv.filter((v) => v.provId === p.id).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))[0]; }
function provEstado(p) {
  const u = provUltima(p); const per = +p.periodicidad || 0;
  if (!per) return { k: 'ok', t: u ? 'Sin periodicidad' : 'Sin visitas', prox: '' };
  if (!u) return { k: 'venc', t: 'Sin visitas registradas', prox: '' };
  const prox = addTo(u.fecha, per), d = daysBetween(today(), prox);
  if (d < 0) return { k: 'venc', t: 'Vencida hace ' + (-d) + ' días', prox };
  if (d <= 7) return { k: 'pronto', t: d === 0 ? 'Toca hoy' : 'Toca en ' + d + ' días', prox };
  return { k: 'ok', t: 'Al día', prox };
}
function vProv() {
  const cf = canFicha();
  const ps = S.proveedores.slice().sort((a, b) => { const o = { venc: 0, pronto: 1, ok: 2 }; return o[provEstado(a).k] - o[provEstado(b).k] || a.nombre.localeCompare(b.nombre); });
  return '<div class="hello"><h1>Proveedores de servicio</h1><span class="muted">Visitas periódicas: la app avisa cuando una está vencida o por vencer.</span></div>' +
    '<div class="grid"><div class="card wide"><div class="item-h"><h2>Servicios</h2>' + (cf ? '<button class="btn sm" data-b="provNew">Agregar proveedor</button>' : '') + '</div>' +
    (ps.length ? ps.map((p) => {
      const e = provEstado(p), u = provUltima(p), vis = S.visitasProv.filter((v) => v.provId === p.id).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
      return '<div class="item"><div class="item-h"><span class="item-t">' + esc(p.servicio) + ' · ' + esc(p.nombre) + '</span><span class="tag ' + (e.k === 'venc' ? 't-bad' : e.k === 'pronto' ? 't-warn' : 't-ok') + '">' + esc(e.t) + '</span></div>' +
        '<span class="muted">' + (p.periodicidad ? 'Cada ' + p.periodicidad + ' días' : 'Sin periodicidad fija') + (p.telefono ? ' · Tel. ' + esc(p.telefono) : '') + (u ? ' · última visita ' + fdate(u.fecha) : '') + (e.prox ? ' · próxima ' + fdate(e.prox) : '') + '</span>' +
        (p.notas ? '<span class="muted">' + esc(p.notas) + '</span>' : '') +
        '<div class="row"><button class="btn sm" data-b="visNew" data-id="' + p.id + '">Registrar visita</button>' + (cf ? '<button class="btn ghost sm" data-b="provEdit" data-id="' + p.id + '">Editar</button><button class="btn danger sm" data-b="del" data-col="proveedores" data-id="' + p.id + '">Borrar</button>' : '') + '</div>' +
        (vis.length ? '<details class="mini-hist"><summary>Historial (' + vis.length + ')</summary>' + vis.slice(0, 12).map((v) => '<div class="muted">' + fdate(v.fecha) + ' · ' + esc(v.trabajo || 'Visita') + (v.quien ? ' · registró ' + esc(v.quien) : '') + '</div>').join('') + '</details>' : '') + '</div>';
    }).join('') : '<span class="empty">No hay proveedores cargados.</span>') + '</div></div>';
}
function provForm(p) {
  p = p || { periodicidad: 30 };
  modal('<h2>' + (p.id ? 'Editar' : 'Nuevo') + ' proveedor</h2><div class="row"><label>Servicio<input name="servicio" required value="' + esc(p.servicio || '') + '" placeholder="Ej.: Ascensores"></label><label>Empresa o técnico<input name="nombre" required value="' + esc(p.nombre || '') + '"></label></div>' +
    '<div class="row"><label>Teléfono<input name="telefono" type="tel" value="' + esc(p.telefono || '') + '"></label><label>Cada cuántos días<input name="periodicidad" type="number" min="0" value="' + (p.periodicidad || 0) + '"></label></div>' +
    '<label>Notas<input name="notas" value="' + esc(p.notas || '') + '" placeholder="Ej.: contrato mensual; avisar a la administración"></label><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar</button></div>',
    (fd) => { const d = { servicio: val(fd, 'servicio'), nombre: val(fd, 'nombre'), telefono: val(fd, 'telefono'), periodicidad: +fd.get('periodicidad') || 0, notas: val(fd, 'notas') };
      return run(() => p.id ? updateDoc(doc(db, 'proveedores', p.id), d) : addDoc(collection(db, 'proveedores'), { ...d, creado: Date.now() }), 'Proveedor guardado'); });
}

/* ----- Servicio de mucamas ----- */
function mucAgenda(fecha) {
  const dow = new Date(fecha + 'T12:00').getDay();
  const fijos = S.servicioMucama.filter((s) => s.activo !== false && (s.dias || []).includes(dow) && (!s.desde || s.desde <= fecha) && (!s.hasta || s.hasta >= fecha))
    .map((s) => ({ key: 's:' + s.id, apto: s.apto, hora: s.hora, mucama: s.mucama, notas: s.notas, fijo: true }));
  const extra = S.agendaMucama.filter((x) => x.fecha === fecha).map((x) => ({ key: 'x:' + x.id, id: x.id, apto: x.apto, hora: x.hora, mucama: x.mucama, notas: x.notas, fijo: false }));
  return fijos.concat(extra).sort((a, b) => (a.hora || '').localeCompare(b.hora || '') || a.apto.localeCompare(b.apto, undefined, { numeric: true }))
    .map((v) => ({ ...v, hecho: S.mucamaHechos.find((h) => h.fecha === fecha && h.key === v.key) }));
}
function mucSheet(fecha) {
  const ag = mucAgenda(fecha);
  return '<div class="sheet"><div class="item-h sheet-top"><div><div class="sheet-kick">Torre Jefferson</div><div style="font-size:20px;font-weight:800">Agenda de mucamas</div></div><div style="text-align:right;font-size:13px">' + esc(dlabel(fecha)) + '<br>' + ag.length + ' servicios</div></div>' +
    (ag.length ? '<table><tr><th>Hora</th><th>Apto</th><th>Mucama</th><th>Notas</th><th class="no-print">Hecho</th><th class="print-only">✓</th></tr>' + ag.map((v) => '<tr><td><b>' + esc(v.hora || '') + '</b></td><td><b>' + esc(v.apto) + '</b></td><td>' + esc(v.mucama || '') + '</td><td>' + esc(v.notas || '') + (v.fijo ? '' : ' <span class="tag">puntual</span>') + '</td>' +
      '<td class="no-print"><button class="tick' + (v.hecho ? ' done' : '') + '" data-b="mucTick" data-k="' + esc(v.key) + '" data-apto="' + esc(v.apto) + '"' + (v.hecho ? ' data-h="' + v.hecho.id + '"' : '') + ' aria-label="Hecho apto ' + esc(v.apto) + '">' + (v.hecho ? '✓' : '') + '</button>' + (!v.fijo ? ' <button class="btn ghost sm" data-b="del" data-col="agendaMucama" data-id="' + v.id + '">Quitar</button>' : '') + '</td><td class="print-only">☐</td></tr>').join('') + '</table>' : '<p class="empty">No hay servicios para este día.</p>') + '</div>';
}
function vMuc() {
  if (!ui.mFecha) ui.mFecha = today();
  const cf = canFicha();
  const sv = S.servicioMucama.slice().sort((a, b) => a.apto.localeCompare(b.apto, undefined, { numeric: true }));
  return '<div class="hello no-print"><h1>Servicio de mucamas</h1><span class="muted">Qué apartamentos tienen el servicio y la agenda del día para imprimir.</span></div>' +
    '<div class="card no-print" style="margin-bottom:16px"><div class="row" style="align-items:flex-end"><label>Día<input type="date" data-c2="mFecha" value="' + ui.mFecha + '"></label><button class="btn ghost" data-b="mucExtra">Agregar visita puntual</button><button class="btn dark" data-a="print">' + ic('print', 18) + 'Imprimir agenda</button></div></div>' +
    mucSheet(ui.mFecha) +
    '<div class="card no-print" style="margin-top:16px"><div class="item-h"><h2>Servicios contratados</h2>' + (cf ? '<button class="btn sm" data-b="mucNew">Agregar</button>' : '') + '</div>' +
    (sv.length ? sv.map((s) => '<div class="item' + (s.activo === false ? ' off' : '') + '"><div class="item-h"><span class="item-t">Apto ' + esc(s.apto) + ' · ' + esc(s.hora || '') + '</span><span class="tag">' + esc((s.dias || []).length === 7 ? 'Todos los días' : (s.dias || []).map((d) => DIAS[d]).join(' ')) + '</span></div><span class="muted">' + esc(s.mucama || 'Sin asignar') + (s.desde || s.hasta ? ' · del ' + fdate(s.desde) + ' al ' + fdate(s.hasta) : '') + (s.notas ? ' · ' + esc(s.notas) : '') + '</span>' +
      (cf ? '<div class="row"><button class="btn ghost sm" data-b="mucEdit" data-id="' + s.id + '">Editar</button><button class="btn danger sm" data-b="del" data-col="servicioMucama" data-id="' + s.id + '">Quitar</button></div>' : '') + '</div>').join('') : '<span class="empty">Ningún apartamento tiene el servicio cargado.</span>') + '</div>';
}
const mucamas = () => S.personal.filter((p) => p.area === 'Mucamas' && p.activo !== false).map((p) => p.nombre);
function mucForm(s) {
  s = s || { dias: [1, 3, 5], hora: '10:00', activo: true };
  const ms = mucamas();
  modal('<h2>' + (s.id ? 'Editar' : 'Nuevo') + ' servicio de mucama</h2><div class="row"><label>Apartamento<input name="apto" inputmode="numeric" required value="' + esc(s.apto || '') + '"></label><label>Hora<input name="hora" type="time" required value="' + esc(s.hora || '10:00') + '"></label></div>' +
    '<span style="font-size:14px;font-weight:600">Días</span><div class="pills">' + [1, 2, 3, 4, 5, 6, 0].map((d) => '<label class="pill check-pill"><input type="checkbox" name="d" value="' + d + '"' + ((s.dias || []).includes(d) ? ' checked' : '') + '> ' + DIAS[d] + '</label>').join('') + '</div>' +
    '<label>Mucama' + (ms.length ? '<select name="mucama">' + opt([''].concat(ms), s.mucama || '') + '</select>' : '<input name="mucama" value="' + esc(s.mucama || '') + '" placeholder="Cargá el personal en Turnos">') + '</label>' +
    '<div class="row"><label>Desde (opcional)<input name="desde" type="date" value="' + esc(s.desde || '') + '"></label><label>Hasta (opcional)<input name="hasta" type="date" value="' + esc(s.hasta || '') + '"></label></div>' +
    '<label>Notas<input name="notas" value="' + esc(s.notas || '') + '" placeholder="Ej.: cambio de sábanas los viernes"></label><label class="check"><input type="checkbox" name="activo"' + (s.activo !== false ? ' checked' : '') + '> Servicio activo</label>' +
    '<div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar</button></div>',
    (fd) => { const ap = val(fd, 'apto'); if (!validApto(ap)) { toast('Apartamento inválido (del 107 al 1712)'); return false; }
      const dias = fd.getAll('d').map(Number); if (!dias.length) { toast('Elegí al menos un día'); return false; }
      const d = { apto: ap, hora: val(fd, 'hora'), dias, mucama: val(fd, 'mucama'), desde: val(fd, 'desde'), hasta: val(fd, 'hasta'), notas: val(fd, 'notas'), activo: !!fd.get('activo') };
      return run(() => s.id ? updateDoc(doc(db, 'servicioMucama', s.id), d) : addDoc(collection(db, 'servicioMucama'), { ...d, creado: Date.now() }), 'Servicio guardado'); });
}

/* ----- Turnos del personal ----- */
function lunes(s) { const d = new Date(s + 'T12:00'); const k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return ymd(d); }
const TURNO_OPC = { 'Recepción': ['Mañana 6–14', 'Tarde 14–22', 'Noche 22–6', 'Libre', 'Licencia'], 'Mucamas': ['Mañana', 'Tarde', 'Libre', 'Licencia'] };
function turnoClase(v) { return !v ? '' : /Libre/.test(v) ? 't-libre' : /Licencia/.test(v) ? 't-lic' : 't-trab'; }
function vTurnos() {
  if (!ui.semana) ui.semana = lunes(today());
  if (!ui.area) ui.area = 'Recepción';
  const dias = [0, 1, 2, 3, 4, 5, 6].map((k) => addTo(ui.semana, k));
  const pers = S.personal.filter((p) => p.area === ui.area && p.activo !== false).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const cell = (p, f) => { const t = S.turnosPersonal.find((x) => x.personaId === p.id && x.fecha === f); const v = t ? t.valor : '';
    return '<td>' + (isEnc() ? '<button class="tcell ' + turnoClase(v) + '" data-b="tCell" data-p="' + p.id + '" data-f="' + f + '">' + (esc(v) || '—') + '</button>' : '<span class="tcell ' + turnoClase(v) + '">' + (esc(v) || '—') + '</span>') + '</td>'; };
  return '<div class="hello no-print"><h1>Turnos del personal</h1><span class="muted">' + (isEnc() ? 'Tocá una celda para asignar horario, día libre o licencia.' : 'Solo lectura: los turnos los asigna el encargado.') + '</span></div>' +
    '<div class="card no-print" style="margin-bottom:16px"><div class="row" style="align-items:flex-end"><div class="seg" style="flex:2 1 260px">' + ['Recepción', 'Mucamas'].map((a) => '<button class="' + (ui.area === a ? 'on' : '') + '" data-b="area" data-v="' + a + '">' + a + '</button>').join('') + '</div>' +
    '<button class="btn ghost" data-b="semana" data-v="-7">‹ Semana anterior</button><button class="btn ghost" data-b="semana" data-v="7">Semana siguiente ›</button><button class="btn dark" data-a="print">' + ic('print', 18) + 'Imprimir</button></div></div>' +
    '<div class="sheet"><div class="item-h sheet-top"><div><div class="sheet-kick">Torre Jefferson</div><div style="font-size:20px;font-weight:800">Turnos · ' + esc(ui.area) + '</div></div><div style="text-align:right;font-size:13px">Semana del ' + fdate(dias[0]) + ' al ' + fdate(dias[6]) + '</div></div>' +
    (pers.length ? '<div class="scroll"><table class="turnos"><tr><th>Persona</th>' + dias.map((f) => '<th' + (f === today() ? ' class="hoy"' : '') + '>' + DIAS[new Date(f + 'T12:00').getDay()] + ' ' + ddmm(f) + '</th>').join('') + '</tr>' +
      pers.map((p) => '<tr><td><b>' + esc(p.nombre) + '</b>' + (isEnc() ? ' <button class="btn ghost sm no-print" data-b="del" data-col="personal" data-id="' + p.id + '" aria-label="Quitar ' + esc(p.nombre) + '">×</button>' : '') + '</td>' + dias.map((f) => cell(p, f)).join('') + '</tr>').join('') + '</table></div>' : '<p class="empty">No hay personal cargado en ' + esc(ui.area) + '.</p>') + '</div>' +
    (isEnc() ? '<form class="card no-print" data-g="persona" style="margin-top:16px"><h2>Agregar persona</h2><div class="row" style="align-items:flex-end"><label>Nombre<input name="nombre" required></label><label>Área<select name="area">' + opt(['Recepción', 'Mucamas'], ui.area) + '</select></label><button class="btn">Agregar</button></div></form>' : '');
}

/* ----- Caja chica ----- */
function vCaja() {
  const mov = S.cajaMov.slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.ts - a.ts);
  const saldo = mov.reduce((s, m) => s + (m.tipo === 'Reposición' ? 1 : -1) * (+m.monto || 0), 0);
  if (!ui.cMes) ui.cMes = today().slice(0, 7);
  const delMes = mov.filter((m) => (m.fecha || '').slice(0, 7) === ui.cMes);
  const g = delMes.filter((m) => m.tipo === 'Gasto').reduce((s, m) => s + (+m.monto || 0), 0), r = delMes.filter((m) => m.tipo === 'Reposición').reduce((s, m) => s + (+m.monto || 0), 0);
  const canAdd = isStaff();
  return '<div class="hello no-print"><h1>Caja chica</h1><span class="muted">Gastos y reposiciones con saldo al día.</span></div>' +
    '<div class="grid">' + (canAdd ? '<form class="card no-print" data-g="caja"><h2>Registrar movimiento</h2><div class="seg"><button type="button" class="' + (ui.cTipo !== 'Reposición' ? 'on' : '') + '" data-b="cTipo" data-v="Gasto">Gasto</button><button type="button" class="' + (ui.cTipo === 'Reposición' ? 'on' : '') + '" data-b="cTipo" data-v="Reposición">Reposición</button></div>' +
      '<div class="row"><label>Fecha<input name="fecha" type="date" required value="' + today() + '"></label><label>Monto ($)<input name="monto" type="number" min="0" step="0.01" required inputmode="decimal"></label></div>' +
      '<label>Concepto<input name="concepto" required placeholder="Ej.: lamparitas para el palier del piso 9"></label><label>N.º de comprobante (opcional)<input name="comprobante"></label>' +
      '<button class="btn">Guardar</button><span class="muted">La foto del comprobante se habilita al pasar al plan Blaze.</span></form>' : '') +
    '<div class="card wide"><div class="stats"><div class="stat"><b>' + money(saldo) + '</b><span>saldo actual</span></div><div class="stat"><b>' + money(g) + '</b><span>gastos del mes</span></div><div class="stat"><b>' + money(r) + '</b><span>reposiciones del mes</span></div></div>' +
    '<div class="row no-print" style="align-items:flex-end"><label style="flex:0 1 200px">Mes<input type="month" data-c2="cMes" value="' + ui.cMes + '"></label><button class="btn dark" data-a="print">' + ic('print', 18) + 'Imprimir</button></div>' +
    (delMes.length ? '<div class="scroll"><table><tr><th>Fecha</th><th>Concepto</th><th>Comp.</th><th>Registró</th><th style="text-align:right">Monto</th>' + (isEnc() ? '<th class="no-print"></th>' : '') + '</tr>' + delMes.map((m) => '<tr><td>' + fdate(m.fecha) + '</td><td>' + esc(m.concepto) + ' <span class="tag ' + (m.tipo === 'Reposición' ? 't-ok' : '') + '">' + esc(m.tipo) + '</span></td><td>' + esc(m.comprobante || '') + '</td><td>' + esc(m.quien || '') + '</td><td style="text-align:right;white-space:nowrap">' + (m.tipo === 'Reposición' ? '+ ' : '− ') + money(m.monto) + '</td>' + (isEnc() ? '<td class="no-print"><button class="btn ghost sm" data-b="del" data-col="cajaMov" data-id="' + m.id + '">Borrar</button></td>' : '') + '</tr>').join('') + '</table></div>' : '<span class="empty">Sin movimientos en este mes.</span>') + '</div></div>';
}

/* ----- Materiales de limpieza ----- */
function vMat() {
  const ms = S.materiales.slice().sort((a, b) => ((+a.stock <= +a.minimo) ? 0 : 1) - ((+b.stock <= +b.minimo) ? 0 : 1) || a.nombre.localeCompare(b.nombre));
  const movs = S.matMov.slice().sort((a, b) => b.ts - a.ts).slice(0, 15);
  return '<div class="hello"><h1>Materiales y productos de limpieza</h1><span class="muted">' + count(ms, (m) => +m.stock <= +m.minimo) + ' para reponer.</span></div>' +
    '<div class="grid"><div class="card wide"><h2>Stock</h2>' + (ms.length ? ms.map((m) => { const low = +m.stock <= +m.minimo;
      return '<div class="item"><div class="item-h"><span class="item-t">' + esc(m.nombre) + '</span><span class="tag ' + (low ? 't-bad' : 't-ok') + '">' + (low ? 'Reponer' : 'OK') + '</span></div><span><b class="big-n">' + (+m.stock || 0) + '</b> ' + esc(m.unidad || '') + ' <span class="muted">· mínimo ' + (+m.minimo || 0) + '</span></span>' +
        '<div class="row"><button class="btn sm" data-b="matMov" data-t="Entrega" data-id="' + m.id + '">Entregar</button><button class="btn ghost sm" data-b="matMov" data-t="Ingreso" data-id="' + m.id + '">Ingreso de compra</button>' + (isEnc() ? '<button class="btn ghost sm" data-b="matEdit" data-id="' + m.id + '">Editar</button><button class="btn danger sm" data-b="del" data-col="materiales" data-id="' + m.id + '">Borrar</button>' : '') + '</div></div>'; }).join('') : '<span class="empty">No hay materiales cargados.</span>') +
    (isEnc() ? '<div><button class="btn ghost sm" data-b="matNew">Agregar material</button></div>' : '') + '</div>' +
    '<div class="card"><h2>Movimientos recientes</h2>' + (movs.length ? movs.map((x) => '<div class="item-h"><span>' + esc(when(x.ts)) + ' · <b>' + esc(x.tipo) + '</b> ' + x.cantidad + ' ' + esc(x.material) + (x.destino ? ' · ' + esc(x.destino) : '') + '</span></div>').join('') : '<span class="empty">Sin movimientos.</span>') + '</div></div>';
}
function matForm(m) {
  m = m || { unidad: 'unidades', stock: 0, minimo: 1 };
  modal('<h2>' + (m.id ? 'Editar' : 'Nuevo') + ' material</h2><label>Producto<input name="nombre" required value="' + esc(m.nombre || '') + '" placeholder="Ej.: Lavandina"></label><div class="row"><label>Unidad<input name="unidad" value="' + esc(m.unidad || '') + '" placeholder="litros, paquetes…"></label><label>Stock actual<input name="stock" type="number" min="0" step="any" value="' + (+m.stock || 0) + '"></label><label>Mínimo<input name="minimo" type="number" min="0" step="any" value="' + (+m.minimo || 0) + '"></label></div><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar</button></div>',
    (fd) => { const d = { nombre: val(fd, 'nombre'), unidad: val(fd, 'unidad'), stock: +fd.get('stock') || 0, minimo: +fd.get('minimo') || 0 };
      return run(() => m.id ? updateDoc(doc(db, 'materiales', m.id), d) : addDoc(collection(db, 'materiales'), { ...d, creado: Date.now() }), 'Material guardado'); });
}

/* ----- Eventos de la Etapa 2 ----- */
document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-g]'); if (!f) return;
  const fd = new FormData(f), g = f.dataset.g;
  const fin = () => { f.reset(); document.activeElement && document.activeElement.blur(); render(); };
  if (g === 'persona') { e.preventDefault(); run(() => addDoc(collection(db, 'personal'), { nombre: val(fd, 'nombre'), area: val(fd, 'area'), activo: true, creado: Date.now() }), 'Persona agregada').then(fin); }
  if (g === 'caja') { e.preventDefault(); const monto = +fd.get('monto'); if (!(monto > 0)) { toast('Ingresá un monto mayor a 0'); return; }
    conNombre(() => run(() => addDoc(collection(db, 'cajaMov'), { tipo: ui.cTipo === 'Reposición' ? 'Reposición' : 'Gasto', fecha: val(fd, 'fecha'), monto, concepto: val(fd, 'concepto'), comprobante: val(fd, 'comprobante'), quien: nombreTurno(), ts: Date.now() }), 'Movimiento guardado').then(fin)); }
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-b]'); if (!b) return; const a = b.dataset.b, id = b.dataset.id;
  const find = (c) => S[c].find((x) => x.id === id);
  if (a === 'gsub') { ui.gsub = b.dataset.v; go(); }
  else if (a === 'provNew') provForm();
  else if (a === 'provEdit') provForm(find('proveedores'));
  else if (a === 'visNew') { const p = find('proveedores'); conNombre(() => modal('<h2>Visita: ' + esc(p.servicio) + '</h2><span class="muted">' + esc(p.nombre) + '</span><label>Fecha<input name="fecha" type="date" required value="' + today() + '"></label><label>Trabajo realizado<input name="trabajo" placeholder="Ej.: mantenimiento mensual, sin novedades"></label><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Registrar</button></div>',
      (fd) => run(() => addDoc(collection(db, 'visitasProv'), { provId: p.id, proveedor: p.servicio + ' · ' + p.nombre, fecha: val(fd, 'fecha'), trabajo: val(fd, 'trabajo'), quien: nombreTurno(), ts: Date.now() }), 'Visita registrada'))); }
  else if (a === 'mucNew') mucForm();
  else if (a === 'mucEdit') mucForm(find('servicioMucama'));
  else if (a === 'mucExtra') { const ms = mucamas(); modal('<h2>Visita puntual · ' + esc(dlabel(ui.mFecha)) + '</h2><div class="row"><label>Apartamento<input name="apto" inputmode="numeric" required></label><label>Hora<input name="hora" type="time" required value="10:00"></label></div><label>Mucama' + (ms.length ? '<select name="mucama">' + opt([''].concat(ms), '') + '</select>' : '<input name="mucama">') + '</label><label>Notas<input name="notas"></label><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Agregar</button></div>',
      (fd) => { const ap = val(fd, 'apto'); if (!validApto(ap)) { toast('Apartamento inválido (del 107 al 1712)'); return false; }
        return run(() => addDoc(collection(db, 'agendaMucama'), { fecha: ui.mFecha, apto: ap, hora: val(fd, 'hora'), mucama: val(fd, 'mucama'), notas: val(fd, 'notas'), creado: Date.now() }), 'Visita agregada'); }); }
  else if (a === 'mucTick') { const hId = b.dataset.h;
    if (hId) run(() => deleteDoc(doc(db, 'mucamaHechos', hId)), 'Desmarcado');
    else conNombre(() => run(() => addDoc(collection(db, 'mucamaHechos'), { fecha: ui.mFecha, key: b.dataset.k, apto: b.dataset.apto, quien: nombreTurno(), ts: Date.now() }), 'Servicio marcado como hecho')); }
  else if (a === 'area') { ui.area = b.dataset.v; render(); }
  else if (a === 'semana') { ui.semana = addTo(ui.semana || lunes(today()), +b.dataset.v); render(); }
  else if (a === 'tCell') { const p = S.personal.find((x) => x.id === b.dataset.p), f = b.dataset.f; const docId = p.id + '_' + f; const cur = (S.turnosPersonal.find((x) => x.id === docId) || {}).valor || '';
    modal('<h2>' + esc(p.nombre) + ' · ' + esc(dlabel(f)) + '</h2><div class="pills">' + TURNO_OPC[p.area].map((o) => '<button type="button" class="pill' + (cur === o ? ' on' : '') + '" data-b="tPick" data-v="' + esc(o) + '">' + esc(o) + '</button>').join('') + '</div>' +
      '<label>Otro horario o detalle<input name="valor" value="' + esc(cur) + '" placeholder="Ej.: 8 a 16, cubre a otro compañero"></label><div class="row"><button type="button" class="btn ghost" data-b="tClear">Dejar vacío</button><button class="btn">Guardar</button></div>',
      (fd) => { const v = val(fd, 'valor'); return run(() => v ? setDoc(doc(db, 'turnosPersonal', docId), { personaId: p.id, persona: p.nombre, area: p.area, fecha: f, valor: v, ts: Date.now() }) : deleteDoc(doc(db, 'turnosPersonal', docId)), 'Turno guardado'); }); }
  else if (a === 'tPick') { const i = document.querySelector('#mform [name=valor]'); if (i) { i.value = b.dataset.v; document.getElementById('mform').requestSubmit(); } }
  else if (a === 'tClear') { const i = document.querySelector('#mform [name=valor]'); if (i) { i.value = ''; document.getElementById('mform').requestSubmit(); } }
  else if (a === 'cTipo') { ui.cTipo = b.dataset.v; b.parentNode.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); }
  else if (a === 'matNew') matForm();
  else if (a === 'matEdit') matForm(find('materiales'));
  else if (a === 'matMov') { const m = find('materiales'), t = b.dataset.t; conNombre(() => modal('<h2>' + (t === 'Entrega' ? 'Entregar' : 'Ingreso de compra') + ': ' + esc(m.nombre) + '</h2><span class="muted">Stock actual: ' + (+m.stock || 0) + ' ' + esc(m.unidad || '') + '</span><label>Cantidad<input name="cantidad" type="number" min="0" step="any" required></label><label>' + (t === 'Entrega' ? 'Para quién o dónde' : 'Proveedor o compra') + '<input name="destino" placeholder="' + (t === 'Entrega' ? 'Ej.: Mucama 1, limpieza del hall' : 'Ej.: compra en supermercado') + '"></label><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar</button></div>',
      (fd) => { const q = +fd.get('cantidad'); if (!(q > 0)) { toast('Ingresá una cantidad mayor a 0'); return false; }
        if (t === 'Entrega' && q > (+m.stock || 0)) { toast('No hay stock suficiente'); return false; }
        return run(async () => { await updateDoc(doc(db, 'materiales', m.id), { stock: increment(t === 'Entrega' ? -q : q) }); await addDoc(collection(db, 'matMov'), { materialId: m.id, material: m.nombre, tipo: t, cantidad: q, destino: val(fd, 'destino'), quien: nombreTurno(), ts: Date.now() }); }, t === 'Entrega' ? 'Entrega registrada' : 'Ingreso registrado'); })); }
});

VIEWS.caja = () => vCaja();

/* ---------------- Ayuda / instrucciones ---------------- */
const steps = (arr) => '<ol class="steps">' + arr.map((x) => '<li>' + x + '</li>').join('') + '</ol>';
const sec = (title, body, open) => '<details class="help"' + (open ? ' open' : '') + '><summary>' + title + '</summary><div class="help-b">' + body + '</div></details>';
const HELP_LOGIN = steps([
  'Elegí quién sos: <b>Vecino</b>, <b>Portero</b>, <b>Encargado</b> o <b>Comisión</b>.',
  'Si sos vecino, escribí el <b>número de tu apartamento</b> tal como figura en la puerta (del 107 al 1712).',
  'Escribí el <b>código</b> que te dio la comisión o portería y tocá <b>Ingresar</b>.',
  'La app recuerda tu ingreso: la próxima vez entrás directo.'
]);
const HELP_INSTALAR = sec('Instalar la app en el celular',
  '<p><b>iPhone (Safari):</b></p>' + steps(['Abrí el link de la app en Safari.', 'Tocá el botón <b>Compartir</b> (cuadrado con flecha hacia arriba).', 'Elegí <b>Agregar a pantalla de inicio</b> y tocá <b>Agregar</b>.']) +
  '<p><b>Android (Chrome):</b></p>' + steps(['Abrí el link de la app en Chrome.', 'Tocá el menú <b>⋮</b> arriba a la derecha.', 'Elegí <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.']) +
  '<p class="muted">Queda un ícono como cualquier app. No hace falta descargar nada de las tiendas.</p>');
const HELP_COMUN = [
  sec('Cambiar colores o modo noche', steps(['Tocá el botón de la <b>paleta</b> arriba a la derecha.', 'En <b>Modo</b> elegí Automático (sigue al celular), Día o Noche.', 'En <b>Color</b> elegí el que más te guste. Se guarda en este celular.'])),
  sec('Anotar una observación (durante la prueba)', steps(['Tocá el botón naranja <b>Anotar observación</b>, abajo a la derecha.', 'Escribí qué te pareció, qué no se entiende o qué falta.', 'Tocá <b>Guardar</b>. Queda registrada con la pantalla en la que estabas.'])),
  sec('Salir', '<p>Tocá <b>Salir</b> arriba a la derecha y confirmá. Para volver a entrar necesitás el código.</p>'),
  sec('Algo no funciona', '<ul class="steps"><li><b>"Código incorrecto":</b> revisá mayúsculas y minúsculas.</li><li><b>"Ese número de apartamento no existe":</b> los apartamentos van del 07 al 12 en cada piso (ej.: 507, 1212).</li><li><b>No veo un cambio:</b> los datos se actualizan solos; si no, cerrá y volvé a abrir la app.</li><li><b>Sin conexión:</b> la app necesita internet para guardar.</li></ul><p>Ante cualquier duda, consultá en portería: <b>' + esc(TEL) + '</b>.</p>')
];
const HELP = {
  vecino: () => [
    sec('Inicio: lo importante del día', '<p>Arriba ves los <b>avisos de portería</b> (paquetes, visitas, delivery). Cuando retires un paquete, tocá <b>Ya lo retiré</b> para que portería lo sepa.</p><p>También ves tus próximas reservas y el último comunicado de la comisión.</p>', true),
    sec('Reservar gimnasio, cowork, sauna o masajes', steps(['Andá a <b>Reservas</b>.', 'Elegí <b>Gimnasio</b>, <b>Cowork</b>, <b>Sauna</b> o <b>Sala de masajes</b>.', 'Elegí el <b>día</b> (hasta 7 días adelante).', 'Tocá un <b>horario libre</b> y confirmá. Cada turno dura 1 hora.', 'Para cancelar, tocá tu reserva (en color) o usá <b>Cancelar</b> en "Mis reservas".']) + '<p class="muted">Los turnos en gris están completos o ya pasaron. Leé las normas de uso que aparecen debajo de los horarios.</p>'),
    sec('Hacer un pedido a portería', steps(['Andá a <b>Portería</b>.', 'Elegí el tipo: autorizar una visita, avisar una llegada o salida, reportar un problema u otro.', 'Escribí el detalle (quién, cuándo, dónde) y tocá <b>Enviar a portería</b>.', 'En "Mis pedidos" seguís el estado: <b>Pendiente</b>, <b>En curso</b> o <b>Atendido</b>, y las notas que te deje portería.']) + '<p class="muted">De 22 a 6 hay un solo portero: lo que no es urgente se atiende a la mañana. Para urgencias, llamá a recepción.</p>'),
    sec('Registrar ocupantes de temporada', steps(['Andá a <b>Ocupantes</b>.', 'Elegí <b>Familia</b> o <b>Inquilinos</b>.', 'Completá responsable, teléfono con código de país (+598 o +54), cantidad de personas y fechas.', 'Tocá <b>Registrar</b>. Portería lo ve al instante.']) + '<p class="muted">Si cambian los planes, tocá <b>Quitar</b>. Al terminar la estadía el registro deja de mostrarse.</p>'),
    sec('Leer los comunicados', '<p>En <b>Comunicados</b> están los avisos oficiales de la comisión (normas, mantenimiento, convivencia). No admiten comentarios: para consultas, escribí a portería.</p>'),
    HELP_INSTALAR
  ],
  portero: () => [
    sec('Panel: atender pedidos', steps(['En <b>Panel</b> ves los pedidos pendientes, del más viejo al más nuevo.', 'Tocá <b>Tomar (en curso)</b> cuando empieces a ocuparte.', 'Con <b>Agregar nota</b> le dejás un mensaje al vecino (ej.: "Se llamó al sanitario").', 'Cuando esté resuelto, tocá <b>Marcar atendido</b>. El vecino lo ve en su app.']), true),
    sec('Avisar a un vecino (paquete, visita, delivery)', steps(['En <b>Registrar</b>, dejá elegido <b>Aviso al vecino</b>.', 'Escribí el número de apartamento.', 'Elegí el tipo de aviso y, si querés, un detalle (ej.: "caja grande en el depósito").', 'Tocá <b>Enviar aviso</b>. Los paquetes quedan "Para retirar" hasta que el vecino confirme.'])),
    sec('Cargar un pedido que llega por teléfono', steps(['En <b>Registrar</b>, elegí <b>Pedido por teléfono</b>.', 'Escribí el apartamento, elegí el tipo y anotá el detalle.', 'Tocá <b>Registrar pedido</b>. Queda en pendientes para vos o el turno siguiente.'])),
    sec('Registrar novedades del turno', steps(['Andá a <b>Novedades</b>.', 'Escribí qué pasó, elegí el tipo (incidente, rotura, visita/proveedor, otro) y el estado.', 'Tocá <b>Guardar novedad</b>.', 'Cuando cambie la situación, actualizá el estado desde la lista: <b>Abierta</b>, <b>En curso</b> o <b>Resuelta</b>.']) + '<p class="muted">Adjuntar videos se habilita en la próxima etapa.</p>'),
    sec('Apartamentos y su ficha', '<p>En <b>Apartamentos</b> ves la torre piso por piso: ocupados, vacíos y sin dato. Podés buscar por apartamento, nombre o matrícula.</p>' + steps(['Tocá un apartamento para abrir su <b>ficha</b>.', 'Ahí están el estado, los residentes, los vehículos, las autorizaciones y el <b>historial</b> (novedades, pedidos, avisos e ingresos).', 'El encargado y recepción cargan y corrigen residentes y vehículos; portería los consulta.'])),
    sec('Autorizaciones de ingreso', steps(['Andá a <b>Autorizaciones</b> o a la ficha del apartamento y tocá <b>Nueva autorización</b> o <b>Agregar</b>.', 'Indicá apartamento, nombre, tipo (inmobiliaria, inquilino, proveedor, visita) y fechas. Para una visita puntual, marcá <b>una sola vez</b>.', 'Cuando la persona llega, buscala y, si es de una sola vez, tocá <b>Registrar ingreso</b>.', 'Las autorizaciones vencidas o usadas pasan solas a inactivas. Con <b>Dar de baja</b> la cortás antes.'])),
    sec('Vehículos para seguridad del complejo', '<p>En <b>Vehículos</b> está el listado de matrículas vigentes. Con <b>Copiar listado para seguridad</b> lo pegás en un WhatsApp o mail a seguridad; incluye las altas y bajas de los últimos 7 días.</p><p>Los vehículos se cargan desde la ficha del apartamento: el del propietario queda permanente, el del inquilino con fecha de baja.</p>'),
    sec('Tareas del turno', steps(['Andá a <b>Tareas</b>. Se abre el turno actual (Mañana 6 a 14, Tarde 14 a 22, Noche 22 a 6).', 'La primera vez, indicá <b>quién está de turno</b>.', 'Al terminar cada tarea, tocá su casilla; podés agregar un comentario (ej.: "tanque 2 al 60 %").', 'Si te equivocaste, tocá de nuevo la casilla para desmarcarla.']) + '<p class="muted">Las tareas semanales o quincenales (generador, cambio de bomba) aparecen solo cuando toca.</p>'),
    sec('Control de llaves', steps(['Andá a <b>Llaves</b>.', 'Para entregar una llave, tocá <b>Prestar</b> e indicá quién se la lleva y para qué.', 'Cuando la devuelven, tocá <b>Registrar devolución</b>.', 'Al cerrar el turno, tocá <b>Control de inventario</b>, marcá las llaves que están en el tablero y guardá: la app indica si falta alguna.'])),
    sec('Gestión: proveedores de servicio', steps(['Andá a <b>Gestión → Proveedores</b>.', 'Cada servicio (ascensores, generador, perfumadores, gimnasio…) muestra la última visita y cuándo toca la próxima. En rojo, las vencidas.', 'Cuando viene el técnico, tocá <b>Registrar visita</b> y anotá el trabajo realizado.', 'El encargado y recepción agregan o editan proveedores y su periodicidad.'])),
    sec('Gestión: mucamas', steps(['Andá a <b>Gestión → Mucamas</b> y elegí el día.', 'La agenda junta los servicios contratados (por días y hora) y las visitas puntuales.', 'Tocá <b>Imprimir agenda</b> para darle la planilla a las mucamas, o marcá cada servicio como hecho en la app.', 'El encargado y recepción cargan qué apartamentos tienen el servicio.'])),
    sec('Gestión: turnos del personal', '<p>En <b>Gestión → Turnos del personal</b> ves la planilla semanal de recepción y de mucamas por separado. El encargado toca cada celda para asignar turno, día libre, licencia u otro horario, y agrega o quita personas. Se puede imprimir.</p>'),
    sec('Gestión: caja chica', steps(['Andá a <b>Gestión → Caja chica</b>.', 'Elegí <b>Gasto</b> o <b>Reposición</b>, completá fecha, monto, concepto y número de comprobante, y tocá <b>Guardar</b>.', 'Arriba ves el saldo actual y los totales del mes; podés imprimir el detalle del mes.']) + '<p class="muted">La comisión puede consultar la caja chica. Solo el encargado borra movimientos.</p>'),
    sec('Gestión: materiales de limpieza', steps(['Andá a <b>Gestión → Materiales</b>.', 'Al entregar productos, tocá <b>Entregar</b> e indicá cantidad y para quién.', 'Cuando llega una compra, tocá <b>Ingreso de compra</b>.', 'Los productos que bajan del mínimo aparecen primero, marcados <b>Reponer</b>.'])),
    sec('Reservas', '<p>En <b>Reservas</b> ves todas las próximas reservas del gimnasio, el cowork, la sauna y la sala de masajes, y podés cancelar una si el vecino lo pide.</p>'),
    HELP_INSTALAR
  ],
  encargado: () => HELP.portero().concat([
    sec('Administrar tareas y llaves (solo encargado)', '<p>En <b>Tareas</b>, abajo, está <b>Administrar tareas</b>: agregá, editá, pausá o borrá tareas, con su turno, frecuencia y cuántas veces por turno. En <b>Llaves</b> agregás o quitás llaves del tablero.</p>'),
    sec('Bitácora diaria (solo encargado)', steps(['Andá a <b>Bitácora diaria</b>.', 'Elegí el <b>día</b>.', 'Revisá el resumen: novedades, pedidos, avisos, reservas, tareas hechas, ingresos y movimientos de llaves.', 'Tocá <b>Imprimir o guardar PDF</b>. En el celular, elegí "Guardar como PDF" o compartir.'])),
    sec('Observaciones y datos de prueba', '<p>En <b>Observaciones</b> ves todo lo que anotaron quienes probaron la app; con <b>Copiar todas</b> las pasás por WhatsApp o mail.</p><p>En <b>Datos de prueba</b> podés cargar los datos de ejemplo o borrar todo para empezar de cero.</p>')
  ]),
  recepcion: () => HELP.portero(),
  comision: () => [
    sec('Publicar un comunicado', steps(['Andá a <b>Comunicados</b>.', 'Escribí el título, elegí la etiqueta (Importante, Mantenimiento, Convivencia o General) y el texto.', 'Tocá <b>Publicar</b>. Lo ven todos los vecinos, también los inquilinos de temporada.', 'Para quitarlo, tocá <b>Eliminar</b>.']) + '<p class="muted">Los comunicados no admiten comentarios.</p>', true),
    sec('Ver las novedades de portería', '<p>En <b>Novedades</b> ves lo que registra portería en cada turno y su estado. Es solo lectura.</p>'),
    sec('Consultar la caja chica', '<p>En <b>Caja chica</b> ves el saldo, los gastos y las reposiciones de cada mes, con quién registró cada movimiento. Es solo lectura.</p>'),
    sec('Observaciones de la prueba', '<p>En <b>Observaciones</b> ves lo que anotaron quienes probaron la app.</p>'),
    HELP_INSTALAR
  ]
};
VIEWS.ayuda = () => '<div class="hello"><h1>Cómo usar la app</h1><span class="muted">Instrucciones para ' + esc(ROLES[who.rol].toLowerCase()) + '. Tocá cada tema para abrirlo.</span></div><div class="help-list">' + HELP[who.rol]().concat(HELP_COMUN).join('') + '</div>';

/* ---------------- Apariencia (colores y modo noche) ---------------- */
const THEMES = [['mar', 'Verde mar', '#0F6E6E'], ['azul', 'Azul', '#1F5FA8'], ['terracota', 'Terracota', '#B04A22'], ['violeta', 'Violeta', '#6B46A8'], ['oliva', 'Oliva', '#3F7A2E']];
function getLook() { let m = 'auto', t = 'mar'; try { m = localStorage.getItem('tj-mode') || 'auto'; t = localStorage.getItem('tj-theme') || 'mar'; } catch (_) {} return { m, t }; }
function applyLook() {
  const { m, t } = getLook(); const dark = m === 'dark' || (m === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.mode = dark ? 'dark' : 'light'; document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.content = dark ? '#0B1015' : '#1B2733';
}
function setLook(m, t) { try { if (m) localStorage.setItem('tj-mode', m); if (t) localStorage.setItem('tj-theme', t); } catch (_) {} applyLook(); }
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyLook);
applyLook();
function lookModal() {
  const { m, t } = getLook();
  modal('<h2>Apariencia</h2><span class="muted">Se guarda en este dispositivo.</span><h3 style="font-size:15px">Modo</h3><div class="seg seg3">' +
    [['auto', 'Automático'], ['light', 'Día'], ['dark', 'Noche']].map((x) => '<button type="button" class="' + (m === x[0] ? 'on' : '') + '" data-a="lookMode" data-v="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' +
    '<span class="muted">Automático sigue el modo día/noche del celular.</span><h3 style="font-size:15px">Color</h3><div class="swatches">' +
    THEMES.map((x) => '<button type="button" class="sw-wrap" data-a="lookTheme" data-v="' + x[0] + '"><span class="sw' + (t === x[0] ? ' on' : '') + '" style="background:' + x[2] + '">' + (t === x[0] ? '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>' : '') + '</span>' + x[1] + '</button>').join('') + '</div>' +
    '<button class="btn">Listo</button>', () => {});
}

/* ---------------- Render ---------------- */
function render() {
  const app = document.getElementById('app');
  app.innerHTML = who ? vShell() : vLogin();
  app.querySelectorAll('video[data-path]').forEach(async (v) => {
    const p = v.dataset.path;
    try { if (!videoUrls[p]) { const { m, s } = await storage(); videoUrls[p] = await m.getDownloadURL(m.ref(s, p)); } v.src = videoUrls[p]; }
    catch (e) { v.replaceWith(Object.assign(document.createElement('span'), { className: 'muted', textContent: 'No se pudo cargar el video.' })); }
  });
}
const go = () => { render(); window.scrollTo(0, 0); };

/* ---------------- Datos de ejemplo ---------------- */
function seedDocs() {
  const t0 = ymd(addDays(0)), t1 = ymd(addDays(1)), t2 = ymd(addDays(2));
  const ago = (min) => Date.now() - min * 60000;
  const R = (espacio, fecha, hora, apto) => ({ espacio, fecha, hora, apto, creado: Date.now(), ejemplo: true });
  return {
    reservas: [R('gym', t0, '08:00', '307'), R('gym', t0, '08:00', '1609'), R('cowork', t0, '10:00', '1110'), R('gym', t0, '18:00', '708'), R('gym', t1, '08:00', '1207'), R('gym', t1, '19:00', '208'), R('gym', t1, '19:00', '410'), R('gym', t1, '19:00', '911'), R('gym', t1, '19:00', '1508'), R('cowork', t2, '09:00', '1712')],
    pedidos: [
      { apto: '1207', tipo: 'Autorizar visita', detalle: 'Llega mi hija con dos nietos a las 16 h.', origen: 'App', estado: 'Pendiente', nota: '', creado: ago(12), ejemplo: true },
      { apto: '708', tipo: 'Reportar un problema', detalle: 'Pérdida de agua en el palier del piso 7.', origen: 'Teléfono', estado: 'En curso', nota: 'Se avisó al sanitario.', creado: ago(40), ejemplo: true },
      { apto: '1508', tipo: 'Aviso de llegada o salida', detalle: 'Los inquilinos se van el lunes a las 10 h; dejan llaves en recepción.', origen: 'App', estado: 'Pendiente', nota: '', creado: ago(75), ejemplo: true },
      { apto: '1207', tipo: 'Reportar un problema', detalle: 'La luz del palier del piso 12 no prende.', origen: 'App', estado: 'Atendido', nota: 'Se cambió la lámpara.', creado: ago(60 * 26), atendido: ago(60 * 25), ejemplo: true }
    ],
    avisos: [
      { apto: '1207', tipo: 'Paquete', detalle: 'Caja mediana, en el depósito de recepción.', estado: 'Para retirar', creado: ago(95), ejemplo: true },
      { apto: '911', tipo: 'Delivery', detalle: '', estado: 'Informado', creado: ago(180), ejemplo: true }
    ],
    ocupantes: [
      { apto: '410', tipo: 'Inquilinos', responsable: 'Inquilino de ejemplo', tel: '+54 9 341 000 0000', personas: 4, desde: ymd(addDays(-3)), hasta: ymd(addDays(5)), creado: Date.now(), ejemplo: true },
      { apto: '909', tipo: 'Familia', responsable: 'Familia del propietario (ejemplo)', tel: '+54 11 0000 0000', personas: 6, desde: ymd(addDays(-1)), hasta: ymd(addDays(12)), creado: Date.now(), ejemplo: true },
      { apto: '1207', tipo: 'Familia', responsable: 'Hija del propietario (ejemplo)', tel: '+598 99 000 000', personas: 3, desde: ymd(addDays(40)), hasta: ymd(addDays(55)), creado: Date.now(), ejemplo: true }
    ],
    comunicados: [
      { titulo: 'Normas del gimnasio y del cowork para el verano', texto: 'Desde diciembre, el gimnasio y el cowork se reservan por la app o en recepción. Los menores usan el gimnasio acompañados por un adulto.', etiqueta: 'Importante', fecha: ymd(addDays(-2)), creado: Date.now(), ejemplo: true },
      { titulo: 'Revisión de ascensores', texto: 'El [DÍA] de [HORA] a [HORA] funcionará un ascensor por vez. Gracias por la paciencia.', etiqueta: 'Mantenimiento', fecha: ymd(addDays(-9)), creado: Date.now(), ejemplo: true }
    ],
    novedades: [
      { titulo: 'Ingreso de proveedor de limpieza de vidrios', detalle: 'Trabajó en pisos 1 a 5 de 8 a 11 h.', tipo: 'Visita / proveedor', estado: 'Resuelta', autor: 'Portero', videos: [], creado: ago(300), ejemplo: true },
      { apto: '708', titulo: 'Pérdida de agua en palier del piso 7', detalle: 'Avisó el apto 708 por teléfono.', tipo: 'Rotura', estado: 'Abierta', autor: 'Portero', videos: [], creado: ago(40), ejemplo: true }
    ]
  };
}
function seedEtapa1() {
  const E = { ejemplo: true, creado: Date.now() }, d = (n) => ymd(addDays(n));
  return {
    unidades: [
      { id: '1207', apto: '1207', estado: 'Ocupada', ingreso: d(-20), notas: 'Propietarios todo el año.' }, { id: '708', apto: '708', estado: 'Ocupada', ingreso: '', notas: '' },
      { id: '410', apto: '410', estado: 'Ocupada', ingreso: d(-3), notas: 'Alquiler de temporada (inmobiliaria).' }, { id: '909', apto: '909', estado: 'Ocupada', ingreso: d(-1), notas: '' },
      { id: '307', apto: '307', estado: 'Ocupada', ingreso: '', notas: '' }, { id: '1508', apto: '1508', estado: 'Vacía', ingreso: d(5), notas: 'Llegan inquilinos; llave en recepción.' },
      { id: '1110', apto: '1110', estado: 'Vacía', ingreso: '', notas: '' }, { id: '1712', apto: '1712', estado: 'Vacía', ingreso: d(30), notas: '' }
    ].map((x) => ({ ...x, actualizado: Date.now(), ejemplo: true })),
    residentes: [
      { apto: '1207', tipo: 'Propietario', nombre: 'Ana', apellido: 'Ejemplo', tel: '+598 99 000 001', email: 'ana@ejemplo.com', nacimiento: '1958-11-25', desde: '', hasta: '', consentimiento: true },
      { apto: '1207', tipo: 'Familiar', nombre: 'Luis', apellido: 'Ejemplo', tel: '+598 99 000 002', email: '', nacimiento: '1956-03-14', desde: '', hasta: '', consentimiento: true },
      { apto: '410', tipo: 'Inquilino', nombre: 'Martín', apellido: 'Prueba', tel: '+54 9 341 000 0000', email: 'martin@ejemplo.com', nacimiento: '', desde: d(-3), hasta: d(5), consentimiento: true },
      { apto: '708', tipo: 'Propietario', nombre: 'Carlos', apellido: 'Muestra', tel: '+54 11 0000 0000', email: '', nacimiento: '', desde: '', hasta: '', consentimiento: true }
    ].map((x) => ({ ...x, ...E })),
    vehiculos: [
      { apto: '1207', tipo: 'Propietario', titular: 'Ana Ejemplo', marca: 'Toyota', modelo: 'Corolla', color: 'Gris', matricula: 'SBA 1234', alta: d(-200), baja: '' },
      { apto: '410', tipo: 'Inquilino', titular: 'Martín Prueba', marca: 'Volkswagen', modelo: 'Amarok', color: 'Blanca', matricula: 'AB 123 CD', alta: d(-3), baja: d(5) },
      { apto: '708', tipo: 'Propietario', titular: 'Carlos Muestra', marca: 'Renault', modelo: 'Kwid', color: 'Rojo', matricula: 'MAA 5678', alta: d(-2), baja: '' }
    ].map((x) => ({ ...x, ...E })),
    autorizaciones: [
      { apto: '1508', nombre: 'Inmobiliaria del Este (ejemplo)', documento: '', tipo: 'Inmobiliaria', unaVez: false, desde: d(-10), hasta: d(20), notas: 'Puede retirar la llave para mostrar el apartamento.', usada: null },
      { apto: '1207', nombre: 'Técnico de aire acondicionado', documento: '', tipo: 'Proveedor', unaVez: true, desde: d(0), hasta: d(0), notas: 'Autorizó Ana por la app.', usada: null },
      { apto: '909', nombre: 'Hijos del propietario', documento: '', tipo: 'Visita', unaVez: false, desde: d(-1), hasta: d(12), notas: '', usada: null },
      { apto: '708', nombre: 'Pintor (ejemplo)', documento: '', tipo: 'Proveedor', unaVez: false, desde: d(-15), hasta: d(-2), notas: '', usada: null }
    ].map((x) => ({ ...x, ...E, autor: 'Encargado de portería' })),
    tareas: [
      ['Control de nivel de agua de tanques', 'Todos', 'Cada turno', 1], ['Recorrida: puertas abiertas, lámparas quemadas, cosas fuera de lugar', 'Todos', 'Cada turno', 2],
      ['Orden en áreas comunes', 'Todos', 'Cada turno', 1], ['Barrido de entradas y accesos', '0', 'Diaria', 1], ['Retiro de la basura', '1', 'Diaria', 1],
      ['Encendido de prueba del generador', '0', 'Semanal', 1], ['Cambio de bomba de alimentación de tanques (alternar bomba 1 y 2)', '0', 'Quincenal', 1]
    ].map((x, k) => ({ nombre: x[0], detalle: '', turno: x[1], frecuencia: x[2], veces: x[3], activa: true, orden: k + 1, ...E })),
    llaves: ['Gimnasio', 'Cowork', 'Sauna', 'Sala de masajes', 'Azotea', 'Sala de máquinas', 'Tablero eléctrico', 'Depósito', 'Apto 1508 (inmobiliaria)', 'Apto 1207 (copia)']
      .map((n) => ({ nombre: n, estado: n === 'Azotea' ? 'Prestada' : 'En recepción', prestadaA: n === 'Azotea' ? 'Técnico de antenas' : '', motivo: n === 'Azotea' ? 'Revisión de antena' : '', desde: n === 'Azotea' ? Date.now() - 3600000 : null, entrego: n === 'Azotea' ? 'Portero (ejemplo)' : '', ...E }))
  };
}
function seedEtapa2() {
  const E = { ejemplo: true, creado: Date.now() }, d = (n) => ymd(addDays(n));
  const pers = [['p1', 'Portero 1 (ejemplo)', 'Recepción'], ['p2', 'Portero 2 (ejemplo)', 'Recepción'], ['p3', 'Portero 3 (ejemplo)', 'Recepción'], ['p4', 'Portero noche (ejemplo)', 'Recepción'], ['p5', 'Encargado (ejemplo)', 'Recepción'], ['m1', 'Mucama 1 (ejemplo)', 'Mucamas'], ['m2', 'Mucama 2 (ejemplo)', 'Mucamas']];
  const lun = lunes(today()); const tp = [];
  const plan = { p1: ['Mañana 6–14', 'Mañana 6–14', 'Mañana 6–14', 'Mañana 6–14', 'Mañana 6–14', 'Libre', 'Libre'], p2: ['Mañana 6–14', 'Mañana 6–14', 'Libre', 'Libre', 'Mañana 6–14', 'Mañana 6–14', 'Mañana 6–14'],
    p3: ['Tarde 14–22', 'Tarde 14–22', 'Tarde 14–22', 'Tarde 14–22', 'Libre', 'Libre', 'Tarde 14–22'], p4: ['Noche 22–6', 'Noche 22–6', 'Noche 22–6', 'Libre', 'Libre', 'Noche 22–6', 'Noche 22–6'],
    p5: ['8 a 16', '8 a 16', '8 a 16', '8 a 16', '8 a 16', 'Libre', 'Libre'], m1: ['Mañana', 'Mañana', 'Mañana', 'Mañana', 'Mañana', 'Mañana', 'Libre'], m2: ['Tarde', 'Tarde', 'Licencia', 'Licencia', 'Tarde', 'Libre', 'Tarde'] };
  Object.keys(plan).forEach((pid) => plan[pid].forEach((v, k) => { const f = addTo(lun, k); const pr = pers.find((x) => x[0] === pid); tp.push({ id: pid + '_' + f, personaId: pid, persona: pr[1], area: pr[2], fecha: f, valor: v, ts: Date.now(), ejemplo: true }); }));
  return {
    proveedores: [
      { id: 'pv1', servicio: 'Ascensores', nombre: 'Empresa de ascensores (ejemplo)', telefono: '', periodicidad: 30, notas: 'Mantenimiento mensual por contrato.' },
      { id: 'pv2', servicio: 'Generador', nombre: 'Técnico del generador (ejemplo)', telefono: '', periodicidad: 30, notas: '' },
      { id: 'pv3', servicio: 'Perfumadores', nombre: 'Servicio de aromatización (ejemplo)', telefono: '', periodicidad: 15, notas: '' },
      { id: 'pv4', servicio: 'Mantenimiento del gimnasio', nombre: 'Técnico de equipos (ejemplo)', telefono: '', periodicidad: 60, notas: '' },
      { id: 'pv5', servicio: 'Fumigación', nombre: 'Control de plagas (ejemplo)', telefono: '', periodicidad: 90, notas: '' }
    ].map((x) => ({ ...x, ...E })),
    visitasProv: [['pv1', 'Ascensores', d(-25), 'Mantenimiento mensual, sin novedades'], ['pv1', 'Ascensores', d(-55), 'Cambio de botonera piso 4'], ['pv2', 'Generador', d(-40), 'Prueba de carga'], ['pv3', 'Perfumadores', d(-10), 'Recarga de difusores'], ['pv4', 'Mantenimiento del gimnasio', d(-20), 'Ajuste de cintas'], ['pv5', 'Fumigación', d(-95), 'Fumigación general']]
      .map((x) => ({ provId: x[0], proveedor: x[1], fecha: x[2], trabajo: x[3], quien: 'Portero (ejemplo)', ts: Date.now(), ejemplo: true })),
    personal: pers.map((x) => ({ id: x[0], nombre: x[1], area: x[2], activo: true, ...E })),
    turnosPersonal: tp,
    servicioMucama: [
      { apto: '1207', dias: [1, 3, 5], hora: '10:00', mucama: 'Mucama 1 (ejemplo)', desde: '', hasta: '', notas: 'Cambio de sábanas los viernes', activo: true },
      { apto: '909', dias: [0, 1, 2, 3, 4, 5, 6], hora: '09:00', mucama: 'Mucama 2 (ejemplo)', desde: d(-1), hasta: d(12), notas: 'Temporada', activo: true },
      { apto: '410', dias: [2, 4], hora: '11:00', mucama: 'Mucama 1 (ejemplo)', desde: '', hasta: d(5), notas: '', activo: true }
    ].map((x) => ({ ...x, ...E })),
    cajaMov: [
      { tipo: 'Reposición', fecha: d(-12), monto: 5000, concepto: 'Fondo de caja chica', comprobante: '', quien: 'Encargado (ejemplo)' },
      { tipo: 'Gasto', fecha: d(-8), monto: 850, concepto: 'Lamparitas para palieres', comprobante: '12345', quien: 'Portero (ejemplo)' },
      { tipo: 'Gasto', fecha: d(-3), monto: 1200, concepto: 'Ferretería: silicona y tornillos', comprobante: '6789', quien: 'Portero (ejemplo)' },
      { tipo: 'Gasto', fecha: d(0), monto: 390, concepto: 'Pilas para controles', comprobante: '', quien: 'Portero (ejemplo)' }
    ].map((x) => ({ ...x, ts: Date.now(), ejemplo: true })),
    materiales: [['Lavandina', 'litros', 12, 5], ['Detergente', 'litros', 3, 4], ['Bolsas de residuos', 'paquetes', 20, 10], ['Papel higiénico', 'paquetes', 8, 10], ['Limpiavidrios', 'unidades', 4, 2], ['Desinfectante de pisos', 'litros', 6, 4]]
      .map((x) => ({ nombre: x[0], unidad: x[1], stock: x[2], minimo: x[3], ...E }))
  };
}
async function seed() {
  const data = Object.assign(seedDocs(), seedEtapa1(), seedEtapa2()); let b = writeBatch(db), k = 0;
  for (const c of Object.keys(data)) for (const d of data[c]) {
    const { id, ...rest } = d; b.set(id ? doc(db, c, id) : doc(collection(db, c)), rest);
    if (++k % 400 === 0) { await b.commit(); b = writeBatch(db); }
  }
  await b.commit();
}
async function wipe() {
  for (const c of ['reservas', 'pedidos', 'avisos', 'ocupantes', 'comunicados', 'novedades', 'unidades', 'residentes', 'vehiculos', 'autorizaciones', 'tareas', 'tareasHechas', 'llaves', 'llavesMov', 'llavesControl', 'proveedores', 'visitasProv', 'servicioMucama', 'agendaMucama', 'mucamaHechos', 'personal', 'turnosPersonal', 'cajaMov', 'materiales', 'matMov']) {
    const snap = await getDocs(collection(db, c));
    let b = writeBatch(db), k = 0;
    for (const d of snap.docs) { b.delete(d.ref); if (++k % 400 === 0) { await b.commit(); b = writeBatch(db); } }
    await b.commit();
  }
}

/* ---------------- Eventos ---------------- */
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, id = b.dataset.id;
  if (a === 'loginRol') { ui.loginRol = b.dataset.r; ui.loginErr = ''; render(); }
  else if (a === 'look') { lookModal(); }
  else if (a === 'lookMode') { setLook(b.dataset.v, null); lookModal(); }
  else if (a === 'lookTheme') { setLook(null, b.dataset.v); lookModal(); }
  else if (a === 'logout') { confirmBox('¿Salir de la app?', 'Salir', async () => { await signOut(auth); }); }
  else if (a === 'tab') { ui.tab = b.dataset.t; ui.ficha = null; go(); }
  else if (a === 'space') { ui.space = b.dataset.s; render(); }
  else if (a === 'day') { ui.day = +b.dataset.i; render(); }
  else if (a === 'pick') { ui[b.dataset.k] = b.dataset.v; b.parentNode.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); }
  else if (a === 'regMode') { ui.regMode = b.dataset.m; ui.regKind = (ui.regMode === 'aviso' ? AV_TIPOS : PED_TIPOS)[0]; render(); }
  else if (a === 'slot') {
    const date = ymd(addDays(ui.day)), h = b.dataset.h, sp = SPACES[ui.space];
    const ex = S.reservas.find((r) => r.espacio === ui.space && r.fecha === date && r.hora === h && r.apto === who.apto);
    if (ex) confirmBox('¿Cancelar tu reserva de ' + sp.name.toLowerCase() + ' del ' + dlabel(date) + ' a las ' + h + '?', 'Cancelar reserva', () => run(() => deleteDoc(doc(db, 'reservas', ex.id)), 'Reserva cancelada'));
    else confirmBox('¿Reservar ' + sp.name.toLowerCase() + ' el ' + dlabel(date) + ' a las ' + h + '?', 'Reservar', () => {
      const taken = S.reservas.filter((r) => r.espacio === ui.space && r.fecha === date && r.hora === h).length;
      if (taken >= sp.cap) { toast('Ese turno se acaba de completar'); return; }
      return run(() => addDoc(collection(db, 'reservas'), { espacio: ui.space, fecha: date, hora: h, apto: who.apto, creado: Date.now() }), 'Reserva confirmada. Portería ya la ve.');
    });
  }
  else if (a === 'cancelRes') { const r = S.reservas.find((x) => x.id === id); if (r) confirmBox('¿Cancelar la reserva de ' + SPACES[r.espacio].name.toLowerCase() + ' del ' + dlabel(r.fecha) + ' a las ' + r.hora + (isStaff() ? ' (apto ' + r.apto + ')' : '') + '?', 'Cancelar reserva', () => run(() => deleteDoc(doc(db, 'reservas', id)), 'Reserva cancelada')); }
  else if (a === 'retirado') { run(() => updateDoc(doc(db, 'avisos', id), { estado: 'Retirado' }), 'Listo, portería lo ve como retirado'); }
  else if (a === 'delOc') { confirmBox('¿Quitar este registro de ocupantes?', 'Quitar', () => run(() => deleteDoc(doc(db, 'ocupantes', id)), 'Registro quitado')); }
  else if (a === 'delCom') { confirmBox('¿Eliminar este comunicado?', 'Eliminar', () => run(() => deleteDoc(doc(db, 'comunicados', id)), 'Comunicado eliminado')); }
  else if (a === 'pedEstado') { const est = b.dataset.e; const upd = { estado: est }; if (est === 'Atendido') upd.atendido = Date.now(); run(() => updateDoc(doc(db, 'pedidos', id), upd), est === 'Atendido' ? 'Pedido atendido. El vecino lo ve en su app.' : 'Pedido en curso'); }
  else if (a === 'pedNota') { const p = S.pedidos.find((x) => x.id === id); if (p) modal('<h2>Nota para el apto ' + esc(p.apto) + '</h2><span class="muted">El vecino la ve en su app.</span><label>Nota<textarea name="nota" required>' + esc(p.nota) + '</textarea></label><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar</button></div>', (fd) => run(() => updateDoc(doc(db, 'pedidos', id), { nota: String(fd.get('nota')).trim() }), 'Nota guardada')); }
  else if (a === 'obs') {
    const screen = (tabsFor().find((t) => t[0] === ui.tab) || ['', '—'])[1];
    modal('<h2>Anotar observación</h2><span class="muted">Lo que comente quien prueba la app, sobre la pantalla: ' + esc(screen) + '.</span><label>Observación<textarea name="texto" required placeholder="Ej.: prefiere que los paquetes se avisen también por WhatsApp"></textarea></label><div class="row"><button type="button" class="btn ghost" data-cancel="1">Cancelar</button><button class="btn">Guardar</button></div>',
      (fd) => run(() => addDoc(collection(db, 'observaciones'), { texto: String(fd.get('texto')).trim(), rol: ROLES[who.rol] + (who.apto ? ' ' + who.apto : ''), pantalla: screen, creado: Date.now(), uid: auth.currentUser.uid }), 'Observación guardada'));
  }
  else if (a === 'obsCopy') {
    const txt = 'Observaciones de la prueba – Torre Jefferson\n\n' + S.observaciones.slice().sort((x, y) => x.creado - y.creado).map((x) => '- ' + when(x.creado) + ' | ' + x.rol + ' | ' + x.pantalla + ': ' + x.texto).join('\n');
    try { await navigator.clipboard.writeText(txt); toast('Observaciones copiadas'); } catch (_) { modal('<h2>Copiá el texto</h2><textarea style="min-height:240px" readonly>' + esc(txt) + '</textarea><button class="btn">Cerrar</button>', () => {}); }
  }
  else if (a === 'print') { window.print(); }
  else if (a === 'seed') { ui.busy = true; render(); await run(seed, 'Datos de ejemplo cargados'); ui.busy = false; render(); }
  else if (a === 'wipe') { confirmBox('¿Borrar todos los datos de prueba? No se puede deshacer.', 'Borrar', async () => { ui.busy = true; render(); await run(wipe, 'Datos borrados'); ui.busy = false; render(); }); }
});

document.addEventListener('change', (e) => {
  const c = e.target.dataset.c; if (!c) return;
  if (c === 'novEstado') run(() => updateDoc(doc(db, 'novedades', e.target.dataset.id), { estado: e.target.value }), 'Estado actualizado');
  if (c === 'bitDate') { ui.bitDate = e.target.value || today(); e.target.blur(); render(); }
});

document.addEventListener('submit', async (e) => {
  const f = e.target.closest('form[data-f]'); if (!f) return; e.preventDefault();
  const fd = new FormData(f); const k = f.dataset.f; const btn = f.querySelector('button.btn:not([type=button])');
  const done = () => { f.reset(); document.activeElement && document.activeElement.blur(); pending = false; render(); };
  if (k === 'login') { await doLogin(fd); return; }
  if (btn) btn.disabled = true;
  try {
    if (k === 'pedido') { await addDoc(collection(db, 'pedidos'), { apto: who.apto, tipo: ui.pedKind, detalle: String(fd.get('detalle')).trim(), origen: 'App', estado: 'Pendiente', nota: '', creado: Date.now() }); toast('Enviado. Portería lo ve en su panel.'); }
    else if (k === 'ocupante') {
      if (fd.get('hasta') < fd.get('desde')) { toast('La fecha "hasta" es anterior a "desde"'); if (btn) btn.disabled = false; return; }
      await addDoc(collection(db, 'ocupantes'), { apto: who.apto, tipo: ui.ocKind, responsable: String(fd.get('responsable')).trim(), tel: String(fd.get('tel')).trim(), personas: +fd.get('personas') || 1, desde: fd.get('desde'), hasta: fd.get('hasta'), creado: Date.now() }); toast('Registrado. Portería ya lo ve.');
    }
    else if (k === 'comunicado') { await addDoc(collection(db, 'comunicados'), { titulo: String(fd.get('titulo')).trim(), etiqueta: fd.get('etiqueta'), texto: String(fd.get('texto')).trim(), fecha: today(), creado: Date.now() }); toast('Comunicado publicado'); }
    else if (k === 'registro') {
      const apto = String(fd.get('apto')).trim(); const det = String(fd.get('detalle') || '').trim();
      if (!validApto(apto)) { toast('Apartamento inválido (del 107 al 1712)'); if (btn) btn.disabled = false; return; }
      if (ui.regMode === 'aviso') { await addDoc(collection(db, 'avisos'), { apto, tipo: ui.regKind, detalle: det, estado: ui.regKind === 'Paquete' ? 'Para retirar' : 'Informado', creado: Date.now() }); toast('Aviso enviado al apto ' + apto); }
      else { await addDoc(collection(db, 'pedidos'), { apto, tipo: ui.regKind, detalle: det, origen: 'Teléfono', estado: 'Pendiente', nota: '', creado: Date.now() }); toast('Pedido del apto ' + apto + ' registrado'); }
    }
    else if (k === 'novedad') {
      const napto = String(fd.get('apto') || '').trim();
      if (napto && !validApto(napto)) { toast('Apartamento inválido (del 107 al 1712)'); if (btn) btn.disabled = false; return; }
      const files = CFG.videos ? Array.from((f.querySelector('[name=video]') || {}).files || []) : [];
      if (files.some((x) => x.size > 50 * 1024 * 1024)) { toast('Cada video puede pesar hasta 50 MB'); if (btn) btn.disabled = false; return; }
      const ref0 = doc(collection(db, 'novedades')); const videos = [];
      if (files.length) {
        toast('Subiendo video…'); const { m, s } = await storage();
        for (const fl of files) { const path = 'novedades/' + ref0.id + '/' + Date.now() + '-' + fl.name.replace(/[^\w.\-]/g, '_'); await m.uploadBytes(m.ref(s, path), fl); videos.push({ path, name: fl.name, size: fl.size }); }
      }
      await setDoc(ref0, { apto: napto, titulo: String(fd.get('titulo')).trim(), detalle: String(fd.get('detalle')).trim(), tipo: ui.novKind, estado: fd.get('estado'), autor: ROLES[who.rol], videos, creado: Date.now() });
      toast(videos.length ? 'Novedad guardada con ' + videos.length + ' video(s)' : 'Novedad guardada');
    }
    done();
  } catch (err) { console.error(err); toast('No se pudo guardar: ' + friendly(err)); if (btn) btn.disabled = false; }
});

async function doLogin(fd) {
  const rol = ui.loginRol; const apto = String(fd.get('apto') || '').trim(); const codigo = String(fd.get('codigo') || '');
  if (rol === 'vecino' && !validApto(apto)) { ui.loginErr = 'Ese número de apartamento no existe en la torre (del 107 al 1712: piso + 07 a 12).'; render(); return; }
  const email = emailFor(rol, apto);
  ui.busy = true; ui.loginErr = ''; render();
  try {
    await signInWithEmailAndPassword(auth, email, codigo);
  } catch (err) {
    const c = err.code || '';
    if ((c === 'auth/invalid-credential' || c === 'auth/user-not-found' || c === 'auth/invalid-login-credentials') && codigo === CFG.codigoPrueba) {
      // Primer ingreso de ese usuario: se crea la cuenta con el código común de la prueba.
      try { await createUserWithEmailAndPassword(auth, email, codigo); }
      catch (e2) { ui.loginErr = e2.code === 'auth/email-already-in-use' ? 'Código incorrecto.' : 'No se pudo ingresar: ' + friendly(e2); }
    } else if (c.includes('invalid') || c.includes('wrong-password') || c.includes('user-not-found')) ui.loginErr = 'Código incorrecto.';
    else if (c.includes('operation-not-allowed')) ui.loginErr = 'Falta habilitar "Correo electrónico/contraseña" en Firebase Authentication.';
    else ui.loginErr = 'No se pudo ingresar: ' + friendly(err);
  }
  ui.busy = false; if (!auth.currentUser) render();
}

onAuthStateChanged(auth, (user) => {
  unsubs.forEach((u) => u()); unsubs = [];
  who = user ? whoFromEmail(user.email) : null;
  if (user && !who) { signOut(auth); return; }
  ui.tab = null; ui.loginErr = '';
  if (who) listen();
  go();
});
