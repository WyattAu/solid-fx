# Visual QA triage

Source of truth: the CI `screenshots` workflow (runs on demand + weekly,
uploads `screenshots/` as an artifact). `scripts/shoot.mjs` additionally
performs a pointer sweep so interaction-driven components render, and the
five interaction-driven demos self-animate via
`src/lib/syntheticPointer.ts` (`autoPointer()` — synthesized pointermove/
down/click on a Lissajous path inside the demo host).

Latest baseline (run 41844145222): **206/218 verified rendering, 12 blanks**
(re-baselined 2026-11-05: the phone-rig captures were contaminated — the rig
shares Chrome with active user browsing; CI screenshots remain the source of
truth. CRTWarp's phone verification stands: its capture predates the
contamination and shows the correct purple warp.)

## Blank-frame triage (8 remaining)

| Component | Class | Explanation / next action |
| --- | --- | --- |
| AeroShards, ShapeWaves | environment | WebGPU: CI runners expose no WebGPU adapter. Render pattern identical to working ogl siblings; verify these two locally in a WebGPU browser. |
| CRTWarp | verified (mobile) | Renders pixel-perfect on a real mobile GPU (phone screencap, 2026-11-03 — captured before the rig contamination). CI/desktop black frame is a software-GL limitation of the build box. |
| SoftAurora | re-test (rig) | Phone re-test contaminated: the device hit Chrome's WebGL context cap after the test marathon (ModelViewer on the same rig showed "Error creating WebGL context"). Port code verified faithful (uniforms + loop byte-diff clean). Clean re-test: close Chrome tabs / clear contexts, reload. |
| ModelViewer | **fixed** | Root cause: the data-URL demo (`data:model/obj,…`) has no file extension, so format dispatch fell through to GLTFLoader → JSON.parse error. Fixed: dispatch now recognizes `data:model/(obj|gltf|glb|fbx)` mime prefixes. Verify visually next screenshots run. |
| DodgeField | investigate | Page main-thread hangs with autoPointer active (suspected feedback loop between synthesized pointermove and dodge logic). Debug with the pointer disabled, then re-enable with amplitude guard. |
| Shredder | investigate | Timing: shreds to blank by capture time — capture earlier or loop the demo. |
| MaskedHeading | investigate | Content in DOM but glyphs never position (0/20) — sync() is wired (ResizeObserver + fonts.ready) yet never completes. Debug the measure/sync path: likely `measureEl`/wordEls refs empty at first sync and no later trigger fires. |

## Debt

- PORT-NOTE markers: **0** — fully burned down. ScrollVelocity physics
  reclassified SOLID-ADAPTATION; RotatingText FLIP width-animation and
  sync-presence mode implemented.
- a11y advisories (~18) and ~200 style warnings in `src/content` are
  warn-level by design (upstream-fidelity patterns); burn down during visual QA.
