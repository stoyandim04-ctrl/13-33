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

- `lib/sequence.ts` + `components/ui/SeqCanvas.tsx` — image sequence на canvas
  (`public/seq/<сцена>/d|m/0001.webp`), зарежда първо всеки 4-ти кадър.
- `components/gl/Fog.tsx` — мъглата на Сцена I (fbm шейдър, курсорът я разтваря).
- `components/gl/Petals.tsx` — листенцата на Сцена II: падане → вихър → бутилка → капки,
  всичко във vertex шейдъра. Броят идва от `lib/gpu.ts` (detect-gpu; 8 000 на телефон).
- `lib/bottle.ts` — профилът на флакона, общ за частиците и 3D бутилката.

Кадрите се режат така (24 fps; desktop 1920w q78, mobile 720×1280 q72):

```bash
ffmpeg -i dawn.mp4 -vf "fps=24,scale=1920:-2" -c:v libwebp -quality 78 public/seq/dawn/d/%04d.webp
ffmpeg -i dawn.mp4 -vf "fps=24,crop=ih*9/16:ih,scale=720:1280" -c:v libwebp -quality 72 public/seq/dawn/m/%04d.webp
```

Фаза 1: основата. CSS „плочите“ в сцените се заменят от кадрите на Higgsfield
(Фаза 2–3) и от WebGL (частици, капка, бутилка) във Фаза 3–5.
