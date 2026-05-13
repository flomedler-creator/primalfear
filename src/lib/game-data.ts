import type { Faction } from "./factions";

export type ResourceKey = "madera" | "hierro" | "comida" | "sangre";

export const RESOURCES: { key: ResourceKey; name: string; ico: string }[] = [
  { key: "madera",  name: "Madera",  ico: "🪵" },
  { key: "hierro",  name: "Hierro",  ico: "⛓" },
  { key: "comida",  name: "Carne",   ico: "🍖" },
  { key: "sangre",  name: "Sangre",  ico: "🩸" },
];

export type Resources = Record<ResourceKey, number>;

export interface BuildingDef {
  key: string;
  name: string;
  desc: string;
  ico: string;
  /** which resource it produces per second (per level) */
  produces?: ResourceKey;
  /** flat per-second production multiplier */
  ratePerLevel?: number;
  /** unlocks recruiting */
  recruits?: boolean;
}

export const BUILDINGS: BuildingDef[] = [
  { key: "aserradero", name: "Aserradero",       desc: "Tala bosques muertos por madera.", ico: "🪓", produces: "madera",  ratePerLevel: 1.2 },
  { key: "mina",       name: "Mina de Hierro",   desc: "Extrae hierro entre huesos.",      ico: "⛏",  produces: "hierro",  ratePerLevel: 1.0 },
  { key: "matadero",   name: "Matadero",         desc: "Carne fresca para los soldados.",   ico: "🥩", produces: "comida",  ratePerLevel: 1.4 },
  { key: "altar",      name: "Altar de Sangre",  desc: "Cada gota alimenta la guerra.",     ico: "🩸", produces: "sangre",  ratePerLevel: 0.6 },
  { key: "cuartel",    name: "Cuartel",          desc: "Adiestra tropas. Mejora velocidad de reclutamiento.", ico: "⚔", recruits: true },
  { key: "muralla",    name: "Muralla",          desc: "Defensa pasiva contra incursiones.", ico: "🏰" },
  { key: "forja",      name: "Forja Rúnica",     desc: "Mejora ataque de tus tropas (+5% por nivel).", ico: "🔨" },
  { key: "templo",     name: "Templo Oscuro",    desc: "Aumenta capacidad de almacén.",     ico: "✟" },
];

export const MAX_LEVEL = 20;

/** Costs scale per next level. Returns cost for going from `level` -> `level+1`. */
export function buildingCost(level: number): Resources {
  const base = Math.pow(1.45, level);
  return {
    madera: Math.round(20 * base),
    hierro: Math.round(15 * base),
    comida: Math.round(10 * base),
    sangre: Math.round(2 * base),
  };
}

/** Build time in seconds. Capped at 1200 (20 min) at high level. */
export function buildingTime(level: number): number {
  // level 0->1 = 5s; ~doubles every 3 levels; capped 1200
  const t = Math.round(5 * Math.pow(1.32, level));
  return Math.min(t, 1200);
}

export function storageCap(templeLevel: number): number {
  return 500 + templeLevel * 600;
}

/* ===================== UNITS PER FACTION ===================== */

export interface UnitDef {
  key: string;
  name: string;
  ico: string;
  /** combat stats */
  atk: number;
  hp: number;
  /** training cost per single unit */
  cost: Resources;
  /** seconds to train ONE unit (modified by cuartel level) */
  time: number;
  role: "infantería" | "caballería" | "élite" | "magia" | "distancia";
}

export const FACTION_UNITS: Record<string, UnitDef[]> = {
  orcos: [
    { key: "orc-hachero",   name: "Hachero Brutal",     ico: "🪓", atk: 8,  hp: 22, cost:{madera:5,hierro:10,comida:8,sangre:1}, time: 10, role:"infantería" },
    { key: "orc-berserker", name: "Berserker Sangriento",ico:"☠", atk: 16, hp: 28, cost:{madera:8,hierro:18,comida:14,sangre:3}, time: 22, role:"élite" },
    { key: "orc-jinete",    name: "Jinete de Lobo",     ico: "🐺", atk: 14, hp: 18, cost:{madera:12,hierro:14,comida:20,sangre:2}, time: 28, role:"caballería" },
    { key: "orc-chaman",    name: "Chamán de Sangre",   ico: "🩸", atk: 22, hp: 14, cost:{madera:6,hierro:8,comida:10,sangre:6}, time: 34, role:"magia" },
  ],
  "elfos-oscuros": [
    { key: "de-asesino",   name: "Asesino Sombrío",   ico: "🗡", atk: 12, hp: 14, cost:{madera:6,hierro:10,comida:8,sangre:2}, time: 12, role:"infantería" },
    { key: "de-envenenador",name:"Envenenador",       ico: "🧪", atk: 18, hp: 12, cost:{madera:8,hierro:8,comida:6,sangre:4}, time: 22, role:"distancia" },
    { key: "de-arana",     name: "Dama Araña",        ico: "🕷", atk: 20, hp: 22, cost:{madera:10,hierro:18,comida:14,sangre:5}, time: 30, role:"caballería" },
    { key: "de-hechicero", name: "Hechicero Sombrío", ico: "🜏", atk: 26, hp: 12, cost:{madera:6,hierro:8,comida:8,sangre:8}, time: 36, role:"magia" },
  ],
  ogros: [
    { key: "og-aplastador",name: "Aplastador",        ico: "🔨", atk: 14, hp: 30, cost:{madera:10,hierro:14,comida:18,sangre:2}, time: 16, role:"infantería" },
    { key: "og-devorador", name: "Devorador",         ico: "🦷", atk: 20, hp: 38, cost:{madera:12,hierro:16,comida:30,sangre:4}, time: 26, role:"élite" },
    { key: "og-lanzaroca", name: "Lanzador de Roca",  ico: "🪨", atk: 22, hp: 24, cost:{madera:14,hierro:20,comida:18,sangre:3}, time: 30, role:"distancia" },
    { key: "og-caudillo",  name: "Caudillo Carnicero",ico: "👹", atk: 30, hp: 50, cost:{madera:18,hierro:30,comida:40,sangre:8}, time: 40, role:"élite" },
  ],
  "no-muertos": [
    { key: "nm-esqueleto", name: "Esqueleto",         ico: "💀", atk: 6,  hp: 14, cost:{madera:3,hierro:6,comida:0,sangre:1}, time: 8,  role:"infantería" },
    { key: "nm-ghoul",     name: "Ghoul Carroñero",   ico: "🧟", atk: 12, hp: 20, cost:{madera:4,hierro:8,comida:0,sangre:3}, time: 18, role:"infantería" },
    { key: "nm-caballero", name: "Caballero Cadáver", ico: "🐴", atk: 18, hp: 28, cost:{madera:8,hierro:18,comida:0,sangre:5}, time: 28, role:"caballería" },
    { key: "nm-nigromante",name: "Nigromante",        ico: "✟", atk: 24, hp: 16, cost:{madera:6,hierro:8,comida:4,sangre:9}, time: 36, role:"magia" },
  ],
  humanos: [
    { key: "hm-soldado",   name: "Soldado",            ico: "🛡", atk: 8,  hp: 22, cost:{madera:6,hierro:10,comida:8,sangre:1}, time: 10, role:"infantería" },
    { key: "hm-ballestero",name: "Ballestero",         ico: "🏹", atk: 14, hp: 14, cost:{madera:12,hierro:8,comida:6,sangre:1}, time: 18, role:"distancia" },
    { key: "hm-caballero", name: "Caballero del Alba", ico: "🐎", atk: 18, hp: 26, cost:{madera:10,hierro:22,comida:18,sangre:3}, time: 28, role:"caballería" },
    { key: "hm-capitan",   name: "Capitán de Hierro",  ico: "⚜", atk: 24, hp: 32, cost:{madera:12,hierro:28,comida:18,sangre:6}, time: 36, role:"élite" },
  ],
  "elfos-bosque": [
    { key: "eb-arquero",   name: "Arquero del Roble",  ico: "🏹", atk: 12, hp: 14, cost:{madera:10,hierro:6,comida:6,sangre:1}, time: 12, role:"distancia" },
    { key: "eb-danzante",  name: "Danzante de Espadas",ico: "🗡", atk: 14, hp: 16, cost:{madera:8,hierro:12,comida:8,sangre:2}, time: 18, role:"infantería" },
    { key: "eb-centinela", name: "Centinela Lince",    ico: "🐈", atk: 16, hp: 18, cost:{madera:14,hierro:14,comida:14,sangre:3}, time: 26, role:"caballería" },
    { key: "eb-druida",    name: "Druida del Bosque",  ico: "❦", atk: 22, hp: 16, cost:{madera:14,hierro:6,comida:8,sangre:7}, time: 34, role:"magia" },
  ],
  enanos: [
    { key: "en-hachero",   name: "Hachero Rúnico",     ico: "🪓", atk: 12, hp: 26, cost:{madera:6,hierro:14,comida:8,sangre:1}, time: 14, role:"infantería" },
    { key: "en-martillador",name:"Martillador",        ico: "🔨", atk: 18, hp: 30, cost:{madera:6,hierro:22,comida:10,sangre:3}, time: 24, role:"élite" },
    { key: "en-ingeniero", name: "Ingeniero",          ico: "⚙", atk: 22, hp: 18, cost:{madera:14,hierro:24,comida:8,sangre:2}, time: 30, role:"distancia" },
    { key: "en-guardian",  name: "Guardián de la Forja",ico:"⛨", atk: 20, hp: 40, cost:{madera:10,hierro:30,comida:14,sangre:6}, time: 38, role:"élite" },
  ],
  varkun: [
    { key: "vk-lancero",   name: "Lancero Tribal",     ico: "🗡", atk: 10, hp: 20, cost:{madera:6,hierro:8,comida:10,sangre:1}, time: 10, role:"infantería" },
    { key: "vk-bestiario", name: "Bestiario",          ico: "🐗", atk: 16, hp: 24, cost:{madera:10,hierro:10,comida:18,sangre:3}, time: 22, role:"caballería" },
    { key: "vk-totem",     name: "Tótem Vivo",         ico: "🌳", atk: 14, hp: 36, cost:{madera:18,hierro:8,comida:14,sangre:4}, time: 28, role:"infantería" },
    { key: "vk-furia",     name: "Furia Primigenia",   ico: "᛭", atk: 26, hp: 30, cost:{madera:12,hierro:14,comida:20,sangre:7}, time: 36, role:"élite" },
  ],
};

/* ===================== ZONES & BOSSES ===================== */

export interface ZoneDef {
  key: string;
  name: string;
  desc: string;
  /** enemy total power (atk+hp pool) */
  power: number;
  reward: Resources;
  /** seconds for the expedition */
  duration: number;
  boss?: boolean;
  bossName?: string;
  /** map position in % (0-100) */
  x: number;
  y: number;
}

export const ZONES: ZoneDef[] = [
  { key:"z1", name:"Páramo Putrefacto", desc:"Carroñeros y muertos hambrientos vagan entre cráteres de sangre.",
    power: 60,  duration: 30,  reward:{madera:80, hierro:60, comida:40, sangre:8}, x: 28, y: 30 },
  { key:"z2", name:"Bosque de Huesos",  desc:"Árboles secos donde cuelgan estandartes podridos.",
    power: 160, duration: 60,  reward:{madera:200, hierro:160, comida:120, sangre:20}, x: 72, y: 26 },
  { key:"z3", name:"Cantera Maldita",   desc:"Una mina abandonada habitada por horrores subterráneos.",
    power: 320, duration: 120, reward:{madera:300, hierro:500, comida:200, sangre:40}, x: 18, y: 68 },
  { key:"z4", name:"Catacumbas Aulladoras", desc:"Pasadizos donde el aire mismo grita.",
    power: 600, duration: 240, reward:{madera:400, hierro:700, comida:300, sangre:90}, x: 80, y: 70 },
  { key:"b1", name:"Carnaval del Carnicero", desc:"BOSS — Un ogro coronado de calaveras devora a sus propios hijos.",
    power: 900, duration: 180, reward:{madera:600, hierro:900, comida:500, sangre:150}, boss:true, bossName:"Karuk el Hambriento", x: 88, y: 48 },
  { key:"b2", name:"Trono de Gusanos",  desc:"BOSS — El nigromante eterno se alimenta de la luna sangre.",
    power: 1500, duration: 300, reward:{madera:800, hierro:1200, comida:600, sangre:300}, boss:true, bossName:"Voth Mortuun", x: 12, y: 14 },
  { key:"b3", name:"Bestia Bajo la Tierra", desc:"BOSS — Algo enorme respira en lo profundo.",
    power: 2600, duration: 420, reward:{madera:1500, hierro:2200, comida:1100, sangre:600}, boss:true, bossName:"La Que Devora Raíces", x: 50, y: 88 },
];

export function unitPower(u: UnitDef): number { return u.atk + u.hp / 2; }

export function recruitTime(u: UnitDef, cuartelLevel: number): number {
  const factor = Math.max(0.25, 1 - cuartelLevel * 0.04);
  return Math.max(2, Math.round(u.time * factor));
}

export function startingResources(): Resources {
  return { madera: 200, hierro: 150, comida: 120, sangre: 20 };
}

export function emptyBuildings(): Record<string, number> {
  const b: Record<string, number> = {};
  for (const def of BUILDINGS) b[def.key] = def.key === "aserradero" || def.key === "mina" || def.key === "matadero" ? 1 : 0;
  return b;
}

export function _unused(_f: Faction) { /* keep import */ }