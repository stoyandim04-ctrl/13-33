# Notes for agents working on this repo

- Bulgarian first: all visible copy is Bulgarian; `<html lang="bg">` turns on the Bulgarian Cyrillic forms of Sofia Sans — keep it.
- Never invent clients, results, testimonials, prices or deadlines. Concept projects stay labelled (`status: "concept"`).
- Visual system lives in `src/index.css` (`@theme`): one accent (#5B7CFA) for primary action/current state only; fixed type scale (`text-label/body/lead/title/heading/display`); every section opens with `eyebrow → heading → lead`.
- `components/ui/horizon-*` and `components/ui/works-wheel.tsx` are adapted from provided originals (see README). Keep their behaviour; the hero and the wheel own separate stretches of the page scroll — don't add wheel-event capture.
- No secrets in client code: only `VITE_*` public values. Inquiries/AI go through server endpoints.
- Before finishing: `npm run build` (runs `tsc -b`).
