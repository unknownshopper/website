// ===== Config =====
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1qyI6pZ5531UL73B6fUyTFDLyo9FsByelX84ACJFOjUc/edit?gid=0#gid=0";
const SHEET_NAME = "registros";
const SUC_NAME = "sucursales";
const NOTIFY_EMAIL = "tipograficoweb@gmail.com";
const TOKEN = "tus-reg-2026";
const PANEL_KEY = "tus-panel-2026";

const AUTO = {
  shopper: "Gracias por registrarte en The Unknown Shopper.\n\nRecibimos tus datos correctamente. Cuando haya una campaña disponible en tu zona, te contactaremos por WhatsApp o correo con los detalles.\n\n— Equipo TUS · unknownshoppers.com",
  empresa: "Gracias por tu interés en The Unknown Shopper.\n\nRecibimos tu solicitud correctamente. Te contactaremos a la brevedad para agendar una demo y diseñar los escenarios de evaluación para tu operación.\n\n— Equipo TUS · unknownshoppers.com"
};

const LINK_INSTR = "https://unknownshoppers.com/instrucciones.html";
const LINK_VIDEO = "https://unknownshoppers.com/video.html";

const SEMILLA = [
  ["Ruta 1", "Guayabal"], ["Ruta 1", "Altabrisa"], ["Ruta 1", "Deportiva"],
  ["Ruta 1", "Móvil Deportiva"], ["Ruta 1", "Walmart Deportiva"], ["Ruta 1", "Cristal"],
  ["Ruta 2", "Walmart Carrizal"], ["Ruta 2", "Pista"], ["Ruta 2", "Usuma"],
  ["Ruta 2", "Ángeles"], ["Ruta 2", "Galerías"], ["Ruta 2", "Olmeca"],
  ["Ruta 3", "Centro"], ["Ruta 3", "Walmart Universidad"], ["Ruta 3", "Américas"],
  ["Ruta 3", "Móvil La Venta"]
];

// ===== Recepción de registros (formulario) =====
function emailSospechoso(email) {
  const e = String(email || "").trim();
  if (!e) return false;
  const m = e.match(/^[^\s@]+@([^\s@]+)$/);
  if (!m) return true;
  const dom = m[1].toLowerCase();
  const typos = { "gmail.comm":1,"gmail.con":1,"gmail.cm":1,"gmail.co":1,"gmal.com":1,
    "gamil.com":1,"gmailc.om":1,"gmail.om":1,"hotmal.com":1,"hotmail.comm":1,
    "hotmail.con":1,"hotmial.com":1,"hotmil.com":1,"hotnail.com":1,"outlok.com":1,
    "outlook.comm":1,"outloook.com":1,"yahoo.comm":1,"yaho.com":1,"yahoo.con":1,
    "yahho.com":1,"icloud.comm":1,"iclod.com":1,"iclou.com":1 };
  if (typos[dom]) return true;
  return !/\.[a-z]{2,}$/.test(dom);
}

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.token !== TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.openByUrl(SHEET_URL);
  let sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(["Fecha", "Tipo", "Nombre", "Email", "Teléfono", "Ciudad",
      "Edad", "Disponibilidad", "Auto", "Experiencia", "Contacto pref.",
      "Canales", "Empresa", "Giro", "Sucursales", "Notas", "Estatus"]);
  }

  const sospechoso = emailSospechoso(d.email);
  if (sospechoso) d.notas = ((d.notas || "") + " [email sospechoso]").trim();

  // dedupe: mismo teléfono o email → actualiza la fila existente
  const telN = String(d.telefono || "").replace(/\D/g, "");
  const mailN = String(d.email || "").trim().toLowerCase();
  const rows0 = sh.getDataRange().getValues();
  let dup = -1;
  for (let i = 1; i < rows0.length; i++) {
    const rt = String(rows0[i][4] || "").replace(/\D/g, "");
    const rm = String(rows0[i][3] || "").trim().toLowerCase();
    if ((telN && rt === telN) || (mailN && rm === mailN)) { dup = i + 1; break; }
  }

  if (dup > 0) {
    const vals = [d.tipo, d.nombre, d.email, d.telefono, d.ciudad, d.edad,
      d.disponibilidad, d.auto, d.experiencia, d.contacto_preferido,
      d.canales, d.empresa, d.giro, d.sucursales, d.notas];
    vals.forEach(function (v, idx) {
      if (v !== undefined && v !== "") sh.getRange(dup, idx + 2).setValue(v);
    });
    if (d.campana) sh.getRange(dup, 18).setValue(d.campana);
    sh.getRange(dup, 16).setValue(
      String(d.notas || rows0[dup - 1][15] || "") + " [actualizado " +
      new Date().toLocaleDateString("es-MX") + "]");
  } else {
    sh.appendRow([new Date(), d.tipo || "", d.nombre || "", d.email || "",
      d.telefono || "", d.ciudad || "", d.edad || "", d.disponibilidad || "",
      d.auto || "", d.experiencia || "", d.contacto_preferido || "",
      d.canales || "", d.empresa || "", d.giro || "", d.sucursales || "",
      d.notas || "", /^no\b/i.test(String(d.auto || "").trim()) ? "Descartado" : "Nuevo",
      d.campana || "organico"]);
  }
  if (!sh.getRange(1, 18).getValue()) sh.getRange(1, 18).setValue("Campaña");

  const suj = d.tipo === "empresa"
    ? "Nueva solicitud Empresa: " + d.empresa + " (" + d.nombre + ")"
    : "Nuevo registro Shopper: " + d.nombre;
  const cuerpo = Object.entries(d)
    .filter(([k]) => k !== "token")
    .map(([k, v]) => k + ": " + v).join("\n");

  const ALIAS = "the@unknownshoppers.com";
  const tieneAlias = GmailApp.getAliases().indexOf(ALIAS) >= 0;
  const opts = { name: "The Unknown Shopper", replyTo: ALIAS };
  if (tieneAlias) opts.from = ALIAS;

  try {
    GmailApp.sendEmail(NOTIFY_EMAIL, suj, cuerpo, opts);
  } catch (err) {
    MailApp.sendEmail(NOTIFY_EMAIL, suj, cuerpo, { name: "TUS · Registros", replyTo: ALIAS });
  }

  if (!sospechoso && d.email && d.email.indexOf("@") > 0) {
    try {
      GmailApp.sendEmail(d.email, "Recibimos tu mensaje — The Unknown Shopper",
        AUTO[d.tipo] || AUTO.shopper, opts);
    } catch (err) {
      MailApp.sendEmail(d.email, "Recibimos tu mensaje — The Unknown Shopper",
        AUTO[d.tipo] || AUTO.shopper, { name: "The Unknown Shopper", replyTo: ALIAS });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== Helpers =====
function waNum(tel) {
  const digits = String(tel || "").replace(/\D/g, "");
  if (digits.length === 10) return "52" + digits;
  return digits;
}

function dispBadges(disp, auto) {
  const a = String(auto || "").toLowerCase();
  const autoB = /^(si|sí|yes|1)/.test(a.trim())
    ? '<span class="pb pwa">Auto</span>'
    : '<span class="pb pno">Sin auto</span>';
  const d = String(disp || "").toLowerCase();
  const am = /mañana|matutino|antes de|madrug/.test(d);
  const pm = /tarde|vespertino|mediodía|mediodia|después|despues|noche/.test(d);
  const libre = /todo|completo|ambos|flexible|libre|cualquier/.test(d);
  let turno = "";
  if (libre || (am && pm)) turno = "AM+PM";
  else if (am) turno = "AM";
  else if (pm) turno = "PM";
  const dispB = turno ? '<span class="pb pm">' + turno + '</span>' : "";
  return autoB + " " + dispB + "<br>";
}

function waLink(tel, nombre, pagina) {
  const url = pagina === "video" ? LINK_VIDEO : LINK_INSTR;
  const msg = "Hola " + nombre + ", gracias por tu registro en The Unknown Shopper. " +
    "Te compartimos el siguiente recurso: " + url;
  return "https://wa.me/" + waNum(tel) + "?text=" + encodeURIComponent(msg);
}

function getSucursales(ss) {
  let sh = ss.getSheetByName(SUC_NAME);
  if (!sh) {
    sh = ss.insertSheet(SUC_NAME);
    sh.appendRow(["Ruta", "Sucursal", "Maps URL"]);
    SEMILLA.forEach(function (par) { sh.appendRow([par[0], par[1], ""]); });
  }
  const rows = sh.getDataRange().getValues();
  const out = {};
  for (let i = 1; i < rows.length; i++) {
    const ruta = rows[i][0], nombre = rows[i][1], url = rows[i][2];
    if (!nombre) continue;
    if (!out[ruta]) out[ruta] = [];
    out[ruta].push({ nombre: String(nombre), url: String(url || "") });
  }
  return out;
}

// ===== Formulario de edición / alta =====
function editarForm(v, r, self, ESTATUS, accion) {
  v = v || [];
  const esAlta = accion === "add";
  const campos = [["nombre", "Nombre", v[2]], ["email", "Email", v[3]],
    ["telefono", "Teléfono", v[4]], ["ciudad", "Ciudad", v[5]],
    ["edad", "Edad", v[6]], ["disponibilidad", "Disponibilidad", v[7]],
    ["auto", "Auto", v[8]], ["experiencia", "Experiencia", v[9]],
    ["contacto", "Contacto preferido", v[10]], ["canales", "Canales", v[11]],
    ["empresa", "Empresa", v[12]], ["giro", "Giro", v[13]],
    ["sucursales", "Sucursales", v[14]], ["notas", "Notas", v[15]],
    ["campana", "Campaña", v[17]]];
  let form = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Editar registro</title><style>
body{font-family:Inter,system-ui,sans-serif;background:#f4f6fb;margin:0;padding:22px;color:#1d2340;max-width:520px}
h1{font-family:'Space Grotesk',sans-serif;font-size:20px;margin-bottom:16px}
label{display:block;font-size:12px;color:#5b6078;margin:10px 0 3px}
input,select{width:100%;border:1px solid #e3e6f0;border-radius:8px;padding:9px 10px;font-size:14px;box-sizing:border-box;background:#fff}
button{margin-top:16px;border:0;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600;background:#2563eb;color:#fff;cursor:pointer}
a{color:#2563eb;font-size:13px;margin-left:14px}
</style></head><body><h1>${esAlta ? "Agregar registro" : "Editar registro #" + r}</h1>
<form method="get" target="_top" action="${ScriptApp.getService().getUrl()}">
<input type="hidden" name="key" value="${PANEL_KEY}">
<input type="hidden" name="action" value="${esAlta ? "add" : "save"}">
<input type="hidden" name="row" value="${r}">
<label>Tipo</label><select name="tipo">
<option value="shopper"${String(v[1]) !== "empresa" ? " selected" : ""}>shopper</option>
<option value="empresa"${String(v[1]) === "empresa" ? " selected" : ""}>empresa</option>
</select>`;
  campos.forEach(function (c) {
    form += `<label>${c[1]}</label><input name="${c[0]}" value="${String(c[2] || "").replace(/"/g, "&quot;")}">`;
  });
  form += `<label>Estatus</label><select name="estatus">` +
    ESTATUS.map(function (s) {
      return `<option${(String(v[16] || "Nuevo")) === s ? " selected" : ""}>${s}</option>`;
    }).join("") + `</select>
<button type="submit">Guardar</button><a target="_top" href="${self}">cancelar</a>
</form></body></html>`;
  return HtmlService.createHtmlOutput(form).setTitle("Editar registro");
}

// ===== Panel =====
function doGet(e) {
  const p = e.parameter || {};
  if (p.key !== PANEL_KEY) {
    return ContentService.createTextOutput("403 — acceso denegado");
  }

  const ss = SpreadsheetApp.openByUrl(SHEET_URL);
  const sh = ss.getSheetByName(SHEET_NAME);
  const self = ScriptApp.getService().getUrl() + "?key=" + PANEL_KEY;
  const ESTATUS = ["Nuevo", "Contactado", "Aceptado", "Descartado"];
  const COLOR = { Nuevo: "#2563eb", Contactado: "#b45309", Aceptado: "#15803d", Descartado: "#6b7280" };

  // acciones — mutan y luego caen al render del panel (sin redirects)
  if (p.action === "nuevo") {
    return editarForm([], 0, self, ESTATUS, "add");
  }

  if (p.action === "add") {
    sh.appendRow([new Date(), p.tipo || "shopper", p.nombre || "", p.email || "",
      p.telefono || "", p.ciudad || "", p.edad || "", p.disponibilidad || "",
      p.auto || "", p.experiencia || "", p.contacto || "", p.canales || "",
      p.empresa || "", p.giro || "", p.sucursales || "", p.notas || "",
      p.estatus || "Nuevo", p.campana || "manual"]);
  }

  if (p.action && p.row && p.action !== "add") {
    const r = parseInt(p.row, 10);
    const rows0 = sh.getDataRange().getValues();
    if (r >= 2 && r <= rows0.length) {
      if (p.action === "status" && p.estatus) {
        sh.getRange(r, 17).setValue(p.estatus);
      } else if (p.action === "del" && String(rows0[r - 1][2]) === String(p.nom)) {
        sh.deleteRow(r);
      } else if (p.action === "save") {
        const cols = { nombre: 3, email: 4, telefono: 5, ciudad: 6, edad: 7,
          disponibilidad: 8, auto: 9, experiencia: 10, contacto: 11,
          canales: 12, empresa: 13, giro: 14, sucursales: 15, notas: 16, estatus: 17, campana: 18 };
        for (const k in cols) {
          if (p[k] !== undefined) sh.getRange(r, cols[k]).setValue(p[k]);
        }
      } else if (p.action === "edit") {
        return editarForm(rows0[r - 1], r, self, ESTATUS);
      }
    }
  }

  const rows = sh.getDataRange().getValues();
  const suc = getSucursales(ss);
  const aceptados = [];
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][16]) === "Aceptado") {
      aceptados.push({ n: String(rows[i][2]), t: waNum(rows[i][4]) });
    }
  }

  let body = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Panel TUS — Registros</title><style>
body{font-family:Inter,system-ui,sans-serif;background:#f4f6fb;margin:0;padding:22px;color:#1d2340}
h1{font-family:'Space Grotesk',sans-serif;font-size:22px;margin:0 0 4px}
h2{font-family:'Space Grotesk',sans-serif;font-size:17px;margin:30px 0 10px}
.sub{color:#5b6078;font-size:13px;margin-bottom:18px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;font-size:13px}
th{background:#0b1e5b;color:#fff;text-align:left;padding:10px 12px;font-size:12px;cursor:pointer;user-select:none;white-space:nowrap}
th:hover{background:#16307e}
td{padding:10px 12px;border-top:1px solid #eef0f6;vertical-align:top}
.badge{display:inline-block;padding:2px 10px;border-radius:99px;color:#fff;font-size:11px;font-weight:600}
.act a{display:inline-block;margin:2px 4px 2px 0;padding:5px 10px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none}
.wa{background:#e7f8ec;color:#15803d}.ln{background:#eef4ff;color:#2563eb}
.st a{display:inline-block;margin:3px 3px 0 0;padding:3px 8px;border-radius:6px;background:#f1f3fa;color:#3a3f5e;font-size:11px;font-weight:600;text-decoration:none}
.st a:hover{background:#e2e8fb;color:#2563eb}
.stsel{border:1px solid #e3e6f0;border-radius:8px;padding:5px 8px;font-size:12px;font-weight:600;background:#fff;cursor:pointer;max-width:130px}
.muted{color:#9aa0b8;font-size:12px}
.pb{display:inline-block;padding:1px 8px;border-radius:99px;font-size:10px;font-weight:700;vertical-align:middle}
.pwa{background:#e7f8ec;color:#15803d}.pm{background:#eef4ff;color:#2563eb}
.pno{background:#fdecec;color:#b91c1c}
.pc{background:#f3e8ff;color:#7c3aed}
.act a.dl{background:#fdecec;color:#b91c1c}
.rutas{background:#fff;border-radius:12px;padding:18px 20px}
.ruta{margin-bottom:14px}
.ruta h3{font-size:13px;margin:0 0 8px;color:#0b1e5b}
.suc{display:inline-flex;align-items:center;gap:6px;background:#f1f3fa;border-radius:8px;padding:6px 10px;margin:3px 4px 3px 0;font-size:13px}
.suc input{accent-color:#2563eb}
.suc .nou{color:#c2410c;font-size:11px}
.btn{display:inline-block;border:0;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;background:#eef4ff;color:#2563eb;margin:4px 4px 0 0}
.btn.main{background:#2563eb;color:#fff}
.btn.wabtn{background:#25d366;color:#fff}
textarea{width:100%;min-height:140px;border:1px solid #e3e6f0;border-radius:10px;padding:12px;font-size:13px;font-family:inherit;margin-top:10px;box-sizing:border-box}
input.tel{border:1px solid #e3e6f0;border-radius:8px;padding:8px 10px;font-size:13px;margin-top:10px}
</style></head><body>
<h1>Panel TUS · Registros</h1>
<div class="sub">${rows.length - 1} registros en el filtro 2 &middot; <a target="_top" href="${self}" style="color:#2563eb">actualizar</a> &middot; <a target="_top" href="${self}&action=nuevo" style="color:#15803d;font-weight:600">＋ Agregar</a></div>
<table><tr><th onclick="sortTable(0)">#</th><th onclick="sortTable(1)">Nombre</th><th onclick="sortTable(2)">Contacto</th><th onclick="sortTable(3)">Ciudad / Edad</th><th onclick="sortTable(4)">Detalles</th><th onclick="sortTable(5)">Estatus</th><th>Acciones</th></tr>`;

  for (let i = rows.length - 1; i >= 1; i--) {
    const r = rows[i];
    const est = String(r[16] || "Nuevo");
    const pref = String(r[10] || "").toLowerCase();
    const fecha = r[0]
      ? new Date(r[0]).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) +
        " · " + new Date(r[0]).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
      : "";
    body += `<tr>
<td>${i}<br><span class="muted">${fecha}</span></td>
<td><strong>${r[2]}</strong><br><span class="muted">${r[1]}</span> ${r[17] ? '<span class="pb pc">' + r[17] + '</span>' : ""}</td>
<td>${r[4]} ${pref === "whatsapp" ? '<span class="pb pwa">WhatsApp</span>' : ""}<br><span class="muted">${r[3]}</span> ${pref === "correo" ? '<span class="pb pm">Correo</span>' : ""}</td>
<td>${r[5]}<br><span class="muted">${r[6]} años</span></td>
<td>${dispBadges(r[7], r[8])}<span class="muted">Disp: ${r[7]} · Exp: ${r[9]}<br>${r[15] || ""}</span></td>
<td><form method="get" target="_top" action="${ScriptApp.getService().getUrl()}" style="margin:0">
<input type="hidden" name="key" value="${PANEL_KEY}">
<input type="hidden" name="action" value="status">
<input type="hidden" name="row" value="${i + 1}">
<select name="estatus" class="stsel" style="color:${COLOR[est] || "#2563eb"}" onchange="this.form.submit()">
${ESTATUS.map(function (s) {
  return `<option${s === est ? " selected" : ""}>${s}</option>`; }).join("")}
</select></form></td>
<td class="act">
<a class="wa" target="_blank" href="${waLink(r[4], r[2], "instrucciones")}">WA · instrucciones</a>
<a class="ln" target="_blank" href="${waLink(r[4], r[2], "video")}">WA · video</a>
<a class="ln" href="#" onclick="msgWA('${waNum(r[4])}', '${String(r[2]).replace(/'/g, "")}');return false">WA · mensaje</a><br>
<a class="ln" target="_top" href="${self}&action=edit&row=${i + 1}">Editar</a>
<a class="dl" target="_top" href="${self}&action=del&row=${i + 1}&nom=${encodeURIComponent(r[2])}" onclick="return confirm('¿Eliminar a ${r[2]}? No se puede deshacer.')">Eliminar</a>
</td></tr>`;
  }
  body += `</table>

<h2>Asignación de rutas</h2>
<div class="rutas">`;

  for (const ruta in suc) {
    body += `<div class="ruta"><h3>${ruta}</h3>`;
    suc[ruta].forEach(function (s) {
      body += `<label class="suc"><input type="checkbox" class="ck" data-nom="${s.nombre}" data-url="${s.url}">${s.nombre}${s.url ? "" : ' <span class="nou">sin maps</span>'}</label>`;
    });
    body += `<br><button class="btn" onclick="selRuta(this,true)">Toda la ruta</button>
<button class="btn" onclick="selRuta(this,false)">3 aleatorias</button></div>`;
  }

  body += `<br>
<select id="shop" class="stsel" onchange="pickShop()">
<option value="">— Elegir shopper aceptado —</option>
${aceptados.map(function (a) {
  return `<option data-tel="${a.t}" data-nom="${a.n}">${a.n}</option>`; }).join("")}
</select>
<button class="btn main" onclick="gen()">Generar mensaje</button>
<textarea id="msg" placeholder="Aquí aparece el mensaje con las sucursales seleccionadas..."></textarea>
<br><input class="tel" id="tel" placeholder="WhatsApp del shopper (10 dígitos)">
<button class="btn wabtn" onclick="sendWA()">Abrir WhatsApp</button>
<button class="btn" onclick="copiar()">Copiar texto</button>
</div>

<script>
function selRuta(btn, toda){
  var cks = btn.parentElement.querySelectorAll('.ck');
  var arr = Array.prototype.slice.call(cks);
  if(toda){ arr.forEach(function(c){ c.checked = true; }); return; }
  arr.forEach(function(c){ c.checked = false; });
  arr.sort(function(){ return Math.random() - .5; }).slice(0,3)
    .forEach(function(c){ c.checked = true; });
}
function pickShop(){
  var s = document.getElementById('shop');
  var o = s.options[s.selectedIndex];
  document.getElementById('tel').value = o.dataset.tel || '';
}
function gen(){
  var cks = document.querySelectorAll('.ck:checked');
  var sel = Array.prototype.slice.call(cks).map(function(c){
    return { n: c.dataset.nom, u: c.dataset.url };
  });
  var msg = document.getElementById('msg');
  if(!sel.length){ msg.value = 'Selecciona al menos una sucursal.'; return; }
  var sh = document.getElementById('shop');
  var nom = sh.options[sh.selectedIndex].dataset.nom || '';
  var t = 'Hola' + (nom ? ' ' + nom : '') + ', tu asignación de evaluación — The Unknown Shopper\\n\\nSucursales:\\n';
  sel.forEach(function(s, i){
    t += (i + 1) + '. ' + s.n + (s.u ? ' — ' + s.u : '') + '\\n';
  });
  t += '\\nInstrucciones: ${LINK_INSTR}';
  msg.value = t;
}
function sendWA(){
  var tel = document.getElementById('tel').value.replace(/\\D/g, '');
  var n = tel.length === 10 ? '52' + tel : tel;
  var t = document.getElementById('msg').value;
  if(!n){ alert('Escribe el WhatsApp del shopper (10 dígitos).'); return; }
  if(!t){ alert('Primero genera el mensaje.'); return; }
  var a = document.createElement('a');
  a.href = 'https://wa.me/' + n + '?text=' + encodeURIComponent(t);
  a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}
function copiar(){
  var m = document.getElementById('msg');
  m.select(); document.execCommand('copy');
}
var sortDir = {};
function sortTable(n){
  var table = document.querySelector('table');
  var rows = Array.prototype.slice.call(table.rows).slice(1);
  var dir = sortDir[n] === 'asc' ? 'desc' : 'asc';
  sortDir[n] = dir;
  rows.sort(function(a, b){
    var x = a.cells[n].textContent.trim();
    var y = b.cells[n].textContent.trim();
    var c = x.localeCompare(y, 'es', { numeric: true });
    return dir === 'asc' ? c : -c;
  });
  rows.forEach(function(r){ table.appendChild(r); });
  var ths = table.rows[0].cells;
  for (var i = 0; i < ths.length; i++){
    var t = ths[i];
    t.dataset.base = t.dataset.base || t.textContent;
    t.textContent = t.dataset.base + (i === n ? (dir === 'asc' ? ' ▲' : ' ▼') : '');
  }
}
function msgWA(n, nom){
  var t = prompt('Mensaje para ' + nom + ':', 'Hola ' + nom + ', ');
  if(!t) return;
  var a = document.createElement('a');
  a.href = 'https://wa.me/' + n + '?text=' + encodeURIComponent(t);
  a.target = '_blank'; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
}
</script>
</body></html>`;

  return HtmlService.createHtmlOutput(body).setTitle("Panel TUS — Registros");
}
