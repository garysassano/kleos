import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import { ecosystemRollup } from "./_shared.ts";

const title = "Ecosystem roll-up";

export const design: Design = {
  id: "A05",
  slug: "ecosystem-rollup",
  title,
  idea: "Groups related GitHub owners into ecosystems (AWS: aws, aws-samples, …) with the ecosystem total on top and its owners, its top repos, or both indented below, so an ecosystem spread across many orgs shows up as one line.",
  settings: [
    {
      name: "owners",
      description:
        "List every owner under its ecosystem. An ecosystem with a single owner never gets an owner line.",
      default: true,
    },
    {
      name: "repos",
      description:
        "How many top repos to list under each owner, or under the ecosystem when owners are off or it has one owner. An owner with a single repo names it on its own line.",
      default: 0,
      min: 0,
      max: 10,
    },
  ],
  examples: [{ owners: false, repos: 3 }, { repos: 3 }],
  render: (stats, theme, options = DEFAULT_OPTIONS) =>
    ecosystemRollup(
      stats,
      theme,
      options.outcomes,
      {
        owners: (options.settings.owners ?? true) as boolean,
        repos: (options.settings.repos ?? 0) as number,
      },
      title,
    ),
};
