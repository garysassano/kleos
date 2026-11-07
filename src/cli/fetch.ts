/**
 * Fetches a user's contributions and writes a Stats snapshot with avatars embedded.
 *
 * Usage: node src/cli/fetch.ts <login> [--out fixtures/<login>.json]
 * Uses $GITHUB_TOKEN when set (CI); otherwise the GitHub CLI's signed-in account.
 */
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { graphql } from "../github/graphql.ts";
import { snapshot } from "../github/snapshot.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string" } },
});
const login = positionals[0];
if (!login) {
  console.error("Usage: node src/cli/fetch.ts <login> [--out file.json]");
  process.exit(2);
}
const out = values.out ?? `fixtures/${login}.json`;

const { raw, stats } = await snapshot(graphql(process.env.GITHUB_TOKEN), login);

writeFileSync(out, `${JSON.stringify(stats, null, 1)}\n`);
const t = stats.totals;
console.log(
  `${login}: ${raw.pullRequests.length} PRs, ${raw.issues.length} issues, ${raw.discussions.length} discussions, ${raw.years.length} years → ${out}`,
);
console.log(
  `external: ${t.externalPRs} PRs (${t.externalMerged} merged) across ${t.externalRepos} repos and ${t.externalOwners} owners`,
);
