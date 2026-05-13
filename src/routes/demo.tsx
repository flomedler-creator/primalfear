import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { factions, factionById, type Faction } from "@/lib/factions";
import {
  BUILDINGS, RESOURCES, ZONES, FACTION_UNITS,
  buildingCost, buildingTime, storageCap, recruitTime, unitPower,
  startingResources, emptyBuildings, MAX_LEVEL,
  type ResourceKey, type Resources, type UnitDef, type ZoneDef,
} from "@/lib/game-data";

export const Route = createFileRoute("/demo")({
  component: Demo,
  head: () => ({
    meta: [
      { title: "DEMO — Grim Portal" },
      { name: "description", content: "Juega la demo: elige facción, alza tu aldea, recluta ejércitos y libra batallas PvE." },
    ],
  }),
});

/* =================================================================== */

interface BuildJob { key: string; toLevel: number; doneAt: number; }
interface RecruitJob { unitKey: string; qty: number; doneAt: number; perUnitMs: number; startedAt: number; }
interface ExpeditionJob { zoneKey: string; doneAt: number; armyPower: number; sentUnits: Record<string, number>; }
interface LogEntry { id: number; ts: number; kind: "info" | "win" | "loss"; text: string; }

interface GameState {
  factionId: string;
  resources: Resources;
  buildings: Record<string, number>;
  army: Record<string, number>;
  build: BuildJob | null;
  recruit: RecruitJob | null;
  expedition: ExpeditionJob | null;
  log: LogEntry[];
  defeated: string[];
}

const STORAGE_KEY = "grim-portal-demo-v1";

function loadState(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch { return null; }
}

function saveState(s: GameState) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function newGame(factionId: string): GameState {
  return {
    factionId,
    resources: startingResources(),
    buildings: emptyBuildings(),
    army: {},
    build: null, recruit: null, expedition: null,
    log: [{ id: Date.now(), ts: Date.now(), kind: "info", text: "Has alzado tu campamento. Que la sangre te guíe." }],
    defeated: [],
  };
}

/* =================================================================== */

function Demo() {
  const [state, setState] = useState<GameState | null>(null);
  const [mounted, setMounted] = useState(false);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    setState(loadState());
    setMounted(true);
    lastTickRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setState(prev => prev ? tick(prev, dt, now) : prev);
    }, 500);
    return () => clearInterval(id);
  }, [mounted]);

  useEffect(() => { if (mounted && state) saveState(state); }, [state, mounted]);

  if (!mounted) {
    return <div className="max-w-7xl mx-auto px-6 py-20 text-center text-muted-foreground font-heading tracking-[0.3em] text-sm">CARGANDO LA SANGRE...</div>;
  }
  if (!state) return <FactionPicker onPick={(id) => setState(newGame(id))} />;

  const faction = factionById(state.factionId);

  return (
    <GameUI
      state={state}
      faction={faction}
      onAction={(fn) => setState(prev => prev ? fn(prev) : prev)}
      onReset={() => { window.localStorage.removeItem(STORAGE_KEY); setState(null); }}
    />
  );
}

/* ========================== Tick / actions ========================= */

function tick(s: GameState, dt: number, now: number): GameState {
  let res = { ...s.resources };
  const cap = storageCap(s.buildings.templo ?? 0);

  for (const def of BUILDINGS) {
    if (!def.produces) continue;
    const lvl = s.buildings[def.key] ?? 0;
    if (lvl <= 0) continue;
    const rate = (def.ratePerLevel ?? 1) * lvl;
    res[def.produces] = Math.min(cap, (res[def.produces] ?? 0) + rate * dt);
  }

  let buildings = s.buildings;
  let build = s.build;
  let log = s.log;
  if (build && now >= build.doneAt) {
    buildings = { ...buildings, [build.key]: build.toLevel };
    log = pushLog(log, "info", `Has terminado: ${nameOfBuilding(build.key)} nivel ${build.toLevel}.`);
    build = null;
  }

  let army = s.army;
  let recruit = s.recruit;
  if (recruit) {
    if (now >= recruit.doneAt) {
      army = { ...army, [recruit.unitKey]: (army[recruit.unitKey] ?? 0) + recruit.qty };
      log = pushLog(log, "info", `Reclutados ${recruit.qty}× ${nameOfUnit(s.factionId, recruit.unitKey)}.`);
      recruit = null;
    }
  }

  let expedition = s.expedition;
  let defeated = s.defeated;
  if (expedition && now >= expedition.doneAt) {
    const zone = ZONES.find(z => z.key === expedition!.zoneKey)!;
    const result = resolveBattle(expedition.armyPower, zone, s.factionId, expedition.sentUnits, buildings);
    army = applyLosses(army, expedition.sentUnits, result.lossRatio);
    if (result.win) {
      res = clampRes(addRes(res, zone.reward), cap);
      log = pushLog(log, "win", `Victoria en ${zone.name}. Bajas: ${Math.round(result.lossRatio*100)}%. Botín saqueado.`);
      if (zone.boss && !defeated.includes(zone.key)) defeated = [...defeated, zone.key];
    } else {
      log = pushLog(log, "loss", `Derrota en ${zone.name}. Las tropas yacen entre el barro.`);
    }
    expedition = null;
  }

  return { ...s, resources: res, buildings, build, army, recruit, expedition, log, defeated };
}

function pushLog(log: LogEntry[], kind: LogEntry["kind"], text: string): LogEntry[] {
  return [{ id: Date.now() + Math.random(), ts: Date.now(), kind, text }, ...log].slice(0, 40);
}

function applyLosses(army: Record<string, number>, sent: Record<string, number>, ratio: number) {
  const next = { ...army };
  for (const k of Object.keys(sent)) {
    const lost = Math.round(sent[k] * ratio);
    next[k] = Math.max(0, (next[k] ?? 0) - lost);
  }
  return next;
}

function resolveBattle(power: number, zone: ZoneDef, factionId: string, sent: Record<string, number>, buildings: Record<string, number>) {
  const forja = buildings.forja ?? 0;
  const atkBoost = 1 + forja * 0.05;
  const effective = power * atkBoost;
  const win = effective >= zone.power;
  // loss ratio: lower if you overkill
  const ratioBase = win ? Math.max(0.05, 1 - effective / (zone.power * 2.2)) : Math.min(0.95, 0.5 + (zone.power / Math.max(1,effective)) * 0.2);
  return { win, lossRatio: Math.min(0.95, Math.max(0, ratioBase)), factionId, sent };
}

function addRes(a: Resources, b: Resources): Resources {
  return { madera:a.madera+b.madera, hierro:a.hierro+b.hierro, comida:a.comida+b.comida, sangre:a.sangre+b.sangre };
}
function subRes(a: Resources, b: Resources): Resources {
  return { madera:a.madera-b.madera, hierro:a.hierro-b.hierro, comida:a.comida-b.comida, sangre:a.sangre-b.sangre };
}
function canAfford(a: Resources, b: Resources): boolean {
  return a.madera>=b.madera && a.hierro>=b.hierro && a.comida>=b.comida && a.sangre>=b.sangre;
}
function clampRes(r: Resources, cap: number): Resources {
  return { madera: Math.min(cap,r.madera), hierro: Math.min(cap,r.hierro), comida: Math.min(cap,r.comida), sangre: Math.min(cap,r.sangre) };
}
function nameOfBuilding(k: string) { return BUILDINGS.find(b => b.key === k)?.name ?? k; }
function nameOfUnit(fid: string, k: string) { return FACTION_UNITS[fid]?.find(u => u.key === k)?.name ?? k; }

/* ============================ UI ================================ */

function FactionPicker({ onPick }: { onPick: (id: string) => void }) {
  const [sel, setSel] = useState<string | null>(null);
  const dark = factions.filter(f => f.side === "oscuridad");
  const light = factions.filter(f => f.side === "luz");
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <header className="text-center mb-10">
        <p className="font-heading tracking-[0.4em] text-blood text-xs mb-3">DEMO · ELIGE TU SANGRE</p>
        <h1 className="font-display text-5xl bleed-text">Forja tu Hueste</h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Elige una facción. Alza edificios, recluta tropas únicas de tu raza y conquista zonas y bosses
          en un mundo agonizante. Los tiempos son cortos: nada de esperas eternas.
        </p>
      </header>

      <FactionGrid title="LA OSCURIDAD" items={dark} sel={sel} setSel={setSel} />
      <FactionGrid title="LA LUZ"       items={light} sel={sel} setSel={setSel} />

      <div className="text-center mt-10">
        <button
          className="blood-btn"
          onClick={() => sel && onPick(sel)}
          disabled={!sel}
          style={{ opacity: sel ? 1 : 0.5 }}
        >
          <span className="corner corner-tl" /><span className="corner corner-tr" />
          <span className="corner corner-bl" /><span className="corner corner-br" />
          <span className="label">{sel ? `MARCHA CON ${factionById(sel).name.toUpperCase()}` : "ELIGE UNA FACCIÓN"}</span>
        </button>
      </div>
    </div>
  );
}

function FactionGrid({ title, items, sel, setSel }: { title: string; items: Faction[]; sel: string|null; setSel: (s:string)=>void }) {
  return (
    <section className="mb-10">
      <p className="font-heading tracking-[0.4em] text-blood text-xs mb-4">{title}</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(f => (
          <button key={f.id} onClick={() => setSel(f.id)} className={`faction-pick text-left ${sel===f.id?"selected":""}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="glyph">{f.glyph}</span>
              <h3 className="font-display text-lg text-bone">{f.name}</h3>
            </div>
            <p className="italic text-sm text-muted-foreground mb-2">{f.tagline}</p>
            <p className="text-sm text-foreground/80">{f.description}</p>
            <div className="parchment-divider my-3" />
            <p className="font-heading text-[10px] tracking-[0.2em] text-blood">UNIDADES</p>
            <ul className="text-xs text-foreground/75 mt-1 space-y-0.5">
              {FACTION_UNITS[f.id].map(u => <li key={u.key}>{u.ico} {u.name} · {u.role}</li>)}
            </ul>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ----------------- Main game UI ----------------- */

type Tab = "aldea" | "tropas" | "mapa" | "reportes";

function GameUI({ state, faction, onAction, onReset }: {
  state: GameState; faction: Faction;
  onAction: (fn: (s: GameState) => GameState) => void;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<Tab>("aldea");
  const cap = storageCap(state.buildings.templo ?? 0);
  const units = FACTION_UNITS[state.factionId];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 game-shell">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <span className="glyph">{faction.glyph}</span>
          <div>
            <p className="font-heading text-[10px] tracking-[0.3em] text-blood">{faction.side === "oscuridad" ? "HUESTE DE LA OSCURIDAD" : "HERALDOS DE LA LUZ"}</p>
            <h1 className="font-display text-3xl bleed-text">{faction.name}</h1>
          </div>
        </div>
        <button className="btn-rune" onClick={onReset}>Cambiar facción</button>
      </header>

      <ResourceBar res={state.resources} cap={cap} />

      <nav className="flex gap-2 border-b border-border mt-6 mb-6 overflow-x-auto">
        {(["aldea","tropas","mapa","reportes"] as Tab[]).map(t => (
          <button key={t} className={`tab-rune ${tab===t?"active":""}`} onClick={() => setTab(t)}>
            {t === "aldea" ? "Aldea" : t === "tropas" ? "Tropas" : t === "mapa" ? "Mapa" : "Reportes"}
          </button>
        ))}
      </nav>

      {tab === "aldea"   && <VillageTab state={state} onAction={onAction} />}
      {tab === "tropas"  && <TroopsTab  state={state} units={units} onAction={onAction} />}
      {tab === "mapa"    && <MapTab     state={state} units={units} onAction={onAction} />}
      {tab === "reportes"&& <LogTab     state={state} />}
    </div>
  );
}

/* ----------------- Resource bar ----------------- */

function ResourceBar({ res, cap }: { res: Resources; cap: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {RESOURCES.map(r => (
        <div key={r.key} className="res-pill">
          <span className="ico">{r.ico}</span>
          <span>{r.name}</span>
          <span className="text-ember">{Math.floor(res[r.key])}</span>
          <span className="text-muted-foreground">/ {cap}</span>
        </div>
      ))}
    </div>
  );
}

/* ----------------- Village tab ----------------- */

function VillageTab({ state, onAction }: { state: GameState; onAction: (fn:(s:GameState)=>GameState)=>void }) {
  const now = Date.now();
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {BUILDINGS.map(def => {
        const lvl = state.buildings[def.key] ?? 0;
        const upgrading = state.build?.key === def.key;
        const isMax = lvl >= MAX_LEVEL;
        const cost = buildingCost(lvl);
        const time = buildingTime(lvl);
        const canPay = canAfford(state.resources, cost);
        const blocked = !!state.build || isMax || !canPay;

        const prog = upgrading
          ? Math.min(1, 1 - (state.build!.doneAt - now) / (time * 1000))
          : 0;

        return (
          <div key={def.key} className="runic-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="glyph">{def.ico}</span>
                <div>
                  <h3 className="font-display text-lg text-bone">{def.name}</h3>
                  <p className="text-xs text-muted-foreground">Nivel <span className="text-ember">{lvl}</span> / {MAX_LEVEL}</p>
                </div>
              </div>
              <button
                className="btn-rune"
                disabled={blocked}
                onClick={() => {
                  onAction(s => {
                    if (s.build) return s;
                    const c = buildingCost(s.buildings[def.key] ?? 0);
                    if (!canAfford(s.resources, c)) return s;
                    return {
                      ...s,
                      resources: subRes(s.resources, c),
                      build: { key: def.key, toLevel: (s.buildings[def.key] ?? 0) + 1, doneAt: Date.now() + buildingTime(s.buildings[def.key] ?? 0) * 1000 }
                    };
                  });
                }}
              >
                {isMax ? "MÁX" : upgrading ? "EN OBRA" : "MEJORAR"}
              </button>
            </div>
            <p className="text-sm text-foreground/80 mt-3">{def.desc}</p>
            {def.produces && (
              <p className="text-xs text-blood mt-1">Produce {((def.ratePerLevel ?? 1) * Math.max(1,lvl)).toFixed(1)}/s de {def.produces}.</p>
            )}
            <div className="parchment-divider my-3" />
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {RESOURCES.map(r => (
                <span key={r.key} className={`res-pill ${state.resources[r.key] < cost[r.key] ? "opacity-60" : ""}`}>
                  <span className="ico">{r.ico}</span>{cost[r.key]}
                </span>
              ))}
              <span className="res-pill"><span className="ico">⏳</span>{fmtTime(time)}</span>
            </div>
            {upgrading && (
              <div className="mt-3">
                <div className="bar"><span style={{ width: `${prog*100}%` }} /></div>
                <p className="text-[11px] text-muted-foreground mt-1">Termina en {fmtTime(Math.max(0,(state.build!.doneAt - now)/1000))}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------- Troops tab ----------------- */

function TroopsTab({ state, units, onAction }: { state: GameState; units: UnitDef[]; onAction:(fn:(s:GameState)=>GameState)=>void }) {
  const cuartel = state.buildings.cuartel ?? 0;
  const now = Date.now();
  const noBarracks = cuartel < 1;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {noBarracks && (
        <div className="md:col-span-2 runic-card p-4 text-sm text-blood">
          Necesitas un <b>Cuartel</b> de nivel 1 para reclutar tropas. Vuelve a la Aldea y constrúyelo.
        </div>
      )}
      {units.map(u => {
        const own = state.army[u.key] ?? 0;
        const t = recruitTime(u, cuartel);
        const recruiting = state.recruit?.unitKey === u.key;
        const prog = recruiting
          ? 1 - (state.recruit!.doneAt - now) / ((state.recruit!.qty * state.recruit!.perUnitMs))
          : 0;

        return (
          <div key={u.key} className="runic-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="glyph">{u.ico}</span>
                <div>
                  <h3 className="font-display text-lg text-bone">{u.name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                </div>
              </div>
              <p className="font-heading text-sm text-ember">×{own}</p>
            </div>
            <p className="text-xs mt-3 text-foreground/80">ATQ <b className="text-ember">{u.atk}</b> · VIDA <b className="text-ember">{u.hp}</b> · poder <b>{Math.round(unitPower(u))}</b></p>
            <div className="flex flex-wrap gap-1.5 mt-3 text-[11px]">
              {RESOURCES.map(r => (
                <span key={r.key} className="res-pill"><span className="ico">{r.ico}</span>{u.cost[r.key]}</span>
              ))}
              <span className="res-pill"><span className="ico">⏳</span>{fmtTime(t)} c/u</span>
            </div>
            <div className="flex gap-2 mt-3">
              {[1, 5, 10].map(q => (
                <button
                  key={q}
                  className="btn-rune flex-1"
                  disabled={noBarracks || !!state.recruit || !canAfford(state.resources, mulRes(u.cost, q))}
                  onClick={() => onAction(s => {
                    if (s.recruit) return s;
                    const c = mulRes(u.cost, q);
                    if (!canAfford(s.resources, c)) return s;
                    const perUnitMs = recruitTime(u, s.buildings.cuartel ?? 0) * 1000;
                    return {
                      ...s,
                      resources: subRes(s.resources, c),
                      recruit: { unitKey: u.key, qty: q, perUnitMs, startedAt: Date.now(), doneAt: Date.now() + perUnitMs * q }
                    };
                  })}
                >
                  +{q}
                </button>
              ))}
            </div>
            {recruiting && (
              <div className="mt-3">
                <div className="bar"><span style={{ width: `${Math.max(0,Math.min(1,prog))*100}%` }} /></div>
                <p className="text-[11px] text-muted-foreground mt-1">{state.recruit!.qty}× listos en {fmtTime(Math.max(0,(state.recruit!.doneAt - now)/1000))}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function mulRes(c: Resources, n: number): Resources {
  return { madera: c.madera*n, hierro: c.hierro*n, comida: c.comida*n, sangre: c.sangre*n };
}

/* ----------------- Map / PvE tab ----------------- */

function MapTab({ state, units, onAction }: { state: GameState; units: UnitDef[]; onAction:(fn:(s:GameState)=>GameState)=>void }) {
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [zoneKey, setZoneKey] = useState<string>(ZONES[0].key);
  const now = Date.now();

  const armyEntries = units.map(u => ({ unit: u, owned: state.army[u.key] ?? 0 }));
  const sentPower = useMemo(() => armyEntries.reduce((acc, { unit }) => acc + unitPower(unit) * (draft[unit.key] ?? 0), 0), [armyEntries, draft]);
  const totalSent = Object.values(draft).reduce((a,b) => a + (b ?? 0), 0);
  const zone = ZONES.find(z => z.key === zoneKey)!;
  const onExpedition = !!state.expedition;
  const expProg = state.expedition ? 1 - (state.expedition.doneAt - now) / (zoneDuration(state.expedition.zoneKey) * 1000) : 0;

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-3">
        <WorldMap state={state} zoneKey={zoneKey} setZoneKey={setZoneKey} />
      </div>
      <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
        {ZONES.map(z => {
          const isSel = z.key === zoneKey;
          const beat = state.defeated.includes(z.key);
          return (
            <button key={z.key} className={`zone-tile text-left ${z.boss ? "boss" : ""}`} onClick={() => setZoneKey(z.key)} style={{ outline: isSel ? "1px solid var(--blood)" : "none" }}>
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg text-bone">{z.name} {beat && <span className="text-ember text-xs">✓ vencido</span>}</h3>
                <span className="font-heading text-xs tracking-widest text-blood">{z.boss ? "BOSS" : "ZONA"}</span>
              </div>
              {z.bossName && <p className="text-xs text-ember italic mt-0.5">{z.bossName}</p>}
              <p className="text-xs text-muted-foreground mt-1">{z.desc}</p>
              <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
                <span className="res-pill"><span className="ico">⚔</span>poder {z.power}</span>
                <span className="res-pill"><span className="ico">⏳</span>{fmtTime(z.duration)}</span>
                {RESOURCES.map(r => z.reward[r.key] ? (
                  <span key={r.key} className="res-pill"><span className="ico">{r.ico}</span>+{z.reward[r.key]}</span>
                ) : null)}
              </div>
            </button>
          );
        })}
      </div>

      <aside className="runic-card p-5 h-fit">
        <p className="font-heading text-[10px] tracking-[0.3em] text-blood">EXPEDICIÓN</p>
        <h3 className="font-display text-xl text-bone mt-1">{zone.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">Poder enemigo: <b className="text-ember">{zone.power}</b></p>

        <div className="parchment-divider my-3" />

        {onExpedition ? (
          <div>
            <p className="text-sm text-foreground/85">Tus tropas marchan a {ZONES.find(z=>z.key===state.expedition!.zoneKey)?.name}.</p>
            <div className="bar mt-2"><span style={{ width: `${Math.max(0,Math.min(1,expProg))*100}%` }} /></div>
            <p className="text-[11px] text-muted-foreground mt-1">Regresa en {fmtTime(Math.max(0,(state.expedition!.doneAt - now)/1000))}</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-foreground/80 mb-2">Compón tu ejército:</p>
            <div className="space-y-2">
              {armyEntries.map(({ unit, owned }) => (
                <div key={unit.key} className="flex items-center gap-2 text-sm">
                  <span>{unit.ico}</span>
                  <span className="flex-1 truncate">{unit.name}</span>
                  <span className="text-muted-foreground text-xs">x{owned}</span>
                  <input
                    type="number" min={0} max={owned} value={draft[unit.key] ?? 0}
                    onChange={e => {
                      const v = Math.max(0, Math.min(owned, Number(e.target.value) || 0));
                      setDraft(d => ({ ...d, [unit.key]: v }));
                    }}
                    className="w-16 bg-input border border-border px-2 py-1 text-bone text-right"
                  />
                </div>
              ))}
            </div>
            <div className="parchment-divider my-3" />
            <div className="flex items-center justify-between text-sm">
              <span>Tropas: <b className="text-ember">{totalSent}</b></span>
              <span>Poder: <b className="text-ember">{Math.round(sentPower)}</b></span>
            </div>
            <p className={`text-xs mt-1 ${sentPower >= zone.power ? "text-ember" : "text-blood"}`}>
              {sentPower >= zone.power ? "Probabilidad de victoria favorable." : "Insuficiente — caerás entre el barro."}
            </p>
            <button
              className="btn-rune w-full mt-3"
              disabled={totalSent === 0}
              onClick={() => onAction(s => {
                if (s.expedition) return s;
                const sent = Object.fromEntries(Object.entries(draft).filter(([,v]) => v && v > 0));
                if (Object.keys(sent).length === 0) return s;
                // verify still own
                for (const [k,v] of Object.entries(sent)) if ((s.army[k] ?? 0) < v) return s;
                return {
                  ...s,
                  expedition: {
                    zoneKey: zone.key,
                    armyPower: sentPower,
                    sentUnits: sent as Record<string, number>,
                    doneAt: Date.now() + zone.duration * 1000,
                  },
                };
              })}
            >
              MARCHAR
            </button>
          </>
        )}
      </aside>
    </div>
  );
}

function zoneDuration(key: string) { return ZONES.find(z => z.key === key)?.duration ?? 60; }

/* ----------------- World Map ----------------- */

function WorldMap({ state, zoneKey, setZoneKey }: {
  state: GameState; zoneKey: string; setZoneKey: (k: string) => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const village = { x: 50, y: 50 };
  const exp = state.expedition;
  const expZone = exp ? ZONES.find(z => z.key === exp.zoneKey) : null;
  const totalMs = expZone ? expZone.duration * 1000 : 1;
  const elapsed = exp ? Math.max(0, totalMs - (exp.doneAt - now)) : 0;
  // 0 -> 0.5 marching out, 0.5 -> 1 returning
  const phase = exp ? Math.min(1, elapsed / totalMs) : 0;
  const t = exp ? (phase < 0.5 ? phase * 2 : (1 - phase) * 2) : 0;
  const troopPos = expZone
    ? { x: village.x + (expZone.x - village.x) * t, y: village.y + (expZone.y - village.y) * t }
    : null;
  const totalTroops = exp ? Object.values(exp.sentUnits).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="runic-card p-3 mb-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="font-heading text-[10px] tracking-[0.3em] text-blood">MAPA DE LAS TIERRAS MUERTAS</p>
        {exp && expZone && (
          <p className="text-[11px] text-ember">
            {phase < 0.5 ? "Marchando" : "Regresando"} · {totalTroops} tropas · {expZone.name}
          </p>
        )}
      </div>
      <div className="world-map relative w-full overflow-hidden rounded-sm border border-border" style={{ aspectRatio: "16 / 9" }}>
        <MapScenery />
        {/* path SVG */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          {ZONES.map(z => (
            <line key={z.key} x1={village.x} y1={village.y} x2={z.x} y2={z.y}
              stroke={z.boss ? "rgba(180,30,30,0.45)" : "rgba(200,170,130,0.28)"}
              strokeWidth={0.3} strokeDasharray="1.4 1.4" />
          ))}
          {exp && expZone && (
            <line x1={village.x} y1={village.y} x2={expZone.x} y2={expZone.y}
              stroke="rgba(220,40,40,0.9)" strokeWidth={0.55} strokeDasharray="2 1" />
          )}
        </svg>

        {/* village */}
        <MapPin x={village.x} y={village.y} title="Tu Aldea" kind="village" />

        {/* zones */}
        {ZONES.map(z => (
          <MapPin key={z.key} x={z.x} y={z.y} title={z.name}
            kind={z.boss ? "boss" : "zone"}
            selected={z.key === zoneKey}
            defeated={state.defeated.includes(z.key)}
            label={z.boss ? (z.bossName ?? z.name) : z.name}
            onClick={() => setZoneKey(z.key)}
          />
        ))}

        {/* marching troops */}
        {troopPos && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${troopPos.x}%`, top: `${troopPos.y}%` }}
          >
            <div className="px-1.5 py-0.5 rounded-sm bg-blood/80 border border-ember/60 text-bone text-[10px] font-heading tracking-widest shadow-lg whitespace-nowrap">
              ⚔ {totalTroops}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-3 mt-2 px-1 text-[10px] text-muted-foreground">
        <span><span className="inline-block w-2 h-2 align-middle mr-1" style={{ background: "var(--ember)" }} />Aldea</span>
        <span><span className="inline-block w-2 h-2 align-middle mr-1" style={{ background: "rgba(180,150,120,0.6)" }} />Zona</span>
        <span><span className="inline-block w-2 h-2 align-middle mr-1" style={{ background: "var(--blood)" }} />Boss</span>
        <span>✓ vencido</span>
      </div>
    </div>
  );
}

function MapPin({ x, y, title, kind, selected, defeated, label, onClick }: {
  x: number; y: number; title: string;
  kind: "village" | "zone" | "boss";
  selected?: boolean; defeated?: boolean; label?: string;
  onClick?: () => void;
}) {
  const size = kind === "boss" ? 18 : kind === "village" ? 16 : 12;
  const bg = kind === "village" ? "var(--ember)" : kind === "boss" ? "var(--blood)" : "rgba(120,90,70,0.85)";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="absolute -translate-x-1/2 -translate-y-1/2 group"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div
        className="rounded-full border flex items-center justify-center text-bone text-[10px]"
        style={{
          width: size, height: size, background: bg,
          borderColor: selected ? "var(--ember)" : "rgba(0,0,0,0.6)",
          boxShadow: selected ? "0 0 0 2px rgba(220,180,100,0.5), 0 0 12px rgba(220,40,40,0.6)" : "0 2px 6px rgba(0,0,0,0.6)",
          opacity: defeated ? 0.55 : 1,
        }}
      >
        {kind === "village" ? "⌂" : kind === "boss" ? "☠" : ""}
      </div>
      {label && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded-sm bg-background/80 border border-border text-[9px] text-bone whitespace-nowrap font-heading tracking-wider opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {label}{defeated ? " ✓" : ""}
        </div>
      )}
    </button>
  );
}

/* ----------------- Log tab ----------------- */

/* ----------------- Map scenery (decorative) ----------------- */

function MapScenery() {
  // Decorative painted-style scenery layer: ground, rivers, mountains,
  // forests, villages, ruins, gravestones — all in the dark palette.
  return (
    <svg
      viewBox="0 0 100 56"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <defs>
        <radialGradient id="ground" cx="50%" cy="55%" r="80%">
          <stop offset="0%" stopColor="#3a2018" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#1c100d" stopOpacity="1" />
          <stop offset="100%" stopColor="#08050a" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="bloodMoon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7a1a1a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#7a1a1a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a1414" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#1a0808" stopOpacity="0.7" />
        </linearGradient>
        <pattern id="grain" width="2" height="2" patternUnits="userSpaceOnUse">
          <rect width="2" height="2" fill="#000" opacity="0.06" />
          <circle cx="0.4" cy="0.5" r="0.18" fill="#fff" opacity="0.04" />
        </pattern>
      </defs>

      {/* Base ground */}
      <rect width="100" height="56" fill="url(#ground)" />
      <ellipse cx="50" cy="28" rx="45" ry="22" fill="url(#bloodMoon)" />

      {/* Distant mountain silhouettes (back) */}
      <path
        d="M0 24 L8 14 L14 20 L22 10 L30 22 L38 14 L46 22 L54 12 L62 22 L72 14 L82 22 L92 12 L100 22 L100 32 L0 32 Z"
        fill="#0d0709" opacity="0.9"
      />
      {/* Mid mountains */}
      <path
        d="M0 30 L10 22 L18 28 L28 18 L36 28 L44 24 L54 30 L64 22 L74 30 L86 24 L100 30 L100 40 L0 40 Z"
        fill="#160b0c" opacity="0.95"
      />

      {/* River of blood meandering through the map */}
      <path
        d="M-2 38 C 12 34, 22 44, 34 38 S 56 30, 66 36 S 86 44, 102 38 L 102 42 C 86 48, 66 40, 54 44 S 22 48, -2 42 Z"
        fill="url(#river)"
      />
      <path
        d="M-2 38 C 12 34, 22 44, 34 38 S 56 30, 66 36 S 86 44, 102 38"
        stroke="#8b1d1d" strokeWidth="0.25" fill="none" opacity="0.55"
      />

      {/* Dead forests (clusters of triangular trees) */}
      <ForestCluster cx={18} cy={18} count={9} />
      <ForestCluster cx={66} cy={16} count={11} />
      <ForestCluster cx={28} cy={48} count={8} />
      <ForestCluster cx={82} cy={50} count={7} />
      <ForestCluster cx={48} cy={20} count={5} dim />

      {/* Villages (huts) */}
      <Village cx={50} cy={32} houses={5} />
      <Village cx={10} cy={46} houses={3} dim />
      <Village cx={92} cy={32} houses={3} dim />

      {/* Ruins / standing stones */}
      <RuinCluster cx={40} cy={42} />
      <RuinCluster cx={74} cy={44} />

      {/* Graveyard near catacombs */}
      <Graveyard cx={48} cy={50} />

      {/* Crows (silhouettes) */}
      <g fill="#000" opacity="0.7">
        <path d="M22 8 q1 -0.6 2 0 q1 -0.6 2 0" stroke="#000" strokeWidth="0.2" fill="none" />
        <path d="M58 6 q1 -0.6 2 0 q1 -0.6 2 0" stroke="#000" strokeWidth="0.2" fill="none" />
        <path d="M78 10 q1 -0.6 2 0 q1 -0.6 2 0" stroke="#000" strokeWidth="0.2" fill="none" />
      </g>

      {/* Fog overlays */}
      <ellipse cx="20" cy="40" rx="30" ry="6" fill="#0a0608" opacity="0.55" />
      <ellipse cx="80" cy="42" rx="28" ry="5" fill="#0a0608" opacity="0.5" />

      {/* Grain */}
      <rect width="100" height="56" fill="url(#grain)" opacity="0.6" />
      {/* Vignette */}
      <rect width="100" height="56" fill="black" opacity="0.0" />
    </svg>
  );
}

function ForestCluster({ cx, cy, count, dim }: { cx: number; cy: number; count: number; dim?: boolean }) {
  const trees = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = 1.5 + (i % 3) * 1.2;
    const x = cx + Math.cos(angle) * r + ((i * 7) % 5) * 0.3;
    const y = cy + Math.sin(angle) * r * 0.55 + ((i * 3) % 4) * 0.2;
    const h = 1.6 + ((i * 11) % 5) * 0.25;
    return { x, y, h, key: i };
  });
  return (
    <g opacity={dim ? 0.55 : 0.95}>
      {trees.map((t) => (
        <g key={t.key}>
          {/* trunk */}
          <rect x={t.x - 0.07} y={t.y - 0.1} width="0.14" height={t.h * 0.4} fill="#0a0606" />
          {/* canopy as triangle stack */}
          <path
            d={`M${t.x} ${t.y - t.h} L${t.x - t.h * 0.5} ${t.y} L${t.x + t.h * 0.5} ${t.y} Z`}
            fill="#0e1a10"
            stroke="#000"
            strokeWidth="0.06"
          />
          <path
            d={`M${t.x} ${t.y - t.h * 0.7} L${t.x - t.h * 0.4} ${t.y - t.h * 0.1} L${t.x + t.h * 0.4} ${t.y - t.h * 0.1} Z`}
            fill="#152418"
            opacity="0.85"
          />
        </g>
      ))}
    </g>
  );
}

function Village({ cx, cy, houses, dim }: { cx: number; cy: number; houses: number; dim?: boolean }) {
  const arr = Array.from({ length: houses }, (_, i) => {
    const angle = (i / houses) * Math.PI * 2;
    const r = 1.6 + (i % 2) * 0.6;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r * 0.6;
    return { x, y, key: i, smoke: i % 2 === 0 };
  });
  return (
    <g opacity={dim ? 0.7 : 1}>
      {arr.map((h) => (
        <g key={h.key}>
          {/* house body */}
          <rect x={h.x - 0.45} y={h.y - 0.2} width="0.9" height="0.6" fill="#1a0e0a" stroke="#000" strokeWidth="0.05" />
          {/* roof */}
          <path
            d={`M${h.x - 0.55} ${h.y - 0.2} L${h.x} ${h.y - 0.7} L${h.x + 0.55} ${h.y - 0.2} Z`}
            fill="#2b1410"
            stroke="#000"
            strokeWidth="0.06"
          />
          {/* tiny ember window */}
          <rect x={h.x - 0.08} y={h.y} width="0.16" height="0.16" fill="#c9531a" opacity="0.85" />
          {/* smoke */}
          {h.smoke && (
            <path
              d={`M${h.x} ${h.y - 0.7} q0.3 -0.5 0 -1.2 q-0.3 -0.5 0 -1`}
              stroke="#3a2a26"
              strokeWidth="0.18"
              fill="none"
              opacity="0.55"
            />
          )}
        </g>
      ))}
    </g>
  );
}

function RuinCluster({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g opacity="0.75">
      <rect x={cx - 1.2} y={cy - 1.4} width="0.4" height="1.8" fill="#1a1614" stroke="#000" strokeWidth="0.05" />
      <rect x={cx - 0.4} y={cy - 1.0} width="0.4" height="1.4" fill="#1a1614" stroke="#000" strokeWidth="0.05" />
      <rect x={cx + 0.4} y={cy - 1.6} width="0.4" height="2.0" fill="#1a1614" stroke="#000" strokeWidth="0.05" />
      <rect x={cx + 1.2} y={cy - 0.8} width="0.4" height="1.2" fill="#1a1614" stroke="#000" strokeWidth="0.05" />
      {/* fallen lintel */}
      <rect x={cx - 1.4} y={cy - 1.6} width="3.4" height="0.18" fill="#0e0c0a" />
    </g>
  );
}

function Graveyard({ cx, cy }: { cx: number; cy: number }) {
  const stones = [
    { x: -1.5, y: 0, h: 0.7 },
    { x: -0.7, y: 0.2, h: 0.5 },
    { x: 0.1, y: 0, h: 0.8 },
    { x: 0.9, y: 0.3, h: 0.55 },
    { x: 1.7, y: 0, h: 0.7 },
  ];
  return (
    <g opacity="0.85">
      {stones.map((s, i) => (
        <path
          key={i}
          d={`M${cx + s.x - 0.25} ${cy + s.y} v${-s.h} a0.25 0.25 0 0 1 0.5 0 v${s.h} z`}
          fill="#1f1a18"
          stroke="#000"
          strokeWidth="0.05"
        />
      ))}
    </g>
  );
}

/* ----------------- Log tab redux ----------------- */

function LogTab({ state }: { state: GameState }) {
  return (
    <div className="runic-card p-5">
      <p className="font-heading text-[10px] tracking-[0.3em] text-blood mb-3">CRÓNICA DE SANGRE</p>
      {state.log.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aún no hay nada que contar.</p>
      ) : (
        <div className="divide-y divide-border">
          {state.log.map(l => (
            <p key={l.id} className={`log-line ${l.kind === "win" ? "win" : l.kind === "loss" ? "loss" : ""}`}>
              <span className="text-muted-foreground text-xs mr-2">{new Date(l.ts).toLocaleTimeString()}</span>
              {l.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------- helpers ----------------- */

function fmtTime(s: number): string {
  s = Math.max(0, Math.round(s));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}
