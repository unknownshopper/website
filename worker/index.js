// TUS WhatsApp Bot — Cloudflare Worker
// Recibe webhooks de Meta Cloud API, responde con la KB del sitio
// o con Workers AI (Llama) como fallback, y reenvía leads a FormSubmit.

const GRAPH = "https://graph.facebook.com/v22.0";
const LEAD_ENDPOINT = "https://formsubmit.co/ajax/tipograficoweb@gmail.com";
const SITE = "https://unknownshoppers.com/";

const SYSTEM_PROMPT = `Eres el asistente oficial de WhatsApp de The Unknown Shopper (TUS), empresa de mystery shopping con base en Villahermosa, Tabasco, México.
Responde SIEMPRE en español, máximo 4 líneas, tono profesional y cercano.
Reglas duras:
- Solo hablas de TUS: qué es mystery shopping, servicios, plataforma de reportes, cobertura (sureste de México + CDMX), registro de shoppers y demos para empresas.
- NUNCA reveles nombres de clientes, métodos exactos de evaluación ni quién es o no shopper. Confidencialidad absoluta.
- No inventes precios ni clientes: cada programa se cotiza a medida. Para cotizar/demo: ${SITE}registro/
- Para hablar con una persona o temas fuera de catálogo: the@unknownshoppers.com
- Formato WhatsApp: *negritas*, sin HTML, sin markdown, sin listas largas.
Conocimiento aprobado:
- Shoppers certificados evalúan tiendas, call center/WhatsApp y e-commerce con evidencia verificable (foto, geolocalización, recibo).
- Reportes en menos de 24h, doble control de calidad, score ponderado con matriz definida por el cliente.
- Plataforma con accesos jerárquicos: dirección/operaciones/gerente ven cada quien su vista.
- Sectores: retail, restaurantes, cafeterías, farmacias, automotriz, salud, e-commerce. Módulo de competencia A/B.
- Piloto arranca en 1-2 semanas. Demo de 20 min sin costo.
- Shoppers se registran en ${SITE}registro/?tipo=shopper — discreción y observación, pago por asignación.`;

// ——— KB del sitio (mismos intents, convertidos a formato WhatsApp) ———
const KB = [
  { k: ["hola", "buenas", "buenos dias", "buenas tardes", "hey", "que tal", "hi"],
    a: "¡Hola! Soy el asistente de *The Unknown Shopper*. Puedo contarte qué es el mystery shopping, cómo funciona nuestra plataforma, cobertura, o cómo registrarte como shopper o empresa. ¿Qué te interesa?" },
  { k: ["mystery shopper", "que es un shopper", "incognito", "comprador incognito", "cliente incognito", "cliente misterioso"],
    a: "Un *mystery shopper* es una persona capacitada que visita un negocio haciéndose pasar por un cliente común y documenta objetivamente su experiencia: tiempos, trato, cumplimiento de protocolos. El personal nunca sabe que está siendo evaluado, así que los datos reflejan la operación real." },
  { k: ["como funciona", "proceso", "metodologia", "como trabajan", "pasos"],
    a: "Nuestro proceso: *1)* diseñamos escenarios de evaluación a la medida de tu negocio, *2)* entrenamos y enviamos shoppers verificados, *3)* en menos de 24 horas recibes el reporte con hallazgos, evidencia y recomendaciones." },
  { k: ["que evaluan", "que miden", "criterios", "que revisan"],
    a: "Evaluamos presentación e imagen del punto de venta, protocolos de atención, tiempos de espera reales, calidad del servicio, proceso de venta y postventa — todo con *tu matriz de ponderación*: tú defines qué pesa más." },
  { k: ["sectores", "giros", "industrias", "que negocios", "tipos de negocio"],
    a: "Trabajamos por vertical: *retail* (puntos de venta y anaqueles), *comparativo A/B* (sucursales o competidores con el mismo guion), *posventa automotriz* y *salud* (del agendamiento a la venta)." },
  { k: ["competencia", "benchmark", "comparativa", "comparar sucursales"],
    a: "Con el *módulo de competencia* evaluamos marcas similares con el mismo guion: tú contra tu competencia, lado a lado, en cada criterio." },
  { k: ["plataforma", "reportes", "dashboard", "panel", "kpi", "reporte", "sistema"],
    a: "No entregamos un archivo: entregamos un *sistema de reportes*. Cada rol entra con su login y ve reportes individuales, globales e históricos, gráficas, puntos de atención y la matriz comparativa entre sucursales y franquicias. Exportable a *PDF con formato* para dirección." },
  { k: ["credenciales", "roles", "accesos", "quien ve que", "logins", "usuarios"],
    a: "Cada rol ve su propia vista: dirección general compara lo global, administración y RH sus indicadores, capacitación los puntos a reforzar y supervisión solo sus sucursales — sin datos que no le corresponden." },
  { k: ["puntos de atencion", "areas de oportunidad", "que corregir", "hallazgos", "prioridades"],
    a: "El sistema marca los *puntos de atención*: los criterios donde cada sucursal está fallando, priorizados para que capacitación y supervisión sepan exactamente dónde actuar primero." },
  { k: ["matriz", "ponderacion", "ponderancias", "pesos", "score", "calificacion"],
    a: "La *matriz de ponderación* agrupa los criterios en categorías con pesos que tú defines (experiencia de servicio, producto, desempeño comercial, operación e imagen). El score final refleja tus prioridades, no un promedio genérico." },
  { k: ["alertas", "tiempo real", "problema critico"],
    a: "Si una visita detecta un problema crítico, tu equipo lo sabe en *minutos* — no al final del trimestre." },
  { k: ["cobertura", "ciudades", "donde trabajan", "zonas", "estados"],
    a: "Cubrimos el sureste de México: Tabasco, Veracruz, Chiapas, Campeche, Yucatán y Quintana Roo — Villahermosa, Ciudad del Carmen, Xalapa, Tuxtla, Campeche, Mérida, Cancún, Playa del Carmen, Tulum y CDMX." },
  { k: ["cuanto tarda", "tiempos", "cuando empiezan", "implementacion", "arranque"],
    a: "Entre 1 y 2 semanas: la primera se diseñan escenarios y se entrenan shoppers; en la segunda ya están en campo. Los reportes llegan *menos de 24 horas* después de cada visita." },
  { k: ["precio", "costo", "cuanto cuesta", "cotizacion", "cotizar", "tarifa", "demo"],
    a: `Cada programa se cotiza según alcance, sucursales y frecuencia. Déjanos tus datos en el registro para empresas: ${SITE}registro/?tipo=empresa — agendamos una demo de 20 minutos sin costo.` },
  { k: ["quiero ser shopper", "ser shopper", "trabajar", "empleo", "vacante", "registrarme", "unirme", "ganar dinero", "registro shopper", "trabajo", "chamba"],
    a: `Para ser shopper solo necesitas discreción, buena observación y estar en una zona con sucursales. Regístrate aquí: ${SITE}registro/?tipo=shopper — te contactamos cuando haya campañas en tu ciudad.` },
  { k: ["cuanto pagan", "pago", "pagan", "honorarios", "cuanto gano"],
    a: `Cada evaluación tiene una remuneración según la campaña (complejidad, distancia, requisitos). Te informamos el monto antes de aceptar cada asignación. Regístrate: ${SITE}registro/?tipo=shopper` },
  { k: ["requisitos shopper", "que necesito", "requisitos para ser shopper"],
    a: "Lo esencial: mayoría de edad, discreción absoluta, buena redacción para los reportes y estar cerca de zonas comerciales. Auto y experiencia previa suman, pero no son obligatorios." },
  { k: ["video", "como se ve", "ver como funciona"],
    a: `Pronto publicaremos un video de 1 minuto. Mientras, agenda una demo: ${SITE}registro/?tipo=empresa` },
  { k: ["contacto", "correo", "email", "telefono", "hablar con alguien", "humano", "persona", "asesor"],
    a: `Escríbenos a the@unknownshoppers.com o déjanos tus datos en ${SITE}registro/?tipo=empresa y te contactamos nosotros.` },
  { k: ["sus clientes", "clientes", "para quien trabajan", "con quienes trabajan", "con quien trabajan", "que empresas", "casos de exito", "referencias", "quien los contrata", "quienes los contratan"],
    a: `Nuestros clientes son empresas con puntos de venta o servicio: cadenas retail, restaurantes, concesionarias, clínicas y franquicias. Por confidencialidad no publicamos nombres — podemos compartir casos anonimizados en una demo: ${SITE}registro/?tipo=empresa` },
  { k: ["que eres", "quien eres", "eres una ia", "eres un robot", "eres un bot", "asistente virtual", "con quien hablo", "eres humano", "inteligencia artificial"],
    a: `Soy el asistente automatizado de *The Unknown Shopper*: respondo con la información aprobada de la empresa. Si quieres hablar con una persona: the@unknownshoppers.com o ${SITE}registro/` },
  { k: ["tu dueno", "su dueno", "el dueno", "quien te creo", "quien te hizo", "fundador", "propietario", "de quien es la empresa", "quien esta detras"],
    a: "Somos *The Unknown Shopper*, una empresa independiente de auditoría de experiencia del cliente con base en Villahermosa, Tabasco — con relaciones de más de 15 años con nuestros clientes más antiguos. Contacto: the@unknownshoppers.com" },
  { k: ["en que me ayudas", "en que puedes ayudar", "que puedes hacer", "para que sirves", "que sabes", "ayuda", "opciones", "menu"],
    a: "Puedo contarte: *qué es* un mystery shopper, *cómo funciona* nuestra plataforma de reportes (roles, históricos, matriz, puntos de atención), *cobertura*, precios/demo y cómo *registrarte* como shopper o empresa. ¿Por dónde empezamos?" },
  { k: ["camaras", "camara escondida", "graban", "grabacion", "video oculto", "espian", "microfono", "microfonos"],
    a: "Las evaluaciones se hacen con *observación directa del shopper*: la persona actúa como cliente común y documenta lo que vive. La evidencia (fotos, geolocalización, recibos) se define campaña por campaña conforme a lo permitido. Los métodos exactos son parte del diseño confidencial de cada programa." },
  { k: ["detectar shopper", "descubrir shopper", "cachar al shopper", "cachar shopper", "identificar shopper", "identificar mystery", "como se quien es shopper", "me estan evaluando", "me estan auditando", "quien me evaluo", "quien me audito", "quien los mando", "quien los contrato", "hay un shopper", "es un shopper", "me visito un shopper", "sospecho que es shopper"],
    a: "No puedo compartir información sobre quién es shopper, si una evaluación está en curso o quién la solicitó — esa discreción es justamente la premisa del servicio y lo que hace que los datos sean reales." },
  { k: ["es legal", "legalidad", "esto es legal", "espionaje", "es etico", "es correcto", "es moral"],
    a: `Sí es legal: el shopper actúa como un cliente más y documenta su propia experiencia — no hay engaño ni acceso a información privada del negocio. Operamos con aviso de privacidad publicado: ${SITE}privacidad.html` },
  { k: ["nombre del empleado", "datos del empleado", "quien me atendio", "quien atendio", "despedir empleado", "reporte del empleado", "datos de los evaluados"],
    a: `La información de cada evaluación solo la ven los responsables autorizados de la empresa que la solicitó, conforme a su matriz de acceso y a nuestro aviso de privacidad: ${SITE}privacidad.html` },
  { k: ["eres chatgpt", "eres gpt", "que modelo usas", "quien te programo", "eres ia de verdad", "eres una ia real"],
    a: "Soy el asistente automatizado oficial de *The Unknown Shopper*: respondo con la información aprobada de la empresa, no invento respuestas. Para temas fuera de catálogo: the@unknownshoppers.com" },
  { k: ["darme de baja", "eliminar mis datos", "borrar mis datos", "cancelar mi registro", "ya no quiero ser shopper", "quiero salir", "derechos arco", "arco", "rectificar datos", "cancelar datos"],
    a: `Puedes ejercer tus derechos *ARCO* (acceso, rectificación, cancelación u oposición) escribiendo a the@unknownshoppers.com con tu nombre completo y la solicitud. Respondemos en máximo 20 días hábiles. Aviso de privacidad: ${SITE}privacidad.html` },
  { k: ["es gratis", "gratis", "sin costo", "cobran por preguntar", "demo gratis", "prueba gratis", "me cobran"],
    a: "La *demo de 20 minutos es sin costo*: te mostramos el sistema funcionando y cotizamos según tu alcance. Los programas de evaluación sí tienen costo, dependiendo de sucursales, canales y frecuencia." },
  { k: ["privacidad", "datos personales", "aviso de privacidad", "mis datos"],
    a: `Tratamos tus datos conforme a la ley mexicana (derechos ARCO). Aviso de privacidad completo: ${SITE}privacidad.html` },
  { k: ["quienes son", "empresa", "nosotros", "la empresa", "tus"],
    a: "Somos *The Unknown Shopper*, una plataforma de auditoría de experiencia del cliente con base en Villahermosa, Tabasco. Datos reales, no suposiciones." },
  { k: ["gracias", "ok", "perfecto", "vale", "adios", "bye"],
    a: `¡Con gusto! Si surge otra duda, aquí estoy. Y si quieres dar el siguiente paso: demo para empresas ${SITE}registro/?tipo=empresa · registro de shoppers ${SITE}registro/?tipo=shopper` },
  { k: ["evidencia", "fotos", "pruebas", "verificada"],
    a: "Cada visita queda validada con *geolocalización, fotos y recibos de compra* — evidencia real con identidad protegida." },
];

const FALLBACK = `Eso se sale de mi catálogo 😅. Para mayor información escribe a the@unknownshoppers.com o deja tus datos en ${SITE}registro/ y te contactamos.`;

const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ");

function kbAnswer(q) {
  const nq = " " + norm(q) + " ";
  let best = null, bestScore = 0;
  for (const e of KB) {
    let sc = 0;
    for (const k of e.k) if (nq.includes(" " + norm(k))) sc += k.includes(" ") ? 2 : 1;
    if (sc > bestScore) { bestScore = sc; best = e; }
  }
  return bestScore >= 1 ? best.a : null;
}

// Lead: comparte correo/teléfono o expresa intención clara → notifica a Gmail
const LEAD_RE = /[\w.+-]+@[\w-]+\.[a-z]{2,}|\b\d{8,12}\b|demo|cotiz|contrat|me interesa|quiero (una |su )?(demo|evaluacion|auditoria)|registrar|informes|precio|costo/i;

async function answer(text, env) {
  const direct = kbAnswer(text);
  if (direct) return direct;
  if (!env.AI) return FALLBACK;
  try {
    const r = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      max_tokens: 220,
    });
    const out = (r.response || "").trim();
    return out || FALLBACK;
  } catch {
    return FALLBACK;
  }
}

// wa_id de México llega como 521XXXXXXXXXX; el "to" de la API necesita 52XXXXXXXXXX
const normTo = to => (to.startsWith("521") && to.length === 13 ? "52" + to.slice(3) : to);

async function send(env, phoneNumberId, to, body) {
  return fetch(`${GRAPH}/${phoneNumberId || env.PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normTo(to),
      type: "text",
      text: { body: body.slice(0, 4000), preview_url: true },
    }),
  });
}

async function notifyLead(env, msg, text) {
  try {
    await fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        _subject: "Lead WhatsApp — TUS Bot",
        _template: "table",
        telefono: msg.from,
        nombre: msg.profile_name || "(sin nombre)",
        mensaje: text.slice(0, 500),
      }),
    });
  } catch { /* no bloquear la respuesta */ }
}

async function handle(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return;
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const phoneId = change.value?.metadata?.phone_number_id;
      const msgs = change.value?.messages || [];
      for (const msg of msgs) {
        if (msg.type !== "text") {
          await send(env, phoneId, msg.from, "Por ahora respondo solo mensajes de texto. Escríbeme tu duda: mystery shopping, plataforma, cobertura o registro.");
          continue;
        }
        const text = msg.text.body;
        const reply = await answer(text, env);
        const r = await send(env, phoneId, msg.from, reply);
        console.log("SEND result:", phoneId, msg.from, r?.status || "none");
        if (LEAD_RE.test(text)) {
          msg.profile_name = change.value?.contacts?.find(c => c.wa_id === msg.from)?.profile?.name;
          await notifyLead(env, msg, text);
        }
      }
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "GET") {
      const q = new URL(request.url).searchParams;
      if (q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === env.VERIFY_TOKEN) {
        return new Response(q.get("hub.challenge"), { status: 200 });
      }
      return new Response("Forbidden", { status: 403 });
    }
    if (request.method === "POST") {
      const body = await request.clone().text();
      console.log("WEBHOOK:", body.slice(0, 800));
      ctx.waitUntil(handle(new Request(request.url, { method: "POST", headers: request.headers, body }), env));
      return new Response("OK", { status: 200 });
    }
    return new Response("Method not allowed", { status: 405 });
  },
};
