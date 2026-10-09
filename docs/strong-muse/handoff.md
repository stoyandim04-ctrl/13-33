# Handoff — Strong Muse

Read `brief.md`, `decisions.md`, `backlog.md`, app `AGENTS.md` and the original `source/` pages. This file is shared by Claude Code and Codex.

## Current implementation

Studio remains in root `src/`; Strong Muse is `apps/strong-muse`. Root package scripts launch and build each independently. No production deployment, checkout, accounts, public PDFs, live contact collection or runtime Jev integration is present.

Strong Muse has a hero with exact client slogans, original graphic placeholders, four planned program cards with working detail dialogs, Anna placeholder section, two nutrition-material cards, native FAQ, mobile menu and contact placeholder. No qualifications or prices are invented.

## Commands (repository root)

```sh
npm ci
npm run dev                 # studio
npm run dev:strong-muse -- --host 0.0.0.0 --port 5174
npm run build:all
npm run test:strong-muse
```

`npm run test:strong-muse` expects the built app and a usable browser. It uses `CHROMIUM_PATH`, otherwise system Chromium or Playwright's installed Chromium, and starts/stops its own preview on port 4175. It performs no paid API calls. Build outputs: `dist` (studio) and `apps/strong-muse/dist` (client).

## Next work

Get user/client feedback on the prototype and chosen A/B/C scenario. Obtain approved photos and bio/contact content. Update program data only after readiness confirmation. Keep design proposals separate from approvals. Hosting uses two projects from the same Git repo with separate build/output settings; do not deploy without approval.

## Validation

Studio production build: passed. Strong Muse TypeScript and production build: passed. Browser smoke tests at 360/390/768/1440 px: passed (assets, no overflow/page errors, program dialogs and focus restoration, mobile menu anchors/Escape, FAQ). Root studio source/public/index/config and package-lock remain unchanged. Screenshots and transient browser outputs belong outside the repo; actual secrets must never be logged or committed.
