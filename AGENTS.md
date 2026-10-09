# Notes for agents working on this repo

- Bulgarian first: all visible copy is Bulgarian; `<html lang="bg">` turns on the Bulgarian Cyrillic forms of Sofia Sans — keep it.
- Never invent clients, results, testimonials, prices or deadlines. Concept projects stay labelled (`status: "concept"`).
- The root studio's visual system lives in `src/index.css` (`@theme`): one accent (#5B7CFA) for primary action/current state only; fixed type scale (`text-label/body/lead/title/heading/display`); every section opens with `eyebrow → heading → lead`. Client applications have their own scoped visual systems.
- `components/ui/horizon-*` and `components/ui/works-wheel.tsx` are adapted from provided originals (see README). Keep their behaviour; the hero and the wheel own separate stretches of the page scroll — don't add wheel-event capture.
- No secrets in client code: only `VITE_*` public values. Inquiries/AI go through server endpoints.
- Before finishing: `npm run build` (runs `tsc -b`).

## Multiple sites in this repository

- The root `src/` and `dist/` belong to the 13:33 studio. Keep its existing behavior.
- Client sites belong under `apps/<client>/` with independent entry points and build outputs. Do not share client identity, global CSS, public paths or business content through the studio application.
- Strong Muse lives in `apps/strong-muse/`. Read its `AGENTS.md` and `docs/strong-muse` shared project files before work. Both Codex and Claude Code must update the same decisions/backlog/handoff.
- Validate both sites with `npm run build:all`; validate Strong Muse interactions with `npm run test:strong-muse`.
- Do not deploy a client prototype or activate unconfirmed commercial functions without approval.
