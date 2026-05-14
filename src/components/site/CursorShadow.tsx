import { useEffect, useRef } from "react";

/**
 * Grim/gore cursor:
 *  - small dark blood-stained smear that lazily follows
 *  - sharp jagged iron reticle exactly under the pointer with a dripping blood tip
 *  - random tiny blood specks left on click
 */
export function CursorShadow() {
  const smearRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const splatLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    let lastSpeed = 0;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - tx;
      const dy = e.clientY - ty;
      lastSpeed = Math.min(20, Math.hypot(dx, dy));
      tx = e.clientX;
      ty = e.clientY;
      if (reticleRef.current) {
        reticleRef.current.style.transform =
          `translate(${tx}px, ${ty}px) translate(-50%, -50%) rotate(${(tx + ty) * 0.4}deg)`;
      }
    };

    const onDown = (e: MouseEvent) => {
      if (!splatLayerRef.current) return;
      const splat = document.createElement("span");
      splat.className = "cursor-splat";
      splat.style.left = `${e.clientX}px`;
      splat.style.top = `${e.clientY}px`;
      const r = 6 + Math.random() * 10;
      splat.style.width = `${r}px`;
      splat.style.height = `${r}px`;
      splatLayerRef.current.appendChild(splat);
      window.setTimeout(() => splat.remove(), 1400);
    };

    const tick = () => {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      if (smearRef.current) {
        const scale = 1 + Math.min(0.4, lastSpeed * 0.02);
        smearRef.current.style.transform =
          `translate(${cx}px, ${cy}px) translate(-50%, -50%) scale(${scale})`;
        lastSpeed *= 0.9;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={smearRef} className="cursor-smear" aria-hidden />
      <div ref={reticleRef} className="cursor-reticle" aria-hidden>
        <svg viewBox="-32 -32 64 64" width="40" height="40">
          {/* jagged iron blades */}
          <g className="reticle-blades" stroke="oklch(0.88 0.04 80)" strokeWidth="1.2" fill="none" strokeLinecap="square">
            <path d="M0 -22 L-2 -10 L0 -6 L2 -10 Z" fill="oklch(0.18 0.02 22)" />
            <path d="M0 22 L-2 10 L0 6 L2 10 Z" fill="oklch(0.18 0.02 22)" />
            <path d="M-22 0 L-10 -2 L-6 0 L-10 2 Z" fill="oklch(0.18 0.02 22)" />
            <path d="M22 0 L10 -2 L6 0 L10 2 Z" fill="oklch(0.18 0.02 22)" />
          </g>
          {/* center wound */}
          <circle r="2.4" fill="oklch(0.45 0.24 25)" />
          <circle r="1" fill="oklch(0.08 0 0)" />
          {/* hairline cracks */}
          <g stroke="oklch(0.45 0.24 25)" strokeWidth="0.6" opacity="0.85">
            <path d="M3 1 L9 4" />
            <path d="M-3 -1 L-9 -5" />
          </g>
        </svg>
        <span className="reticle-drip" />
      </div>
      <div ref={splatLayerRef} className="cursor-splat-layer" aria-hidden />
    </>
  );
}
