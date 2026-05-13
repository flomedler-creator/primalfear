import { createFileRoute } from "@tanstack/react-router";
import { FactionCard } from "@/components/site/FactionCard";
import { factions } from "@/lib/factions";

export const Route = createFileRoute("/facciones")({
  component: Facciones,
  head: () => ({
    meta: [
      { title: "Facciones — Grim Portal" },
      {
        name: "description",
        content:
          "Conoce las facciones de Grim Portal: orcos, elfos oscuros, ogros, no-muertos, humanos, elfos del bosque y enanos.",
      },
    ],
  }),
});

function SectionGrid({ title, subtitle, side }: { title: string; subtitle: string; side: "oscuridad" | "luz" }) {
  const items = factions.filter((f) => f.side === side);
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <header className="mb-10">
        <p className="font-heading tracking-[0.4em] text-blood text-xs mb-3">{subtitle}</p>
        <h2 className="font-display text-4xl bleed-text">{title}</h2>
        <div className="parchment-divider mt-6" />
      </header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((f) => <FactionCard key={f.id} faction={f} />)}
      </div>
    </section>
  );
}

function Facciones() {
  return (
    <>
      <div className="text-center px-6 pt-10 pb-6">
        <h1 className="font-display text-5xl sm:text-6xl bleed-text">Facciones</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Siete pueblos. Dos destinos. Solo uno verá el siguiente amanecer.
        </p>
      </div>
      <SectionGrid title="La Oscuridad" subtitle="LOS QUE DEVORAN" side="oscuridad" />
      <SectionGrid title="La Luz" subtitle="LOS QUE RESISTEN" side="luz" />
    </>
  );
}
