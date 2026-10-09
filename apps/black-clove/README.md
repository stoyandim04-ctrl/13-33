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
`scripts/build-sequence.sh`:

- `public/seq/d` — 16:9, 1600 px, desktop; the canvas keeps the subject in
  view with a focal point per scroll position.
- `public/seq/m` — 3:4 portrait crop that follows the subject, for phones.

Frames load coarse-to-fine; the nearest loaded frame is always drawn.
`TIMELINE` in `Film.tsx` adds short holds so each chapter can be read.

## Content rules

Concept project: no prices, certifications, reviews or ageing-day claims.
Black garlic is described in general terms only (`src/content.ts`). All
photography is AI-generated for presentation and labelled so in the footer.
