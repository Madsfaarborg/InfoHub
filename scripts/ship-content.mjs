import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repo = "Madsfaarborg/InfoHub";
const publicFile = "src/content/public-release.json";
const baseBranch = "main";

function output(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: "utf8" }).trim();
}

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: ["ignore", "inherit", "inherit"] });
}

function ship([kind, input, mode, ...extra]) {
  if (!["news", "catalog"].includes(kind) || !input || !["--publish", "--check-only"].includes(mode) || extra.length) {
    throw new Error("Usage: npm run content:ship -- (news|catalog) FILE (--publish|--check-only)");
  }
  const inputPath = path.resolve(input);
  const root = output("git", ["rev-parse", "--show-toplevel"]);
  const repoUrl = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)madsfaarborg\/infohub(?:\.git)?\/?$/i;
  for (const option of [[], ["--push"]]) {
    if (!repoUrl.test(output("git", ["remote", "get-url", ...option, "origin"], root))) {
      throw new Error(`Set origin to the GitHub repository ${repo} first.`);
    }
  }
  const scratch = mkdtempSync(path.join(tmpdir(), "infohub-ship-"));
  const checkout = path.join(scratch, "checkout");
  const candidate = path.join(scratch, "candidate.json");
  let worktreeAdded = false;
  try {
    cpSync(inputPath, candidate);
    run("git", ["fetch", "--no-tags", "origin", baseBranch], root);
    const base = output("git", ["rev-parse", `refs/remotes/origin/${baseBranch}`], root);
    run("git", ["worktree", "add", "--detach", checkout, base], root);
    worktreeAdded = true;
    run("npm", ["ci"], checkout);
    run("npm", ["run", "content", "--", "prepare-release", kind, candidate, "--automatic"], checkout);
    const changes = output("git", ["status", "--porcelain"], checkout);
    if (!changes) {
      console.log("No public update to ship.");
      return;
    }
    if (changes !== `M ${publicFile}`) throw new Error("Unexpected working tree changes. Publication stopped.");
    run("npm", ["run", "ci"], checkout);
    if (output("git", ["status", "--porcelain"], checkout) !== changes) {
      throw new Error("The release checks changed the checkout. Publication stopped.");
    }
    if (mode === "--check-only") {
      console.log("Candidate passed the full release checks.");
      return;
    }

    const branch = `codex/infohub-${kind}-${randomUUID()}`;
    const title = kind === "news" ? "Publish verified frontier AI news" : "Publish evidence-backed model guidance";
    if (output("gh", ["api", `repos/${repo}`, "--jq", ".permissions.push"], checkout) !== "true") {
      throw new Error("GitHub CLI needs write access to InfoHub.");
    }
    run("git", ["add", "--", publicFile], checkout);
    run("git", ["commit", "-m", title], checkout);
    const commit = output("git", ["rev-parse", "HEAD"], checkout);
    if (output("git", ["diff", "--name-only", base, commit], checkout) !== publicFile) {
      throw new Error("The commit contains files outside the public snapshot. Publication stopped.");
    }
    console.log(`Publishing branch ${branch}`);
    run("git", ["push", "origin", `HEAD:refs/heads/${branch}`], checkout);
    const pr = output("gh", [
      "pr", "create", "--repo", repo, "--base", baseBranch, "--head", branch, "--title", title,
      "--body", "Scheduled InfoHub content update. The complete release suite passed before push. GitHub validates this change again before merge.",
    ], checkout);
    console.log(pr);
    run("gh", ["pr", "merge", pr, "--repo", repo, "--auto", "--squash", "--match-head-commit", commit], checkout);
    console.log("GitHub will merge after the required check passes. Vercel builds the resulting main commit.");
  } finally {
    try {
      if (worktreeAdded) run("git", ["worktree", "remove", "--force", checkout], root);
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
  }
}

try {
  ship(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
