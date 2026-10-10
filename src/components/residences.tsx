import { useState } from "react";
import { residences, type Residence } from "../data/content";
import { SectionHead } from "./section-head";

function Plan({ r }: { r: Residence }) {
  return (
    <svg key={r.id} viewBox="0 0 100 64" className="h-auto w-full" role="img" aria-label={`План — ${r.name}`}>
      {r.plan.map((room, i) =>
        room.outdoor ? (
          <rect
            key={i}
            x={room.x}
            y={room.y}
            width={room.w}
            height={room.h}
            className="plan-label fill-paper-3/40 stroke-mute"
            strokeWidth={0.18}
            strokeDasharray="0.8 0.8"
            style={{ animationDelay: `${0.6 + i * 0.05}s` }}
          />
        ) : (
          <rect
            key={i}
            x={room.x}
            y={room.y}
            width={room.w}
            height={room.h}
            pathLength={1}
            className="plan-line fill-none stroke-ink"
            strokeWidth={0.32}
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ),
      )}
      {r.plan.map(
        (room, i) =>
          room.label && (
            <text
              key={`t${i}`}
              x={room.x + room.w / 2}
              y={room.y + room.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="plan-label fill-mute font-sans"
              style={{ fontSize: 1.9, letterSpacing: 0.25, animationDelay: `${0.7 + i * 0.06}s` }}
            >
              {room.label}
            </text>
          ),
      )}
      {/* north arrow */}
      <g className="plan-label stroke-ink" style={{ animationDelay: "1.2s" }} strokeWidth={0.2}>
        <line x1={97} y1={56} x2={97} y2={61} />
        <path d="M95.8 57.4 L97 55.6 L98.2 57.4" fill="none" />
      </g>
    </svg>
  );
}

export function Residences() {
  const [active, setActive] = useState(residences[1].id);
  const r = residences.find((x) => x.id === active) ?? residences[0];

  return (
    <section id="zhilishta" aria-labelledby="zhilishta-h" className="section bg-paper">
      <div className="wrap">
        <SectionHead
          id="zhilishta-h"
          eyebrow="Жилища"
          title="Три вида жилища, един и същ покой"
          lead="Всяко има собствена тераса или градина и прозорци на две страни. Изберете, за да видите плана."
        />

        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20" data-reveal>
          <div>
            <div role="tablist" aria-label="Вид жилище" className="border-t border-line">
              {residences.map((x) => {
                const on = x.id === active;
                return (
                  <button
                    key={x.id}
                    role="tab"
                    id={`tab-${x.id}`}
                    aria-selected={on}
                    aria-controls="plan-panel"
                    onClick={() => setActive(x.id)}
                    className="group flex w-full items-baseline justify-between gap-4 border-b border-line py-6 text-left"
                  >
                    <span className={`font-display text-title font-light transition-colors duration-500 ${on ? "text-ink" : "text-mute group-hover:text-ink"}`}>
                      {x.name}
                    </span>
                    <span className={`eyebrow transition-colors duration-500 ${on ? "text-accent" : "text-mute"}`}>{x.floors}</span>
                  </button>
                );
              })}
            </div>

            <p className="mt-10 max-w-[28rem] text-lead text-pretty">{r.note}</p>

            <dl className="mt-10 grid grid-cols-3 gap-6">
              {[
                { k: "Площ", v: r.area, u: "м²" },
                { k: r.outdoorLabel, v: r.outdoor, u: "м²" },
                { k: "Спални", v: r.bedrooms, u: "" },
              ].map((s) => (
                <div key={s.k} className="border-t border-line pt-4">
                  <dt className="eyebrow text-mute">{s.k}</dt>
                  <dd className="mt-3 font-display text-[clamp(2.4rem,1.8rem+2vw,3.6rem)] font-light leading-none [font-variant-numeric:lining-nums]">
                    {s.v}
                    {s.u && <span className="ml-1 text-[0.4em] text-mute">{s.u}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 text-[0.8rem] text-mute">Площите са ориентировъчни — Варовик е концепция, не реален обект.</p>
          </div>

          <div id="plan-panel" role="tabpanel" aria-labelledby={`tab-${r.id}`} className="self-center bg-paper-2 p-6 md:p-12">
            <Plan r={r} />
          </div>
        </div>
      </div>
    </section>
  );
}
