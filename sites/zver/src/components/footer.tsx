import { scrollToId } from "../lib/scroll";
import { Claw } from "./bits";

export function Footer() {
  return (
    <footer className="relative z-20 overflow-hidden bg-[var(--f-bg)] px-4 pt-16 pb-8 text-[var(--f-ink)] sm:px-8">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
        <div>
          <p className="display text-title">Готов ли си?</p>
          <button type="button" className="btn-main mt-5" onClick={() => scrollToId("shop")}>
            Към кашоните <span aria-hidden>→</span>
          </button>
        </div>
        <div className="label grid max-w-md gap-3 opacity-85">
          <p>Високо съдържание на кофеин (32 мг/100 мл). Не се препоръчва за деца, бременни и кърмещи жени.</p>
          <p>ЗВЯР е концептуален проект на 13:33 — марката, вкусовете, съставът и цените са измислени. Нищо не се продава.</p>
        </div>
      </div>
      <div className="mt-12 flex items-end gap-[1vw] leading-[0.78]" aria-hidden>
        <Claw className="h-[18vw] w-[18vw] shrink-0" />
        <span className="display text-[24vw]">ЗВЯР</span>
      </div>
      <div className="label mt-6 flex flex-wrap justify-between gap-3 border-t-[3px] border-current pt-4">
        <span>© 2026 ЗВЯР · концепция</span>
        <a href="https://digistudio13.com" className="nav-link" target="_blank" rel="noreferrer">
          Направено от 13:33
        </a>
      </div>
    </footer>
  );
}
