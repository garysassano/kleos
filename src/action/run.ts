/**
 * Fetches a user's contributions and writes the chosen cards to a folder, in both themes. Shared
 * by the GitHub Action (src/cli/action.ts) and the npm CLI (src/cli/kleos.ts).
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { THEME_NAMES } from "../designs/types.ts";
import { graphql } from "../github/graphql.ts";
import { snapshot } from "../github/snapshot.ts";
import { type ActionConfig, CARD_FILE, cardFiles } from "./inputs.ts";

/**
 * Renders `config` into `dir` (created if missing) and removes card files of designs that are no
 * longer listed; other files are left alone. `token` is a GitHub token; without one, requests go
 * through the GitHub CLI's signed-in account.
 */
export async function renderCards(
  config: ActionConfig,
  dir: string,
  token: string | undefined,
  log: (line: string) => void = console.log,
): Promise<void> {
  const { user, designs, outcomes, ecosystems } = config;
  const started = Date.now();
  const { stats } = await snapshot(graphql(token), user, { ecosystems });
  const t = stats.totals;
  const sum = (k: "issues" | "discussions") => stats.repos.reduce((a, r) => a + r[k], 0);
  log(
    `${user}: ${t.externalPRs} PRs, ${sum("issues")} issues, ${sum("discussions")} discussions in ${t.externalRepos} upstream repos of ${t.externalOwners} owners (${((Date.now() - started) / 1000).toFixed(1)} s)`,
  );

  mkdirSync(dir, { recursive: true });
  const keep = new Set<string>();
  for (const { design: d, settings } of designs) {
    const files = cardFiles(d);
    for (const theme of THEME_NAMES) {
      writeFileSync(join(dir, files[theme]), d.render(stats, theme, { outcomes, settings }));
      keep.add(files[theme]);
    }
    log(`${d.id} ${d.title} → ${join(config.out, files.dark)}, ${files.light}`);
  }
  for (const f of readdirSync(dir)) {
    if (CARD_FILE.test(f) && !keep.has(f)) {
      rmSync(join(dir, f));
      log(`removed ${join(config.out, f)}, no longer listed`);
    }
  }
}
