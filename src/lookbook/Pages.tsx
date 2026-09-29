import type { Leaf } from "../flipbook/types";

/* Reusable editorial building blocks ------------------------------------- */

function ImagePage({
  src,
  align = "bottom",
  kicker,
  title,
}: {
  src: string;
  align?: "bottom" | "top";
  kicker?: string;
  title?: string;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e8e0d2]">
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
      <div
        className={`absolute inset-x-0 ${
          align === "bottom" ? "bottom-0" : "top-0"
        } p-[6%]`}
        style={{
          background:
            align === "bottom"
              ? "linear-gradient(0deg, rgba(20,15,10,0.72), transparent)"
              : "linear-gradient(180deg, rgba(20,15,10,0.6), transparent)",
        }}
      >
        {kicker && (
          <p className="mb-2 text-[0.62rem] font-medium uppercase tracking-[0.4em] text-amber-200/90">
            {kicker}
          </p>
        )}
        {title && (
          <h2 className="font-display text-[clamp(1.4rem,3.4vw,2.6rem)] font-medium leading-[1.05] text-white">
            {title}
          </h2>
        )}
      </div>
    </div>
  );
}

function TextPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-center bg-[#f7f2e9] px-[9%] py-[8%] text-[#2b241b]">
      {children}
    </div>
  );
}

/* --------------------------------------------------------------------------
 * The lookbook leaves
 * ------------------------------------------------------------------------ */
export const lookbookLeaves: Leaf[] = [
  // Leaf 0 — Cover (front) / Contents (back)
  {
    id: "cover",
    front: (
      <div className="relative h-full w-full overflow-hidden bg-[#141210]">
        <img
          src="/images/cover.jpg"
          alt=""
          className="h-full w-full object-cover opacity-95"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
        <div className="absolute inset-0 flex flex-col justify-between p-[8%]">
          <div className="flex items-center justify-between">
            <span className="font-display text-sm tracking-[0.5em] text-white">
              MERIDIAN
            </span>
            <span className="text-[0.6rem] uppercase tracking-[0.35em] text-white/70">
              N°04
            </span>
          </div>
          <div>
            <p className="mb-3 text-[0.62rem] uppercase tracking-[0.45em] text-amber-200">
              The Autumn Lookbook · 2026
            </p>
            <h1 className="font-display text-[clamp(2.2rem,6vw,4.4rem)] font-semibold leading-[0.95] text-white">
              Quiet
              <br />
              Luxury
            </h1>
            <p className="mt-4 max-w-[26ch] text-[0.72rem] leading-relaxed text-white/75">
              A study in restraint — soft tailoring, earthen tones and the art
              of the understated.
            </p>
          </div>
        </div>
      </div>
    ),
    back: (
      <TextPage>
        <p className="mb-6 text-[0.6rem] uppercase tracking-[0.45em] text-amber-700/80">
          Contents
        </p>
        <ol className="space-y-5">
          {[
            ["01", "The Editor's Note", "p. 03"],
            ["02", "Structured Softness", "p. 05"],
            ["03", "Golden Hour", "p. 07"],
            ["04", "Desert Reverie", "p. 09"],
            ["05", "The Collection", "p. 11"],
          ].map(([n, t, p]) => (
            <li
              key={n}
              className="flex items-baseline justify-between border-b border-[#2b241b]/10 pb-3"
            >
              <span className="flex items-baseline gap-4">
                <span className="font-display text-sm text-amber-700/70">
                  {n}
                </span>
                <span className="font-display text-[clamp(0.95rem,2.4vw,1.35rem)]">
                  {t}
                </span>
              </span>
              <span className="text-[0.6rem] tracking-widest text-[#2b241b]/50">
                {p}
              </span>
            </li>
          ))}
        </ol>
      </TextPage>
    ),
  },

  // Leaf 1 — Editor's note (front) / Structured softness image (back)
  {
    id: "leaf-1",
    front: (
      <TextPage>
        <p className="mb-4 text-[0.6rem] uppercase tracking-[0.45em] text-amber-700/80">
          The Editor's Note
        </p>
        <h2 className="font-display text-[clamp(1.5rem,3.6vw,2.4rem)] font-medium leading-[1.1]">
          Beauty lives in the details you almost miss.
        </h2>
        <div className="mt-6 space-y-4 text-[0.82rem] leading-relaxed text-[#2b241b]/75">
          <p className="first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-5xl first-letter:leading-[0.8] first-letter:text-amber-800">
            This season we return to the essentials — the weight of a well-cut
            coat, the way morning light falls across raw linen, the confidence
            of a palette drawn entirely from the earth.
          </p>
          <p>
            Every look was photographed in natural light, unhurried, allowing
            texture and silhouette to speak for themselves. What remains is a
            wardrobe built to outlast the noise.
          </p>
        </div>
        <p className="mt-8 font-display text-sm italic text-[#2b241b]/60">
          — A. Meridian, Creative Director
        </p>
      </TextPage>
    ),
    back: (
      <ImagePage
        src="/images/spread1.jpg"
        kicker="Look 01 · The Overcoat"
        title="Structured Softness"
      />
    ),
  },

  // Leaf 2 — Details text (front) / Golden hour image (back)
  {
    id: "leaf-2",
    front: (
      <TextPage>
        <p className="mb-4 text-[0.6rem] uppercase tracking-[0.45em] text-amber-700/80">
          Materials
        </p>
        <h2 className="font-display text-[clamp(1.4rem,3.4vw,2.2rem)] font-medium leading-[1.1]">
          Cashmere, wool &amp; the warmth of gold.
        </h2>
        <ul className="mt-8 space-y-6">
          {[
            ["Fabric", "Double-faced virgin wool, 720gsm"],
            ["Palette", "Sand · Camel · Terracotta · Ivory"],
            ["Accents", "Brushed antique gold hardware"],
            ["Origin", "Woven in Biella, Italy"],
          ].map(([k, v]) => (
            <li key={k}>
              <p className="text-[0.58rem] uppercase tracking-[0.3em] text-amber-700/70">
                {k}
              </p>
              <p className="mt-1 font-display text-[clamp(0.95rem,2.2vw,1.2rem)]">
                {v}
              </p>
            </li>
          ))}
        </ul>
      </TextPage>
    ),
    back: (
      <ImagePage
        src="/images/spread2.jpg"
        kicker="Look 02 · The Detail"
        title="Golden Hour"
      />
    ),
  },

  // Leaf 3 — Quote (front) / Desert image (back)
  {
    id: "leaf-3",
    front: (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-[#2b241b] px-[10%] text-center text-[#f7f2e9]">
        <span className="mb-8 font-display text-6xl leading-none text-amber-300/60">
          “
        </span>
        <p className="font-display text-[clamp(1.3rem,3.2vw,2rem)] font-normal leading-[1.35] italic">
          Elegance is not standing out, but being remembered.
        </p>
        <p className="mt-8 text-[0.6rem] uppercase tracking-[0.4em] text-amber-300/70">
          The Meridian Philosophy
        </p>
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 0%, rgba(210,170,110,0.18), transparent 60%)",
          }}
        />
      </div>
    ),
    back: (
      <ImagePage
        src="/images/spread3.jpg"
        kicker="Look 03 · The Escape"
        title="Desert Reverie"
      />
    ),
  },

  // Leaf 4 — Collection grid (front) / Back cover (back)
  {
    id: "leaf-4",
    front: (
      <TextPage>
        <p className="mb-5 text-[0.6rem] uppercase tracking-[0.45em] text-amber-700/80">
          The Collection
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["The Overcoat", "$1,290", "/images/spread1.jpg"],
            ["The Knit", "$540", "/images/spread2.jpg"],
            ["The Slip", "$680", "/images/spread3.jpg"],
            ["The Cover", "$1,100", "/images/cover.jpg"],
          ].map(([name, price, src]) => (
            <div key={name} className="group">
              <div className="aspect-[3/4] overflow-hidden rounded-sm bg-[#e8e0d2]">
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <p className="mt-2 font-display text-[0.85rem]">{name}</p>
              <p className="text-[0.65rem] tracking-widest text-[#2b241b]/55">
                {price}
              </p>
            </div>
          ))}
        </div>
      </TextPage>
    ),
    back: (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-[#141210] px-[10%] text-center text-white">
        <span className="font-display text-lg tracking-[0.55em]">MERIDIAN</span>
        <div className="my-6 h-px w-16 bg-amber-300/50" />
        <p className="max-w-[28ch] text-[0.75rem] leading-relaxed text-white/70">
          Discover the full Autumn 2026 collection online and in our ateliers.
        </p>
        <button className="mt-8 rounded-full border border-amber-200/40 px-7 py-2.5 text-[0.6rem] uppercase tracking-[0.35em] text-amber-100 transition-colors hover:bg-amber-200/10">
          Shop the Lookbook
        </button>
        <p className="absolute bottom-[8%] text-[0.55rem] uppercase tracking-[0.3em] text-white/35">
          © 2026 Meridian Atelier
        </p>
      </div>
    ),
  },
];
