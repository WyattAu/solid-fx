# Visual QA triage

Source of truth: the CI `screenshots` workflow (runs on demand + weekly,
uploads `screenshots/` as an artifact). `scripts/shoot.mjs` additionally
performs a pointer sweep so interaction-driven components render.

Baseline run (2026-11-03): 218/218 pages captured, 0 crashes,
**206 verified rendering, 12 near-blank frames** (pixel-variance scan,
stddev < 6 over the demo region).

## Blank-frame triage

| Component | Class | Explanation / next action |
| --- | --- | --- |
| BlobCursor, ImageTrail, DodgeField, PixelTrail, SplashCursor, Ribbons | expected | Pointer-driven: animate only under the cursor. Covered by the shoot.mjs pointer sweep; verify on the next run. |
| AeroShards, ShapeWaves | expected | WebGPU: GitHub CI runners expose no WebGPU adapter. Verify locally in a WebGPU browser. |
| CRTWarp, SoftAurora | investigate | Shader backgrounds should self-animate — inspect console errors on the live page. |
| MaskedHeading | investigate | Text animation should be visible at capture time — check intro timing vs the 2.5s settle window. |
| ModelViewer | investigate | Demo renders an embedded OBJ data-URL; frame is empty in CI. Check OBJLoader parse + lighting (may be black-on-black without env). |

## Debt

- PORT-NOTE markers: **3** (grep `PORT-NOTE` in src/content) — RotatingText
  FLIP layout, RotatingText AnimatePresence mode, ScrollVelocity scroll
  physics. Everything else was burned down or reclassified as
  SOLID-ADAPTATION / SOLID-CONSTRAINT.
- a11y advisories (~18) and ~200 style warnings in `src/content` are
  warn-level by design (upstream-fidelity patterns); burn down during visual QA.
