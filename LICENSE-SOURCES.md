# Source license vetting

solid-fx ports components from multiple upstream libraries. Each source must be
license-vetted **before** the first port lands, and carries its own NOTICE
entry here. Non-redistributable or non-commercial sources are excluded
regardless of quality.

| Source | Upstream license | Verdict | Status |
| --- | --- | --- | --- |
| react-bits (DavidHDev) | MIT + Commons Clause | Port allowed: free use inside products, library itself must not be sold. NOTICE in LICENSE.md. | Ported (218) — `src/content/` |
| Magic UI (magicui.design) | MIT | Approved. | Not started — `src/extras/magic-ui/` |
| Kibo UI (kibo-ui.com) | MIT | Approved. | Not started — `src/extras/kibo/` |
| Cursify (cursify.pages.dev) | MIT | Approved. | Not started — `src/extras/cursify/` |
| Aceternity UI (ui.aceternity.com) | Custom: free for personal + commercial **with attribution and no resale of components as-is** | Conditional. Requires per-component attribution block + NOTICE entry; decide before first port. | Vet — `src/extras/aceternity/` |
| Codrops (tympanus.net) | Per-demo licenses, many restrictive | Excluded unless a demo explicitly allows redistribution. | Excluded |
| Shadertoy derivatives | Per-shader (often CC BY-NC) | Excluded unless the specific shader is CC BY or MIT. | Excluded |

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
