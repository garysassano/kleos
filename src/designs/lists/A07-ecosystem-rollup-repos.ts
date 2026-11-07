import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import { ecosystemRollup } from "./_shared.ts";

const title = "Ecosystem roll-up by repo";

export const design: Design = {
  id: "A07",
  slug: "ecosystem-rollup-repos",
  title,
  idea: "A05 with repos instead of owners: each ecosystem's total on top and its top 3 repos by contributions indented below, each with its owner's avatar and its stars. An ecosystem with a single repo shows no rows below it.",
  render: (stats, theme, options = DEFAULT_OPTIONS) =>
    ecosystemRollup(stats, theme, options.outcomes, "repos", title),
};
