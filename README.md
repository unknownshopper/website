# The Unknown Shopper — Sitio web

**The Unknown Shopper (TUS)** es una plataforma de mystery shopping y auditoría de experiencia del cliente. Shoppers certificados visitan puntos de venta de forma incógnita para medir, auditar y transformar la experiencia del cliente — con datos reales, no suposiciones.

## Servicios

- **Auditoría de punto de venta**: evaluación de vitrina, presentación, inventario visible, protocolos de atención y tiempo de espera real.
- **Comparación A/B**: el mismo guion de evaluación aplicado en sucursales, turnos o competidores distintos para detectar inconsistencias.
- **Posventa automotriz**: documentación del ciclo completo de servicio — recepción, cotizaciones, comunicación y entrega.
- **Salud y agendamiento**: evaluación del journey del paciente, de la cita a la venta.
- **Cobertura multicanal**: tienda física, digital y telefónica auditadas por un solo equipo.

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
