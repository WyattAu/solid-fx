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
| CRTWarp | verified (mobile GPU) | Renders pixel-perfect on a real mobile GPU (phone screencap, 2026-11-03 — captured before the rig contamination). CI/desktop black frame is a software-GL limitation of the build box. |
| SoftAurora | **verified** | Canvas-mount fix deployed; renders on desktop (std 32.4, pixel-verified 2026-11-06). Phone re-test blocked only by the rig context cap. | Phone re-test contaminated: the device hit Chrome's WebGL context cap after the test marathon (ModelViewer on the same rig showed "Error creating WebGL context"). Port code verified faithful (uniforms + loop byte-diff clean). Clean re-test: close Chrome tabs / clear contexts, reload. |
| ModelViewer | **verified** | Data-URL dispatch fix confirmed in production: octahedron renders lit + rotating (desktop playwright screenshot, 2026-11-06). Full sidebar + chrome also verified on the same pass. |
| DodgeField | verified | Loads + renders healthy in a real browser (dodge counter live, zero hang, zero console errors — verified via Aileron, 2026-11-05). CI blank = capture timing: elements dodge out of the crop region. |
| Shredder | verified (timing) | Port matches upstream loop logic exactly (loopAfterDelete revive / loop-when-empty). CI blank = legit empty stage between shred cycles at capture time. Capture earlier or accept. |
| MaskedHeading | investigate | Content in DOM but glyphs never position (0/20) — sync() is wired (ResizeObserver + fonts.ready) yet never completes. Debug the measure/sync path: likely `measureEl`/wordEls refs empty at first sync and no later trigger fires. |

## Site chrome (fixed 2026-11-06)

- PageFrame named-slot forwarding restored the site header (site title,
  Search Ctrl+K, theme select, GitHub) and the sidebar pane on all doc
  pages — verified live via playwright (header buttons enumerated,
  theme select present).
- Follow-up (minor): Starlight prev/next pagination container renders but
  stays empty on doc pages — likely needs explicit `prev`/`next` frontmatter
  or a sidebar-order hint per category. Low priority: sidebar + search cover
  navigation.

## Debt

- PORT-NOTE markers: **0** — fully burned down. ScrollVelocity physics
  reclassified SOLID-ADAPTATION; RotatingText FLIP width-animation and
  sync-presence mode implemented.
- a11y advisories (~18) and ~200 style warnings in `src/content` are
  warn-level by design (upstream-fidelity patterns); burn down during visual QA.
