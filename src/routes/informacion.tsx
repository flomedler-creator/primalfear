import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/informacion")({
  component: Informacion,
  head: () => ({
    meta: [
      { title: "Información — Grim Portal" },
      { name: "description", content: "Sistema de combate, modos de juego y plataformas de Grim Portal." },
    ],
  }),
});

const features = [
  {
    title: "Combate Visceral",
    body: "Cada golpe importa. Sistema de heridas localizadas, desmembramientos y rastros de sangre que persisten en el campo.",
  },
  {
    title: "Mundo Persistente",
    body: "Las batallas alteran el mundo. Las ruinas se acumulan, los bosques se queman, los muertos se levantan.",
  },
  {
    title: "Siete Facciones",
    body: "Elige entre las hordas de la oscuridad o los últimos defensores de la luz. Cada una con árboles de habilidad únicos.",
  },
  {
    title: "PvE & PvP",
    body: "Asedios masivos de 100 vs 100, mazmorras necrótricas y campañas narrativas en cooperativo.",
  },
  {
    title: "Magia Antigua",
    body: "Nigromancia, runas enanas, brujería oscura. La magia tiene un precio — y siempre se paga en sangre.",
  },
  {
    title: "Multiplataforma",
    body: "PC, PlayStation 5 y Xbox Series X|S. Crossplay total. Lanzamiento previsto para el invierno de 2026.",
  },
];

function Informacion() {
  return (
    <>
      <section className="max-w-5xl mx-auto px-6 pt-10 pb-16 text-center">
        <h1 className="font-display text-5xl sm:text-6xl bleed-text">El Juego</h1>
        <p className="mt-6 text-lg text-foreground/85 leading-relaxed">
          Grim Portal es un MMO-RPG de fantasía oscura desarrollado por veteranos
          del género. Una experiencia brutal, sin censura, donde cada decisión deja
          cicatriz.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <article
              key={f.title}
              className="border border-border bg-card p-8 hover:border-blood transition-colors"
            >
              <h3 className="font-display text-2xl text-bone mb-3">{f.title}</h3>
              <p className="text-foreground/80 leading-relaxed">{f.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
