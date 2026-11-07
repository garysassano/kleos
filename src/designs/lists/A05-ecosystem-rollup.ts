import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import { ecosystemRollup } from "./_shared.ts";

const title = "Ecosystem roll-up";

export const design: Design = {
  id: "A05",
  slug: "ecosystem-rollup",
  title,
  idea: "Groups related GitHub owners into ecosystems (AWS: aws, aws-samples, …) with the ecosystem total on top and member owners indented below, so an ecosystem spread across many orgs shows up as one line. A07 lists repos instead of owners, A08 both.",
  render: (stats, theme, options = DEFAULT_OPTIONS) =>
    ecosystemRollup(stats, theme, options.outcomes, "owners", title),
};
