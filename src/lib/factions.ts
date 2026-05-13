import orc from "@/assets/faction-orc.jpg";
import darkelf from "@/assets/faction-darkelf.jpg";
import ogre from "@/assets/faction-ogre.jpg";
import undead from "@/assets/faction-undead.jpg";
import human from "@/assets/faction-human.jpg";
import woodelf from "@/assets/faction-woodelf.jpg";
import dwarf from "@/assets/faction-dwarf.jpg";
import varkun from "@/assets/faction-varkun.jpg";

export type Side = "oscuridad" | "luz";

export interface Faction {
  id: string;
  name: string;
  side: Side;
  tagline: string;
  description: string;
  image: string;
  glyph: string;
}

export const factions: Faction[] = [
  {
    id: "orcos",
    name: "Orcos Sangrientos",
    side: "oscuridad",
    tagline: "La carnicería es su oración",
    description:
      "Hordas de músculo y odio. Sus hachas mellan huesos antes de salir el sol y beben de las heridas que abren.",
    image: orc,
    glyph: "☠",
  },
  {
    id: "elfos-oscuros",
    name: "Elfos Oscuros",
    side: "oscuridad",
    tagline: "Belleza venenosa",
    description:
      "Maestros del veneno y la traición. Sonríen mientras te apuñalan y susurran maldiciones en lenguas muertas.",
    image: darkelf,
    glyph: "🜏",
  },
  {
    id: "ogros",
    name: "Ogros Devoradores",
    side: "oscuridad",
    tagline: "El campo de batalla es un banquete",
    description:
      "Marchan masticando lo que arrancan a su paso. Su hambre nunca termina y su risa retumba como avalancha.",
    image: ogre,
    glyph: "⚔",
  },
  {
    id: "no-muertos",
    name: "No-Muertos",
    side: "oscuridad",
    tagline: "Carne podrida, voluntad eterna",
    description:
      "Nigromantes envueltos en gusanos levantan ejércitos del barro y la putrefacción. La muerte es solo el principio.",
    image: undead,
    glyph: "✟",
  },
  {
    id: "humanos",
    name: "Humanos",
    side: "luz",
    tagline: "Frágiles, pero indomables",
    description:
      "Caballeros y plebeyos que defienden lo poco que les queda con acero, fe y rabia desesperada.",
    image: human,
    glyph: "⚜",
  },
  {
    id: "elfos-bosque",
    name: "Elfos del Bosque",
    side: "luz",
    tagline: "El susurro de la flecha",
    description:
      "Guardianes de los últimos bosques vivos. Cazan en silencio y su puntería no conoce el perdón.",
    image: woodelf,
    glyph: "❦",
  },
  {
    id: "enanos",
    name: "Enanos",
    side: "luz",
    tagline: "Yunque, runa y barba",
    description:
      "Forjadores de armas legendarias. Tercos como la roca, mortales como la avalancha que los esculpió.",
    image: dwarf,
    glyph: "⛏",
  },
  {
    id: "varkun",
    name: "Varkun",
    side: "luz",
    tagline: "Carne de tierra, furia primigenia",
    description:
      "Humanos primigenios de fuerza descomunal, piel endurecida y raíces brotando de su carne. Tribus salvajes que sangran al bosque y al bosque devuelven la sangre.",
    image: varkun,
    glyph: "᛭",
  },
];

export const factionById = (id: string) => factions.find((f) => f.id === id)!;
