# Sangre Eterna

Sitio web del videojuego de fantasía oscura **Sangre Eterna**. Construido con
[TanStack Start](https://tanstack.com/start) (React 19 + Vite 7) y
[Tailwind CSS v4](https://tailwindcss.com/).

## Stack

- **Framework:** TanStack Start v1 (SSR + file-based routing en `src/routes/`)
- **UI:** React 19, Tailwind CSS v4, componentes shadcn/ui en `src/components/ui/`
- **Estilo del proyecto:** ver `mem/design/image-style.md` (prompt maestro de
  imágenes) y los tokens semánticos en `src/styles.css`.
- **Audio ambiente:** `src/components/site/AmbientAudio.tsx` — pista en bucle
  con control de volumen persistente (no se reinicia al cambiar de página).

## Desarrollo local

Requisitos: Node 20+ y [Bun](https://bun.sh) (o npm/pnpm).

```bash
bun install
bun run dev      # arranca el servidor de desarrollo en http://localhost:5173
bun run build    # build de producción
bun run lint     # ESLint
bun run format   # Prettier
```

## Estructura

```
src/
  routes/              # Rutas (file-based). __root.tsx es el layout global.
  components/site/     # Componentes propios del sitio (Hero, Navigation, ...).
  components/ui/       # Primitivos shadcn/ui.
  lib/factions.ts      # Catálogo de facciones del juego.
  assets/              # Imágenes generadas con el prompt maestro.
  styles.css           # Tokens de diseño (oklch) y utilidades globales.
public/audio/          # Pista de música ambiente.
mem/                   # Memoria del proyecto (estilo visual, decisiones).
```

### Añadir una página

1. Crea un archivo en `src/routes/`, por ejemplo `src/routes/lore.tsx`.
2. Exporta una `Route` con `createFileRoute("/lore")`.
3. El layout (navegación, footer, audio) se aplica automáticamente desde
   `src/routes/__root.tsx` — el componente de la ruta solo devuelve su contenido.

### Añadir una facción

1. Genera la imagen siguiendo el prompt maestro de `mem/design/image-style.md`
   y guárdala en `src/assets/faction-<id>.jpg`.
2. Añade una entrada al array `factions` en `src/lib/factions.ts`.

## Despliegue

El template está preparado para **Cloudflare Workers** (ver `wrangler.jsonc`)
y se publica directamente desde Lovable.

### Vercel

TanStack Start también funciona en Vercel. Para desplegar este repo en Vercel:

1. Importa el repositorio en [vercel.com/new](https://vercel.com/new).
2. Build command: `bun run build` · Output directory: `.output/public`.
3. Si quieres SSR completo en Vercel en lugar de Workers, cambia el preset en
   `vite.config.ts` a `tanstackStart: { target: "vercel" }` y elimina el
   `@cloudflare/vite-plugin` y `wrangler.jsonc`.

## GitHub

El proyecto está sincronizado con GitHub a través de la integración nativa
de Lovable. Los cambios hechos en Lovable se empujan automáticamente al repo
y los commits del repo aparecen en Lovable en tiempo real.
