# РОЗА 1903

Концептуален сайт на 13:33 за измислена парфюмерийна къща от Розовата долина.
Next.js (App Router) + TypeScript + Tailwind v4, GSAP + ScrollTrigger, Lenis, React Three Fiber.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
```

## Как е устроен

- Всяка сцена е цял екран (`.stage`, fixed). Страницата е само „писта“ за скрола.
- `lib/timeline.ts` — един master timeline, мерен във `vh` скрол. `SCENES` държи
  дължините (300 / 400 / 300 / 500 / 3×150 / 200 / 150), `useSceneTimeline` слага
  локалния timeline на сцената на нейното място. Кръстосаните преливания и
  атмосферата (цвят на фона) са в `components/Experience.tsx`.
- `components/scenes/Scene*.tsx` — по един файл за сцена.
- `components/Preloader.tsx` — медна линия с реалния прогрес, 0000 → 1903, завеса.
- `components/ui/Film.tsx` — зърно и виньетка; `Cursor.tsx` — курсорът
  (`data-cursor="Дума"` го разтваря в кръг с текста).
- `lib/sound.ts` — Howler, изключен по подразбиране.

Фаза 1: основата. CSS „плочите“ в сцените се заменят от кадрите на Higgsfield
(Фаза 2–3) и от WebGL (частици, капка, бутилка) във Фаза 3–5.
