import { describe, expect, it } from "vitest";
import { CARD_FILE, cardFiles, parseEcosystems, parseInputs } from "../src/action/inputs.ts";
import { allDesigns } from "../src/designs/index.ts";
import { DEFAULT_ECOSYSTEMS } from "../src/stats/aggregate.ts";

const base = { user: "octocat", designs: "D01" };

describe("action inputs", () => {
  it("reads ids in any separator and case", () => {
    const c = parseInputs({ ...base, designs: "d01, A05\nB01" });
    expect(c.designs.map((d) => d.design.id)).toEqual(["D01", "A05", "B01"]);
    expect(c.designs[1]?.settings).toEqual({ owners: true, repos: 0 });
    expect(c.outcomes).toBe("full");
    expect(c.out).toBe("kleos");
    expect(c.ecosystems).toEqual(DEFAULT_ECOSYSTEMS);
  });

  it("names what is wrong", () => {
    expect(() => parseInputs({ ...base, designs: "" })).toThrow(/designs: list at least one/);
    expect(() => parseInputs({ ...base, designs: "D01 Z99" })).toThrow(/designs: unknown id Z99/);
    expect(() => parseInputs({ ...base, user: "-bad" })).toThrow(/user:/);
    expect(() => parseInputs({ ...base, outcomes: "some" })).toThrow(/pr-outcomes: "some"/);
    expect(() => parseInputs({ ...base, out: "../elsewhere" })).toThrow(/out-dir:/);
    expect(() => parseInputs({ ...base, out: "/abs" })).toThrow(/out-dir:/);
    expect(parseInputs({ ...base, out: "/abs" }, { anywhere: true }).out).toBe("/abs");
  });

  it("reads settings after their design", () => {
    const c = parseInputs({ ...base, designs: "D01 A05 owners=no repos=3" });
    expect(c.designs.map((d) => [d.design.id, d.settings])).toEqual([
      ["D01", {}],
      ["A05", { owners: false, repos: 3 }],
    ]);
  });

  it("ignores comments in designs and ecosystems", () => {
    const c = parseInputs({
      ...base,
      designs: "D01  # the orbit\nA05 repos=3 # top repos",
      ecosystems: "jdx: ^jdx$   # one person",
    });
    expect(c.designs.map((d) => d.design.id)).toEqual(["D01", "A05"]);
    expect(c.ecosystems.at(-1)).toEqual({ name: "jdx", match: "^jdx$" });
  });

  it("names the design and setting that is wrong", () => {
    const bad = (designs: string) => () => parseInputs({ ...base, designs });
    expect(bad("D01 repos=3")).toThrow(/D01 has no settings, so "repos" can't be set/);
    expect(bad("A05 rows=3")).toThrow(/A05 has no setting "rows"; it has owners, repos/);
    expect(bad("A05 repos=11")).toThrow(/A05 repos: expected a whole number from 0 to 10/);
    expect(bad("A05 owners=3")).toThrow(/A05 owners: expected yes or no/);
    expect(bad("A05 repos=many")).toThrow(/A05 repos: "many" is not yes, no or a number/);
    expect(bad("repos=3 A05")).toThrow(/must follow the id/);
    expect(bad("A05 D01 A05")).toThrow(/A05 is listed twice/);
    expect(bad("A07")).toThrow(/A07 was retired; use A05 owners=no repos=3/);
  });

  it("rejects a level a design can't render", () => {
    expect(() => parseInputs({ ...base, designs: "F02", outcomes: "none" })).toThrow(
      /pr-outcomes: F02 .* supports full, not none/,
    );
  });

  it("adds ecosystems to the defaults, replacing one of the same name", () => {
    const rules = parseEcosystems("aws: ^(aws|aws-.*)$\n\n# people\njdx: ^jdx$\n");
    expect(rules.length).toBe(DEFAULT_ECOSYSTEMS.length + 1);
    expect(rules[0]).toEqual({ name: "aws", match: "^(aws|aws-.*)$" });
    expect(rules.at(-1)).toEqual({ name: "jdx", match: "^jdx$" });
    expect(parseEcosystems("")).toEqual(DEFAULT_ECOSYSTEMS);
  });

  it("uses only the given ecosystems without the defaults", () => {
    expect(parseEcosystems("jdx: ^jdx$", false)).toEqual([{ name: "jdx", match: "^jdx$" }]);
    expect(parseEcosystems("", false)).toEqual([]);
  });

  it("rejects malformed ecosystems", () => {
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
