# Source license vetting

solid-fx ports components from multiple upstream libraries. Each source must be
license-vetted **before** the first port lands, and carries its own NOTICE
entry here. Non-redistributable or non-commercial sources are excluded
regardless of quality.

| Source                            | Upstream license                                                                              | Verdict                                                                                         | Status                               |
| --------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------ |
| react-bits (DavidHDev)            | MIT + Commons Clause                                                                          | Port allowed: free use inside products, library itself must not be sold. NOTICE in LICENSE.md.  | Ported (218) — `src/content/`        |
| anime.js (juliangarnier)          | MIT © 2025 Julian Garnier — `LICENSE.md` verified at github.com/juliangarnier/anime (branch `master`); npm `animejs` 4.5.0 ships `license: MIT` | Approved. Engine: vanilla, framework-agnostic ES modules — see EXTRAS-ROADMAP.md pilot.        | Vetted — engine pilot pending — `src/extras/animejs/` |
| tsParticles (tsparticles org)     | MIT © 2020 Matteo Bruni — `LICENSE` verified at github.com/tsparticles/tsparticles (canonical org repo; `matteobruni/tsparticles` redirects) | Approved. Engine: `@tsparticles/engine` + bundles; official Solid adapter exists.              | Vetted — `src/extras/tsparticles/`   |
| Magic UI (magicui.design)         | MIT                                                                                           | Approved.                                                                                       | Partial (3: BorderBeam, DotPattern, Marquee) — `src/extras/magic-ui/` |
| Kibo UI (kibo-ui.com)             | MIT © 2023–present shadcnblocks — `license.md` verified at github.com/shadcnblocks/kibo (repo moved from `haydenbleasel/kibo` after Oct 2025 shadcnblocks acquisition; `kibo-ui/kibo` 404s) | Approved. Functional shadcn registry — low animation overlap, defer picks.                     | Not started — `src/extras/kibo/`     |
| Cursify (ui-layouts/cursify)      | **None** — GitHub API `license: null`, no LICENSE file; request open since Mar 2025 (issue #21), repo stale (last push Mar 2026) | **Excluded.** No license = all rights reserved; earlier "MIT Approved" row was wrong. Re-vet only if upstream adds a license. | Excluded                             |
| Aceternity UI (ui.aceternity.com) | Custom: free for personal + commercial **with attribution and no resale of components as-is** | Conditional. Requires per-component attribution block + NOTICE entry; decide before first port. | Vet — `src/extras/aceternity/`       |
| Codrops (tympanus.net)            | Per-demo licenses, many restrictive                                                           | Excluded unless a demo explicitly allows redistribution.                                        | Excluded                             |
| Shadertoy derivatives             | Per-shader (often CC BY-NC)                                                                   | Excluded unless the specific shader is CC BY or MIT.                                            | Excluded                             |

## Rules for adding a source

1. Vet the license into this table first — no port before a verdict line exists.
2. Each source lives in its own tree: `src/extras/<source>/<Category>/<Name>/<Name>.tsx`.
   Sources never share directories; the react-bits sync diff (`.github/workflows/sync-check.yml`)
   depends on `src/content/` being react-bits-native.
3. Addendum contract: the same PORTING.md rules apply (Solid idioms, cleanup,
   layering), plus a provenance header in each ported file:
   `// Source: <upstream repo/url>@<commit-or-date>. License: <spdx-or-url>.`
4. Overlap rule: if two sources ship the same effect, keep the more faithful
   port and alias the other (`export { default } from '…'` with a provenance note).
5. NOTICE: append the source's attribution requirements to LICENSE.md.
