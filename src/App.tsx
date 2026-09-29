import { useEffect, useState } from "react";
import FlipBook from "./flipbook/FlipBook";
import { lookbookLeaves } from "./lookbook/Pages";

export default function App() {
  const [entered, setEntered] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 5200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-[#171310]">
      {/* Ambient environment — warm studio light + subtle vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% -10%, #35291d 0%, #221a13 38%, #141010 78%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 30%, rgba(255,214,150,0.10), transparent 70%)",
        }}
      />
      {/* Fine grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.05) 0.5px, transparent 0.5px)",
          backgroundSize: "3px 3px",
        }}
      />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
        <span className="font-display text-sm tracking-[0.5em] text-amber-50/90 md:text-base">
          MERIDIAN
        </span>
        <span className="hidden text-[0.6rem] uppercase tracking-[0.4em] text-amber-100/40 sm:block">
          The Autumn Lookbook · N°04
        </span>
        <span className="text-[0.6rem] uppercase tracking-[0.35em] text-amber-100/40">
          2026
        </span>
      </header>

      {/* Stage */}
      <main className="relative z-10 min-h-0 flex-1 px-2 pb-2 md:px-6">
        <FlipBook leaves={lookbookLeaves} pageRatio={0.72} />
      </main>

      {/* Swipe / drag hint */}
      {showHint && entered && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 z-30 -translate-x-1/2 md:bottom-20">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 backdrop-blur-md">
            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-white/70">
              Drag or swipe to turn
            </span>
            <span className="hint-float text-amber-200">→</span>
          </div>
        </div>
      )}

      {/* Intro overlay */}
      {!entered && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#141010]/80 backdrop-blur-sm">
          <div className="fade-up text-center">
            <p className="mb-4 text-[0.62rem] uppercase tracking-[0.5em] text-amber-200/80">
              Meridian Atelier presents
            </p>
            <h1 className="font-display text-[clamp(2.4rem,8vw,5rem)] font-semibold leading-[0.95] text-amber-50">
              Quiet Luxury
            </h1>
            <p className="mx-auto mt-5 max-w-[34ch] text-sm leading-relaxed text-amber-100/50">
              An interactive lookbook. Turn each page as you would in print —
              drag, hold, and release.
            </p>
            <button
              onClick={() => setEntered(true)}
              className="mt-9 rounded-full border border-amber-200/40 px-9 py-3 text-[0.62rem] uppercase tracking-[0.4em] text-amber-100 transition-all duration-300 hover:bg-amber-200/10 hover:tracking-[0.5em]"
            >
              Open the Book
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
