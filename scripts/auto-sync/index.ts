import fs from "node:fs";
import path from "node:path";
import { sh, checkoutNewBranch, commitAll, createPr, autoMergePr } from "./utils/git";
import { isPathAllowed } from "./filters";
import { scoreRisk } from "./risk";
import { runSmoke } from "./smoke";

type Cfg = typeof import("./config.json");
const cfg: Cfg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "config.json"), "utf8"));
const statePath = cfg.stateFile;

type State = Record<string, string>;
const state: State = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : {};

function parseConventionalType(msg: string) {
  const m = msg.match(/^(\w+)(\(.+\))?:/);
  return m?.[1] ?? "";
}

function changedFilesFromPatch(): string[] {
  const diff = sh(`git diff --name-only`);
  return diff.split("\n").filter(Boolean);
}

function detectTouch(files: string[]) {
  const touchedEnv = files.some(f => f.startsWith(".env"));
  const touchedPrisma = files.some(f => f.includes("schema.prisma"));
  return { touchedEnv, touchedPrisma };
}

async function main() {
  const base = cfg.targetDefaultBranch;
  sh(`git checkout ${base}`);
  sh(`git pull --ff-only`);

  for (const repo of cfg.sourceRepos) {
    const safeRepoId = repo.replace(/[\/.]/g, "_");
    const integBranch = `${cfg.integrationBranchPrefix}/${repo.replace(/[\/.]/g, "-")}`;

    // add & fetch remote
    sh(`git remote add src_${safeRepoId} https://github.com/${repo}.git || true`);
    sh(`git fetch src_${safeRepoId} --tags --prune`);

    const newest = sh(`git ls-remote src_${safeRepoId} HEAD`).split("\t")[0] || "";
    const last = state[repo] || "";
    if (newest && newest === last) continue;

    checkoutNewBranch(integBranch);

    const logCmd = `git log ${last ? last+".." : ""}src_${safeRepoId}/HEAD --pretty=format:%H:::%s --max-count=${cfg.maxCommitsPerRun}`;
    const commits = sh(logCmd).split("\n").filter(Boolean).reverse();

    for (const line of commits) {
      const [sha, msg] = line.split(":::");
      const type = parseConventionalType(msg);
      if (!cfg.allowConventionalTypes.includes(type)) continue;

      try { sh(`git cherry-pick -n ${sha}`); }
      catch { sh(`git cherry-pick --abort || true`); continue; }

      const files = changedFilesFromPatch();
      if (!files.every(isPathAllowed)) { sh(`git reset --hard`); continue; }

      const { touchedEnv } = detectTouch(files);
      if (touchedEnv) { sh(`git reset --hard`); continue; }

      commitAll(`[auto-sync] ${msg} (${repo}@${sha.slice(0,7)})`);
    }

    // nothing to push?
    const ahead = sh(`git rev-list --left-right --count ${base}...${integBranch}`).split("\t")[1] || "0";
    if (ahead === "0") {
      sh(`git checkout ${base}`);
      sh(`git branch -D ${integBranch} || true`);
      if (newest) {
        state[repo] = newest;
        fs.mkdirSync(path.dirname(statePath), { recursive: true });
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
      }
      continue;
    }

    // checks
    let tsErrors = 0, testFailures = 0, touchedPrisma = false;

    try { sh(`npm run type-check`); } catch { tsErrors += 1; }
    try { sh(`npm run lint`); } catch { /* ignore lint fail for risk weighting */ }
    try { sh(`npm run build`); } catch { tsErrors += 1; }

    const changed = sh(`git diff --name-only ${base}...${integBranch}`).split("\n");
    touchedPrisma = changed.some(f => f.includes("schema.prisma"));
    if (touchedPrisma) {
      try { sh(`npx prisma validate`); } catch { tsErrors += 1; }
      try { sh(`npx prisma migrate diff --from-empty --to-schema-datamodel schema.prisma --exit-code`); } catch { testFailures += 1; }
    }

    try { sh(`npm test --silent`); } catch { testFailures += 1; }

    try { await runSmoke(); } catch { testFailures += 1; }

    const filesChanged = parseInt(ahead || "0", 10);
    const risk = scoreRisk({ filesChanged, tsErrors, testFailures, touchedPrisma, touchedEnv: false });

    sh(`git push -u origin ${integBranch} -f`);
    const body = [
      `Auto-sync from **${repo}**`,
      `- Files changed (ahead): ${filesChanged}`,
      `- TS errors: ${tsErrors}`,
      `- Test failures: ${testFailures}`,
      `- Touched Prisma: ${touchedPrisma}`,
      `- Risk score: **${risk.toUpperCase()}**`,
      ``,
      `Checks: type-check, lint, build, tests, smoke, prisma guards`,
      `Conventional types allowed: ${cfg.allowConventionalTypes.join(", ")}`
    ].join("\n");

    createPr(`[auto-sync] Ingest updates from ${repo}`, body, base, integBranch);
    sh(`gh pr edit --add-label "auto-sync" --add-label "risk:${risk}" || true`);
    if (risk === "low" && cfg.autoMergeLowRisk) {
      try { autoMergePr(); } catch {}
    }

    if (newest) {
      state[repo] = newest;
      fs.mkdirSync(path.dirname(statePath), { recursive: true });
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

