// TUS Panel Proxy — Cloudflare Worker
// Sirve el panel de Apps Script bajo unknownshoppers.com/panel
// La clave de Apps Script (PANEL_KEY) y la contraseña del panel (PANEL_PASS)
// viven SOLO como secretos de Cloudflare: wrangler secret put PANEL_KEY / PANEL_PASS

const EXEC = "https://script.google.com/macros/s/AKfycbw0QxwdJpebcBlXQsuMzuz39LVknuA1Ty8QoQecbwnhPbpsST_ACsosPYbbOZ8Nzjowdw/exec";
const COOKIE = "tus_sess";
const MAX_AGE = 60 * 60 * 24 * 7; // 1 semana

function jsUnescape(s) {
  return s.replace(/\\(x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|n|r|t|b|f|v|0|"|'|\\|\/)/g, (_, e) => {
    if (e[0] === "x" || e[0] === "u") return String.fromCharCode(parseInt(e.slice(1), 16));
    const mp = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", v: "\v", "0": "\0",
      '"': '"', "'": "'", "\\": "\\", "/": "/" };
    return mp[e];
  });
}

async function sessionToken(env) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(env.PANEL_PASS + "|" + env.PANEL_KEY),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("tus-panel-v1"));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

const LOGIN = (err) => `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Acceso al panel — The Unknown Shopper</title>
<meta name="robots" content="noindex,nofollow"><style>
*{box-sizing:border-box;margin:0}
body{font-family:'Inter',system-ui,sans-serif;background:#0b1e5b;min-height:100vh;display:flex;align-items:center;justify-content:center;color:#1d2340}
.card{background:#fff;border-radius:16px;padding:36px 32px;width:90%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.3);text-align:center}
.logo{height:52px;margin-bottom:6px}
.sub{color:#5b6078;font-size:13px;margin-bottom:24px}
label{display:block;text-align:left;font-size:12px;color:#5b6078;margin-bottom:6px}
input{width:100%;border:1px solid #e3e6f0;border-radius:10px;padding:12px 14px;font-size:15px}
input:focus{outline:2px solid #2563eb;border-color:transparent}
button{width:100%;margin-top:16px;border:0;border-radius:10px;padding:13px;font-size:15px;font-weight:600;background:#2563eb;color:#fff;cursor:pointer}
button:hover{background:#1d4fd7}
.err${err ? "" : "{display:none}"};background:#fdecec;color:#b91c1c;font-size:12px;border-radius:8px;padding:8px;margin-top:12px}
</style></head><body>
<div class="card">
<img class="logo" src="/tusxx.png" alt="The Unknown Shopper">
<div class="sub">Panel de administración</div>
<form method="post" action="/panel/login">
<label for="p">Contraseña</label>
<input id="p" name="pass" type="password" autocomplete="current-password" autofocus>
<button type="submit">Entrar al panel</button>
</form>
<div class="err">Contraseña incorrecta.</div>
</div></body></html>`;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const want = await sessionToken(env);
    const cookie = req.headers.get("Cookie") || "";
    const authed = cookie.includes(COOKIE + "=" + want);

    // cerrar sesión
    if (url.pathname === "/panel/salir") {
      return new Response(null, { status: 302, headers: {
        "Location": "/panel/",
        "Set-Cookie": `${COOKIE}=; Max-Age=0; Path=/panel` } });
    }

    // login
    if (req.method === "POST" && url.pathname === "/panel/login") {
      const f = await req.formData();
      if (f.get("pass") === env.PANEL_PASS) {
        return new Response(null, { status: 302, headers: {
          "Location": "/panel/",
          "Set-Cookie": `${COOKIE}=${want}; HttpOnly; Secure; SameSite=Lax; Path=/panel; Max-Age=${MAX_AGE}` } });
      }
      return new Response(LOGIN(true), { status: 401,
        headers: { "Content-Type": "text/html;charset=utf-8" } });
    }

    if (!authed) {
      return new Response(LOGIN(false), {
        headers: { "Content-Type": "text/html;charset=utf-8" } });
    }

    // proxy → Apps Script (la clave la inyecta el servidor, nunca viaja al navegador)
    const q = new URLSearchParams(url.search);
    q.delete("key");
    const upstream = EXEC + "?key=" + env.PANEL_KEY +
      (q.toString() ? "&" + q.toString() : "");

    const res = await fetch(upstream, {
      method: req.method,
      redirect: "follow",
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
    });

    let html = await res.text();

    // Apps Script no devuelve el panel directo: lo envuelve en una página
    // con iframe sandbox + JS de Google (que rompe bajo nuestro dominio).
    // El HTML real viaja embebido en userHtml, doble-escapado → 2 decodes.
    const m = html.match(/userHtml\\x22:\\x22((?:[^\\]|\\.)*?)\\x22,\\x22/);
    if (m) html = jsUnescape(jsUnescape(m[1]));

    // reescritura in-domain: los links internos del panel apuntan al EXEC → a /panel
    html = html.split(EXEC).join("/panel");
    // y la clave real jamás aparece en el HTML entregado
    html = html.split(env.PANEL_KEY).join("x");

    const headers = new Headers();
    headers.set("Content-Type", "text/html;charset=utf-8");
    headers.set("Cache-Control", "private, no-store");
    return new Response(html, { status: res.status, headers });
  },
};
