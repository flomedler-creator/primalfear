import type { Faction } from "@/lib/factions";

export function FactionCard({ faction }: { faction: Faction }) {
  return (
    <article className="faction-card group rounded-sm">
      <img
        src={faction.image}
        alt={faction.name}
        loading="lazy"
        width={896}
        height={1216}
        className="w-full h-[420px] object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 p-6 z-10">
        <span className="text-xs uppercase tracking-[0.3em] text-blood/90 font-heading">
          {faction.side === "oscuridad" ? "Hueste de la Oscuridad" : "Heraldos de la Luz"}
        </span>
        <h3 className="font-display text-2xl mt-2 text-bone">{faction.name}</h3>
        <p className="italic text-muted-foreground mt-1">{faction.tagline}</p>
        <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{faction.description}</p>
      </div>
    </article>
  );
}
