/**
 * The GitHub Action's entry point (action.yml): fetch, render the chosen designs in both themes,
 * write them to the output folder, and remove cards of designs no longer listed.
 *
 * Inputs arrive as INPUT_* environment variables. Locally, with no GITHUB_TOKEN, requests go
 * through the GitHub CLI, so this can be tried with:
 *   INPUT_USER=octocat INPUT_DESIGNS="D01 A05" node src/cli/action.ts   (writes ./kleos/)
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { CARD_FILE, cardFiles, parseInputs } from "../action/inputs.ts";
import { THEME_NAMES } from "../designs/types.ts";
import { graphql } from "../github/graphql.ts";
import { snapshot } from "../github/snapshot.ts";

const env = process.env;
let config: ReturnType<typeof parseInputs>;
try {
  config = parseInputs({
    user: env.INPUT_USER,
    designs: env.INPUT_DESIGNS,
    outcomes: env.INPUT_OUTCOMES,
    ecosystems: env.INPUT_ECOSYSTEMS,
    out: env.INPUT_OUT,
  });
} catch (e) {
  console.log(`::error title=kleos configuration::${(e as Error).message}`);
  process.exit(1);
}

const { user, designs, outcomes, ecosystems } = config;
// parseInputs keeps `out` relative and inside the repository.
const out = resolve(env.GITHUB_WORKSPACE ?? ".", config.out);

const started = Date.now();
const { stats } = await snapshot(graphql(env.GITHUB_TOKEN || undefined), user, { ecosystems });
const t = stats.totals;
const sum = (k: "issues" | "discussions") => stats.repos.reduce((a, r) => a + r[k], 0);
console.log(
  `${user}: ${t.externalPRs} PRs, ${sum("issues")} issues, ${sum("discussions")} discussions in ${t.externalRepos} upstream repos of ${t.externalOwners} owners (${((Date.now() - started) / 1000).toFixed(1)} s)`,
);

mkdirSync(out, { recursive: true });
const keep = new Set<string>();
for (const d of designs) {
  const files = cardFiles(d);
  for (const theme of THEME_NAMES) {
    writeFileSync(join(out, files[theme]), d.render(stats, theme, { outcomes }));
    keep.add(files[theme]);
  }
  console.log(`${d.id} ${d.title} → ${config.out}/${files.dark}, ${files.light}`);
}
for (const f of readdirSync(out)) {
  if (CARD_FILE.test(f) && !keep.has(f)) {
    rmSync(join(out, f));
    console.log(`removed ${config.out}/${f}, no longer listed`);
  }
}
