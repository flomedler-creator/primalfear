import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Hero } from "@/components/site/Hero";
import { FactionCard } from "@/components/site/FactionCard";
import { BloodButton } from "@/components/site/BloodButton";
import { factions } from "@/lib/factions";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Sangre Eterna — Videojuego de fantasía oscura" },
      {
        name: "description",
        content:
          "Sangre Eterna: un videojuego de fantasía oscura y gore. Orcos sanguinarios, elfos oscuros, ogros devoradores y no-muertos contra humanos, elfos del bosque y enanos.",
      },
    ],
  }),
});

function Index() {
  const dark = factions.filter((f) => f.side === "oscuridad").slice(0, 2);
  const light = factions.filter((f) => f.side === "luz").slice(0, 2);

  return (
    <Layout>
      <Hero />

      <section className="max-w-7xl mx-auto px-6 py-20">
        <header className="text-center mb-14">
          <p className="font-heading tracking-[0.4em] text-blood text-xs mb-4">
            DOS BANDOS · UNA MASACRE
          </p>
          <h2 className="font-display text-4xl sm:text-5xl bleed-text">
            Las Huestes en Guerra
          </h2>
          <div className="parchment-divider mt-8 max-w-md mx-auto" />
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...dark, ...light].map((f) => (
            <FactionCard key={f.id} faction={f} />
          ))}
        </div>

        <div className="text-center mt-12">
          <BloodButton to="/facciones">Ver todas las facciones</BloodButton>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-4xl sm:text-5xl bleed-text">
          Un mundo abandonado por los dioses
        </h2>
        <p className="mt-8 text-lg text-foreground/85 leading-relaxed">
          Los reinos arden. Los nigromantes susurran a los gusanos. Los ogros
          marchan masticando piernas robadas a los caídos. Y aún así, en lo
          profundo de los bosques y las montañas, alguien afila el acero.
        </p>
        <p className="mt-4 italic text-muted-foreground">
          Tu sangre es solo el principio.
        </p>
        <div className="mt-10">
          <Link
            to="/contacto"
            className="font-heading text-sm tracking-[0.3em] text-blood hover:text-ember transition-colors"
          >
            ÚNETE A LA BETA →
          </Link>
        </div>
      </section>
    </Layout>
  );
}
