import { useEffect, useRef, useState } from "react";

/*
  Ателието — едно изречение, чиито думи светват, докато скролваш,
  и три правила отдолу.
*/
const LINE = "Шием малко, бавно и в София. Дреха, която гледаш от всеки ъгъл, трябва да е хубава от всеки ъгъл.";
const RULES = [
  ["01", "Малки серии", "Всяка дреха излиза в ограничен брой. Когато свърши — свършва."],
  ["02", "Тежки материи", "Памук над 300 г/м², истинска вълна, рогови копчета. Нищо, което се усеща евтино."],
  ["03", "Кройка за движение", "Ниско рамо, свободен гръб, дължини, които не се дърпат, когато седнеш."],
];

export function Atelier() {
  const ref = useRef<HTMLParagraphElement>(null);
  const [lit, setLit] = useState(0);
  const words = LINE.split(" ");

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = ref.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
        setLit(Math.round(p * words.length));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [words.length]);

  return (
    <section id="atelier" className="relative py-28 sm:py-40">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-8">
        <p className="label text-blood">Ателието</p>
        <p ref={ref} className="mt-6 max-w-[22ch] text-[clamp(2.25rem,1rem+4.4vw,5.75rem)] font-light leading-[1.02] tracking-[-0.045em]">
          {words.map((w, i) => (
            <span key={i} className="transition-colors duration-500" style={{ color: i < lit ? "var(--color-ink)" : "rgb(20 18 16 / 0.14)" }}>
              {i === 10 || i === 11 ? <span className="serif-i">{w}</span> : w}{" "}
            </span>
          ))}
        </p>
        <ul className="mt-20 grid gap-10 border-t border-line pt-10 sm:grid-cols-3">
          {RULES.map(([n, t, d]) => (
            <li key={n}>
              <p className="label text-muted">{n}</p>
              <p className="mt-3 text-title font-medium tracking-tight">{t}</p>
              <p className="mt-3 max-w-xs text-ink-2">{d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
