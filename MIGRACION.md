# Migración de unknownshoppers.com

Checklist para independizar correo, sitio y dominio de la agencia.

**Orden recomendado: correo primero, dominio al final.** Para liberar el correo
solo hace falta controlar el DNS — la transferencia del dominio puede esperar y,
hecha al final, causa **cero downtime** porque ya nada depende de la agencia.

## 0. Antes de cortar con la agencia

- [ ] **Respaldar el historial de correos** del buzón actual (500 MB):
      opción rápida: reenviar correos importantes a `tipograficoweb@gmail.com`;
      opción completa: `imapsync` del buzón viejo al Gmail (o descargar por IMAP a un cliente como Thunderbird).
- [ ] **Capturar los registros DNS actuales** (A, MX, TXT, CNAME) — captura de pantalla de la zona DNS/panel si hay acceso. Es crítico para recrearlos en Cloudflare sin romper nada.
- [ ] Pedir el **auth code / EPP code** del dominio y que lo "desbloqueen" para transferencia. No hace falta usarlo todavía — se usa en la sección 3, pero conviene tenerlo antes de que la agencia se entere del todo.

## 1. Correo primero — DNS a Cloudflare

El correo solo puede liberarse cuando controles el DNS. Esto se logra **sin transferir el dominio**:

1. Crear cuenta en Cloudflare → "Add site" → `unknownshoppers.com` → plan Free.
   Cloudflare te asigna 2 nameservers (ej. `lara.ns.cloudflare.com`) y escanea los DNS actuales.
2. Revisar/recrear en Cloudflare los registros actuales (el A del sitio viejo, MX viejos) para que nada se rompa al cambiar.
3. Pedir a la agencia —o hacerlo en el panel del registrador si tienes acceso— cambiar los **nameservers** del dominio a los que asignó Cloudflare.
   - Cambiar NS ≠ transferir dominio: el sitio y el correo siguen igual en ese instante, pero el DNS ya lo controlas tú.
   - Propagación: de minutos a ~24 h. Verificar con `dig NS unknownshoppers.com`.
4. Ya con el DNS en Cloudflare, activar el correo (1a–1c). El buzón viejo de la agencia puede convivir unos días mientras migras.

> Si la agencia se niega a cambiar los nameservers, no hay atajo: toca transferir primero (sección 3) y retomar aquí después. Por eso conviene pedir el auth code desde el principio.

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

Con el DNS ya en tu Cloudflare, el corte lo decides tú (un cambio de registro, no la agencia):

- **Quedarse en Pages** (gratis): repo → Settings → Pages → Custom domain `unknownshoppers.com` + DNS en Cloudflare: `A` @ → las 4 IPs de GitHub Pages (185.199.108.153, .109.153, .110.153, .111.153) y `CNAME` `www` → `unknownshopper.github.io`. El registro queda en `unknownshoppers.com/registro/`.
- **Hosting propio**: subir `site/` a Hostinger/Netlify/etc. y apuntar DNS según el proveedor.
- Puedes mantener el sitio viejo de la agencia apuntado mientras verificas, y cambiar el registro A cuando estés listo.
- Verificar: `unknownshoppers.com`, `www`, `/privacidad.html`, `/terminos.html`, `/obsi.html`, `/registro/?tipo=empresa`.

### Formulario de registro

`site/registro/` es autónomo (no necesita backend). Los envíos van por **FormSubmit** a `tipograficoweb@gmail.com`:

- La **primera** vez que llegue un envío real, FormSubmit manda un correo de confirmación a ese Gmail — confirmarlo una sola vez y queda activado.
- Los correos de lead ya incluyen `_replyto` (responder va directo al correo del lead) y asunto con el tipo (`Nuevo registro Shopper:` / `Nueva solicitud Empresa:`).
- El honeypot `empresa_web` filtra bots sin captcha.

## 3. Transferir el dominio (último)

Con correo y sitio ya funcionando fuera de la agencia:

1. Crear cuenta en el registrador destino (Cloudflare Registrar recomendado: precio de costo, sin markup).
2. Iniciar transferencia con el auth code. Tarda ~5–7 días.
3. **La transferencia mantiene los nameservers actuales** (los de Cloudflare) → el sitio y el correo ni se enteran. Por eso este paso va al final: ya no hay nada que pueda romperse.
4. Al terminar, el dominio queda 100% tuyo: renovaciones, contacto registrante y DNS — cero dependencia de la agencia.

## 4. Notas

- Los correos enviados desde Gmail como `the@` llevan SPF de Google válido; Gmail firma DKIM con gmail.com (normal y suficiente).
- Todos los `mailto:` del sitio apuntan a `the@unknownshoppers.com` — seguirán funcionando tras la migración.
- El formulario Next.js (`src/app/api/lead`) queda como respaldo por si algún día quieres backend propio: puede usar el mismo Gmail con App Password (`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=tipograficoweb@gmail.com`, `SMTP_PASS=<app password>`, `LEADS_TO=tipograficoweb@gmail.com`).
