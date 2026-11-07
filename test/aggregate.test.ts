import { describe, expect, it } from "vitest";
import type { RawData, RawRepo } from "../src/github/fetch.ts";
import { aggregate } from "../src/stats/aggregate.ts";

const repo = (owner: string, name: string, stars = 10, isPrivate = false): RawRepo => ({
  nameWithOwner: `${owner}/${name}`,
  name,
  isPrivate,
  stargazerCount: stars,
  owner: { login: owner, __typename: owner === "me" ? "User" : "Organization", avatarUrl: "" },
  primaryLanguage: { name: "TypeScript", color: "#3178c6" },
});

const cdk = repo("aws", "aws-cdk", 12000);
const samples = repo("aws-samples", "demo", 50);
const mine = repo("me", "dotfiles");
const secret = repo("acme", "internal", 0, true);
const commitsOnly = repo("acme", "commits-only", 5);

const raw: RawData = {
  login: "me",
  fetchedAt: "2026-03-02T10:00:00Z",
  pullRequests: [
    {
      number: 1,
      title: "a",
      state: "MERGED",
      merged: true,
      createdAt: "2026-01-05T00:00:00Z",
      additions: 5,
      deletions: 1,
      repository: cdk,
    },
    {
      number: 2,
      title: "b",
      state: "OPEN",
      merged: false,
      createdAt: "2026-02-05T00:00:00Z",
      additions: 2,
      deletions: 0,
      repository: cdk,
    },
    {
      number: 3,
      title: "c",
      state: "MERGED",
      merged: true,
      createdAt: "2026-02-06T00:00:00Z",
      additions: 1,
      deletions: 1,
      repository: mine,
    },
    {
      number: 4,
      title: "d",
      state: "CLOSED",
      merged: false,
      createdAt: "2026-02-07T00:00:00Z",
      additions: 1,
      deletions: 1,
      repository: secret,
    },
  ],
  issues: [
    {
      number: 9,
      title: "i",
      state: "OPEN",
      createdAt: "2025-12-01T00:00:00Z",
      repository: samples,
    },
    { number: 10, title: "j", state: "CLOSED", createdAt: "2026-01-09T00:00:00Z", repository: cdk },
  ],
  discussions: [{ number: 3, title: "q", createdAt: "2026-01-20T00:00:00Z", repository: samples }],
  years: [
    {
      year: 2026,
      totalCommitContributions: 4,
      restrictedContributionsCount: 0,
      commitContributionsByRepository: [
        { contributions: { totalCount: 4 }, repository: cdk },
        { contributions: { totalCount: 2 }, repository: commitsOnly },
      ],
      pullRequestReviewContributionsByRepository: [],
      contributionCalendar: {
        totalContributions: 3,
        weeks: [
          {
            contributionDays: [
              { date: "2026-03-01", contributionCount: 2 },
              { date: "2026-03-02", contributionCount: 1 },
              { date: "2026-03-03", contributionCount: 0 },
            ],
          },
        ],
      },
    },
  ],
};

describe("aggregate", () => {
  const stats = aggregate(raw);

  it("counts PRs, issues and discussions per external repository", () => {
    expect(
      stats.repos.map((r) => [
        r.repo,
        r.prs,
        r.prsMerged,
        r.prsOpen,
        r.issues,
        r.discussions,
        r.total,
      ]),
    ).toEqual([
      ["aws/aws-cdk", 2, 1, 1, 1, 0, 3],
      ["aws-samples/demo", 0, 0, 0, 1, 1, 2],
    ]);
    const cdkStats = stats.repos[0];
    expect(cdkStats?.monthly).toEqual({ "2026-01": 2, "2026-02": 1 });
    expect(cdkStats?.first).toBe("2026-01-05T00:00:00Z");
    expect(cdkStats?.commits).toBe(4);
  });

  it("excludes the user's own and private repositories from external stats but not from totals", () => {
    expect(stats.repos.some((r) => r.owner === "me" || r.private)).toBe(false);
    expect(stats.ownRepoActivity).toBe(1);
    expect(stats.totals).toMatchObject({
      prs: 4,
      prsMerged: 2,
      externalPRs: 2,
      externalMerged: 1,
      externalRepos: 2,
      externalOwners: 2,
    });
  });

  it("leaves out repositories where the user only has commits", () => {
    expect(stats.repos.some((r) => r.repo === "acme/commits-only")).toBe(false);
    expect(stats.owners.some((o) => o.owner === "acme")).toBe(false);
  });

  it("rolls owners up into families by login pattern", () => {
    const aws = stats.families.find((f) => f.name === "AWS");
    expect(aws).toMatchObject({
      owners: ["aws", "aws-samples"],
      total: 5,
      prs: 2,
      issues: 2,
      discussions: 1,
      repos: 2,
    });
  });

  it("lists recent external public PRs newest first and the first one's date", () => {
    expect(stats.recentPRs.map((p) => [p.repo, p.number, p.state])).toEqual([
      ["aws/aws-cdk", 2, "OPEN"],
      ["aws/aws-cdk", 1, "MERGED"],
    ]);
    expect(stats.totals.firstExternalPR).toBe("2026-01-05T00:00:00Z");
  });

  it("keeps the calendar up to the fetch date only", () => {
    expect(stats.calendar).toEqual([
      ["2026-03-01", 2],
      ["2026-03-02", 1],
    ]);
  });
});
