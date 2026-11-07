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
  DEFAULT_LEVEL,
  type Design,
  LEVELS,
  type Level,
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

/** How callers ask for a card; unset `outcomes` means the default level. */
export interface CardOptions {
  outcomes?: Level;
}

export interface CatalogDesign extends Omit<Design, "render"> {
  category: Category;
  render(stats: Stats, theme: ThemeName, options?: CardOptions): string;
}

/** Every design, with an unset level filled in before it reaches the design. */
export const allDesigns = (): CatalogDesign[] =>
  categories.flatMap((category) =>
    category.designs.map((d) => ({
      ...d,
      category,
      render: (stats: Stats, theme: ThemeName, options: CardOptions = {}) =>
        d.render(stats, theme, { outcomes: options.outcomes ?? DEFAULT_LEVEL }),
    })),
  );

export type { Category, Design, Level, RenderOptions, ThemeName } from "./types.ts";
export { DEFAULT_LEVEL, DEFAULT_OPTIONS, LEVELS } from "./types.ts";

/** The levels a design supports. */
export const outcomesOf = (d: Pick<Design, "outcomes">): readonly Level[] => d.outcomes ?? LEVELS;
