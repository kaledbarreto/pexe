#!/usr/bin/env bash
# Polls GitHub for the latest published release. When it differs from the tag
# checked out in the mounted clone, checks it out and rebuilds/restarts the bot.
set -uo pipefail

: "${GITHUB_REPO:?GITHUB_REPO (owner/name) is required}"
REPO_DIR="${REPO_DIR:-/srv/pexe-bot}"
SERVICE="${BOT_SERVICE:-bot}"
INTERVAL="${POLL_INTERVAL:-120}"
VERIFY_DELAY="${VERIFY_DELAY:-20}"
GIT_URL="${GIT_URL:-https://github.com/${GITHUB_REPO}.git}"

failed_tag=""

log() { echo "[$(date -u +%FT%TZ)] $*"; }

api() {
  local auth=()
  [ -n "${GITHUB_TOKEN:-}" ] && auth=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
  curl -fsS "${auth[@]}" -H "Accept: application/vnd.github+json" "https://api.github.com/repos/${GITHUB_REPO}/$1"
}

git_fetch() {
  if [ -n "${GITHUB_TOKEN:-}" ]; then
    git -C "$REPO_DIR" -c "http.extraHeader=Authorization: Basic $(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64 -w0)" "$@"
  else
    git -C "$REPO_DIR" "$@"
  fi
}

current_tag() { git -C "$REPO_DIR" describe --tags --exact-match HEAD 2>/dev/null || true; }

compose() { docker compose -f "$REPO_DIR/docker-compose.yml" --project-directory "$REPO_DIR" "$@"; }

verify() {
  local id status restarts
  sleep "$VERIFY_DELAY"
  id=$(compose ps -q "$SERVICE")
  [ -z "$id" ] && { log "verify: no container for service '$SERVICE'"; return 1; }
  status=$(docker inspect -f '{{.State.Status}}' "$id")
  restarts=$(docker inspect -f '{{.RestartCount}}' "$id")
  log "verify: status=${status} restarts=${restarts}"
  [ "$status" = "running" ] && [ "$restarts" -eq 0 ]
}

deploy() {
  local tag="$1" prev
  prev=$(git -C "$REPO_DIR" rev-parse --short HEAD)
  log "deploying ${tag} (was $(current_tag) @ ${prev})"

  if [ -n "$(git -C "$REPO_DIR" status --porcelain --untracked-files=no)" ]; then
    log "ERROR: clone has uncommitted changes to tracked files, refusing to deploy:"
    git -C "$REPO_DIR" status --short --untracked-files=no
    return 1
  fi

  git_fetch fetch --force --quiet "$GIT_URL" "refs/tags/${tag}:refs/tags/${tag}" || { log "ERROR: git fetch failed"; return 1; }
  git -C "$REPO_DIR" checkout --quiet --detach "refs/tags/${tag}" || { log "ERROR: git checkout failed"; return 1; }

  compose up -d --build "$SERVICE" || { log "ERROR: docker compose up failed"; return 1; }
  docker image prune -f >/dev/null

  if verify; then
    log "deployed ${tag} OK"
  else
    log "ERROR: ${tag} is unhealthy, recent logs:"
    compose logs --tail=50 "$SERVICE"
    return 1
  fi
}

log "watching ${GITHUB_REPO} releases every ${INTERVAL}s (clone: ${REPO_DIR}, currently: $(current_tag || true))"

while true; do
  if release=$(api releases/latest 2>/dev/null); then
    latest=$(jq -r '.tag_name // empty' <<<"$release")
    current=$(current_tag)
    if [ -n "$latest" ] && [ "$latest" != "$current" ] && [ "$latest" != "$failed_tag" ]; then
      if deploy "$latest"; then failed_tag=""; else failed_tag="$latest"; log "will not retry ${latest} until a new release or watcher restart"; fi
    fi
  else
    log "no published release found (or GitHub API unreachable)"
  fi
  sleep "$INTERVAL"
done
