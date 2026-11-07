import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const CLI = new URL("../src/cli/kleos.ts", import.meta.url).pathname;

/** Runs the CLI from source; only paths that exit before fetching, so no network. */
function kleos(...args: string[]): { code: number; out: string } {
  try {
    return { code: 0, out: execFileSync("node", [CLI, ...args], { encoding: "utf8" }) };
  } catch (e) {
    const err = e as { status: number; stdout: string; stderr: string };
    return { code: err.status, out: `${err.stdout}${err.stderr}` };
  }
}

describe("kleos CLI", () => {
  it("documents every flag in --help", () => {
    const { code, out } = kleos("--help");
    expect(code).toBe(0);
    for (const flag of [
      "--design",
      "--pr-outcomes",
      "--ecosystem",
      "--no-default-ecosystems",
      "--out-dir",
      "--list-designs",
    ])
      expect(out).toContain(flag);
  });

  it("lists designs with their settings", () => {
    const { code, out } = kleos("--list-designs");
    expect(code).toBe(0);
    expect(out).toMatch(/^A05 {2}Ecosystem roll-up$/m);
    expect(out).toMatch(/repos=0 {2}\(default, 0–10\)/);
    expect(out).toMatch(/F02 .*\(pr-outcomes: full only\)/);
  });

  it("names the flag that is wrong, before fetching anything", () => {
    expect(kleos("octocat", "-d", "Z01").out).toContain("--design: unknown id Z01");
    expect(kleos("octocat", "-d", "A05 repos=20").out).toContain("--design: A05 repos:");
    expect(kleos("octocat", "-d", "F02", "--pr-outcomes", "none").out).toContain(
      "--pr-outcomes: F02",
    );
    expect(kleos("octocat", "-d", "D01", "-e", "bad").out).toContain("--ecosystem:");
    expect(kleos("octocat").out).toContain("choose at least one card with --design");
    expect(kleos("-d", "D01").out).toContain("give exactly one GitHub login");
    expect(kleos("octocat", "-d", "D01", "--nope").code).toBe(2);
  });
});
