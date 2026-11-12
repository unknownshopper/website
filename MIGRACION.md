# Migración de unknownshoppers.com

Checklist para independizar dominio, sitio y correo de la agencia.

## 0. Antes de cortar con la agencia

- [ ] Pedir el **auth code / EPP code** del dominio y que lo "desbloqueen" para transferencia.
- [ ] **Respaldar el historial de correos** del buzón actual (500 MB):
      opción rápida: reenviar correos importantes a `tipograficoweb@gmail.com`;
      opción completa: `imapsync` del buzón viejo al Gmail (o descargar por IMAP a un cliente como Thunderbird).
- [ ] Confirmar qué nameservers/registros DNS tiene hoy el dominio (captura de pantalla si hay acceso).

## 1. Transferir el dominio

1. Crear cuenta en el registrador destino (Cloudflare Registrar recomendado: precio de costo, sin markup).
2. Iniciar transferencia con el auth code. Tarda ~5 días; el dominio sigue funcionando durante el proceso.
3. Cuando el dominio esté en tu registrador, asignar los **nameservers de Cloudflare** (los da al agregar el sitio a tu cuenta Cloudflare).

## 2. Sitio web

El clon está listo en `site/` (HTML estático, sin dependencias de la agencia).

- El sitio ya vive en GitHub Pages: `unknownshopper.github.io/website`. Opciones:
  - **Quedarse en Pages** (gratis): en repo → Settings → Pages → Custom domain `unknownshoppers.com` + DNS: `A` @ → las 4 IPs de GitHub Pages (185.199.108-111.153) y `CNAME` `www` → `unknownshopper.github.io`. El registro queda en `unknownshoppers.com/registro/`.
  - **Hosting propio**: subir `site/` a Hostinger/cPanel/Netlify/etc. y apuntar DNS según el proveedor.
- Verificar: `unknownshoppers.com`, `www`, `/privacidad.html`, `/terminos.html`, `/obsi.html`, `/registro/?tipo=empresa`.

### Formulario de registro

`site/registro/` es autónomo (no necesita backend). Para que los envíos lleguen por correo sin abrir el cliente del usuario:

1. Crear access key gratis en https://web3forms.com con `tipograficoweb@gmail.com` (250 envíos/mes gratis).
2. Pegarla en `site/registro/index.html` → `const WEB3FORMS_KEY = "..."` y hacer push.
3. Alternativa: cualquier endpoint de forms (Formspree/Getform) en `FORM_ENDPOINT`.

Sin key configurada, el form abre un `mailto:` con los datos precargados (funciona, pero depende del cliente de correo del usuario).

## 3. Correo: CF Email Routing + Gmail

### 3a. Cloudflare (recibir)

En el dashboard de Cloudflare → Email → Email Routing:

- Crear dirección: `the@unknownshoppers.com` → destino `tipograficoweb@gmail.com`
- (Opcional) activar **Catch-all** → todo `*@unknownshoppers.com` cae al mismo Gmail
- Cloudflare agrega los MX automáticamente: `route1/2/3.mx.cloudflare.net`

### 3b. SPF — IMPORTANTE

Debe existir **un solo** registro TXT SPF que incluya Cloudflare (recepción) y Google (envío):

```
Tipo: TXT   Nombre: @   Valor:
v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all
```

Cloudflare Email Routing intenta crear su propio SPF; combinar en uno solo, nunca dos registros `v=spf1`.

### 3c. Gmail (enviar como the@)

En la cuenta `tipograficoweb@gmail.com`:

1. Activar verificación en 2 pasos si no está: https://myaccount.google.com/security
2. Generar **App Password**: https://myaccount.google.com/apppasswords → nombre "unknownshoppers" → copiar las 16 letras.
3. Gmail → ⚙️ → Ver todos los ajustes → **Cuentas e importación** → "Enviar como" → **Añadir otra dirección**:
   - Nombre: `The Unknown Shopper`
   - Correo: `the@unknownshoppers.com`
   - ☐ desmarcar "Tratar como alias" (o marcarlo, da igual para este uso)
   - Servidor SMTP: `smtp.gmail.com` · Puerto: `587` · TLS
   - Usuario: `tipograficoweb@gmail.com`
   - Contraseña: la **App Password** del paso 2
4. Gmail envía un correo de verificación a `the@unknownshoppers.com` → llega vía Cloudflare al propio Gmail → clic en el enlace / pegar el código.
5. En la misma sección activar: **"Responder desde la misma dirección a la que se envió el mensaje"** — así las respuestas a `the@` salen firmadas como `the@` automáticamente.

Prueba: enviar un correo a `the@unknownshoppers.com` desde otra cuenta → debe llegar a Gmail → responder → el remitente debe verse `the@unknownshoppers.com`.

## 4. Notas

- Los correos enviados así llevan SPF de Google válido; Gmail firma DKIM con gmail.com (normal y suficiente).
- El "Quiero ser shopper" y demás mailto del sitio ya apuntan a `the@unknownshoppers.com` — seguirán funcionando.
- El formulario de registro (Next.js, `/api/lead`) necesita SMTP propio si se publica: puede usar el mismo Gmail con App Password (`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=tipograficoweb@gmail.com`, `SMTP_PASS=<app password>`, `LEADS_TO=the@unknownshoppers.com` o el gmail).
