import { Link } from "@tanstack/react-router";
import { BloodButton } from "./BloodButton";

const links = [
  { to: "/", label: "Inicio" },
  { to: "/facciones", label: "Facciones" },
  { to: "/informacion", label: "Información" },
  { to: "/contacto", label: "Contacto" },
] as const;

export function Navigation() {
  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="text-2xl font-display text-blood drop-shadow-[0_0_12px_oklch(0.45_0.24_25/0.6)]">
            ✠
          </span>
          <span className="font-display text-lg tracking-widest text-bone">
            SANGRE&nbsp;ETERNA
          </span>
        </Link>
        <ul className="flex items-center gap-2 sm:gap-4">
          {links.map((l) => (
            <li key={l.to}>
              <BloodButton to={l.to} className="text-xs sm:text-sm !py-2 !px-3 sm:!px-5">
                {l.label}
              </BloodButton>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
