import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Leaf } from "./types";

interface FlipBookProps {
  leaves: Leaf[];
  /** Aspect ratio of a single page (width / height). */
  pageRatio?: number;
  onIndexChange?: (index: number) => void;
}

/**
 * Premium 3D page-turn engine.
 *
 * Rendering model
 * ---------------
 * We render every leaf as an absolutely-positioned element occupying the RIGHT
 * half of the book. Each leaf has a `.front` face (0deg, the recto) and a
 * `.back` face (rotated 180deg, the verso of the *next* spread). Turning a leaf
 * means rotating it around the spine from 0deg -> -180deg.
 *
 * Soft paper curl is faked with:
 *   - a moving specular highlight band that tracks the fold,
 *   - a graduated core shadow near the spine,
 *   - a soft drop shadow cast onto the page underneath, whose size + opacity
 *     peak when the leaf is at ~90deg (standing up),
 *   - a subtle bend on the free edge via layered radial gradients.
 *
 * `progress` ranges continuously so pages can be *held partially* mid-turn.
 */
export default function FlipBook({
  leaves,
  pageRatio = 0.72,
  onIndexChange,
}: FlipBookProps) {
  const total = leaves.length;

  // current is the number of leaves that have been fully turned to the left.
  const [current, setCurrent] = useState(0);

  // Continuous drag state for the leaf currently being manipulated.
  // dragging holds the index of the leaf being turned, and dir: 1 = forward
  // (turning right leaf leftwards), -1 = backward (turning a turned leaf back).
  const [drag, setDrag] = useState<{
    leaf: number;
    dir: 1 | -1;
    progress: number; // 0..1
    active: boolean;
    hover?: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0, single: false });

  // Measure available space and fit the book.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      const single = cw < 760;
      // spread width = 2 pages (or 1 on mobile)
      const pagesAcross = single ? 1 : 2;
      // Try to fit height first
      let pageH = ch - 24;
      let pageW = pageH * pageRatio;
      const maxSpreadW = cw - 24;
      if (pageW * pagesAcross > maxSpreadW) {
        pageW = maxSpreadW / pagesAcross;
        pageH = pageW / pageRatio;
      }
      setDims({ w: pageW, h: pageH, single });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pageRatio]);

  useEffect(() => {
    onIndexChange?.(current);
  }, [current, onIndexChange]);

  const canForward = current < total;
  const canBackward = current > 0;

  // ---- Animated snap (spring-ish easing) --------------------------------
  const rafRef = useRef<number | null>(null);
  const animateTo = useCallback(
    (leaf: number, dir: 1 | -1, from: number, to: number, onDone: () => void) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const duration = 560;
      const start = performance.now();
      // easeOutBack-ish for a tactile settle without overshoot past bounds
      const ease = (t: number) => {
        const c1 = 1.20;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const e = ease(t);
        const p = from + (to - from) * e;
        setDrag({ leaf, dir, progress: Math.max(0, Math.min(1, p)), active: false });
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setDrag(null);
          onDone();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    []
  );

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // ---- Pointer handling --------------------------------------------------
  const pointerState = useRef<{
    id: number;
    startX: number;
    startY: number;
    dir: 1 | -1;
    leaf: number;
    width: number;
    moved: boolean;
    startTime: number;
    lastX: number;
    lastT: number;
    vx: number;
  } | null>(null);

  const beginDrag = (clientX: number, clientY: number, pointerId: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spineX = rect.left + rect.width / 2;
    const single = dims.single;
    const effectiveSpine = single ? rect.left : spineX;
    const onRight = single ? true : clientX >= effectiveSpine;

    let dir: 1 | -1;
    let leaf: number;
    if (onRight) {
      if (!canForward) return;
      dir = 1;
      leaf = current;
    } else {
      if (!canBackward) return;
      dir = -1;
      leaf = current - 1;
    }
    document.body.classList.add("flipbook-dragging");
    pointerState.current = {
      id: pointerId,
      startX: clientX,
      startY: clientY,
      dir,
      leaf,
      width: dims.w,
      moved: false,
      startTime: performance.now(),
      lastX: clientX,
      lastT: performance.now(),
      vx: 0,
    };
    setDrag({ leaf, dir, progress: dir === 1 ? 0 : 1, active: true });
  };

  const moveDrag = (clientX: number, clientY: number) => {
    const ps = pointerState.current;
    if (!ps) return;
    const dx = clientX - ps.startX;
    const dy = clientY - ps.startY;
    if (!ps.moved && Math.hypot(dx, dy) > 4) ps.moved = true;

    const now = performance.now();
    const dt = now - ps.lastT;
    if (dt > 0) ps.vx = (clientX - ps.lastX) / dt;
    ps.lastX = clientX;
    ps.lastT = now;

    // Map horizontal travel to progress. Full turn ~ 1.15x page width feels natural.
    const span = ps.width * 1.05;
    let progress: number;
    if (ps.dir === 1) {
      progress = Math.min(1, Math.max(0, -dx / span));
    } else {
      progress = 1 - Math.min(1, Math.max(0, dx / span));
    }
    setDrag({ leaf: ps.leaf, dir: ps.dir, progress, active: true });
  };

  const endDrag = () => {
    const ps = pointerState.current;
    document.body.classList.remove("flipbook-dragging");
    if (!ps) return;
    pointerState.current = null;
    const d = drag;
    if (!d) return;

    // Decide commit based on progress + velocity (swipe).
    const fastLeft = ps.vx < -0.35;
    const fastRight = ps.vx > 0.35;
    let commit: boolean;
    if (ps.dir === 1) {
      commit = d.progress > 0.5 || fastLeft;
      if (fastRight) commit = false;
    } else {
      commit = d.progress < 0.5 || fastRight;
      if (fastLeft) commit = false;
    }

    if (ps.dir === 1) {
      if (commit) {
        animateTo(ps.leaf, 1, d.progress, 1, () => setCurrent((c) => Math.min(total, c + 1)));
      } else {
        animateTo(ps.leaf, 1, d.progress, 0, () => {});
      }
    } else {
      if (commit) {
        animateTo(ps.leaf, -1, d.progress, 0, () => setCurrent((c) => Math.max(0, c - 1)));
      } else {
        animateTo(ps.leaf, -1, d.progress, 1, () => {});
      }
    }
  };

  // Button / tap navigation
  const goNext = useCallback(() => {
    if (!canForward || drag) return;
    animateTo(current, 1, 0, 1, () => setCurrent((c) => Math.min(total, c + 1)));
  }, [canForward, current, drag, animateTo, total]);

  const goPrev = useCallback(() => {
    if (!canBackward || drag) return;
    animateTo(current - 1, -1, 1, 0, () => setCurrent((c) => Math.max(0, c - 1)));
  }, [canBackward, current, drag, animateTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  // ---- Render ------------------------------------------------------------
  const { w, h, single } = dims;
  const spreadW = single ? w : w * 2;

  // For each leaf compute its rotation. Leaves with index < current are turned
  // (rotated -180), >= current are flat (0). The dragging leaf gets interpolated.
  const rotationFor = (i: number): number => {
    if (drag && drag.leaf === i) {
      return -180 * drag.progress;
    }
    return i < current ? -180 : 0;
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full select-none items-center justify-center"
    >
      <div
        ref={stageRef}
        className="relative"
        style={{
          width: spreadW,
          height: h,
          perspective: Math.max(1600, spreadW * 2.2),
          perspectiveOrigin: "50% 42%",
          touchAction: "pan-y",
        }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          beginDrag(e.clientX, e.clientY, e.pointerId);
        }}
        onPointerMove={(e) => moveDrag(e.clientX, e.clientY)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* Book base / under-shadow + spine */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            filter: "blur(0px)",
          }}
        >
          {/* soft ground shadow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
            style={{
              bottom: -28,
              width: spreadW * 0.9,
              height: 46,
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(30,25,20,0.34) 0%, rgba(30,25,20,0.12) 45%, transparent 72%)",
              filter: "blur(9px)",
            }}
          />
        </div>

        {/* Static right base: normally the current recto; while a forward turn is
            underway the turning leaf sits on top, so the base must reveal the
            NEXT recto beneath it. */}
        {(() => {
          const forwardTurning = drag && drag.dir === 1 && drag.leaf === current;
          const rightContent = forwardTurning
            ? leaves[current + 1]?.front
            : leaves[current]?.front;
          const rightRemaining = forwardTurning
            ? total - current - 1
            : total - current;
          return (
            <StaticSide
              side="right"
              w={w}
              h={h}
              single={single}
              content={rightContent}
              remaining={rightRemaining}
            />
          );
        })()}

        {/* Static left base: normally the previous verso; while a backward turn is
            underway, reveal the EARLIER verso beneath the turning leaf. */}
        {!single &&
          (() => {
            const backTurning =
              drag && drag.dir === -1 && drag.leaf === current - 1;
            const leftContent = backTurning
              ? leaves[current - 2]?.back
              : leaves[current - 1]?.back;
            const leftRemaining = backTurning ? current - 1 : current;
            return (
              <StaticSide
                side="left"
                w={w}
                h={h}
                single={single}
                content={leftContent}
                remaining={leftRemaining}
              />
            );
          })()}

        {/* Turning leaves — render only near the active one for perf */}
        {leaves.map((leaf, i) => {
          const isActive =
            (drag && drag.leaf === i) ||
            (!drag && (i === current - 1 || i === current));
          // We only need to mount leaves that could be visible while flipping.
          if (Math.abs(i - current) > 1 && !(drag && drag.leaf === i)) return null;

          const rot = rotationFor(i);
          return (
            <TurningLeaf
              key={leaf.id}
              i={i}
              w={w}
              h={h}
              single={single}
              rot={rot}
              front={leaf.front}
              back={leaf.back}
              current={current}
              dragging={!!(drag && drag.leaf === i && drag.active)}
              zBoost={isActive}
            />
          );
        })}

        {/* Center spine shading overlay */}
        {!single && (
          <div
            className="pointer-events-none absolute top-0 z-[60] h-full"
            style={{
              left: "50%",
              width: 46,
              transform: "translateX(-50%)",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(20,16,12,0.20) 46%, rgba(20,16,12,0.28) 50%, rgba(20,16,12,0.20) 54%, transparent 100%)",
            }}
          />
        )}
      </div>

      {/* Nav controls */}
      <NavArrow dir="prev" onClick={goPrev} disabled={!canBackward} />
      <NavArrow dir="next" onClick={goNext} disabled={!canForward} />

      {/* Progress + hint */}
      <BottomBar current={current} total={total} />
    </div>
  );
}

/* --------------------------------------------------------------------------
 * Static (non-turning) page underneath
 * ------------------------------------------------------------------------ */
function StaticSide({
  side,
  w,
  h,
  single,
  content,
  remaining,
}: {
  side: "left" | "right";
  w: number;
  h: number;
  single: boolean;
  content: React.ReactNode;
  remaining: number;
}) {
  const left = single ? 0 : side === "right" ? "50%" : `calc(50% - ${w}px)`;
  const edges = Math.min(6, Math.max(0, remaining - 1));
  return (
    <div
      className="absolute top-0"
      style={{ left, width: w, height: h }}
      aria-hidden={!content}
    >
      {/* page-edge thickness illusion */}
      {Array.from({ length: edges }).map((_, k) => (
        <div
          key={k}
          className="absolute top-0 rounded-sm"
          style={{
            [side === "right" ? "right" : "left"]: -(k + 1) * 1.4,
            top: (k + 1) * 0.8,
            width: w,
            height: h - (k + 1) * 1.6,
            background: k % 2 === 0 ? "#f3ede2" : "#e9e1d3",
            boxShadow: "0 0 0 0.5px rgba(120,100,70,0.18)",
            zIndex: -k - 1,
          }}
        />
      ))}
      <div
        className="relative h-full w-full overflow-hidden bg-[#f7f2e9] paper-grain"
        style={{
          borderTopLeftRadius: side === "left" || single ? 6 : 2,
          borderBottomLeftRadius: side === "left" || single ? 6 : 2,
          borderTopRightRadius: side === "right" ? 6 : 2,
          borderBottomRightRadius: side === "right" ? 6 : 2,
          boxShadow:
            "0 30px 60px -30px rgba(40,30,20,0.5), 0 2px 8px rgba(40,30,20,0.15)",
        }}
      >
        {content}
        {/* inner spine gradient */}
        <div
          className="pointer-events-none absolute inset-y-0 w-24"
          style={{
            [side === "right" ? "left" : "right"]: 0,
            background:
              side === "right"
                ? "linear-gradient(90deg, rgba(30,22,14,0.20), transparent)"
                : "linear-gradient(270deg, rgba(30,22,14,0.20), transparent)",
          }}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------
 * A single turning leaf with soft-curl faking
 * ------------------------------------------------------------------------ */
function TurningLeaf({
  i,
  w,
  h,
  single,
  rot,
  front,
  back,
  current,
  dragging,
  zBoost,
}: {
  i: number;
  w: number;
  h: number;
  single: boolean;
  rot: number; // 0 .. -180
  front: React.ReactNode;
  back: React.ReactNode;
  current: number;
  dragging: boolean;
  zBoost: boolean;
}) {
  const left = single ? 0 : "50%";
  const t = -rot / 180; // 0..1 turn progress
  // curl intensity peaks mid-turn
  const curl = Math.sin(t * Math.PI);
  // secondary soft-curl: the free edge lags, giving the paper a gentle S-bend.
  // We tilt the leaf slightly on Z near mid-turn so the outer corner droops.
  const droop = Math.sin(t * Math.PI) * 2.2; // degrees
  // The face currently visible: front until 90deg then back
  const showingBack = t > 0.5;

  // z-index: turning leaf above everything
  const z = zBoost ? 50 : i < current ? 20 - i : 20;

  return (
    <div
      className="absolute top-0"
      style={{
        left,
        width: w,
        height: h,
        transformStyle: "preserve-3d",
        transformOrigin: "left center",
        transform: `rotateY(${rot}deg) rotate(${droop}deg)`,
        transition: dragging ? "none" : undefined,
        zIndex: z,
        willChange: "transform",
      }}
    >
      {/* FRONT face */}
      <Face w={w} hidden={showingBack} side="front" curl={curl} t={t}>
        {front}
      </Face>

      {/* BACK face */}
      <Face w={w} hidden={!showingBack} side="back" curl={curl} t={t}>
        {back}
      </Face>

      {/* Cast shadow onto the page below — flat element that widens as page stands up */}
      <div
        className="pointer-events-none absolute top-0"
        style={{
          left: 0,
          width: w,
          height: h,
          transform: "translateZ(-2px)",
          background: `linear-gradient(90deg, rgba(20,14,8,${0.32 * curl}) 0%, rgba(20,14,8,${
            0.14 * curl
          }) 30%, transparent 65%)`,
          opacity: curl,
          borderRadius: 6,
        }}
      />
    </div>
  );
}

function Face({
  w,
  hidden,
  side,
  curl,
  t,
  children,
}: {
  w: number;
  hidden: boolean;
  side: "front" | "back";
  curl: number;
  t: number;
  children: React.ReactNode;
}) {
  // The specular highlight sweeps across as the page turns.
  const highlightPos = side === "front" ? 100 - t * 120 : t * 120 - 20;

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#f7f2e9] paper-grain"
      style={{
        backfaceVisibility: "hidden",
        transform: side === "back" ? "rotateY(180deg)" : undefined,
        borderRadius: 6,
        boxShadow:
          "0 24px 50px -24px rgba(35,25,15,0.55), 0 2px 10px rgba(35,25,15,0.18)",
        // subtle bend: brighten free edge, darken spine edge
        backgroundImage:
          side === "front"
            ? undefined
            : undefined,
        visibility: hidden ? "hidden" : "visible",
      }}
    >
      {children}

      {/* Spine-side core shadow (darker near hinge = left for front, right for back) */}
      <div
        className="pointer-events-none absolute inset-y-0"
        style={{
          [side === "front" ? "left" : "right"]: 0,
          width: Math.max(40, w * 0.28),
          background:
            side === "front"
              ? "linear-gradient(90deg, rgba(25,18,10,0.28), transparent)"
              : "linear-gradient(270deg, rgba(25,18,10,0.28), transparent)",
        }}
      />

      {/* Moving soft specular highlight (paper sheen while curling) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(105deg, transparent ${highlightPos - 18}%, rgba(255,252,244,${
            0.55 * curl
          }) ${highlightPos}%, transparent ${highlightPos + 18}%)`,
          mixBlendMode: "soft-light",
        }}
      />

      {/* Overall dimming as page tilts away from light (lighting) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `rgba(20,14,8,${0.22 * curl})`,
        }}
      />

      {/* Free-edge curl highlight — subtle bright rim on the outer edge */}
      <div
        className="pointer-events-none absolute inset-y-0"
        style={{
          [side === "front" ? "right" : "left"]: 0,
          width: 26,
          background:
            side === "front"
              ? `linear-gradient(270deg, rgba(255,255,255,${0.4 * curl}), transparent)`
              : `linear-gradient(90deg, rgba(255,255,255,${0.4 * curl}), transparent)`,
        }}
      />

      {/* Curved page-tip shadow — implies the free edge bending toward the light */}
      <div
        className="pointer-events-none absolute inset-y-0"
        style={{
          [side === "front" ? "right" : "left"]: 0,
          width: Math.max(60, w * 0.42),
          opacity: curl,
          background:
            side === "front"
              ? `radial-gradient(140% 120% at 100% 50%, rgba(30,20,10,${
                  0.3 * curl
                }) 0%, transparent 55%)`
              : `radial-gradient(140% 120% at 0% 50%, rgba(30,20,10,${
                  0.3 * curl
                }) 0%, transparent 55%)`,
        }}
      />
    </div>
  );
}

/* --------------------------------------------------------------------------
 * UI chrome
 * ------------------------------------------------------------------------ */
function NavArrow({
  dir,
  onClick,
  disabled,
}: {
  dir: "prev" | "next";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "next" ? "Next page" : "Previous page"}
      className={`group absolute top-1/2 z-[80] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-md transition-all duration-300 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-20 md:h-14 md:w-14 ${
        dir === "next" ? "right-3 md:right-8" : "left-3 md:left-8"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-white/90 transition-transform group-hover:scale-110 md:h-6 md:w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {dir === "next" ? <path d="M9 6l6 6-6 6" /> : <path d="M15 6l-6 6 6 6" />}
      </svg>
    </button>
  );
}

function BottomBar({ current, total }: { current: number; total: number }) {
  const pct = useMemo(
    () => (total <= 0 ? 0 : Math.round((current / total) * 100)),
    [current, total]
  );
  return (
    <div className="absolute bottom-4 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-4 md:bottom-6">
      <span className="font-display text-xs tracking-[0.35em] text-white/50">
        {String(Math.min(current + 1, total)).padStart(2, "0")}
      </span>
      <div className="relative h-[2px] w-40 overflow-hidden rounded-full bg-white/15 md:w-56">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-200 to-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-display text-xs tracking-[0.35em] text-white/50">
        {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}
