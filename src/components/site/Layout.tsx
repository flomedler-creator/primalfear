import type { ReactNode } from "react";
import { CursorShadow } from "./CursorShadow";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";
import { AmbientAudio } from "./AmbientAudio";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <CursorShadow />
      <Navigation />
      <main className="pt-24">{children}</main>
      <Footer />
      <AmbientAudio />
    </div>
  );
}
