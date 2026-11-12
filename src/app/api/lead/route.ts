import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

type LeadPayload = {
  tipo?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  city?: string;
  age?: string;
  availability?: string;
  hasCar?: string;
  experience?: string;
  company?: string;
  industry?: string;
  locations?: string;
  notes?: string;
  consent?: boolean;
};

export async function POST(req: Request) {
  let payload: LeadPayload;

  try {
    payload = (await req.json()) as LeadPayload;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Payload inválido." },
      { status: 400 }
    );
  }

  const tipo = payload.tipo === "empresa" ? "empresa" : "shopper";
  const fullName = (payload.fullName || "").trim();
  const email = (payload.email || "").trim();
  const phone = (payload.phone || "").trim();
  const city = (payload.city || "").trim();
  const company = (payload.company || "").trim();
  const consent = payload.consent === true;

  if (
    fullName.length < 3 ||
    !email.includes("@") ||
    phone.length < 7 ||
    city.length < 2 ||
    !consent ||
    (tipo === "empresa" && company.length < 2)
  ) {
    return NextResponse.json(
      { ok: false, message: "Faltan campos obligatorios." },
      { status: 400 }
    );
  }

  const to = process.env.LEADS_TO || "the@unknownshoppers.com";

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !port || !user || !pass || !from) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "El servidor no está configurado para envío de correo (SMTP). Configura variables de entorno."
      },
      { status: 500 }
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const subject =
    tipo === "empresa"
      ? `Nueva solicitud Empresa: ${company} (${fullName})`
      : `Nuevo registro Mystery Shopper: ${fullName}`;
  const text = [
    "Nuevo lead - The Unknown Shopper",
    "",
    `Tipo: ${tipo}`,
    `Nombre: ${fullName}`,
    `Email: ${email}`,
    `Teléfono: ${phone}`,
    `Ciudad: ${city}`,
    ...(tipo === "empresa"
      ? [
          `Empresa: ${company}`,
          `Giro: ${payload.industry || ""}`,
          `Sucursales: ${payload.locations || ""}`
        ]
      : [
          `Edad: ${payload.age || ""}`,
          `Disponibilidad: ${payload.availability || ""}`,
          `Auto: ${payload.hasCar || ""}`,
          `Experiencia: ${payload.experience || ""}`
        ]),
    `Notas: ${payload.notes || ""}`,
    "",
    "Fuente: Landing"
  ].join("\n");

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      replyTo: email
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, message: "No se pudo enviar el correo." },
      { status: 502 }
    );
  }
}
