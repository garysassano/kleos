import type { Stats } from "../stats/types.ts";
import { category as charts } from "./charts/index.ts";
import { category as collectibles } from "./collectibles/index.ts";
import { category as compact } from "./compact/index.ts";
import { category as flows } from "./flows/index.ts";
import { category as focus } from "./focus/index.ts";
import { category as lists } from "./lists/index.ts";
import { category as type } from "./type/index.ts";
import {
  type Category,
  type Design,
  LEVELS,
  type Level,
  type Outcomes,
  type ThemeName,
} from "./types.ts";
import { category as visual } from "./visual/index.ts";

/** Every category in catalog order (by letter). */
export const categories: Category[] = [
  lists,
  charts,
  type,
  visual,
  compact,
  flows,
  collectibles,
  focus,
];

/** How callers ask for a card: any `outcomes`, including "original". */
export interface CardOptions {
  outcomes?: Outcomes;
}

export interface CatalogDesign extends Omit<Design, "render"> {
  category: Category;
  render(stats: Stats, theme: ThemeName, options?: CardOptions): string;
}

/** Every design, with "original" translated to "no option" before it reaches the design. */
export const allDesigns = (): CatalogDesign[] =>
  categories.flatMap((category) =>
    category.designs.map((d) => ({
      ...d,
      category,
      render: (stats: Stats, theme: ThemeName, options: CardOptions = {}) =>
        d.render(
          stats,
          theme,
          options.outcomes && options.outcomes !== "original" ? { outcomes: options.outcomes } : {},
        ),
    })),
  );

export type { Category, Design, Outcomes, RenderOptions, ThemeName } from "./types.ts";
export { DEFAULT_OPTIONS, LEVELS, OUTCOMES } from "./types.ts";

/** The outcomes a design supports: always "original", plus its converged levels. */
export const outcomesOf = (d: Pick<Design, "outcomes">): readonly Outcomes[] => [
  "original",
  ...(d.outcomes ?? LEVELS),
];
export type { Level };
