/**
 * Fetches a user's contributions and returns the Stats every design renders from, with the
 * avatars the cards draw embedded as data URIs (GitHub's image proxy blocks external images in SVGs).
 */
import { type EcosystemRule, aggregate, avatarOwners } from "../stats/aggregate.ts";
import type { Stats } from "../stats/types.ts";
import { type RawData, fetchUser } from "./fetch.ts";
import type { GraphQL } from "./graphql.ts";

export async function snapshot(
  gql: GraphQL,
  login: string,
  opts: { ecosystems?: EcosystemRule[] } = {},
): Promise<{ raw: RawData; stats: Stats }> {
  const raw = await fetchUser(gql, login);
  const draft = aggregate(raw, opts);

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
  const stats = aggregate(raw, {
    ...opts,
    avatars: Object.fromEntries(Object.entries(avatars).sort()),
  });
  return { raw, stats };
}
