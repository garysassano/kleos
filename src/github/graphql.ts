/**
 * Minimal GitHub GraphQL transport.
 *
 * In CI, pass a token (GitHub Actions provides one). Locally, when no token is given, requests go
 * through the GitHub CLI (`gh api graphql`), so the account `gh` is signed in to is used and no
 * token ever has to be copied into the environment.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export type GraphQL = <T>(query: string, variables?: Record<string, unknown>) => Promise<T>;

interface Response<T> {
  data?: T;
  errors?: { message: string }[];
}

export function graphql(token?: string): GraphQL {
  return token ? viaFetch(token) : viaGhCli();
}

function viaFetch(token: string): GraphQL {
  return async (query, variables = {}) => {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        authorization: `bearer ${token}`,
        "content-type": "application/json",
        "user-agent": "kleos",
      },
      body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`GitHub GraphQL: HTTP ${res.status} ${await res.text()}`);
    return unwrap((await res.json()) as Response<unknown>);
  };
}

function viaGhCli(): GraphQL {
  return async (query, variables = {}) => {
    const args = ["api", "graphql", "-f", `query=${query}`];
    for (const [k, v] of Object.entries(variables)) {
      if (v === null || v === undefined) continue;
      args.push(typeof v === "string" ? "-f" : "-F", `${k}=${v}`);
    }
    const { stdout } = await run("gh", args, { maxBuffer: 64 * 1024 * 1024 });
    return unwrap(JSON.parse(stdout) as Response<unknown>);
  };
}

function unwrap<T>(body: Response<unknown>): T {
  if (body.errors?.length)
    throw new Error(`GitHub GraphQL: ${body.errors.map((e) => e.message).join("; ")}`);
  if (!body.data) throw new Error("GitHub GraphQL: empty response");
  return body.data as T;
}
