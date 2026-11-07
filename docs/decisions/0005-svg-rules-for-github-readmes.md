# 0005 · What a card may contain so it renders inside a GitHub README

Date: 2026-11-07

## Context

GitHub shows README images through camo, its image proxy, inside an `<img>` tag. A browser treats an SVG loaded that way as an isolated, static document.

## Decision

Every card follows these rules. `test/designs.test.ts` checks the mechanical ones for every design, both themes and both fixtures:

- **Self-contained.** No `<script>`, no event handlers, no `<foreignObject>`, and no external URL of any kind: no web fonts, no `@import`, no `<image href="https://…">`. Avatars are embedded as `data:` URIs, about 4 KB each at 64 px.
- **System fonts.** Sans: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif`. Mono: `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace`. Text can't be measured at render time, so widths are estimated at about 0.58 em per character for sans and 0.6 em for mono, with slack left. Long names are truncated with `…`.
- **At most 840 px wide**, the width of the profile README column. The root `<svg>` has `width`, `height` and `viewBox`, so it scales down on narrow screens.
- **Two themes, two files.** Each design renders a `dark` file (GitHub dark: `#0d1117` background, `#e6edf3` text) and a `light` file (`#ffffff`, `#1f2328`). The README picks one with `<picture>` and `prefers-color-scheme`. A single SVG with an internal `@media (prefers-color-scheme)` follows the operating system, not the GitHub theme setting, so it would be wrong for anyone who set GitHub's theme by hand.
- **Animation only if finite and subtle.** CSS `@keyframes` do play inside `<img>`. The card must be complete in its final frame, because camo or a screenshot may capture any moment.
- **No interaction.** Hover, links and title tooltips don't work inside `<img>`, so a design never depends on them.
- **Under 400 KB** per file. The camo limit is higher, but large SVGs slow the profile page.
- **Deterministic.** The same `Stats` always produces the same bytes. "As of" dates come from `stats.generatedAt`, never the clock. This keeps commits in the profile repository meaningful.
- **Honest numbers.** Every figure comes from `Stats` and is labelled with what it counts. A bar that's cut short says so where the reader is looking, not only in a footnote.
