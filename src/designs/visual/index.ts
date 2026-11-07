import type { Category } from "../types.ts";
import { design as D01 } from "./D01-orbit.ts";
import { design as D02 } from "./D02-mosaic.ts";
import { design as D03 } from "./D03-heatmap.ts";
import { design as D04 } from "./D04-swimlanes.ts";
import { design as D05 } from "./D05-skyline.ts";
import { design as D06 } from "./D06-calendar.ts";

export const category: Category = {
  letter: "D",
  dir: "visual",
  name: "Visual",
  blurb: "Picture-first ideas: orbits, mosaics, heatmaps, timelines and skylines.",
  designs: [D01, D02, D03, D04, D05, D06],
};
