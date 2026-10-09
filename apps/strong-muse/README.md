# Strong Muse

Separate Bulgarian fitness-brand prototype for Anna Dimitrova. It shares the repository's installed dependencies but has its own Vite entry, CSS, content, favicon and build output. It does not import the root studio application.

Run from the repository root:

```sh
npm ci
npm run dev:strong-muse -- --host 0.0.0.0 --port 5174
npm run build:strong-muse
npm run preview:strong-muse -- --host 0.0.0.0 --port 4174
npm run test:strong-muse
```

The smoke test requires a built app and Chromium (or `CHROMIUM_PATH`); it starts and stops its own local preview. Outputs are `apps/strong-muse/dist`, separately from the studio's root `dist`.

Shared brief, decisions, backlog and handoff live in `docs/strong-muse`. Current scope: review prototype only; planned programs, no checkout, accounts, downloads or collected inquiries. All illustrations are placeholders until authorized client photos arrive.

For a future separate hosting project, use repository root as the installation directory, `npm run build:strong-muse` as the build command, and `apps/strong-muse/dist` as the output. The studio remains `npm run build` → `dist`. Both projects can use their own domains. Configure hosting only after approval; no live project is created by these files.
