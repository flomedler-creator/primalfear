import { Link } from "@tanstack/react-router";
import { BloodButton } from "./BloodButton";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/facciones", label: "Facciones" },
  { to: "/informacion", label: "Información" },
  { to: "/demo", label: "Demo" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function Navigation() {
  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-background/60 border-y border-[oklch(0.22_0.04_25)] relative">
      {/* Side ornamental accents */}
      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-10 w-[2px] bg-gradient-to-b from-transparent via-blood to-transparent opacity-70" />
      <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-10 w-[2px] bg-gradient-to-b from-transparent via-blood to-transparent opacity-70" />
      {/* Bottom hairline glow */}
      <span className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--blood-deep)] to-transparent" />

      <nav className="max-w-7xl mx-auto px-8 py-3.5 flex items-center justify-between gap-6">
        <Link to="/" className="group flex items-center gap-3">
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-blood drop-shadow-[0_0_10px_oklch(0.45_0.24_25/0.7)] transition-transform duration-500 group-hover:rotate-12"
          >
            <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
          </svg>
          <span className="font-display text-lg tracking-[0.25em] text-bone drop-shadow-[2px_2px_0_rgba(0,0,0,0.9)]">
            GRIM&nbsp;<span className="text-blood">PORTAL</span>
          </span>
        </Link>

        <ul className="flex items-center">
          <li
            aria-hidden
            className="hidden sm:block h-7 w-px mx-2 bg-gradient-to-b from-transparent via-[var(--blood-deep)] to-transparent"
          />
          {links.map((l, i) => (
            <li key={l.to} className="flex items-center">
              <BloodButton
                to={l.to}
                className="blood-btn--ghost text-[11px] sm:text-xs"
              >
                {l.label}
              </BloodButton>
              {i < links.length - 1 && (
                <span
                  aria-hidden
                  className="hidden sm:block h-4 w-px bg-[var(--blood-deep)] opacity-50"
                />
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
