#!/usr/bin/env bash
set -euo pipefail

# ====== CONFIG ======
DOMAIN="neonhubecosystem.com"
EXPECTED_REPO_SLUG="NeonHub3A/neonhub"   # adjust if needed
EXPECTED_BRANCH="main"                    # adjust if needed
TEAM_SLUG=""                             # optional; e.g. "kofirusu-icloudcoms-projects"
DRY_RUN=1                                 # set to 0 to ATTACH the domain
# ====================

echo "== NeonHub Domain Attach Audit =="
date

if ! command -v jq >/dev/null; then
  echo "Installing jq (local) not available in this environment. Please ensure jq is present." >&2
fi

if ! command -v curl >/dev/null; then
  echo "curl is required." >&2; exit 1
fi

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "ERROR: VERCEL_TOKEN not set. Export and re-run:"
  echo "export VERCEL_TOKEN=***"
  exit 2
fi

AUTH=(-H "Authorization: Bearer $VERCEL_TOKEN")

# 1) Quick DNS + HTTP check
echo -e "\n[1] DNS & HTTP check for $DOMAIN"
( dig +short CNAME $DOMAIN || true ) | sed 's/^/CNAME: /' || true
( dig +short A $DOMAIN || true ) | sed 's/^/A: /' || true
curl -sI "https://$DOMAIN" | sed 's/^/HDR: /' || true

# 2) List projects and find candidates that link the expected repo/branch
PARAMS="?limit=200"
[ -n "$TEAM_SLUG" ] && PARAMS="$PARAMS&teamId=$TEAM_SLUG"
echo -e "\n[2] Fetching Vercel projects…"
curl -fsSL "${AUTH[@]}" "https://api.vercel.com/v9/projects$PARAMS" -o /tmp/vercel_projects.json

echo -e "\n[3] Candidate projects (by repo match):"
jq -r --arg repo "$EXPECTED_REPO_SLUG" --arg br "$EXPECTED_BRANCH" '
  .projects[]
  | {id,name,accountId,framework,link}
  | select(.link.repo==$repo)
  | [.id,.name,.accountId, .link.productionBranch, .framework] | @tsv
' /tmp/vercel_projects.json | awk -v br="$EXPECTED_BRANCH" '
BEGIN{printf "ProjectID\tName\tTeam\tProdBranch\tFramework\tBR_MATCH\n"}
{match=($4==br)?"YES":"NO"; printf "%s\t%s\t%s\t%s\t%s\t%s\n",$1,$2,$3,$4,$5,match}'

# pick the first with matching branch, else first repo match
CANDIDATE_ID=$(jq -r --arg repo "$EXPECTED_REPO_SLUG" --arg br "$EXPECTED_BRANCH" '
  .projects[] | select(.link.repo==$repo and .link.productionBranch==$br) | .id
' /tmp/vercel_projects.json | head -n1)

if [ -z "$CANDIDATE_ID" ] || [ "$CANDIDATE_ID" = "null" ]; then
  CANDIDATE_ID=$(jq -r --arg repo "$EXPECTED_REPO_SLUG" '
    .projects[] | select(.link.repo==$repo) | .id
  ' /tmp/vercel_projects.json | head -n1)
fi

if [ -z "$CANDIDATE_ID" ] || [ "$CANDIDATE_ID" = "null" ]; then
  echo "ERROR: No Vercel project found linked to $EXPECTED_REPO_SLUG."
  exit 3
fi

echo -e "\n[4] Selected project:"
curl -fsSL "${AUTH[@]}" "https://api.vercel.com/v9/projects/$CANDIDATE_ID" -o /tmp/p.json
jq '{id,name,accountId,framework,link:{type,repo,productionBranch}}' /tmp/p.json

# 5) Check if DOMAIN already attached
echo -e "\n[5] Checking attached domains for the project…"
curl -fsSL "${AUTH[@]}" "https://api.vercel.com/v9/projects/$CANDIDATE_ID/domains" -o /tmp/domains.json || echo "[]">/tmp/domains.json
ATTACHED=$(jq --arg d "$DOMAIN" '[.[] | select(.name==$d)] | length' /tmp/domains.json)
echo "Attached count for $DOMAIN: $ATTACHED"

# 6) Attach if not present and approved
if [ "$ATTACHED" -eq 0 ]; then
  if [ "$DRY_RUN" -eq 1 ]; then
    echo "DRY RUN: Would attach domain \"$DOMAIN\" to project $CANDIDATE_ID."
  else
    echo "Attaching domain \"$DOMAIN\" to project $CANDIDATE_ID…"
    curl -fsSL "${AUTH[@]}" -X POST \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"$DOMAIN\"}" \
      "https://api.vercel.com/v10/projects/$CANDIDATE_ID/domains" | tee /tmp/attach_out.json
    echo "Re-checking…"
    curl -fsSL "${AUTH[@]}" "https://api.vercel.com/v9/projects/$CANDIDATE_ID/domains" -o /tmp/domains.json
    jq '.[] | select(.name=="'"$DOMAIN"'")' /tmp/domains.json || true
  fi
else
  echo "Domain is already attached to this project."
fi

# 7) Final verification request (HTTP)
echo -e "\n[7] HTTP verification (may take ~30-120s after first attach):"
curl -sI "https://$DOMAIN" | sed 's/^/FINAL_HDR: /' || true

# 8) Summary
echo -e "\n===== SUMMARY ====="
echo "Domain:        $DOMAIN"
echo "Project ID:    $CANDIDATE_ID"
echo "Repo:          $EXPECTED_REPO_SLUG"
echo "Prod branch:   $EXPECTED_BRANCH"
echo "Team (acctId): $(jq -r '.accountId' /tmp/p.json)"
echo "Dry run:       $DRY_RUN"
echo "Attached now?: $(jq --arg d "$DOMAIN" '[.[] | select(.name==$d)] | length' /tmp/domains.json) (0=no, >0=yes)"
echo "=================="

