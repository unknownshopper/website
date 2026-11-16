# AGENTS.md — contexto del proyecto

## Qué es este repo

Sitio público de **The Unknown Shopper (TUS)** — empresa mexicana de mystery shopping
y soluciones operativas (Villahermosa, Tabasco). GitHub Pages + Google Apps Script
+ Cloudflare Workers. Todo push a `main` publica `site/` en `unknownshoppers.com`
(workflow `.github/workflows/pages.yml`).

## Modelo de negocio (no revelar clientes por nombre en el sitio)

**TUS mide → PIRIA construye → mensualidad.** La auditoría detecta problemas y el
reporte con evidencia vende la solución. Líneas:

1. **Medición de campo** — mystery shopping, auditoría de franquicias, encuestas de
   percepción georreferenciadas, auditoría de canales (call center/WhatsApp/web).
2. **Experiencia en sitio** — menú digital NFC, llamada de mesero, comandas por mesa.
3. **Plataformas a medida (PIRIA)** — sistemas operativos con dashboard KPIs, video,
   roles. NUNCA usar nombres de clientes en el sitio público (discreción = venta).

Marcas muertas/absorbidas: **Olmeca Code** y **Datos Duros** → consolidadas en PIRIA
y TUS respectivamente.

## Arquitectura operativa

- `site/` — sitio estático público (index, registro/, empresas/, panel/, obsi.html,
  privacidad, terminos, instrucciones, sitemap).
- `scripts/registros-tus.gs` — **backend completo**: doPost del formulario, Sheet,
  panel admin HTML/JS embebido, dedupe, emails. Se edita aquí y se copia a Apps Script.
- `worker-panel/` — Cloudflare Worker `tus-panel`: proxy + auth de
  `unknownshoppers.com/panel*` hacia el Apps Script. Secretos: `PANEL_KEY`, `PANEL_PASS`.
- `worker/` — worker de WhatsApp (TUS WhatsApp).
- `ejms/` — creativos (post-shopper.png, post-empresa.png, post-shopper27) +
  `prospeccion-empresas.md` (templates B2B + pipeline de prospectos).
- `src/` + `public/` — landing Next.js legada (el formulario vive ya en `site/registro/`).

## URLs clave

- Sitio: `https://unknownshoppers.com/`
- Registro shopper: `/registro/` · empresa: `/registro/?tipo=empresa` · alias `/empresas`
- Panel admin: `unknownshoppers.com/panel` (worker) — login con `PANEL_PASS`
- Apps Script exec: `…/AKfycbw0QxwdJpebcBlXQsuMzuz39LVknuA1Ty8QoQecbwnhPbpsST_ACsosPYbbOZ8Nzjowdw/exec`

## Deploys

- **Sitio**: push a `main` → GitHub Pages (~1 min).
- **`.gs`**: compilar check `node -e "new Function(require('fs').readFileSync('scripts/registros-tus.gs','utf8'))"`
  → copiar a Apps Script → **Implementar → Nueva versión** (sin nueva versión sigue la vieja).
- **Worker panel**: `cd worker-panel && npx wrangler deploy` (secretos ya configurados).
- **Creativos**: HTML → PNG via Chrome headless:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --screenshot=out.png --window-size=1080,1350 file://.../post-x.html`

## Datos del Sheet "Registros TUS" (18 columnas)

1 timestamp · 2 tipo (shopper/empresa) · 3 nombre · 4 email · 5 teléfono · 6 ciudad ·
7 edad · 8 disponibilidad · 9 auto · 10 experiencia · 11 contacto preferido ·
12 canales · 13 empresa · 14 giro · 15 sucursales · 16 notas · 17 estatus · 18 campaña.

Estatus: `Nuevo | Contactado | Aceptado | Descartado` (auto="no" entra Descartado +
email automático "se requiere auto"). Campañas: `cafeterias`, `organico`, `manual`,
`ene27`, `b2b`. Descartados van a tabla colapsable aparte; descartar pide motivo →
notas como `[descarte: …]`. Dedupe por teléfono o email normalizado. Emails
sospechosos se guardan marcados `[email sospechoso]` sin confirmación.

## Reglas de operación

- Sitemap: solo páginas públicas (`/`, `/registro/`, privacidad, terminos). Internas
  (`instrucciones`, `panel`, `obsi`… obsi está linkada desde index, déjala) fuera.
- Conflicto de interés: no prospectar competidores del cliente de cafeterías activo
  (CACEP, Atakear, A Toda Salsa, Banquetakos quedaron descartados).
- Credenciales y claves NUNCA en el repo — viven como secretos de Cloudflare.
- Meta pixel `shoppers` ID 1178135964818871: PageView en index/registro +
  `CompleteRegistration` solo tras submit exitoso.
