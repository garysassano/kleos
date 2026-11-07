/**
 * Minimal GitHub GraphQL transport.
 *
 * In CI, pass a token (GitHub Actions provides one). Locally, when no token is given, requests go
 * through the GitHub CLI (`gh api graphql`), so the account `gh` is signed in to is used and no
 * token ever has to be copied into the environment.
 */
import { execFile } from "node:child_process";

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
  // The request body goes in as JSON on stdin, so variables keep their types (lists, numbers, null).
  return (query, variables = {}) =>
    new Promise((resolve, reject) => {
      const child = execFile(
        "gh",
        ["api", "graphql", "--input", "-"],
        { maxBuffer: 64 * 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error && !stdout)
            return reject(new Error(`gh api graphql: ${stderr || error.message}`));
          try {
            resolve(unwrap(JSON.parse(stdout) as Response<unknown>));
          } catch (e) {
            reject(e);
          }
        },
      );
      child.stdin?.end(JSON.stringify({ query, variables }));
    });
}

function unwrap<T>(body: Response<unknown>): T {
  if (body.errors?.length)
    throw new Error(`GitHub GraphQL: ${body.errors.map((e) => e.message).join("; ")}`);
  if (!body.data) throw new Error("GitHub GraphQL: empty response");
  return body.data as T;
}
