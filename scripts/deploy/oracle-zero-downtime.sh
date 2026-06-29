#!/usr/bin/env bash
# Zero-downtime frontend deploy for Oracle (blue-green via port swap).
# Old instance keeps serving until the new build passes /api/health, then nginx switches.
set -euo pipefail

REPO_DIR="${REPO_DIR:-/home/ubuntu/argroup-education}"
FRONTEND_DIR="$REPO_DIR/apps/frontend"
STATE_FILE="${STATE_FILE:-/home/ubuntu/.frontend-active-port}"
LOCK_FILE="${LOCK_FILE:-/tmp/frontend-deploy.lock}"
NGINX_UPSTREAM="${NGINX_UPSTREAM:-/etc/nginx/conf.d/nextjs-upstream.conf}"
HEALTH_PATH="/api/health"
HEALTH_RETRIES=60
HEALTH_INTERVAL=2
BUILD_NODE_OPTIONS="${BUILD_NODE_OPTIONS:---max-old-space-size=1536}"

log() { printf '[%s] %s\n' "$(date -u +'%Y-%m-%dT%H:%M:%SZ')" "$*"; }
die() { log "ERROR: $*"; exit 1; }

pm2_name_for_port() {
  case "$1" in
    3000) echo "frontend-3000" ;;
    3001) echo "frontend-3001" ;;
    *) die "Unsupported port: $1" ;;
  esac
}

# Legacy PM2 app was named "frontend" on port 3000 — keep serving until first blue-green swap.
active_pm2_name() {
  local port="$1"
  if [[ "$port" == "3000" ]] && pm2 describe frontend >/dev/null 2>&1; then
    echo "frontend"
    return
  fi
  pm2_name_for_port "$port"
}

other_port() {
  if [[ "$1" == "3000" ]]; then echo "3001"; else echo "3000"; fi
}

read_active_port() {
  if [[ -f "$STATE_FILE" ]]; then
    cat "$STATE_FILE"
    return
  fi
  if pm2 describe frontend >/dev/null 2>&1; then
    echo "3000"
    return
  fi
  echo "3000"
}

wait_for_health() {
  local port="$1"
  local attempt=1
  while (( attempt <= HEALTH_RETRIES )); do
    if curl -fsS --max-time 5 "http://127.0.0.1:${port}${HEALTH_PATH}" >/dev/null 2>&1; then
      log "Health OK on port ${port} (attempt ${attempt})"
      return 0
    fi
    log "Waiting for health on :${port} (${attempt}/${HEALTH_RETRIES})..."
    sleep "$HEALTH_INTERVAL"
    attempt=$((attempt + 1))
  done
  return 1
}

write_nginx_upstream() {
  local port="$1"
  local tmp
  tmp="$(mktemp)"
  cat >"$tmp" <<EOF
upstream nextjs_backend {
    server 127.0.0.1:${port};
    keepalive 32;
}
EOF
  sudo cp "$tmp" "$NGINX_UPSTREAM"
  rm -f "$tmp"
  sudo nginx -t
  sudo nginx -s reload
}

start_frontend_on_port() {
  local port="$1"
  local name
  name="$(pm2_name_for_port "$port")"

  if pm2 describe "$name" >/dev/null 2>&1; then
    pm2 delete "$name" >/dev/null 2>&1 || true
  fi

  cd "$FRONTEND_DIR"
  PORT="$port" pm2 start npm --name "$name" --cwd "$FRONTEND_DIR" -- start
  pm2 save
}

stop_pm2_process() {
  local name="$1"
  if pm2 describe "$name" >/dev/null 2>&1; then
    pm2 delete "$name" >/dev/null 2>&1 || true
    pm2 save
  fi
}

main() {
  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    die "Another deploy is already running (lock: $LOCK_FILE)"
  fi

  local active_port new_port active_name new_name
  active_port="$(read_active_port)"
  new_port="$(other_port "$active_port")"
  active_name="$(active_pm2_name "$active_port")"
  new_name="$(pm2_name_for_port "$new_port")"

  log "Active traffic port: ${active_port} (${active_name})"
  log "Deploy target port: ${new_port} (${new_name})"

  if [[ ! -d "$FRONTEND_DIR" ]]; then
    die "Frontend directory not found: $FRONTEND_DIR"
  fi

  cd "$REPO_DIR"
  log "Pulling latest code..."
  git fetch origin main
  git reset --hard origin/main

  cd "$FRONTEND_DIR"
  if [[ -f "$REPO_DIR/package-lock.json" ]]; then
    log "Installing dependencies from repo root (dev deps required for next build)..."
    cd "$REPO_DIR"
    npm ci 2>/dev/null || npm install
    cd "$FRONTEND_DIR"
  fi

  log "Building new release (live site keeps running on :${active_port})..."
  NODE_OPTIONS="$BUILD_NODE_OPTIONS" npm run build

  log "Starting candidate on port ${new_port}..."
  start_frontend_on_port "$new_port"

  if ! wait_for_health "$new_port"; then
    log "Candidate failed health checks — rolling back PM2 process only"
    stop_pm2_process "$new_name"
    die "Deploy aborted: new instance never became healthy"
  fi

  log "Switching nginx upstream to port ${new_port}..."
  write_nginx_upstream "$new_port"
  echo "$new_port" >"$STATE_FILE"

  log "Stopping previous instance (${active_name})..."
  stop_pm2_process "$active_name"

  log "Deploy complete. Live port: ${new_port}"
  pm2 list
}

main "$@"
