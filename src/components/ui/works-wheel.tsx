// A portfolio index built as a wheel you turn - adapted from the provided
// WorksWheel for 13:33.
//
// At rest the work sits in a ring around a title, each card tangent to the
// circle. The first notch of scroll unwinds the ring into a 3D spiral: the card
// at the front faces you full size, the next ones wind away round the axis and
// down it, the previous ones up and behind. Keep turning and the spiral carries
// the next piece round to the front. (13:33 brief: the original vertical drum
// became a helix, with speed, pointer and idle motion for more life.)
//
// The whole thing is still one number - `turn` - read by a single rAF pass that
// writes transforms straight to the DOM. 0 is the ring, 1 is the drum with item
// 0 at the front, and every whole number after that is one more item turned past.
//
// What changed from the original, and why:
// - `turn` follows this section's own scroll (a sticky stage inside a tall
//   section) instead of cancelling wheel events. The hero above and the wheel
//   own separate stretches of the page, so they never fight over one gesture,
//   touch scroll works natively, and the page simply carries on after the last
//   project. WHEEL_UNITS / DRAG_UNITS keep their meaning: how much scroll or drag
//   turns one item.
// - While the stage is pinned, one wheel/trackpad gesture or one swipe turns
//   exactly one item: the gesture is taken over and the page is scrolled to the
//   next item, so momentum never skips a project. Above the ring and past the
//   last item the gesture is left to the page, so the hero and the sections
//   after it scroll as usual.
// - Cards carry a poster and an optional muted, looping video. Only the front
//   card plays, from the start (the top of the site), once the wheel has
//   settled on it; the rest show their posters. One decoder at a time keeps
//   tablets and laptops smooth.
// - Clicking the front card opens the project; a side card or an index entry
//   turns it to the front; a drag never opens a link.
import * as React from "react";
import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";

import { cn, clamp } from "@/lib/utils";
import { useLang } from "@/lib/i18n";
import { useCoarseDevice, useReducedMotion } from "@/hooks/use-media";

export interface WorksWheelItem {
  /** Stable key; also used for the card id. */
  id: string;
  /** Project name. Shown beside the front card and in the index. */
  title: string;
  /** Poster frame. Any src an <img> takes. */
  image: string;
  /** Short muted loop of the site in use. Poster stays if it is missing. */
  video?: { mp4?: string; webm?: string };
  /** Small line under the front title, e.g. the category. */
  meta?: string;
  /** Badge on the card face, e.g. "Концепция". */
  badge?: string;
  /** Where the front card links to. */
  href?: string;
}

export interface WorksWheelProps extends Omit<
  React.ComponentPropsWithoutRef<"section">,
  "children"
> {
  items: WorksWheelItem[];
  /** Sits in the middle of the ring. */
  label?: string;
  /** Label on the front card's affordance. */
  action?: string;
  /** Section heading and line under it, shown while the ring is closed. */
  heading?: string;
  subheading?: string;
  /** Client-side navigation for the front card; falls back to the href. */
  onOpen?: (item: WorksWheelItem, event: React.MouseEvent) => void;
}

/* Geometry. The card is measured against the stage; everything else is measured
   against the card, so a narrow stage scales the whole wheel down with it. */
const CARD_H = 0.45; // front card height, of the stage
const CARD_MAX_W = 0.42; // ... but never wider than this much of the stage
const CARD_MAX_W_NARROW = 0.86; // phones: the work has to be legible
const CARD_RATIO = 1.45; // card width / height
/* The spiral (helix). Each card sits a step further round a vertical axis and a
   pitch further down it; turning the wheel winds the helix so the next piece
   comes round to the front. Radius is in card widths, pitch in card heights. */
const STEP = 38; // degrees between cards round the axis
/* Neighbours stay clear of the front card only while the chord between them
   (2·R·sin(STEP/2)) is about a card wide - hence a radius of ~1.45 widths. */
const HELIX_R = 1.45;
const PITCH = 0.62;
const LENS = 2.7; // perspective distance
const RING_R = 0.94; // ring radius
/** How much of its arc each ring card fills. Lower = a lighter loop. */
const RING_FILL = 0.6;
const TITLE = 0.124; // ring label and front-card title
const INDEX = 0.04; // the index down the right-hand side
/** Items either side of the front still worth drawing. */
const CULL = 2.6;

/** Pixels of page scroll that turn one item (mouse wheel / trackpad). */
export const WHEEL_UNITS = 550;
/** Pixels of drag (mouse) or swipe (touch) that turn one item. */
export const DRAG_UNITS = 320;
/** Quiet time after the last scroll before the wheel settles on an item. */
const SETTLE = 200;
/** Fraction of the remaining distance closed each frame. 1 = no smoothing.
    Low on purpose: the spiral glides after the page instead of snapping. */
const EASE = 0.075;
/* Life. Speed tilts and opens the spiral; the pointer leans it; at rest it
   breathes. All of it scales with `m`, so the closed ring stays calm. */
const SPEED_TILT = 900; // degrees per (turns per frame)
const MAX_TILT = 16;
const SPEED_SPREAD = 16;
const MAX_SPREAD = 0.5;
const POINTER_TILT = { x: 5, y: 8 };
/** Extra scroll at the end so the last project is held, not flung past. */
const TAIL = 0.45;
/** Share of an item that commits a turn in that direction. Below it the wheel
    returns to where it was, so a single slow wheel notch still advances. */
const COMMIT = 0.12;
/** Movement that turns a press into a drag (and cancels its click). */
const DRAG_SLOP = 6;
/** Wheel distance (px) that counts as a gesture, and the quiet time that ends
    one - trackpad momentum keeps sending events, all part of the same gesture. */
const GESTURE_MIN = 24;
const GESTURE_GAP = 260;
/** Finger travel (px) that counts as a swipe to the next item. */
const SWIPE_MIN = 36;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (deg: number) => (deg * Math.PI) / 180;

type Stage = { w: number; h: number };

/** Both states in one chain: the ring terms fall away as `m` reaches the
    helix, and the helix terms are still zero while the ring is up - so on the
    way between, the ring visibly unwinds into the spiral. `d` is the card's
    distance from the front, in items. */
function place(
  ringDeg: number,
  ringR: number,
  d: number,
  helixR: number,
  pitch: number,
  m: number,
) {
  const a = rad(d * STEP);
  const x = Math.sin(a) * helixR;
  const z = (Math.cos(a) - 1) * helixR;
  const y = d * pitch;
  return (
    `translate3d(${m * x}px, ${m * y}px, ${m * z}px) rotateY(${m * d * STEP}deg)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)`
  );
}

export function WorksWheel({
  items,
  label = "Projects",
  action = "View",
  heading,
  subheading,
  onOpen,
  className,
  style,
  ...props
}: WorksWheelProps) {
  const { tr } = useLang();
  const sectionRef = React.useRef<HTMLElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const headRef = React.useRef<HTMLDivElement>(null);
  const frontRef = React.useRef<HTMLDivElement>(null);
  const dimRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
  const glowRef = React.useRef<HTMLDivElement>(null);
  /** Pointer position over the stage, -1..1, for the lean. */
  const pointer = React.useRef({ x: 0, y: 0 });

  // The wheel's position, and where it is heading. Only `active` and `open`
  // are state - everything else is written to the DOM.
  const turn = React.useRef(0);
  const target = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  /** The section is on screen (videos may play). */
  const [onScreen, setOnScreen] = React.useState(false);
  const [stage, setStage] = React.useState<Stage>({ w: 0, h: 0 });

  const reduced = useReducedMotion();
  const coarse = useCoarseDevice();
  const count = items.length;
  const last = Math.max(count - 1, 0);
  const unit = coarse ? DRAG_UNITS : WHEEL_UNITS;
  // Phones, and tablets held upright: the spiral climbs and the work fills the width.
  const narrow = stage.w > 0 && (stage.w < 768 || (stage.w < 1024 && stage.h > stage.w));

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    const maxW = narrow ? CARD_MAX_W_NARROW : CARD_MAX_W;
    const cardW = Math.min(h * CARD_H * CARD_RATIO, w * maxW);
    const cardH = cardW / CARD_RATIO;
    // Phones: too narrow to swing far sideways, so the spiral climbs instead.
    const helixR = cardW * (narrow ? 0.75 : HELIX_R);
    const pitch = cardH * (narrow ? 1.15 : PITCH);
    const ringR = cardH * (narrow ? RING_R * 0.62 : RING_R);
    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * RING_FILL) / (cardW || 1), 0.16, 1)
      : 1;
    // The ring makes room for the section heading: right of it on desktop,
    // below it on phones. It slides back to centre as it opens into the helix.
    const ringShift = narrow
      ? { x: 0, y: h * 0.1 }
      : { x: w * 0.13, y: h * 0.04 };
    return {
      cardW,
      cardH,
      ringR,
      ringShift,
      ringScale,
      helixR,
      pitch,
      depth: Math.max(1, cardH * LENS),
      title: cardH * TITLE,
      index: cardH * INDEX,
    };
  }, [stage, count, narrow]);

  // ---- scroll → target ------------------------------------------------
  /** Page offset of the section's top. */
  const sectionTop = React.useCallback(() => {
    const el = sectionRef.current;
    return el ? el.getBoundingClientRect().top + window.scrollY : 0;
  }, []);

  /** A scroll we started (index, keys, settling). While it runs, settling
      keeps its hands off; any input from the reader cancels it. */
  const seek = React.useRef<{ y: number; at: number; turn: number } | null>(null);
  /** The item the wheel last rested on - settling is measured from here. It
      moves only once a scroll actually arrives: a seek the reader interrupts
      must not count as having landed. */
  const anchor = React.useRef(0);

  const scrollToTurn = React.useCallback(
    (t: number) => {
      const next = clamp(t, 0, count);
      const y = Math.round(sectionTop() + next * unit);
      seek.current = { y, at: performance.now(), turn: Math.round(next) };
      window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    },
    [count, unit, reduced, sectionTop],
  );

  React.useEffect(() => {
    if (!count) return;
    let settleTimer = 0;
    let touching = false;

    const read = () => {
      const el = sectionRef.current;
      if (!el) return;
      const travelled = -el.getBoundingClientRect().top;
      target.current = clamp(travelled / unit, 0, count);
    };

    // A scroll gesture has no end of its own, so the rest position is wherever
    // it happened to stop - between two cards, both turned half away. Settle
    // onto an item once the page has been quiet for a moment.
    const settle = () => {
      if (touching) return;
      const s = seek.current;
      if (s) {
        const arrived = Math.abs(window.scrollY - s.y) < 2;
        if (!arrived && performance.now() - s.at < 1500) return;
        if (arrived) anchor.current = s.turn;
        seek.current = null;
      }
      const t = target.current;
      if (t >= count - 0.001) {
        anchor.current = count;
        return;
      }
      if (Math.abs(Math.round(t) - t) < 0.01) {
        anchor.current = Math.round(t);
        return;
      }
      // Finish the turn in the direction it was going, or fall back.
      const delta = t - anchor.current;
      const near =
        Math.abs(delta) < COMMIT ? anchor.current : delta > 0 ? Math.ceil(t) : Math.floor(t);
      scrollToTurn(near);
    };
    const schedule = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, SETTLE);
    };

    // `scrollend` (where supported) marks the end of a gesture, its momentum or
    // a smooth scroll; the short wait after it lets the next wheel notch in.
    // Without it, a quiet period after the last scroll event stands in.
    const hasScrollEnd = "onscrollend" in window;
    const onScroll = () => {
      read();
      if (hasScrollEnd) window.clearTimeout(settleTimer);
      else schedule();
    };
    const onInput = () => {
      seek.current = null;
    };

    // ---- one gesture, one item ----
    /** True while the stage is pinned - the stretch of page the wheel owns. */
    const engaged = () => {
      const el = sectionRef.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top <= 1 && r.bottom >= window.innerHeight - 1;
    };
    /** The item one step from where the wheel is (or is heading), or null when
        the gesture belongs to the page: up from the ring, down past the last. */
    const stepFrom = (dir: number) => {
      const el = sectionRef.current;
      // Unclamped, so coming back up from below lands on the last item first.
      const travelled = el ? -el.getBoundingClientRect().top / unit : target.current;
      const t = seek.current ? seek.current.turn : Math.max(0, travelled);
      if (dir > 0 && t >= count - 0.001) return null;
      if (dir < 0 && t <= 0.001) return null;
      if (dir < 0 && t > count + 0.01) return count;
      return dir > 0 ? Math.floor(t + 0.001) + 1 : Math.ceil(t - 0.001) - 1;
    };
    const gesture = { acc: 0, locked: false, idle: 0 };
    const onWheel = (event: WheelEvent) => {
      const dy = event.deltaY * (event.deltaMode === 1 ? 40 : 1);
      if (event.ctrlKey || !dy || !engaged()) return onInput();
      // A fresh gesture that leaves the wheel goes to the page; the rest of a
      // gesture that already turned it is held, so its momentum stops here.
      if (!gesture.locked && stepFrom(Math.sign(dy)) === null) return onInput();
      event.preventDefault();
      window.clearTimeout(gesture.idle);
      gesture.idle = window.setTimeout(() => {
        gesture.locked = false;
        gesture.acc = 0;
      }, GESTURE_GAP);
      if (gesture.locked) return;
      gesture.acc += dy;
      if (Math.abs(gesture.acc) < GESTURE_MIN) return;
      const next = stepFrom(Math.sign(gesture.acc));
      gesture.locked = true;
      gesture.acc = 0;
      if (next !== null) scrollToTurn(next);
    };

    // Touch: a swipe inside the pinned stretch turns one item. Whether the
    // wheel or the page owns a touch is decided on its first move - after that
    // the browser no longer lets the move be cancelled.
    let touchY = 0;
    let own: boolean | null = null;
    const onTouchStart = (event: TouchEvent) => {
      touching = true;
      onInput();
      touchY = event.touches[0]?.clientY ?? 0;
      own = null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 1) return;
      const dy = touchY - (event.touches[0]?.clientY ?? touchY);
      if (own === null) own = engaged() && stepFrom(dy < 0 ? -1 : 1) !== null;
      if (own && event.cancelable) event.preventDefault();
    };
    const onTouchEnd = (event: TouchEvent) => {
      touching = false;
      const dy = touchY - (event.changedTouches[0]?.clientY ?? touchY);
      // No move reached us (some browsers coalesce a fast flick): decide now.
      if (own === null) own = engaged() && stepFrom(dy < 0 ? -1 : 1) !== null;
      if (own) {
        if (Math.abs(dy) >= SWIPE_MIN) {
          const next = stepFrom(Math.sign(dy));
          if (next !== null) scrollToTurn(next);
          // Turned out to leave the wheel after all: hand the swipe to the page.
          else window.scrollBy({ top: dy * 2, behavior: reduced ? "auto" : "smooth" });
        }
      }
      own = null;
      schedule();
    };

    read();
    turn.current = target.current;
    anchor.current = Math.round(target.current);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (hasScrollEnd) window.addEventListener("scrollend", schedule);
    window.addEventListener("resize", read);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.clearTimeout(settleTimer);
      window.clearTimeout(gesture.idle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", schedule);
      window.removeEventListener("resize", read);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [count, unit, reduced, scrollToTurn]);

  /** Turn to a position by scrolling the page there. */
  const to = scrollToTurn;
  const select = React.useCallback((i: number) => to(i + 1), [to]);

  // ---- one pass per frame ----------------------------------------------
  React.useEffect(() => {
    if (!stage.h || !count) return;
    let frame = 0;
    let visible = true;
    const { ringR, ringScale, helixR, pitch, ringShift } = metrics;
    const still = reduced;
    let speed = 0; // smoothed turns per frame
    let lean = { x: 0, y: 0 };
    let prev = turn.current;
    // Once nothing moves, the frame does no DOM work at all.
    let settled = false;

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      setOnScreen(visible);
      if (visible) {
        settled = false;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(draw);
      }
    });
    if (sectionRef.current) io.observe(sectionRef.current);

    function draw() {
      if (!visible) return;
      frame = requestAnimationFrame(draw);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (still ? 1 : EASE);
      const leanGap = Math.abs(pointer.current.x - lean.x) + Math.abs(pointer.current.y - lean.y);
      if (gap === 0 && Math.abs(speed) < 1e-5 && leanGap < 1e-3) {
        if (settled) return;
        settled = true;
      } else {
        settled = false;
      }

      const t = turn.current;
      const m = clamp(t, 0, 1);
      const pos = clamp(t - 1, 0, last);

      // Speed of the turn, smoothed; drives the tilt and the opening spiral.
      speed += (t - prev - speed) * 0.18;
      prev = t;
      if (still) speed = 0;
      lean = {
        x: lean.x + (pointer.current.x - lean.x) * 0.06,
        y: lean.y + (pointer.current.y - lean.y) * 0.06,
      };
      const tiltX = still
        ? 0
        : m * (clamp(speed * SPEED_TILT, -MAX_TILT, MAX_TILT) - lean.y * POINTER_TILT.x);
      const tiltY = still
        ? 0
        : m * lean.x * POINTER_TILT.y;
      const spread = 1 + (still ? 0 : clamp(Math.abs(speed) * SPEED_SPREAD, 0, MAX_SPREAD));

      if (wheelRef.current) {
        wheelRef.current.style.transform =
          `translate3d(${(1 - m) * ringShift.x}px, ${(1 - m) * ringShift.y}px, 0)` +
          ` rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      }

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const card = cardRefs.current[i];
        if (!card) continue;
        card.style.transform = place(d * (360 / count), ringR, d, helixR, pitch * spread, m);
        const far = Math.abs(d);
        const hidden = m > 0.5 && far > CULL;
        // Phones: the caption sits under the spiral, so the piece coming up
        // from below fades out before it reaches it.
        const below = narrow && d > 0.35 ? clamp(1 - (d - 0.35) * 2.2 * m, 0, 1) : 1;
        card.style.opacity = hidden ? "0" : String(below);
        card.style.visibility = hidden ? "hidden" : "visible";
        card.style.zIndex = String(Math.round(100 - far * 10));
        const face = card.firstElementChild as HTMLElement | null;
        if (face) {
          const depthScale = 1 - Math.min(far, 2.5) * 0.07;
          face.style.transform = `scale(${lerp(ringScale, depthScale, m)})`;
        }
        // Pieces turned away sink into the dark - the front one carries the light.
        const dim = dimRefs.current[i];
        if (dim) dim.style.opacity = String(m * Math.min(0.72, far * 0.4));
      }

      if (labelRef.current) {
        labelRef.current.style.opacity = String(1 - m);
        labelRef.current.style.transform = `translate(${ringShift.x}px, ${ringShift.y}px)`;
      }
      if (headRef.current) {
        headRef.current.style.opacity = String(clamp(1 - m * 1.6, 0, 1));
      }
      const shown = clamp((m - 0.55) / 0.45, 0, 1);
      if (frontRef.current) frontRef.current.style.opacity = String(shown);
      if (glowRef.current) {
        glowRef.current.style.opacity = String(m * 0.85);
      }
      const near = clamp(Math.round(pos), 0, last);
      setActive((prev) => (prev === near ? prev : near));
      const isOpen = m > 0.85;
      setOpen((prev) => (prev === isOpen ? prev : isOpen));
    }

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, [metrics, stage.h, count, last, reduced, narrow]);

  // ---- mouse drag (touch scrolls natively) -------------------------------
  const drag = React.useRef<{ y: number; start: number; moved: boolean; id: number } | null>(null);
  const suppressClick = React.useRef(false);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    seek.current = null;
    drag.current = { y: event.clientY, start: event.clientY, moved: false, id: event.pointerId };
    suppressClick.current = false;
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") {
      const r = event.currentTarget.getBoundingClientRect();
      pointer.current = {
        x: ((event.clientX - r.left) / r.width) * 2 - 1,
        y: ((event.clientY - r.top) / r.height) * 2 - 1,
      };
    }
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    if (!d.moved && Math.abs(event.clientY - d.start) > DRAG_SLOP) {
      d.moved = true;
      suppressClick.current = true;
      // Capture only once it is a drag, so a plain click still reaches the card.
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (d.moved) {
      window.scrollBy({ top: ((d.y - event.clientY) * unit) / DRAG_UNITS, behavior: "instant" });
    }
    d.y = event.clientY;
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onCardClick = (i: number, item: WorksWheelItem) => (event: React.MouseEvent) => {
    if (suppressClick.current) {
      event.preventDefault();
      suppressClick.current = false;
      return;
    }
    // Only the piece at the front opens; anything else is brought round first.
    if (!open || i !== active) {
      event.preventDefault();
      select(i);
      return;
    }
    if (item.href && onOpen && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      event.preventDefault();
      onOpen(item, event);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const now = Math.round(target.current);
    if (event.key === "ArrowDown" || event.key === "ArrowRight") to(now + 1);
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") to(now - 1);
    else if (event.key === "Home") to(1);
    else if (event.key === "End") to(count);
    else return;
    event.preventDefault();
  };

  if (!count) return null;

  const current = items[active];
  const sectionHeight = `calc(100svh + ${(count + TAIL) * unit}px)`;

  return (
    <section
      ref={sectionRef}
      aria-label={heading ?? label}
      className={cn("bg-background text-foreground relative", className)}
      style={{ height: sectionHeight, ...style }}
      {...props}
    >
      <div className="sticky top-0 h-svh overflow-hidden select-none">
        {/* Section header - fades as the ring opens. */}
        <div
          ref={headRef}
          className="pointer-events-none absolute inset-x-0 top-0 z-[120] px-5 pt-24 sm:px-8 md:pt-28 lg:px-14"
        >
          <div className="container-wide">
            <p className="eyebrow mb-4">{label}</p>
            {heading ? (
              <h2 className="font-display text-heading font-[500] tracking-[-0.045em]">
                {heading}
              </h2>
            ) : null}
            {subheading ? (
              <p className="text-lead text-muted-foreground mt-4 max-w-[34ch]">{subheading}</p>
            ) : null}
          </div>
        </div>

        <div
          ref={stageRef}
          tabIndex={0}
          role="group"
          aria-roledescription={tr("портфолио")}
          aria-label={`${label}: ${current?.title ?? ""}. ${tr("Стрелките сменят проекта.")}`}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={() => {
            pointer.current = { x: 0, y: 0 };
          }}
          className={cn(
            // z-0: its own stacking context, so 3D cards never paint over the captions.
            "absolute inset-0 z-0 touch-pan-y outline-none",
            "focus-visible:outline-ice focus-visible:outline-2 focus-visible:-outline-offset-8",
            open ? "cursor-grab active:cursor-grabbing" : "cursor-default",
          )}
          style={{ perspective: `${metrics.depth}px` }}
        >
          {/* A soft light under the front card. */}
          <div
            ref={glowRef}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0",
              "bg-[radial-gradient(closest-side,rgb(18_17_16/0.07),transparent)]",
              narrow ? "top-[44%]" : "top-1/2",
            )}
            style={{ width: metrics.cardW * 1.9, height: metrics.cardH * 2.1 }}
          />
          <div
            ref={wheelRef}
            className={cn(
              "absolute left-1/2 [transform-style:preserve-3d]",
              narrow ? "top-[44%]" : "top-1/2",
            )}
          >
            {items.map((item, i) => {
              const isFront = open && i === active;
              return (
                <a
                  key={item.id}
                  id={`works-wheel-${item.id}`}
                  href={item.href ?? "#"}
                  target={item.href?.startsWith("http") ? "_blank" : undefined}
                  rel={item.href?.startsWith("http") ? "noreferrer" : undefined}
                  draggable={false}
                  tabIndex={isFront ? 0 : -1}
                  aria-label={isFront ? `${action}: ${item.title}` : `${item.title} — ${tr("избери")}`}
                  aria-current={isFront ? "true" : undefined}
                  onClick={onCardClick(i, item)}
                  ref={(node) => {
                    cardRefs.current[i] = node;
                  }}
                  className="group absolute [backface-visibility:hidden] focus-visible:outline-none"
                  style={{
                    width: metrics.cardW,
                    height: metrics.cardH,
                    marginLeft: -metrics.cardW / 2,
                    marginTop: -metrics.cardH / 2,
                  }}
                >
                  <span className="bg-surface-2 ring-foreground/10 group-focus-visible:ring-ice relative block size-full overflow-hidden rounded-[6px] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)] ring-1 group-focus-visible:ring-2">
                    <img
                      src={item.image}
                      alt=""
                      draggable={false}
                      loading={i < 3 ? "eager" : "lazy"}
                      decoding="async"
                      className="absolute inset-0 size-full object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                    />
                    {item.video ? (
                      <CardVideo key={i === active ? `on-${active}` : "off"} src={item.video} poster={item.image} playing={onScreen && open && i === active} />
                    ) : null}
                    {item.badge ? (
                      <span className="bg-background/75 text-foreground/90 absolute top-3 left-3 rounded-full px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.16em] uppercase">
                        {item.badge}
                      </span>
                    ) : null}
                    <span
                      aria-hidden="true"
                      ref={(node) => {
                        dimRefs.current[i] = node;
                      }}
                      className="bg-background pointer-events-none absolute inset-0 opacity-0"
                    />
                    {action && item.href && isFront ? (
                      <span className="bg-background/80 text-foreground pointer-events-none absolute right-3 bottom-3 flex translate-y-1 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                        {action}
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      </span>
                    ) : null}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Ring label */}
        <div
          ref={labelRef}
          aria-hidden="true"
          className={cn(
            "font-display text-muted-foreground pointer-events-none absolute inset-x-0 grid place-items-center font-[500] tracking-[0.18em]",
            narrow ? "top-0 h-[88%]" : "inset-y-0",
          )}
          style={{ fontSize: Math.max(14, metrics.title * 0.6) }}
        >
          {label}
        </div>

        {/* Front card caption. Desktop: left of the drum. Phones: below it. */}
        <div
          ref={frontRef}
          className={cn(
            "absolute z-[110] opacity-0",
            narrow
              ? "from-background via-background/90 inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-5 pt-20 pb-24 sm:px-8"
              : "bottom-[11%] left-[6%]",
            !open && "pointer-events-none",
          )}
          style={
            narrow
              ? undefined
              : { width: `calc(50% - ${metrics.cardW / 2}px - 9%)` }
          }
          aria-live="polite"
        >
          <p key={`e${active}`} className="ww-rise eyebrow mb-3">
            {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            {current?.meta ? <span className="text-muted-foreground/80"> · {current.meta}</span> : null}
          </p>
          <p
            key={`t${active}`}
            className="ww-rise ww-d1 font-display font-[500] tracking-[-0.03em] text-balance"
            style={{ fontSize: narrow ? "2rem" : clamp(metrics.title, 28, 56), lineHeight: 1.02 }}
          >
            {current?.title}
          </p>
          {current?.href ? (
            <a
              href={current.href}
              target={current.href.startsWith("http") ? "_blank" : undefined}
              rel={current.href.startsWith("http") ? "noreferrer" : undefined}
              tabIndex={open ? 0 : -1}
              onClick={(event) => {
                if (onOpen && current && !event.metaKey && !event.ctrlKey) {
                  event.preventDefault();
                  onOpen(current, event);
                }
              }}
              className="text-foreground hover:text-ice mt-5 inline-flex items-center gap-1.5 border-b border-current pb-0.5 text-sm font-medium transition-colors"
            >
              {action}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          ) : null}
        </div>

        {/* Index - desktop. */}
        {!narrow ? (
          <nav
            aria-label={`${label} — ${tr("индекс")}`}
            className="text-muted-foreground absolute top-[12%] right-[2.5%] z-[120] text-right leading-[1.9]"
            style={{ fontSize: clamp(metrics.index, 12, 15) }}
          >
            <ol>
              {items.map((item, i) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => select(i)}
                    aria-current={open && i === active ? "true" : undefined}
                    className={cn(
                      "hover:text-foreground cursor-pointer rounded-sm px-1 transition-colors",
                      open && i === active && "text-foreground font-medium",
                    )}
                  >
                    {item.title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <div className="absolute right-5 bottom-6 left-5 z-[120] flex items-center justify-between sm:right-8 sm:left-8">
            <span className="text-label text-muted-foreground tracking-[0.22em] uppercase">
              {open ? tr("Плъзни за следващия") : tr("Плъзни нагоре")}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label={tr("Предишен проект")}
                onClick={() => to(Math.round(target.current) - 1)}
                className="border-foreground/20 grid size-11 place-items-center rounded-full border"
              >
                <ChevronUp aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                aria-label={tr("Следващ проект")}
                onClick={() => to(Math.round(target.current) + 1)}
                className="border-foreground/20 grid size-11 place-items-center rounded-full border"
              >
                <ChevronDown aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** The front card's recording. Mounted only once the wheel has rested on the
    card for a moment, so a quick spin through the projects starts no
    downloads; it always starts from the first frame - the top of the site.
    The poster stays below and shows through until the first frame is ready,
    or for good when the device refuses to play (Low Power Mode). */
function CardVideo({
  src,
  poster,
  playing,
}: {
  src: NonNullable<WorksWheelItem["video"]>;
  poster: string;
  playing: boolean;
}) {
  const ref = React.useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const reduced = useReducedMotion();
  const on = playing && !reduced;

  React.useEffect(() => {
    if (!on) {
      setMounted(false);
      setReady(false);
      return;
    }
    const id = window.setTimeout(() => setMounted(true), 220);
    return () => window.clearTimeout(id);
  }, [on]);

  React.useEffect(() => {
    const v = ref.current;
    if (!v || !mounted) return;
    // iOS plays inline video on its own only when it is muted as an attribute,
    // not just as a property - React sets the property only.
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.currentTime = 0;
    const p = v.play();
    if (p) p.catch(() => setReady(false));
    return () => v.pause();
  }, [mounted]);

  if (!mounted) return null;
  return (
    <video
      ref={ref}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      disablePictureInPicture
      aria-hidden="true"
      onPlaying={() => setReady(true)}
      onError={(e) => {
        if (e.target === e.currentTarget) setReady(false);
      }}
      className={cn(
        "absolute inset-0 size-full object-cover transition-opacity duration-500",
        ready ? "opacity-100" : "opacity-0",
      )}
    >
      {src.mp4 ? <source src={src.mp4} type="video/mp4" /> : null}
      {src.webm ? <source src={src.webm} type="video/webm" /> : null}
    </video>
  );
}

export default WorksWheel;
