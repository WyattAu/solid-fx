# Visual QA triage

Source of truth: the CI `screenshots` workflow (runs on demand + weekly,
uploads `screenshots/` as an artifact). `scripts/shoot.mjs` additionally
performs a pointer sweep so interaction-driven components render, and the
five interaction-driven demos self-animate via
`src/lib/syntheticPointer.ts` (`autoPointer()` — synthesized pointermove/
down/click on a Lissajous path inside the demo host).

Latest baseline (run 41844145222): **210/218 verified rendering, 8 blanks**.

## Blank-frame triage (8 remaining)

| Component | Class | Explanation / next action |
| --- | --- | --- |
| AeroShards, ShapeWaves | environment | WebGPU: CI runners expose no WebGPU adapter. Render pattern identical to working ogl siblings; verify these two locally in a WebGPU browser. |
| CRTWarp | verified | Renders pixel-perfect on a real mobile GPU (phone screencap proof, 2026-11-03). CI/desktop black frame is a software-GL limitation of the build box. |
| SoftAurora | re-test | Phone capture was inconclusive (mid-navigation). Clean re-test needed: load page fresh, wait 10s, capture. |
| ModelViewer | investigate | Embedded-OBJ demo renders empty in CI; check OBJLoader parse + lighting (black-on-black without env light). |
| DodgeField | investigate | std 3.6 (near-blank, marginal). DodgeField dodges the cursor; the synthetic pointer may not register as inside the field — tune autoPointer amplitude/host. |
| Shredder | investigate | Timing: shreds to blank by capture time — capture earlier or loop the demo. |
| MaskedHeading | investigate | Text animation invisible at capture time — check intro timing vs the settle window. |

## Debt

- PORT-NOTE markers: **0** — fully burned down. ScrollVelocity physics
  reclassified SOLID-ADAPTATION; RotatingText FLIP width-animation and
  sync-presence mode implemented.
- a11y advisories (~18) and ~200 style warnings in `src/content` are
  warn-level by design (upstream-fidelity patterns); burn down during visual QA.
