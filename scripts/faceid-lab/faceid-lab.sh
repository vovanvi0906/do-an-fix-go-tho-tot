#!/usr/bin/env bash
# FixGo Worker FaceID Lab launcher (dev/test only). Invoked by ./dev-local.sh faceid [...].
#
# Starts, inspects and stops ONLY what this launcher created:
#   * server/scripts/face-lab/lab-stack.cjs  → research AI container (real YuNet/SFace/MN3),
#     disposable PostgreSQL container, research Nest, Face Core Nest (real JwtStrategy/guards)
#   * Vite dev server of ai-faceid-lab (loopback only)
# Never touches the main database, server/.env, Docker Compose services or other workspaces.
# Processes are tracked by PID + kernel start time + command line; each runs in its own session
# (process group) created here, so stop never signals a reused/foreign PID or a pattern.
# shellcheck disable=SC2015  # `A && B || die` is intentional: die when any precondition fails.
# shellcheck disable=SC2016  # single-quoted strings are JavaScript passed to `node -e`.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
cd "$ROOT"
LOG_DIR="$ROOT/logs/faceid-lab"
STATE_DIR="${XDG_RUNTIME_DIR:-/tmp}/fixgo-faceid-lab-$(id -u)-$(printf '%s' "$ROOT" | sha256sum | cut -c1-12)"
STATE="$STATE_DIR/state"
LOCAL_CONFIG="$ROOT/.faceid-lab.local.env"

YUNET_SHA=8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4
SFACE_SHA=0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79
MN3_SHA=c4c99af04603b62d7e44f6f4daeb33e0daeccc696008c0b1d62f6f5cebbb3262

if [ -t 1 ]; then B=$'\e[1m'; G=$'\e[32m'; R=$'\e[31m'; Y=$'\e[33m'; N=$'\e[0m'; else B='' G='' R='' Y='' N=''; fi
info() { printf '%s\n' "$*"; }
ok()   { printf '  %s✓%s %s\n' "$G" "$N" "$*"; }
warn() { printf '  %s!%s %s\n' "$Y" "$N" "$*"; }
die()  { printf '%sERROR:%s %s\n' "$R" "$N" "$1" >&2; [ -n "${2:-}" ] && printf '  → %s\n' "$2" >&2; exit "${3:-1}"; }

usage() {
  cat <<EOF
${B}./dev-local.sh faceid${N} [--status | --stop | --help]

  faceid           Start the isolated Worker FaceID Lab (background) and print its URL
  faceid --status  Show processes, ports, health and PAD/proof policy state
  faceid --stop    Stop only the processes/containers started by this launcher

Configuration (environment variables, or KEY=VALUE lines in .faceid-lab.local.env, git-ignored):
  FACE_LAB_MODEL_DIR        dir with face_detection_yunet_2023mar.onnx + face_recognition_sface_2021dec.onnx
                            (default: ai-service/weights)
  FACE_LAB_PAD_RUNTIME_DIR  dir with anti-spoof-mn3.onnx + venv/ (default: ~/.cache/fixgo-pad-mn3)
  FACE_LAB_RESEARCH_PORT    research API port   (default 3107)
  FACE_LAB_CORE_PORT        Face Core API port  (default 3118)
  FACE_LAB_WEB_PORT         Vite web lab port   (default 5199)
  FACE_LAB_SESSION_TTL_MS   biometric session TTL in the lab (default 120000)

Database: always a NEW disposable PostgreSQL container (fixgo_face_research_*); the main DB and
server/.env are never read or written. Tokens are written to a private 0600 fixture file whose
path is printed; tokens themselves are never printed.
EOF
}

# --- configuration ---------------------------------------------------------------------------
load_config() {
  local keys='FACE_LAB_MODEL_DIR FACE_LAB_PAD_RUNTIME_DIR FACE_LAB_RESEARCH_PORT FACE_LAB_CORE_PORT FACE_LAB_WEB_PORT FACE_LAB_SESSION_TTL_MS'
  if [ -f "$LOCAL_CONFIG" ]; then
    local line key value
    while IFS= read -r line || [ -n "$line" ]; do
      [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
      [[ "$line" =~ ^([A-Z_]+)=(.*)$ ]] || die "Invalid line in .faceid-lab.local.env: $line"
      key="${BASH_REMATCH[1]}"; value="${BASH_REMATCH[2]}"; value="${value%\"}"; value="${value#\"}"
      [[ " $keys " == *" $key "* ]] || die "Unsupported key in .faceid-lab.local.env: $key" "Allowed: $keys"
      [ -z "${!key:-}" ] && printf -v "$key" '%s' "${value/#\~/$HOME}"   # environment wins
    done < "$LOCAL_CONFIG"
  fi
  MODEL_DIR="${FACE_LAB_MODEL_DIR:-$ROOT/ai-service/weights}"
  PAD_DIR="${FACE_LAB_PAD_RUNTIME_DIR:-$HOME/.cache/fixgo-pad-mn3}"
  RESEARCH_PORT="${FACE_LAB_RESEARCH_PORT:-3107}"
  CORE_PORT="${FACE_LAB_CORE_PORT:-3118}"
  WEB_PORT="${FACE_LAB_WEB_PORT:-5199}"
  SESSION_TTL="${FACE_LAB_SESSION_TTL_MS:-120000}"
  local p
  for p in "$RESEARCH_PORT" "$CORE_PORT" "$WEB_PORT"; do
    [[ "$p" =~ ^[0-9]+$ ]] && [ "$p" -ge 1024 ] && [ "$p" -le 65535 ] || die "Invalid port '$p'" "Use 1024–65535"
  done
  [ "$RESEARCH_PORT" != "$CORE_PORT" ] && [ "$CORE_PORT" != "$WEB_PORT" ] && [ "$RESEARCH_PORT" != "$WEB_PORT" ] || die "FaceID Lab ports must be distinct"
  [[ "$SESSION_TTL" =~ ^[0-9]+$ ]] && [ "$SESSION_TTL" -ge 10000 ] && [ "$SESSION_TTL" -le 900000 ] || die "FACE_LAB_SESSION_TTL_MS must be 10000–900000"
}

# --- process identity ------------------------------------------------------------------------
proc_start() { awk '{print $22}' "/proc/$1/stat" 2>/dev/null || true; }
proc_args()  { tr '\0' ' ' < "/proc/$1/cmdline" 2>/dev/null || true; }
# owned PID START PATTERN → true only if the same process (not a reused PID) is still alive
owned() { [ -n "$1" ] && [ -d "/proc/$1" ] && [ "$(proc_start "$1")" = "$2" ] && [[ "$(proc_args "$1")" == *"$3"* ]]; }

port_owner() { ss -ltnpH "sport = :$1" 2>/dev/null | sed -E 's/.*users:\(\("([^"]+)",pid=([0-9]+).*/\1 (pid \2)/' | head -1; }
port_busy()  { [ -n "$(ss -ltnH "sport = :$1" 2>/dev/null)" ]; }

save_state() {
  umask 077; mkdir -p "$STATE_DIR"; chmod 700 "$STATE_DIR"
  { for k in STACK_PID STACK_START VITE_PID VITE_START RESEARCH_URL CORE_URL WEB_URL FIXTURES DB_NAME DB_CONTAINER CONTAINERS NETWORK STACK_LOG VITE_LOG; do
      printf '%s=%q\n' "$k" "${!k:-}"; done; } > "$STATE.tmp"
  mv "$STATE.tmp" "$STATE"
}
read_state() {
  [ -f "$STATE" ] || return 1
  # Only our own known keys are accepted from the state file.
  local line
  while IFS= read -r line; do
    [[ "$line" =~ ^(STACK_PID|STACK_START|VITE_PID|VITE_START|RESEARCH_URL|CORE_URL|WEB_URL|FIXTURES|DB_NAME|DB_CONTAINER|CONTAINERS|NETWORK|STACK_LOG|VITE_LOG)=(.*)$ ]] || continue
    eval "${BASH_REMATCH[1]}=${BASH_REMATCH[2]}"
  done < "$STATE"
}

# verify_db_isolation NAME HOST ISOLATED CONTAINER → 0 only for a disposable lab database.
verify_db_isolation() {
  [[ "$1" =~ ^fixgo_face_research_[a-f0-9]+$ ]] && [ "$2" = "127.0.0.1" ] && [ "$3" = "true" ] \
    && [[ "$4" =~ ^fixgo-face-research-[a-f0-9]+$ ]] && [ "$4" != "ondemand_postgres" ] && [ "$1" != "ondemand_db" ]
}

# --- preflight -------------------------------------------------------------------------------
sha_of() { sha256sum "$1" 2>/dev/null | cut -d' ' -f1; }
preflight() {
  info "${B}Preflight${N}"
  command -v node >/dev/null || die "node not found" "Install Node 20 (nvm install 20)"
  local major; major="$(node -p 'process.versions.node.split(".")[0]')"
  [ "$major" -ge 20 ] || die "Node $major found; Node ≥ 20 required"
  ok "node $(node -v)"
  command -v ss >/dev/null || die "ss (iproute2) not found" "sudo apt install iproute2"
  command -v docker >/dev/null || die "docker not found" "Install Docker Engine"
  docker info >/dev/null 2>&1 || die "Docker daemon not reachable" "Start Docker / add user to docker group"
  local img
  for img in python:3.11-slim postgis/postgis:16-3.4; do
    docker image inspect "$img" >/dev/null 2>&1 || die "Docker image $img missing" "docker pull $img"
  done
  ok "docker + images python:3.11-slim, postgis/postgis:16-3.4"
  [ -f server/node_modules/@prisma/client/package.json ] && [ -d server/node_modules/.prisma/client ] && [ -f server/node_modules/@babel/register/package.json ] \
    || die "server dependencies/Prisma client missing" "(cd server && npm ci && npx prisma generate)"
  [ -f ai-faceid-lab/node_modules/vite/bin/vite.js ] || die "ai-faceid-lab dependencies missing" "(cd ai-faceid-lab && npm ci)"
  ok "server + ai-faceid-lab dependencies"
  [ "$(sha_of "$MODEL_DIR/face_detection_yunet_2023mar.onnx")" = "$YUNET_SHA" ] \
    || die "YuNet model missing or SHA-256 mismatch in $MODEL_DIR" "Set FACE_LAB_MODEL_DIR to the pinned weights directory"
  [ "$(sha_of "$MODEL_DIR/face_recognition_sface_2021dec.onnx")" = "$SFACE_SHA" ] \
    || die "SFace model missing or SHA-256 mismatch in $MODEL_DIR" "Set FACE_LAB_MODEL_DIR to the pinned weights directory"
  ok "YuNet + SFace (SHA-256 pinned)"
  [ "$(sha_of "$PAD_DIR/anti-spoof-mn3.onnx")" = "$MN3_SHA" ] \
    || die "PAD model anti-spoof-mn3.onnx missing or SHA-256 mismatch in $PAD_DIR" "Set FACE_LAB_PAD_RUNTIME_DIR (see docs/implementation/face-id/pad-technical-experiment.md)"
  [ -L "$PAD_DIR/venv/bin/python" ] || [ -x "$PAD_DIR/venv/bin/python" ] || die "PAD runtime venv missing in $PAD_DIR/venv"
  ok "PAD MN3 artifact (SHA-256 pinned) + isolated runtime"
  local name port
  for name in RESEARCH_PORT CORE_PORT WEB_PORT; do
    port="${!name}"
    port_busy "$port" && die "Port $port ($name) already in use by $(port_owner "$port" || echo 'another process')" \
      "Not touching it. Choose another: FACE_LAB_${name}=<free port> ./dev-local.sh faceid" 3
  done
  ok "ports free: research $RESEARCH_PORT, core $CORE_PORT, web $WEB_PORT"
}

# --- start -----------------------------------------------------------------------------------
STARTED_STACK='' STARTED_VITE='' STARTUP_DONE=''
# EXIT trap: runs for die/exit, errors (set -e) and signals. Cleans up only if startup did not finish.
on_exit() {
  local code=$?
  trap - EXIT INT TERM
  [ -n "$STARTUP_DONE" ] && exit "$code"
  [ -z "$STARTED_STACK$STARTED_VITE" ] && exit "$code"
  warn "startup failed/interrupted — cleaning up only what this run started"
  [ -n "$STARTED_VITE" ] && owned "$VITE_PID" "$VITE_START" "vite.js" && kill -TERM -- "-$VITE_PID" 2>/dev/null || true
  if [ -n "$STARTED_STACK" ] && owned "$STACK_PID" "$STACK_START" "lab-stack.cjs"; then
    kill -INT "$STACK_PID" 2>/dev/null || true; wait_gone "$STACK_PID" 60
  fi
  rm -f "$STATE"
  exit "$([ "$code" -eq 0 ] && echo 1 || echo "$code")"
}
on_signal() { exit 130; }
wait_gone() { local i; for ((i = 0; i < $2 * 2; i++)); do [ -d "/proc/$1" ] || return 0; sleep 0.5; done; return 1; }

start() {
  if read_state && { owned "$STACK_PID" "$STACK_START" "lab-stack.cjs" || owned "$VITE_PID" "$VITE_START" "vite.js"; }; then
    info "FaceID Lab already running (started by this launcher)."; status; return 0
  fi
  rm -f "$STATE"
  load_config
  preflight
  mkdir -p "$LOG_DIR"
  STACK_LOG="$LOG_DIR/lab-stack.log"; VITE_LOG="$LOG_DIR/vite.log"
  : > "$STACK_LOG"; : > "$VITE_LOG"
  trap on_exit EXIT
  trap on_signal INT TERM

  info "${B}Starting isolated stack${N} (AI container, disposable PostgreSQL, research + Face Core APIs)…"
  # New session = own process group. DATABASE_URL and friends are scrubbed: the harness never
  # needs them and must not inherit a developer's main-DB connection string.
  ( cd server && exec env -u DATABASE_URL -u FACE_TEST_DATABASE_URL -u DIRECT_URL \
      FACE_RESEARCH_SOURCE_MODEL_DIR="$MODEL_DIR" FACE_RESEARCH_RUNTIME_DIR="$PAD_DIR" \
      FACE_LAB_RESEARCH_PORT="$RESEARCH_PORT" FACE_LAB_CORE_PORT="$CORE_PORT" FACE_LAB_SESSION_TTL_MS="$SESSION_TTL" \
      setsid node scripts/face-lab/lab-stack.cjs ) >> "$STACK_LOG" 2>&1 < /dev/null &
  STACK_PID=$!; STACK_START="$(proc_start "$STACK_PID")"; STARTED_STACK=1
  local i ready=''
  for ((i = 0; i < 360; i++)); do
    ready="$(grep -m1 '"ready":true' "$STACK_LOG" || true)"
    [ -n "$ready" ] && break
    grep -q 'LAB_STACK_FAILED' "$STACK_LOG" && break
    [ -d "/proc/$STACK_PID" ] || break
    sleep 0.5
  done
  if [ -z "$ready" ]; then
    printf '%s\n' "$(grep -E 'LAB_STACK_FAILED|Error' "$STACK_LOG" | tail -3)" >&2
    die "isolated stack did not become ready" "See $STACK_LOG"
  fi
  # The harness reports its own PID; it must equal the process we spawned (no wrapper confusion).
  local reported; reported="$(node -e 'console.log(JSON.parse(process.argv[1]).pid)' "$ready")"
  [ "$reported" = "$STACK_PID" ] || die "stack PID mismatch (spawned $STACK_PID, reported $reported)"
  eval "$(node -e '
    const r = JSON.parse(process.argv[1]); const q = s => `'"'"'${String(s).replace(/'"'"'/g, "")}'"'"'`;
    console.log([["RESEARCH_URL", r.researchUrl], ["CORE_URL", r.coreUrl], ["FIXTURES", r.fixturePath], ["DB_NAME", r.database?.name],
      ["DB_HOST", r.database?.host], ["DB_CONTAINER", r.database?.container], ["DB_ISOLATED", r.database?.isolated],
      ["CONTAINERS", (r.containers || []).join(" ")], ["NETWORK", r.network]].map(([k, v]) => `${k}=${q(v ?? "")}`).join("\n"));' "$ready")"
  # Database isolation must be proven, otherwise stop (on_exit tears down what was started).
  verify_db_isolation "$DB_NAME" "$DB_HOST" "$DB_ISOLATED" "$DB_CONTAINER" \
    || die "database isolation could not be proven (name=${DB_NAME:-?} container=${DB_CONTAINER:-?})" "Refusing to continue"
  docker inspect "$DB_CONTAINER" >/dev/null 2>&1 || die "isolated database container $DB_CONTAINER not found"
  [ "$(stat -c %a "$FIXTURES")" = "600" ] || die "fixture file is not private (expected mode 600)"
  save_state
  ok "stack ready (pid $STACK_PID), database ${DB_NAME} in container ${DB_CONTAINER}"

  info "${B}Starting FaceID Web Lab${N} (Vite)…"
  ( cd ai-faceid-lab && exec env FACEID_LAB_RESEARCH_URL="$RESEARCH_URL" FACEID_LAB_API_URL="${CORE_URL%/api}" \
      setsid node node_modules/vite/bin/vite.js --host 127.0.0.1 --port "$WEB_PORT" --strictPort ) >> "$VITE_LOG" 2>&1 < /dev/null &
  VITE_PID=$!; VITE_START="$(proc_start "$VITE_PID")"; STARTED_VITE=1
  WEB_URL=''
  for ((i = 0; i < 120; i++)); do
    WEB_URL="$(sed -E 's/\x1b\[[0-9;]*m//g' "$VITE_LOG" | grep -oE 'Local: +http://[^ ]+' | head -1 | awk '{print $2}' || true)"
    [ -n "$WEB_URL" ] && break
    [ -d "/proc/$VITE_PID" ] || break
    sleep 0.5
  done
  [ -n "$WEB_URL" ] || { tail -5 "$VITE_LOG" >&2; die "Vite did not start" "See $VITE_LOG"; }
  save_state

  local health
  health="$(node scripts/faceid-lab/health.cjs "$FIXTURES" "$RESEARCH_URL" "$CORE_URL" "$WEB_URL")" || {
    printf '%s\n' "$health" >&2; die "health check failed after start (nothing reported as RUNNING)"; }
  STARTUP_DONE=1
  trap - EXIT INT TERM
  summary "$health"
}

# --- status / stop ---------------------------------------------------------------------------
line() { printf '  %-15s: %s\n' "$1" "$2"; }
colour() { case "$1" in RUNNING|ISOLATED*) printf '%s%s%s' "$G" "$1" "$N" ;; *) printf '%s%s%s' "$R" "$1" "$N" ;; esac; }
summary() {
  local h="$1"
  get() { node -e 'const h=JSON.parse(process.argv[1]);const v=h[process.argv[2]];console.log(Array.isArray(v)?v.join(", "):(v??""))' "$h" "$1"; }
  echo
  info "${B}FixGo Development Launcher — Worker FaceID Lab${N}"
  echo
  line "FaceID Backend" "$(colour "$(get core)")  ${CORE_URL}"
  line "FaceID AI" "$(colour "$(get ai)")  (YuNet/SFace/MN3 via ${RESEARCH_URL})"
  line "FaceID Web Lab" "$(colour "$(get web)")"
  line "Database" "$(colour "ISOLATED TEST")  ${DB_NAME} (container ${DB_CONTAINER})"
  echo
  line "PAD policy" "$(get pad)"
  line "FaceID proof" "$(get proof)"
  line "Blockers" "$(get blockers)"
  line "Camera upload" "$(get cameraUpload)"
  echo
  info "Open FaceID Lab:"
  info "  ${B}${WEB_URL}${N}"
  info "Test tokens (private, mode 600 — paste into the Lab; never commit/share):"
  info "  ${FIXTURES}"
  info "Logs: ${STACK_LOG}, ${VITE_LOG}"
  echo
  info "Status: ./dev-local.sh faceid --status"
  info "Stop:   ./dev-local.sh faceid --stop"
}

status() {
  read_state || { info "FaceID Lab: ${B}STOPPED${N} (no launcher state)"; return 3; }
  local s v
  owned "$STACK_PID" "$STACK_START" "lab-stack.cjs" && s=1 || s=0
  owned "$VITE_PID" "$VITE_START" "vite.js" && v=1 || v=0
  if [ "$s$v" = 00 ]; then
    info "FaceID Lab: ${B}STOPPED${N} (stale state from a previous run removed; no process was signalled)"
    rm -f "$STATE"; return 3
  fi
  local health rc=0
  health="$(node scripts/faceid-lab/health.cjs "$FIXTURES" "$RESEARCH_URL" "$CORE_URL" "$WEB_URL")" || rc=$?
  summary "$health"
  echo
  line "Stack process" "$([ $s = 1 ] && echo "pid $STACK_PID" || echo 'NOT RUNNING')"
  line "Vite process" "$([ $v = 1 ] && echo "pid $VITE_PID" || echo 'NOT RUNNING')"
  local c
  for c in $CONTAINERS; do line "Container" "$c $(docker inspect -f '{{.State.Status}}' "$c" 2>/dev/null || echo missing)"; done
  return "$rc"
}

stop() {
  read_state || { info "FaceID Lab is not running (no launcher state). Nothing to stop."; return 0; }
  local stopped=0
  if owned "$VITE_PID" "$VITE_START" "vite.js"; then
    kill -TERM -- "-$VITE_PID" 2>/dev/null || true; wait_gone "$VITE_PID" 10 || kill -KILL -- "-$VITE_PID" 2>/dev/null || true
    ok "Vite stopped (pid $VITE_PID)"; stopped=1
  fi
  if owned "$STACK_PID" "$STACK_START" "lab-stack.cjs"; then
    kill -INT "$STACK_PID"   # harness removes its own containers, network, temp config
    if ! wait_gone "$STACK_PID" 60; then warn "stack slow to exit; sending SIGTERM"; kill -TERM "$STACK_PID" 2>/dev/null || true; wait_gone "$STACK_PID" 20 || true; fi
    ok "isolated stack stopped (pid $STACK_PID)"; stopped=1
  fi
  [ "$stopped" = 1 ] || warn "no live launcher process matched the saved state (stale); nothing was signalled"
  # Containers recorded at start must be gone; only those exact names are removed if left over.
  local c
  for c in $CONTAINERS; do
    if docker inspect "$c" >/dev/null 2>&1; then warn "leftover container $c (created by this launcher) — removing"; docker rm -f "$c" >/dev/null; fi
  done
  [ -n "${NETWORK:-}" ] && docker network inspect "$NETWORK" >/dev/null 2>&1 && docker network rm "$NETWORK" >/dev/null || true
  rm -f "$STATE"
  ok "FaceID Lab stopped"
}

# Allow `source faceid-lab.sh` for unit tests without running a command.
[[ "${BASH_SOURCE[0]}" != "$0" ]] && return 0
case "${1:-start}" in
  start|"") start ;;
  --status|status) status ;;
  --stop|stop) stop ;;
  -h|--help|help) usage ;;
  *) usage >&2; exit 2 ;;
esac
