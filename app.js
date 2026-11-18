// Torre Jefferson · App (piloto) — Firebase Auth + Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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
  cowork: { name: 'Cowork', cap: 6, rules: 'Horario: [A DEFINIR]. Puestos por turno: 6 (ejemplo). Hablar en voz baja; llamadas fuera de la sala. Dejar el puesto limpio al terminar.' }
};
const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
const ROLES = { vecino: 'Vecino', portero: 'Portero', encargado: 'Encargado de portería', comision: 'Comisión' };
const PED_TIPOS = ['Autorizar visita', 'Aviso de llegada o salida', 'Reportar un problema', 'Otro pedido'];
const AV_TIPOS = ['Paquete', 'Visita en recepción', 'Delivery', 'Otro'];
const NOV_TIPOS = ['Incidente', 'Rotura', 'Visita / proveedor', 'Otro'];
const COLS = ['reservas', 'pedidos', 'avisos', 'ocupantes', 'comunicados', 'novedades', 'observaciones'];

function validApto(a) { const n = parseInt(a, 10); if (!/^\d{3,4}$/.test(a)) return false; const piso = Math.floor(n / 100), u = n % 100; return piso >= 1 && piso <= 17 && u >= 7 && u <= 12; }
function emailFor(rol, apto) { return (rol === 'vecino' ? 'apto' + apto : rol) + '@' + CFG.dominio; }
function whoFromEmail(email) {
  const u = (email || '').split('@')[0];
  if (/^apto\d+$/.test(u)) return { rol: 'vecino', apto: u.slice(4) };
  if (ROLES[u]) return { rol: u, apto: null };
  return null;
}
const isStaff = () => who && (who.rol === 'portero' || who.rol === 'encargado');

/* ---------------- Estado ---------------- */
let who = null;
const S = { reservas: [], pedidos: [], avisos: [], ocupantes: [], comunicados: [], novedades: [], observaciones: [] };
const loaded = new Set();
let unsubs = [];
const ui = { tab: null, space: 'gym', day: 0, regMode: 'aviso', regKind: 'Paquete', pedKind: 'Autorizar visita', bitDate: today(), ocKind: 'Familia', novKind: 'Incidente', loginRol: 'vecino', loginErr: '', busy: false };
const videoUrls = {};

function listen() {
  unsubs.forEach((u) => u()); unsubs = []; loaded.clear();
  COLS.forEach((c) => (S[c] = []));
  const mine = (c) => query(collection(db, c), where('apto', '==', who.apto));
  const all = (c) => collection(db, c);
  let plan = {};
  if (who.rol === 'vecino') plan = { reservas: all('reservas'), pedidos: mine('pedidos'), avisos: mine('avisos'), ocupantes: mine('ocupantes'), comunicados: all('comunicados'), observaciones: all('observaciones') };
  else if (who.rol === 'comision') plan = { comunicados: all('comunicados'), novedades: all('novedades'), observaciones: all('observaciones') };
  else plan = { reservas: all('reservas'), pedidos: all('pedidos'), avisos: all('avisos'), ocupantes: all('ocupantes'), comunicados: all('comunicados'), novedades: all('novedades'), observaciones: all('observaciones') };
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
  const roles = [['vecino', 'Vecino', 'home'], ['portero', 'Portero', 'desk'], ['encargado', 'Encargado', 'shield'], ['comision', 'Comisión', 'mega']];
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
  if (who.rol === 'comision') return [['comunicados', 'Comunicados', 'mega'], ['novedades', 'Novedades', 'video'], ['observaciones', 'Observaciones', 'list', S.observaciones.length], ['ayuda', 'Ayuda', 'help']];
  const p = count(S.pedidos, (x) => x.estado !== 'Atendido'); const n = count(S.novedades, (x) => x.estado !== 'Resuelta');
  const t = [['panel', 'Panel', 'desk', p], ['novedades', 'Novedades', 'video', n], ['reservasP', 'Reservas', 'cal'], ['ocupantesP', 'Ocupantes', 'users']];
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
  return '<div class="grid"><div class="card wide"><h2>Reservar</h2><div class="seg"><button class="' + (ui.space === 'gym' ? 'on' : '') + '" data-a="space" data-s="gym">Gimnasio</button><button class="' + (ui.space === 'cowork' ? 'on' : '') + '" data-a="space" data-s="cowork">Cowork</button></div>' +
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
    '<label>Detalle<textarea name="detalle"></textarea></label><label>Estado<select name="estado"><option>Abierta</option><option>En curso</option><option>Resuelta</option></select></label>' + vidField + '<button class="btn">Guardar novedad</button></form>' : '';
  const seeVideos = who.rol === 'encargado' || who.rol === 'comision';
  return '<div class="grid">' + form + '<div class="card wide"><h2>Novedades</h2>' + (who.rol === 'comision' ? '<span class="muted">Solo lectura.</span>' : '') +
    (list.length ? list.map((n) => '<div class="item"><div class="item-h"><span class="item-t">' + esc(n.titulo) + '</span>' + (canEdit ? '<select aria-label="Estado" data-c="novEstado" data-id="' + n.id + '" style="width:auto;min-height:38px">' + ['Abierta', 'En curso', 'Resuelta'].map((e) => '<option' + (e === n.estado ? ' selected' : '') + '>' + e + '</option>').join('') + '</select>' : estadoTag(n.estado)) + '</div>' +
      (n.detalle ? '<span>' + esc(n.detalle) + '</span>' : '') + '<span class="muted">' + esc(when(n.creado)) + ' · ' + esc(n.autor) + ' · ' + esc(n.tipo) + '</span>' +
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
  const t = (head, rows) => rows.length ? '<table><tr>' + head.map((h) => '<th>' + h + '</th>').join('') + '</tr>' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</table>' : '<p class="empty">Sin registros.</p>';
  return '<div class="sheet"><div class="item-h sheet-top"><div><div class="sheet-kick">Torre Jefferson</div><div style="font-size:20px;font-weight:800">Bitácora de portería</div></div><div style="text-align:right;font-size:13px">' + esc(dlabel(date)) + '<br>Encargado de portería</div></div>' +
    '<div class="stats"><div class="stat"><b>' + nov.length + '</b><span>novedades</span></div><div class="stat"><b>' + count(nov, (n) => n.estado !== 'Resuelta') + '</b><span>sin resolver</span></div><div class="stat"><b>' + ped.length + '</b><span>pedidos de vecinos</span></div><div class="stat"><b>' + av.length + '</b><span>avisos enviados</span></div><div class="stat"><b>' + res.length + '</b><span>reservas</span></div></div>' +
    '<h3>Novedades</h3>' + t(['Hora', 'Novedad', 'Tipo', 'Estado', 'Video'], nov.map((n) => [hhmm(n.creado), n.titulo + (n.detalle ? ' — ' + n.detalle : ''), n.tipo, n.estado, (n.videos || []).length ? 'Sí (' + n.videos.length + ')' : '—'])) +
    '<h3>Pedidos de vecinos</h3>' + t(['Hora', 'Apto', 'Pedido', 'Origen', 'Estado'], ped.map((p) => [hhmm(p.creado), p.apto, p.tipo + ': ' + p.detalle, p.origen, p.estado])) +
    '<h3>Avisos a vecinos</h3>' + t(['Hora', 'Apto', 'Aviso', 'Estado'], av.map((a) => [hhmm(a.creado), a.apto, a.tipo + (a.detalle ? ': ' + a.detalle : ''), a.estado])) +
    '<h3>Reservas</h3>' + t(['Hora', 'Espacio', 'Apto'], res.map((r) => [r.hora, SPACES[r.espacio].name, r.apto])) +
    '<div class="item-h muted" style="font-size:12px;margin-top:16px"><span>Firma del encargado: ______________________</span><span>Generada ' + esc(when(Date.now())) + '</span></div></div>';
}
VIEWS.bitacora = () => '<div class="card no-print" style="margin-bottom:16px"><h2>Bitácora diaria</h2><span class="muted">Solo para el encargado de portería. Resume novedades con su estado, pedidos, avisos y reservas del día.</span><div class="row" style="align-items:flex-end"><label style="flex:0 1 220px">Día<input type="date" data-c="bitDate" value="' + ui.bitDate + '"></label><button class="btn dark" data-a="print">' + ic('print', 18) + 'Imprimir o guardar PDF</button></div></div>' + bitSheet(ui.bitDate);

VIEWS.observaciones = () => {
  const o = S.observaciones.slice().sort(sortTs);
  return '<div class="card"><div class="item-h"><h2>Observaciones de la prueba (' + o.length + ')</h2>' + (o.length ? '<button class="btn ghost sm" data-a="obsCopy">Copiar todas</button>' : '') + '</div>' +
    (o.length ? o.map((x) => '<div class="item"><span class="muted">' + esc(when(x.creado)) + ' · ' + esc(x.rol) + ' · ' + esc(x.pantalla) + '</span><span>' + esc(x.texto) + '</span></div>').join('') : '<span class="empty">Todavía no hay observaciones.</span>') + '</div>';
};

VIEWS.datos = () => {
  const n = COLS.reduce((s, c) => s + S[c].length, 0);
  return '<div class="grid"><div class="card"><h2>Datos de ejemplo</h2><span>Carga reservas, pedidos, avisos, ocupantes, comunicados y novedades de ejemplo para la prueba.</span><span class="muted">Registros actuales: ' + n + '.</span><div><button class="btn" data-a="seed"' + (ui.busy ? ' disabled' : '') + '>Cargar datos de ejemplo</button></div></div>' +
    '<div class="card"><h2>Empezar de cero</h2><span>Borra todos los registros de la prueba (no borra usuarios ni observaciones).</span><div><button class="btn danger" data-a="wipe"' + (ui.busy ? ' disabled' : '') + '>Borrar datos de prueba</button></div></div></div>';
};

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
    sec('Reservar el gimnasio o el cowork', steps(['Andá a <b>Reservas</b>.', 'Elegí <b>Gimnasio</b> o <b>Cowork</b>.', 'Elegí el <b>día</b> (hasta 7 días adelante).', 'Tocá un <b>horario libre</b> y confirmá. Cada turno dura 1 hora.', 'Para cancelar, tocá tu reserva (en color) o usá <b>Cancelar</b> en "Mis reservas".']) + '<p class="muted">Los turnos en gris están completos o ya pasaron. Leé las normas de uso que aparecen debajo de los horarios.</p>'),
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
    sec('Reservas y ocupantes', '<p>En <b>Reservas</b> ves todas las próximas reservas del gimnasio y el cowork, y podés cancelar una si el vecino lo pide.</p><p>En <b>Ocupantes</b> ves quién está hoy en cada apartamento y las próximas llegadas, con teléfono de contacto.</p>'),
    HELP_INSTALAR
  ],
  encargado: () => HELP.portero().concat([
    sec('Bitácora diaria (solo encargado)', steps(['Andá a <b>Bitácora diaria</b>.', 'Elegí el <b>día</b>.', 'Revisá el resumen: novedades con su estado, pedidos, avisos y reservas.', 'Tocá <b>Imprimir o guardar PDF</b>. En el celular, elegí "Guardar como PDF" o compartir.'])),
    sec('Observaciones y datos de prueba', '<p>En <b>Observaciones</b> ves todo lo que anotaron quienes probaron la app; con <b>Copiar todas</b> las pasás por WhatsApp o mail.</p><p>En <b>Datos de prueba</b> podés cargar los datos de ejemplo o borrar todo para empezar de cero.</p>')
  ]),
  comision: () => [
    sec('Publicar un comunicado', steps(['Andá a <b>Comunicados</b>.', 'Escribí el título, elegí la etiqueta (Importante, Mantenimiento, Convivencia o General) y el texto.', 'Tocá <b>Publicar</b>. Lo ven todos los vecinos, también los inquilinos de temporada.', 'Para quitarlo, tocá <b>Eliminar</b>.']) + '<p class="muted">Los comunicados no admiten comentarios.</p>', true),
    sec('Ver las novedades de portería', '<p>En <b>Novedades</b> ves lo que registra portería en cada turno y su estado. Es solo lectura.</p>'),
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
      { titulo: 'Pérdida de agua en palier del piso 7', detalle: 'Avisó el apto 708 por teléfono.', tipo: 'Rotura', estado: 'Abierta', autor: 'Portero', videos: [], creado: ago(40), ejemplo: true }
    ]
  };
}
async function seed() {
  const data = seedDocs(); const b = writeBatch(db);
  Object.keys(data).forEach((c) => data[c].forEach((d) => b.set(doc(collection(db, c)), d)));
  await b.commit();
}
async function wipe() {
  for (const c of ['reservas', 'pedidos', 'avisos', 'ocupantes', 'comunicados', 'novedades']) {
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
  else if (a === 'tab') { ui.tab = b.dataset.t; go(); }
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
      const files = CFG.videos ? Array.from((f.querySelector('[name=video]') || {}).files || []) : [];
      if (files.some((x) => x.size > 50 * 1024 * 1024)) { toast('Cada video puede pesar hasta 50 MB'); if (btn) btn.disabled = false; return; }
      const ref0 = doc(collection(db, 'novedades')); const videos = [];
      if (files.length) {
        toast('Subiendo video…'); const { m, s } = await storage();
        for (const fl of files) { const path = 'novedades/' + ref0.id + '/' + Date.now() + '-' + fl.name.replace(/[^\w.\-]/g, '_'); await m.uploadBytes(m.ref(s, path), fl); videos.push({ path, name: fl.name, size: fl.size }); }
      }
      await setDoc(ref0, { titulo: String(fd.get('titulo')).trim(), detalle: String(fd.get('detalle')).trim(), tipo: ui.novKind, estado: fd.get('estado'), autor: ROLES[who.rol], videos, creado: Date.now() });
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
