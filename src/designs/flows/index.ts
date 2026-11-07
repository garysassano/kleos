import type { Category } from "../types.ts";
import { design as F01 } from "./F01-sankey.ts";
import { design as F02 } from "./F02-pr-outcomes.ts";
import { design as F03 } from "./F03-metro-map.ts";
import { design as F04 } from "./F04-rank-by-year.ts";
import { design as F05 } from "./F05-first-contact.ts";
import { design as F06 } from "./F06-fan-tree.ts";

export const category: Category = {
  letter: "F",
  dir: "flows",
  name: "Flows and networks",
  blurb:
    "How contributions flow from you through ecosystems and owners to repositories, and how rankings shift.",
  designs: [F01, F02, F03, F04, F05, F06],
};
