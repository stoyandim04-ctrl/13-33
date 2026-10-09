# Decisions shared by Codex and Claude Code

## Authorized by the user

- Keep the studio and client websites in `stoyandim04-ctrl/13-33`.
- Prepare Strong Muse as a separate application in `apps/strong-muse`; preserve the root studio.
- Prepare an initial review prototype based on the supplied brief; no live publication.

## Implementation choices, still subject to design review

- Shared root dependencies, no move of the studio checkout or source, independent Vite root and output. No workspace migration is needed for this first app.
- Warm paper, plum/rose/peach/sage accents, Sofia Sans + Cormorant Garamond, subtle interactive states, original abstract graphics. These are proposals, not client-approved brand tokens.
- Program details use a native modal dialog, no sales action. Mobile menu also uses native dialog for focus containment and Escape behavior.
- Unknown bio/contact information is visibly pending in the review prototype; replace with approved facts before launch.
- `noindex` and concept notice remain until explicit release approval. They are not access control; no private originals or actual nutrition PDFs belong in public assets.

## Unresolved client decisions

Site goal, commercial scenario, CTA, audience, final content/photos/design, product readiness, rights, price, delivery and payment provider. No active checkout/accounts are authorized.

## Jev evidence

`jev-evaluation.json` is the real original API answer to the actual source brief: HTTP 200; requested alias `jev-latest`, resolved model `jev-1.13.0`; 9512 input / 69 output tokens. Five Score questions used an ordered 0–3 rubric: unsupported now, useful later, important parallel preparation, essential blocker.

Scores: scope 2.86; repository/app location 2.55; assets/rights/readiness 2.51; visual prototype 1.98; premature checkout 0.28. The user's later repository decision resolves location. Jev scores are advisory and do not authorize changes, verify credentials or establish client approval. No API keys are stored.
