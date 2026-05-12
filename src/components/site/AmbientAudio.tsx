import { useEffect, useRef, useState } from "react";
import audioSrc from "/audio/ambient-battle.m4a?url";

const STORAGE_KEY = "se_audio_settings_v1";
const DEFAULT_VOLUME = 0.18;

export function AmbientAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState<number>(DEFAULT_VOLUME);
  const [muted, setMuted] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);

  // Load saved settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as { volume?: number; muted?: boolean };
        if (typeof s.volume === "number") setVolume(Math.min(1, Math.max(0, s.volume)));
        if (typeof s.muted === "boolean") setMuted(s.muted);
      }
    } catch {
      /* noop */
    }
  }, []);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume, muted }));
    } catch {
      /* noop */
    }
  }, [volume, muted]);

  // Apply volume to audio element
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    a.muted = muted;
  }, [volume, muted]);

  // Start playback after first user interaction (browser autoplay policies)
  useEffect(() => {
    if (started) return;
    const tryPlay = async () => {
      const a = audioRef.current;
      if (!a) return;
      try {
        a.volume = volume;
        a.muted = muted;
        await a.play();
        setStarted(true);
      } catch {
        /* will retry on next interaction */
      }
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];
    const handler = () => {
      tryPlay();
    };
    events.forEach((ev) => window.addEventListener(ev, handler, { once: false, passive: true }));
    // attempt immediate play (works if permission already granted)
    tryPlay();
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handler));
    };
  }, [started, volume, muted]);

  const toggleMute = () => setMuted((m) => !m);

  return (
    <>
      <audio ref={audioRef} src={audioSrc} loop preload="auto" />
      <div className="fixed bottom-5 right-5 z-50 select-none">
        <div
          className={`flex items-center gap-3 px-3 py-2 rounded-full border border-[var(--blood-deep)] bg-background/80 backdrop-blur-md shadow-[0_0_24px_oklch(0_0_0/0.6)] transition-all duration-300 ${
            open ? "pr-4" : ""
          }`}
        >
          <button
            type="button"
            aria-label={muted ? "Activar música" : "Silenciar música"}
            onClick={toggleMute}
            className="w-8 h-8 grid place-items-center rounded-full text-bone hover:text-blood transition-colors"
          >
            {muted || volume === 0 ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.59 3L20 8.41 18.59 7 15 10.59 11.41 7 10 8.41 13.59 12 10 15.59 11.41 17 15 13.41 18.59 17 20 15.59 16.59 12z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Volumen"
            className="text-[10px] tracking-[0.3em] uppercase text-bone/70 hover:text-blood transition-colors font-heading"
          >
            Música
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              open ? "w-28 opacity-100" : "w-0 opacity-0"
            }`}
          >
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                if (v > 0 && muted) setMuted(false);
              }}
              className="ambient-slider w-full"
              aria-label="Nivel de volumen"
            />
          </div>
        </div>
      </div>
    </>
  );
}