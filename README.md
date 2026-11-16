# The Unknown Shopper — Sitio web

**The Unknown Shopper (TUS)** es una plataforma de mystery shopping y auditoría de experiencia del cliente. Shoppers certificados visitan puntos de venta de forma incógnita para medir, auditar y transformar la experiencia del cliente — con datos reales, no suposiciones.

## Modelo de negocio

Tres líneas que se refuerzan — **TUS mide, PIRIA construye, la experiencia en sitio mejora**:

- **Medición de campo (TUS)**: mystery shopping incógnito, auditoría de franquicias, encuestas de percepción georreferenciadas, auditoría de canales (call center/WhatsApp/web).
- **Experiencia en sitio**: menú digital NFC por mesa, botón de llamada de mesero, comandas — con tiempo de respuesta medido automáticamente.
- **Plataformas a medida (PIRIA)**: el cliente no recibe un PDF, recibe su sistema — dashboard con KPIs, video evidencia, accesos por rol, reportes <24 h y sistemas operativos hechos a la operación.

Modelo comercial: la auditoría **detecta** las áreas de atención y el reporte con evidencia es la puerta de entrada a vender la **solución** (sistema a medida / línea en sitio). Facturación recurrente vía evaluaciones mensuales + mensualidad de plataforma.

## Servicios

- **Auditoría de punto de venta**: evaluación de vitrina, presentación, inventario visible, protocolos de atención y tiempo de espera real.
- **Auditoría de franquicias**: verificación de estándar de marca por sucursal para el franquiciador.
- **Encuestas de percepción**: intercepts a clientes reales (~20 s por encuesta, georreferenciadas), con diseño de muestra y tabulación.
- **Comparación A/B**: el mismo guion de evaluación aplicado en sucursales, turnos o competidores distintos para detectar inconsistencias.
- **Posventa automotriz**: documentación del ciclo completo de servicio — recepción, cotizaciones, comunicación y entrega.
- **Salud y agendamiento**: evaluación del journey del paciente, de la cita a la venta.
- **Cobertura multicanal**: tienda física, digital y telefónica auditadas por un solo equipo.
- **Soluciones en el punto de venta**: menú NFC, llamada de mesero y comandas por mesa con métrica automática de respuesta.

### La plataforma

No se entregan solo reportes: se entrega un sistema de inteligencia.

- Visitas incógnito verificadas con geolocalización, fotos y recibos
- Credenciales jerárquicas (dirección ve lo global, operaciones su región, cada gerente su tienda)
- Matriz de ponderación con pesos definidos por el cliente
- Histórico global e individual por sucursal, franquicia o red
- Módulo de competencia (benchmarking con el mismo guion)
- Reportes KPI accionables y alertas en tiempo real
- De la visita a la decisión en menos de 24 horas

**Cobertura**: sureste de México — Tabasco, Veracruz, Chiapas, Campeche, Yucatán y Quintana Roo (Villahermosa, Cancún, Mérida, Playa del Carmen, Tulum, Ciudad del Carmen, Xalapa).

**En vivo (GitHub Pages)**: https://unknownshopper.github.io/website/ — se publica `site/` automáticamente en cada push a `main` (workflow `pages.yml`).

## Estructura del repositorio

| Ruta | Contenido |
|---|---|
| `site/` | Clon estático del sitio en producción (`unknownshoppers.com`): `index`, `privacidad`, `terminos`, `obsi` + **`registro/`** (formulario dual shopper/empresa, autónomo). Sin dependencias de la agencia ni de Cloudflare. |
| `src/` | Landing de reclutamiento en Next.js 14 (App Router) con el **formulario de registro de shoppers**. Los leads se envían por correo vía `/api/lead` (nodemailer + SMTP). |
| `public/` | Assets de la landing (logo, ilustraciones). |
| `reunion.html` | Manual de inducción para shoppers (página standalone). |
| `MIGRACION.md` | Checklist paso a paso para migrar dominio, hosting y correo fuera de la agencia. |

## Desarrollo (landing Next.js)

```bash
npm install
npm run dev
```

Variables de entorno para el formulario (`/api/lead`):

```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, LEADS_TO
```
