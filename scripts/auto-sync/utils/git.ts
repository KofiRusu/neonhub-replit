import { execSync } from "node:child_process";

export function sh(cmd: string, opts: any = {}) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf8", ...opts }).trim();
}

export function checkoutNewBranch(name: string) {
  sh(`git checkout -B ${name}`);
}

export function commitAll(message: string) {
  sh(`git add -A`);
  sh(`git commit -S -m "${message}" || true`);
}

export function createPr(title: string, body: string, base = "main", head: string) {
  return sh(`gh pr create --title "${title}" --body "${body}" --base ${base} --head ${head} || true`);
}

export function autoMergePr() {
  sh(`gh pr merge --auto --squash || true`);
}

