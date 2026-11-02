# src/scenes — full-page compositions

Assembled pages built from `src/content` components: heroes, feature sections,
landings. A scene is a Solid component that composes ports with layout and
copy — the presentation layer above the parts bin.

One dir per scene: `src/scenes/<Scene>/<Scene>.tsx`. Scenes may import
components (the only layer allowed to), never other scenes. Each scene ships a
docs page like components do (extend `scripts/gen-docs.mjs` when the first
real scene lands).
