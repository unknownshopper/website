# Migración de unknownshoppers.com

Checklist para independizar correo y sitio de la agencia.

**Situación real**: el dominio ya está en el GoDaddy del propietario — no se
necesita auth code ni permiso de la agencia para nada. Lo único que controla la
agencia es el hosting viejo (ya clonado a este repo) y el buzón viejo (respaldar).
Toda la migración es **unilateral**.

**Orden recomendado: correo primero, sitio después.**

## 0. Antes de cortar con la agencia

- [ ] **Respaldar el historial de correos** del buzón actual: una vez apuntes el MX a Cloudflare, ese buzón deja de recibir.
  - Si el webmail por `unknownshoppers.com:2096` está bloqueado por el WAF de la agencia, el servidor real responde directo: **`https://priva-140.spindns.com:2096`** (Roundcube) o IMAP `priva-140.spindns.com:993` SSL con `the@unknownshoppers.com` — IMAP no pasa por el proxy de Cloudflare, no pueden bloquearlo.
  - Cliente (Thunderbird/Apple Mail) para descargar todo localmente, o `imapsync` hacia `tipograficoweb@gmail.com`.
- [ ] **Capturar los registros DNS actuales** (A, MX, TXT, CNAME) en el dashboard de Cloudflare de la agencia si se tiene acceso, o reconstruirlos desde cero — solo hace falta el A del sitio viejo si se quiere mantener encendido un tiempo.
- [ ] (Opcional, sin urgencia) auth code en GoDaddy → solo si más adelante se quiere mover el dominio a Cloudflare Registrar por costo. No es requisito para migrar correo ni sitio.

## 1. Correo primero — DNS a Cloudflare propio

1. Crear cuenta propia en Cloudflare → "Add site" → `unknownshoppers.com` → plan Free.
   Cloudflare asigna 2 nameservers nuevos (ej. `lara.ns.cloudflare.com`).
2. En **tu propio GoDaddy** → DNS del dominio → cambiar nameservers a los que asignó tu Cloudflare.
   - Propagación: de minutos a ~24 h. Verificar con `dig NS unknownshoppers.com`.
   - En ese instante el DNS pasa 100% a tu control; la agencia queda fuera.
3. En Cloudflare, recrear lo mínimo para no romper nada mientras tanto:
   - `A` @ → IP del hosting viejo (si quieres que el sitio viejo siga vivo unos días) — o directamente los pasos de la sección 2 si el corte es inmediato.

### 1a. Cloudflare Email Routing (recibir)

En el dashboard de Cloudflare → Email → Email Routing:

- Crear dirección: `the@unknownshoppers.com` → destino `tipograficoweb@gmail.com`
- (Opcional) activar **Catch-all** → todo `*@unknownshoppers.com` cae al mismo Gmail
- Cloudflare agrega los MX automáticamente: `route1/2/3.mx.cloudflare.net`

### 1b. SPF — IMPORTANTE

Debe existir **un solo** registro TXT SPF que incluya Cloudflare (recepción) y Google (envío):

```
Tipo: TXT   Nombre: @   Valor:
v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all
```

Cloudflare Email Routing intenta crear su propio SPF; combinar en uno solo, nunca dos registros `v=spf1`.

### 1c. Gmail (enviar como the@)

En la cuenta `tipograficoweb@gmail.com`:

1. Activar verificación en 2 pasos si no está: https://myaccount.google.com/security
2. Generar **App Password**: https://myaccount.google.com/apppasswords → nombre "unknownshoppers" → copiar las 16 letras.
3. Gmail → ⚙️ → Ver todos los ajustes → **Cuentas e importación** → "Enviar como" → **Añadir otra dirección**:
   - Nombre: `The Unknown Shopper`
   - Correo: `the@unknownshoppers.com`
   - Servidor SMTP: `smtp.gmail.com` · Puerto: `587` · TLS
   - Usuario: `tipograficoweb@gmail.com`
   - Contraseña: la **App Password** del paso 2
4. Gmail envía un correo de verificación a `the@unknownshoppers.com` → llega vía Cloudflare al propio Gmail → clic en el enlace / pegar el código.
5. En la misma sección activar: **"Responder desde la misma dirección a la que se envió el mensaje"** — así las respuestas a `the@` salen firmadas como `the@` automáticamente.

Prueba: enviar un correo a `the@unknownshoppers.com` desde otra cuenta → debe llegar a Gmail → responder → el remitente debe verse `the@unknownshoppers.com`.

## 2. Sitio web

El sitio ya vive en GitHub Pages (`unknownshopper.github.io/website`) y es 100% estático.

Con el DNS en tu Cloudflare, el corte lo decides tú:

- Repo → Settings → Pages → Custom domain `unknownshoppers.com`.
- DNS en Cloudflare: `A` @ → 185.199.108.153, .109.153, .110.153, .111.153 (proxy desactivado, "DNS only") y `CNAME` `www` → `unknownshopper.github.io`.
- El registro queda en `unknownshoppers.com/registro/`.
- Puedes dejar el A apuntando al hosting viejo unos días mientras verificas, y cambiarlo cuando quieras — un registro, no una negociación.
- Verificar: `unknownshoppers.com`, `www`, `/privacidad.html`, `/terminos.html`, `/obsi.html`, `/registro/?tipo=empresa`.

### Formulario de registro

`site/registro/` es autónomo (no necesita backend). Los envíos van por **FormSubmit** a `tipograficoweb@gmail.com`:

- La **primera** vez que llegue un envío real, FormSubmit manda un correo de confirmación a ese Gmail — confirmarlo una sola vez y queda activado.
- Los correos de lead ya incluyen `_replyto` (responder va directo al correo del lead) y asunto con el tipo (`Nuevo registro Shopper:` / `Nueva solicitud Empresa:`).
- El honeypot `empresa_web` filtra bots sin captcha.

## 3. Si la agencia se pone difícil

Aunque el dominio es tuyo, pueden retener:

- **El historial del buzón** → por eso el respaldo va primero. Si cortan acceso antes de respaldar, ese contenido se pierde (los correos futuros llegan a Cloudflare/Gmail igual).
- **El hosting viejo** → irrelevante: el sitio completo ya está en este repo y en GitHub Pages.
- Nada más. Dominio, DNS, correo nuevo y sitio nuevo son 100% tuyos.

## 4. Notas

- Los correos enviados desde Gmail como `the@` llevan SPF de Google válido; Gmail firma DKIM con gmail.com (normal y suficiente).
- Todos los `mailto:` del sitio apuntan a `the@unknownshoppers.com` — seguirán funcionando tras la migración.
- El dominio expira 21-dic-2026; al estar en tu GoDaddy la renovación la controlas tú.
- El formulario Next.js (`src/app/api/lead`) queda como respaldo por si algún día quieres backend propio: puede usar el mismo Gmail con App Password (`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=tipograficoweb@gmail.com`, `SMTP_PASS=<app password>`, `LEADS_TO=tipograficoweb@gmail.com`).
