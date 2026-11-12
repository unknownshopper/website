"use client";

import Image from "next/image";
import {
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  Coins,
  MapPin,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Timer
} from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  age: string;
  availability: string;
  hasCar: "si" | "no" | "";
  experience: string;
  notes: string;
  consent: boolean;
};

export default function HomePage() {
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<
    | { type: "idle" }
    | { type: "success"; message: string }
    | { type: "error"; message: string }
  >({ type: "idle" });

  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    age: "",
    availability: "",
    hasCar: "",
    experience: "",
    notes: "",
    consent: false
  });

  const canSubmit = useMemo(() => {
    return (
      form.fullName.trim().length >= 3 &&
      form.email.includes("@") &&
      form.phone.trim().length >= 7 &&
      form.city.trim().length >= 2 &&
      form.consent
    );
  }, [form]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ type: "idle" });

    if (!canSubmit) {
      setStatus({
        type: "error",
        message: "Completa los campos obligatorios y acepta el aviso de privacidad."
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = (await res.json()) as { ok: boolean; message?: string };

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "No se pudo enviar tu registro.");
      }

      setStatus({
        type: "success",
        message:
          "¡Listo! Recibimos tu registro. Te contactaremos cuando haya campañas disponibles."
      });
      setForm({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        age: "",
        availability: "",
        hasCar: "",
        experience: "",
        notes: "",
        consent: false
      });
    } catch (err) {
      setStatus({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Ocurrió un error inesperado al enviar tu registro."
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-white via-white to-slate-50">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200 via-fuchsia-200 to-amber-200 blur-3xl opacity-60" />
        <div className="pointer-events-none absolute -bottom-40 left-0 h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-emerald-200 via-cyan-200 to-sky-200 blur-3xl opacity-50" />

        <div className="mx-auto max-w-6xl px-5 py-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logotus.png"
              alt="The Unknown Shopper"
              width={56}
              height={56}
              priority
            />
            <div>
              <div className="text-base font-semibold tracking-tight">
                The Unknown Shopper
              </div>
              <div className="text-sm text-black/70">
                Mystery shopper | Evaluación de atención y ventas
              </div>
            </div>
          </div>
          <a
            href="#registro"
            className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black/90"
          >
            Quiero registrarme
          </a>
        </header>

        <section className="mt-10 grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold text-black/80 shadow-sm backdrop-blur"
            >
              <Sparkles className="h-4 w-4" />
              Registro abierto para nuevas campañas
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-5 text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl"
            >
              Convierte tus visitas a tiendas en evaluaciones pagadas.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 max-w-prose text-lg text-black/70"
            >
              Somos una agencia de mystery shopper. Constantemente buscamos shoppers
              para evaluar la atención y la experiencia de venta en sucursales de
              distintas marcas.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-7 flex flex-wrap gap-3"
            >
              <a
                href="#registro"
                className="inline-flex items-center justify-center rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-black/90"
              >
                Registrarme
              </a>
              <a
                href="mailto:the@unknownshoppers.com"
                className="inline-flex items-center justify-center rounded-xl border border-black/15 bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm hover:bg-black/5"
              >
                Contacto
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 overflow-hidden rounded-3xl border border-black/10 bg-white/70 shadow-sm backdrop-blur"
            >
              <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold">Así se ve una evaluación</div>
                  <div className="mt-0.5 text-sm text-black/60">
                    Brief + visita + reporte
                  </div>
                </div>
                <div className="hidden items-center gap-2 text-xs font-semibold text-black/70 sm:flex">
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                    Discreto
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                    Claro
                  </span>
                  <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                    Pagado
                  </span>
                </div>
              </div>
              <div className="p-3">
                <Image
                  src="/illus-visit.svg"
                  alt="Ilustración de evaluación"
                  width={1200}
                  height={900}
                  className="h-auto w-full rounded-2xl"
                  priority
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-10 grid gap-3 sm:grid-cols-3"
            >
              <FeatureCard
                icon={<CalendarDays className="h-5 w-5" />}
                title="Campañas frecuentes"
                description="Nuevas evaluaciones cada semana."
              />
              <FeatureCard
                icon={<ClipboardList className="h-5 w-5" />}
                title="Proceso claro"
                description="Brief, visita, reporte y listo."
              />
              <FeatureCard
                icon={<Coins className="h-5 w-5" />}
                title="Pago por evaluación"
                description="Remuneración según campaña."
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="mt-10"
            >
              <h2 className="text-xl font-semibold tracking-tight">Flujo típico</h2>
              <p className="mt-2 max-w-prose text-sm text-black/60">
                Cada campaña puede variar por marca, pero esto es lo más común.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <ImageCard
                  src="/illus-brief.svg"
                  title="Brief"
                  description="Recibes instrucciones, guion y criterios de evaluación."
                />
                <ImageCard
                  src="/illus-visit.svg"
                  title="Visita"
                  description="Acudes como cliente normal y observas la atención/venta."
                />
                <ImageCard
                  src="/illus-report.svg"
                  title="Reporte"
                  description="Llenas el reporte con evidencias y comentarios."
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="mt-10"
            >
              <h2 className="text-xl font-semibold tracking-tight">¿Cómo funciona?</h2>
              <div className="mt-4 grid gap-3">
                <StepCard
                  number="1"
                  icon={<BadgeCheck className="h-5 w-5" />}
                  title="Regístrate"
                  description="Déjanos tus datos y ciudad para asignarte campañas."
                />
                <StepCard
                  number="2"
                  icon={<MessageCircleMore className="h-5 w-5" />}
                  title="Te invitamos a campañas"
                  description="Te contactamos con instrucciones y fechas disponibles."
                />
                <StepCard
                  number="3"
                  icon={<Timer className="h-5 w-5" />}
                  title="Visita y reporta"
                  description="Evalúas, completas el reporte y recibes tu pago según la campaña."
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="mt-10"
            >
              <h2 className="text-xl font-semibold tracking-tight">Requisitos comunes</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <FeatureCard
                  icon={<ShieldCheck className="h-5 w-5" />}
                  title="Confidencialidad"
                  description="Discreción durante la visita y reporte."
                />
                <FeatureCard
                  icon={<MapPin className="h-5 w-5" />}
                  title="Ubicación"
                  description="Vivir cerca de zonas con sucursales."
                />
              </div>
            </motion.div>
          </div>

          <aside
            id="registro"
            className="sticky top-6 h-fit rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm backdrop-blur"
          >
            <h2 className="text-xl font-semibold tracking-tight">
              Regístrate para recibir campañas
            </h2>
            <p className="mt-2 text-sm text-black/70">
              Te contactaremos desde <span className="font-semibold">the@unknownshoppers.com</span>
            </p>

            <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
              <Field label="Nombre completo*">
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email*">
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                    placeholder="tucorreo@..."
                    autoComplete="email"
                  />
                </Field>
                <Field label="Teléfono*">
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                    placeholder="WhatsApp"
                    autoComplete="tel"
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Ciudad*">
                  <input
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                    placeholder="Ej. Monterrey"
                    autoComplete="address-level2"
                  />
                </Field>
                <Field label="Edad">
                  <input
                    value={form.age}
                    onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                    placeholder="Ej. 28"
                    inputMode="numeric"
                  />
                </Field>
              </div>

              <Field label="Disponibilidad (días/horarios)">
                <input
                  value={form.availability}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, availability: e.target.value }))
                  }
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                  placeholder="Ej. Tardes entre semana / sábados"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="¿Tienes auto?">
                  <select
                    value={form.hasCar}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, hasCar: e.target.value as any }))
                    }
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                  >
                    <option value="">Selecciona</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                </Field>
                <Field label="Experiencia como mystery shopper">
                  <select
                    value={form.experience}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, experience: e.target.value }))
                    }
                    className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                  >
                    <option value="">Selecciona</option>
                    <option value="nunca">Nunca</option>
                    <option value="poca">1-5 evaluaciones</option>
                    <option value="media">6-20 evaluaciones</option>
                    <option value="alta">20+ evaluaciones</option>
                  </select>
                </Field>
              </div>

              <Field label="Notas (opcional)">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full min-h-24 resize-y rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/30"
                  placeholder="Algo que debamos considerar (zonas, horarios, experiencia adicional, etc.)"
                />
              </Field>

              <label className="mt-1 flex items-start gap-2 text-sm text-black/70">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, consent: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-black/30 bg-white"
                />
                <span>
                  Acepto ser contactado(a) por The Unknown Shopper para asignación de
                  campañas.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Enviando..." : "Enviar registro"}
              </button>

              {status.type !== "idle" ? (
                <div
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    status.type === "success"
                      ? "border-emerald-600/20 bg-emerald-600/10 text-emerald-900"
                      : "border-red-600/20 bg-red-600/10 text-red-900"
                  }`}
                >
                  {status.message}
                </div>
              ) : null}

              <div className="pt-2 text-xs text-black/60">
                Si prefieres, también puedes escribirnos a the@unknownshoppers.com
              </div>
            </form>
          </aside>
        </section>

        <footer className="mt-14 border-t border-black/10 pt-6 text-sm text-black/60">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} The Unknown Shopper</div>
            <div>Contacto: the@unknownshoppers.com</div>
          </div>
        </footer>
      </div>
      </div>
    </main>
  );
}

function ImageCard({
  src,
  title,
  description
}: {
  src: string;
  title: string;
  description: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/70 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="p-3">
        <Image
          src={src}
          alt={title}
          width={1200}
          height={900}
          className="h-auto w-full rounded-xl"
        />
      </div>
      <div className="px-4 pb-4">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-sm text-black/60">{description}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold text-black/70">{label}</span>
      {children}
    </label>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="rounded-xl border border-black/10 bg-black/5 p-2 text-black">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-sm text-black/60">{description}</div>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
          {number}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-black/10 bg-black/5 p-1.5 text-black">
              {icon}
            </span>
            <div className="text-sm font-semibold">{title}</div>
          </div>
          <div className="mt-2 text-sm text-black/60">{description}</div>
        </div>
      </div>
    </div>
  );
}
