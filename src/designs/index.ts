import { category as charts } from "./charts/index.ts";
import { category as collectibles } from "./collectibles/index.ts";
import { category as compact } from "./compact/index.ts";
import { category as flows } from "./flows/index.ts";
import { category as focus } from "./focus/index.ts";
import { category as lists } from "./lists/index.ts";
import { category as type } from "./type/index.ts";
import type { Category, Design } from "./types.ts";
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

export const allDesigns = (): (Design & { category: Category })[] =>
  categories.flatMap((category) => category.designs.map((d) => ({ ...d, category })));

export type { Category, Design, ThemeName } from "./types.ts";
