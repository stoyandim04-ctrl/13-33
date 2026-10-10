# Black Clove — concept site

Portfolio concept by 13:33 Digital Studio for a black garlic brand. Separate
Vite app; shares the repo's dependencies, not the studio's source.

```sh
npm run dev:black-clove
npm run build:black-clove      # → apps/black-clove/dist
npm run preview:black-clove
```

Hosting: its own Vercel project — root = repository root, build
`npm run build:black-clove`, output `apps/black-clove/dist`.

## The film

The hero is a scroll-scrubbed film drawn on a canvas (`src/Film.tsx`):
rotate → open → pour → spread on toast. Frames come from three 5 s 1080p
scenes generated with Higgsfield (Seedance 2.0, start/end keyframes made with
GPT Image 2.5 from the brief's packaging photos), joined by
`scripts/build-sequence.sh` into three tiers:

| tier | for | frames | size |
| --- | --- | --- | --- |
| `d` | desktop, landscape | 181 (every 2nd) | 1600×900, 14 MB |
| `m` | phones, portrait | 181 (every 2nd) | 720×960 crop that follows the subject, 8 MB |
| `s` | slow phones (≤3 GB RAM / ≤3 cores), data saver, 2G/3G | 121 (every 3rd) | 480×640, 3 MB |

Smoothness: the scroll position is damped in time and the two frames around
the fractional position are cross-faded, so 12 fps source frames scrub
without visible steps in either direction. Loading: a coarse skeleton first
(every 8th frame, drives the loader), then whatever is nearest to the user's
scroll position; the nearest loaded frame always stands in. `TIMELINE` adds
short holds so each chapter can be read. Frames are decoded off-thread
(`img.decode()`); a decode failure under memory pressure just skips that
frame. Reduced motion: no damping, no entrance animations.

## Content rules

Concept project: no prices, certifications, reviews or ageing-day claims.
Black garlic is described in general terms only (`src/content.ts`). All
photography is AI-generated for presentation and labelled so in the footer.
