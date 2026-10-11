import type { Hotspot } from "../data/menu";

/** Ъгълът, на който се накланя чинията. Табелките се завъртат обратно, за да „стоят“ изправени. */
export const TILT = 54;

/**
 * Съставките като 3D табелки, забити в чинията. Живеят в същия наклонен
 * контейнер като снимката, така че точката е точно върху съставката, а
 * стълбчето и надписът се изправят към зрителя.
 */
export function PlatePins({ spots, open }: { spots: Hotspot[]; open: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d" }} aria-hidden={!open}>
      {spots.map((s, i) => {
        // Задните точки получават по-високи стълбчета, предните — по-ниски, така табелките
        // се подреждат на етажи. Мерим в cqw, за да се мащабира с чинията.
        const stem = `${(26 + (100 - s.y) * 1.15) / 5}cqw`;
        const delay = open ? 0.25 + i * 0.09 : 0;
        return (
          <div key={s.label} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%`, transformStyle: "preserve-3d" }}>
            {/* сянка/пулс върху повърхността на чинията */}
            <span
              className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ember/80"
              style={{
                opacity: open ? 1 : 0,
                transform: `translate(-50%,-50%) scale(${open ? 1 : 0.2})`,
                transition: `opacity .4s ease ${delay}s, transform .7s cubic-bezier(.16,1,.3,1) ${delay}s`,
                animation: open ? "pin-pulse 2.2s ease-out infinite" : undefined,
                animationDelay: `${delay + 0.6}s`,
              }}
            />
            <span className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember shadow-[0_0_12px_rgba(255,91,36,0.9)]" style={{ opacity: open ? 1 : 0, transition: `opacity .3s ease ${delay}s` }} />
            {/* изправената част */}
            <div className="absolute bottom-0 left-0" style={{ transform: `rotateX(-${TILT}deg)`, transformOrigin: "0 100%", transformStyle: "preserve-3d" }}>
              <div className="flex -translate-x-1/2 flex-col items-center">
                <div
                  className="whitespace-nowrap rounded-lg border border-bone/15 bg-ink/80 px-2 py-1 md:rounded-xl md:px-3 md:py-1.5 text-center shadow-[0_12px_30px_rgba(0,0,0,0.6)] backdrop-blur-md"
                  style={{
                    opacity: open ? 1 : 0,
                    transform: `translateY(${open ? 0 : 14}px) scale(${open ? 1 : 0.85})`,
                    transition: `opacity .5s ease ${delay + 0.25}s, transform .8s cubic-bezier(.16,1,.3,1) ${delay + 0.25}s`,
                  }}
                >
                  <p className="hidden text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-muted md:block">{s.kicker}</p>
                  <p className="font-display text-[0.85rem] leading-tight text-bone md:text-[1.1rem]">{s.label}</p>
                </div>
                <span
                  className="w-px bg-gradient-to-b from-bone/70 to-ember"
                  style={{
                    height: stem,
                    transformOrigin: "50% 100%",
                    transform: `scaleY(${open ? 1 : 0})`,
                    transition: `transform .7s cubic-bezier(.16,1,.3,1) ${delay}s`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
