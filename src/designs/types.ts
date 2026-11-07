import type { Stats } from "../stats/types.ts";

export type ThemeName = "dark" | "light";
export const THEME_NAMES: readonly ThemeName[] = ["dark", "light"];

export interface Design {
  /** Stable catalog id: category letter + two digits, such as "A01". Never reuse a retired id. */
  id: string;
  /** Kebab-case name used in file names, such as "repo-leaderboard". */
  slug: string;
  /** Short human name shown in the catalog. */
  title: string;
  /** One or two sentences: what the card shows and why it is useful. */
  idea: string;
  /** Returns a complete, self-contained SVG document for one theme. Must be deterministic. */
  render(stats: Stats, theme: ThemeName): string;
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
