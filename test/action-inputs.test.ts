import { describe, expect, it } from "vitest";
import { CARD_FILE, cardFiles, parseEcosystems, parseInputs } from "../src/action/inputs.ts";
import { allDesigns } from "../src/designs/index.ts";
import { DEFAULT_ECOSYSTEMS } from "../src/stats/aggregate.ts";

const base = { user: "octocat", designs: "D01" };

describe("action inputs", () => {
  it("reads ids in any separator and case, without duplicates", () => {
    const c = parseInputs({ ...base, designs: "d01, A05\nD01" });
    expect(c.designs.map((d) => d.id)).toEqual(["D01", "A05"]);
    expect(c.outcomes).toBe("full");
    expect(c.out).toBe("kleos");
    expect(c.ecosystems).toBe(DEFAULT_ECOSYSTEMS);
  });

  it("names what is wrong", () => {
    expect(() => parseInputs({ ...base, designs: "" })).toThrow(/designs: list at least one/);
    expect(() => parseInputs({ ...base, designs: "D01 Z99" })).toThrow(/designs: unknown id Z99/);
    expect(() => parseInputs({ ...base, user: "-bad" })).toThrow(/user:/);
    expect(() => parseInputs({ ...base, outcomes: "some" })).toThrow(/outcomes: "some"/);
    expect(() => parseInputs({ ...base, out: "../elsewhere" })).toThrow(/out:/);
    expect(() => parseInputs({ ...base, out: "/abs" })).toThrow(/out:/);
  });

  it("rejects a level a design can't render", () => {
    expect(() => parseInputs({ ...base, designs: "F02", outcomes: "none" })).toThrow(
      /outcomes: F02 .* supports full, not none/,
    );
  });

  it("parses ecosystems, skipping blank and comment lines", () => {
    expect(parseEcosystems("AWS: ^(aws|aws-.*)$\n\n# people\njdx: ^jdx$\n")).toEqual([
      { name: "AWS", match: "^(aws|aws-.*)$" },
      { name: "jdx", match: "^jdx$" },
    ]);
    expect(() => parseEcosystems("AWS ^aws$")).toThrow(/Name: regular expression/);
    expect(() => parseEcosystems("AWS: ^(aws$")).toThrow(/ecosystems: AWS:/);
  });

  it("recognizes every file it writes, and nothing else", () => {
    for (const d of allDesigns())
      for (const f of Object.values(cardFiles(d))) expect(f).toMatch(CARD_FILE);
    expect("README.md").not.toMatch(CARD_FILE);
    expect("logo-dark.svg").not.toMatch(CARD_FILE);
  });
});
