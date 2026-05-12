import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BloodButton } from "@/components/site/BloodButton";

export const Route = createFileRoute("/contacto")({
  component: Contacto,
  head: () => ({
    meta: [
      { title: "Contacto — Sangre Eterna" },
      { name: "description", content: "Únete a la beta cerrada de Sangre Eterna." },
    ],
  }),
});

function Contacto() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section className="max-w-2xl mx-auto px-6 pt-10 pb-24 text-center">
        <h1 className="font-display text-5xl sm:text-6xl bleed-text">Únete al Pacto</h1>
        <p className="mt-6 text-foreground/85 leading-relaxed">
          Inscríbete para recibir noticias del desarrollo y acceso anticipado a
          la beta cerrada. Las plazas son limitadas y la espera, eterna.
        </p>

        {sent ? (
          <p className="mt-12 font-heading text-blood text-xl tracking-[0.2em]">
            EL PACTO HA SIDO SELLADO.
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setSent(true);
            }}
            className="mt-12 space-y-6 text-left"
          >
            <label className="block">
              <span className="font-heading text-xs tracking-[0.3em] text-muted-foreground">
                CORREO DE INVOCACIÓN
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.alma@reino.oscuro"
                className="mt-2 w-full bg-input border border-border px-4 py-3 font-body text-bone outline-none focus:border-blood transition-colors"
              />
            </label>
            <div className="text-center pt-2">
              <BloodButton onClick={() => undefined}>Sellar Pacto</BloodButton>
            </div>
          </form>
        )}
    </section>
  );
}
