import type { Category } from "../types.ts";
import { design as B01 } from "./B01-stacked-bars.ts";
import { design as B02 } from "./B02-treemap.ts";
import { design as B03 } from "./B03-donut.ts";
import { design as B04 } from "./B04-stars-vs-contributions.ts";
import { design as B05 } from "./B05-waffle.ts";
import { design as B06 } from "./B06-contributions-over-time.ts";

export const category: Category = {
  letter: "B",
  dir: "charts",
  name: "Charts",
  blurb: "Bars, treemaps, donuts, scatter plots and stacked areas of the same numbers.",
  designs: [B01, B02, B03, B04, B05, B06],
};
