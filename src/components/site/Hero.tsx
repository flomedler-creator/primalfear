import heroImg from "@/assets/hero-battle.jpg";
import { BloodButton } from "./BloodButton";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden noise">
      <img
        src={heroImg}
        alt="Batalla épica entre las huestes de la luz y la oscuridad"
        width={1920}
        height={1088}
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0.10_0.05_22/0.85)_80%)]" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24 text-center">
        <p className="font-heading tracking-[0.5em] text-blood text-xs sm:text-sm mb-6 flicker">
          UN VIDEOJUEGO DE GUERRA OSCURA
        </p>
        <h1 className="bleed-text font-display text-5xl sm:text-7xl md:text-8xl leading-[0.95]">
          Grim
          <br />
          Portal
        </h1>
        <p className="mt-8 text-lg sm:text-xl text-foreground/85 max-w-2xl mx-auto leading-relaxed">
          Cuando la última luna sangre, las hordas marcharán. Elige tu bando entre
          la <span className="text-blood">putrefacción de la oscuridad</span> y los
          <span className="text-bone"> últimos defensores</span> de un mundo agonizante.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <BloodButton to="/facciones">Explorar Facciones</BloodButton>
          <BloodButton to="/demo">Jugar Demo</BloodButton>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
}
