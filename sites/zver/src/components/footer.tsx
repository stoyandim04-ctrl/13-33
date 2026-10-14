import { scrollToId } from "../lib/scroll";
import { Claw } from "./bits";

export function Footer() {
  return (
    <footer className="relative z-20 overflow-hidden bg-[var(--f-bg)] px-4 pt-16 pb-8 text-[var(--f-ink)] sm:px-8">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
        <div>
          <p className="display text-title">Ready?</p>
          <button type="button" className="btn-main mt-5" onClick={() => scrollToId("shop")}>
            Grab a pack <span aria-hidden>→</span>
          </button>
        </div>
        <div className="label grid max-w-md gap-3 opacity-85">
          <p>High caffeine content (32 mg/100 ml). Not recommended for children or pregnant or breastfeeding women.</p>
          <p>FERAL is a concept project by 13:33 — the brand, flavours, ingredients and prices are invented. Nothing is for sale.</p>
        </div>
      </div>
      <div className="mt-12 flex items-end gap-[1vw] leading-[0.78]" aria-hidden>
        <Claw className="h-[18vw] w-[18vw] shrink-0" />
        <span className="display text-[33vw]">FERAL</span>
      </div>
      <div className="label mt-6 flex flex-wrap justify-between gap-3 border-t-[3px] border-current pt-4">
        <span>© 2026 FERAL · concept</span>
        <a href="https://digistudio13.com" className="nav-link" target="_blank" rel="noreferrer">
          Made by 13:33
        </a>
      </div>
    </footer>
  );
}
