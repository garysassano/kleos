import type { Category } from "../types.ts";
import { design as H01 } from "./H01-family-deep-dive.ts";
import { design as H02 } from "./H02-selected-repos.ts";
import { design as H03 } from "./H03-merge-funnel.ts";
import { design as H04 } from "./H04-year-in-review.ts";
import { design as H05 } from "./H05-milestones.ts";
import { design as H06 } from "./H06-family-versus.ts";

export const category: Category = {
  letter: "H",
  dir: "focus",
  name: "Focus and stories",
  blurb: "Deep dives into one family or repository, milestones and year-in-review stories.",
  designs: [H01, H02, H03, H04, H05, H06],
};
