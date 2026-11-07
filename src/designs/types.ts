import type { Stats } from "../stats/types.ts";

export type ThemeName = "dark" | "light";
export const THEME_NAMES: readonly ThemeName[] = ["dark", "light"];

/**
 * How much PR outcome detail a card shows. See docs/decisions/0009-outcomes-option.md.
 * - "original": each design exactly as designed (what the catalog shows). Same as leaving it unset.
 * - "none": PRs as one number. No merged, open, closed or merge rate anywhere.
 * - "merged": PRs, with the merged ones highlighted as a subset. Nothing labels the rest
 *   ("not merged", "closed", "open"), and no merge rate.
 * - "full": merged, still open and closed without merging, each shown; merge rates allowed.
 */
export type Outcomes = "original" | "none" | "merged" | "full";
/** The converged levels a design implements itself; "original" needs no work from a design. */
export type Level = Exclude<Outcomes, "original">;
export const LEVELS: readonly Level[] = ["none", "merged", "full"];
export const OUTCOMES: readonly Outcomes[] = ["original", ...LEVELS];

/** What a design's render receives: unset means its original look. */
export interface RenderOptions {
  outcomes?: Level;
}

export const DEFAULT_OPTIONS: RenderOptions = {};

export interface Design {
  /** Stable catalog id: category letter + two digits, such as "A01". Never reuse a retired id. */
  id: string;
  /** Kebab-case name used in file names, such as "repo-leaderboard". */
  slug: string;
  /** Short human name shown in the catalog. */
  title: string;
  /** One or two sentences: what the card shows and why it is useful. */
  idea: string;
  /** Outcome levels this design can render when one is set. Omitted means all of them. */
  outcomes?: readonly Level[];
  /** Returns a complete, self-contained SVG document for one theme. Must be deterministic. */
  render(stats: Stats, theme: ThemeName, options?: RenderOptions): string;
}

export interface Category {
  /** Single capital letter shared by every design id in the category. */
  letter: string;
  /** Folder name under src/designs and gallery/. */
  dir: string;
  name: string;
  blurb: string;
  designs: Design[];
}
