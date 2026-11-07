/**
 * Fetches a user's contributions and writes a Stats snapshot with avatars embedded.
 *
 * Usage: node src/cli/fetch.ts <login> [--out fixtures/<login>.json]
 * Uses $GITHUB_TOKEN when set (CI); otherwise the GitHub CLI's signed-in account.
 */
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { fetchUser } from "../github/fetch.ts";
import { graphql } from "../github/graphql.ts";
import { aggregate, avatarOwners } from "../stats/aggregate.ts";

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

const raw = await fetchUser(graphql(process.env.GITHUB_TOKEN), login);
const draft = aggregate(raw);

const avatars: Record<string, string> = {};
await Promise.all(
  [...avatarOwners(draft)].map(async ([owner, url]) => {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}s=64`);
    if (!res.ok) return;
    const type = res.headers.get("content-type") ?? "image/png";
    avatars[owner] =
      `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  }),
);
const stats = aggregate(raw, { avatars: Object.fromEntries(Object.entries(avatars).sort()) });

writeFileSync(out, `${JSON.stringify(stats, null, 1)}\n`);
const t = stats.totals;
console.log(
  `${login}: ${raw.pullRequests.length} PRs, ${raw.issues.length} issues, ${raw.discussions.length} discussions, ${raw.years.length} years → ${out}`,
);
console.log(
  `external: ${t.externalPRs} PRs (${t.externalMerged} merged) across ${t.externalRepos} repos and ${t.externalOwners} owners`,
);
