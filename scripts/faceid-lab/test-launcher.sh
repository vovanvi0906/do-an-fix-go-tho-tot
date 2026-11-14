#!/usr/bin/env bash
# Non-destructive tests for dev-local.sh + FaceID Lab launcher. Never runs the real default flow
# (which would `prisma db push` the main DB): the default path is executed in a sandbox with
# recording stubs for docker/npx/node/python3 and compared against the HEAD version.
# Requires: FACE_LAB_MODEL_DIR (pinned YuNet/SFace) for the preflight-dependent cases.
# shellcheck disable=SC2016  # check bodies are single-quoted on purpose: eval'd later by check().
# shellcheck disable=SC2034  # variables used inside eval'd check bodies.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)"
T="$(mktemp -d)"; trap 'rm -rf "$T"; [ -n "${LISTENER:-}" ] && kill "$LISTENER" 2>/dev/null' EXIT
pass=0; fail=0
check() { if eval "$2"; then echo "PASS $1"; pass=$((pass + 1)); else echo "FAIL $1"; fail=$((fail + 1)); fi; }

# ---------- 1. default behaviour regression (sandbox + recording stubs) ----------
mkdir -p "$T/bin" "$T/home"
for c in docker npx node python3; do
  printf '#!/bin/sh\necho "%s $*" >> "$REC"\n' "$c" > "$T/bin/$c"; chmod +x "$T/bin/$c"
done
sandbox() { # $1=name $2=dev-local.sh content source; rest = args
  local d="$T/$1"; mkdir -p "$d/server" "$d/client" "$d/ai-service/.venv/bin" "$d/scripts/faceid-lab"
  touch "$d/ai-service/.venv/bin/python"
  printf '#!/bin/sh\necho "faceid-lab.sh $*" >> "$REC"\n' > "$d/scripts/faceid-lab/faceid-lab.sh"
  cat > "$d/dev-local.sh"; shift
  (cd "$d" && env -i HOME="$T/home" PATH="$T/bin:/usr/bin:/bin" REC="$d/rec" bash ./dev-local.sh "$@" > "$d/out" 2>&1); echo $? > "$d/rc"
}
git -C "$ROOT" show HEAD:dev-local.sh | sandbox old
sandbox new < "$ROOT/dev-local.sh"
check "default (no args) runs the identical command sequence as HEAD" 'diff -q "$T/old/rec" "$T/new/rec" >/dev/null && diff -q "$T/old/out" "$T/new/out" >/dev/null'
check "default still runs compose + prisma db push + concurrently" 'grep -q "docker compose up -d postgres redis" "$T/new/rec" && grep -q "npx prisma db push" "$T/new/rec" && grep -q "npx --yes concurrently" "$T/new/rec"'
sandbox faceid < "$ROOT/dev-local.sh" faceid --status
check "'faceid' never touches compose/prisma/main DB" '[ "$(cat "$T/faceid/rec")" = "faceid-lab.sh --status" ]'
sandbox help < "$ROOT/dev-local.sh" --help
check "--help exits 0, lists commands, no side effects" '[ "$(cat "$T/help/rc")" = 0 ] && grep -q "faceid --stop" "$T/help/out" && [ ! -e "$T/help/rec" ]'
sandbox bad < "$ROOT/dev-local.sh" bogus
check "unknown command → exit 2, no side effects" '[ "$(cat "$T/bad/rc")" = 2 ] && [ ! -e "$T/bad/rec" ]'
sandbox allargs < "$ROOT/dev-local.sh" all extra
check "'all' rejects extra args before doing anything" '[ "$(cat "$T/allargs/rc")" = 2 ] && [ ! -e "$T/allargs/rec" ]'
printf '#!/bin/sh\necho "faceid-lab.sh $*" >> "$REC"\nexit 1\n' > "$T/failstub"
mkdir -p "$T/allfail"; ( d="$T/allfail"; mkdir -p "$d/scripts/faceid-lab" "$d/server"; cp "$T/failstub" "$d/scripts/faceid-lab/faceid-lab.sh"; cp "$ROOT/dev-local.sh" "$d/";
  cd "$d" && env -i HOME="$T/home" PATH="$T/bin:/usr/bin:/bin" REC="$d/rec" bash ./dev-local.sh all > "$d/out" 2>&1; echo $? > "$d/rc" )
check "'all' aborts default flow when FaceID Lab fails" '[ "$(cat "$T/allfail/rc")" = 1 ] && [ "$(cat "$T/allfail/rec")" = "faceid-lab.sh " ]'

# ---------- 2. launcher CLI / configuration ----------
L="$ROOT/scripts/faceid-lab/faceid-lab.sh"
check "faceid --help" 'bash "$L" --help | grep -q "FACE_LAB_CORE_PORT"'
check "faceid unknown flag → exit 2" 'bash "$L" --nope >/dev/null 2>&1; [ $? = 2 ]'
# Runs the launcher with extra env; prints only its stderr. Exit status ignored (failures expected).
run_cfg() { (for kv in "$@"; do export "${kv?}"; done; { bash "$L" >/dev/null; } 2>&1) || true; }
check "privileged/invalid port rejected" 'run_cfg FACE_LAB_WEB_PORT=80 | grep -q "Invalid port"'
check "duplicate ports rejected" 'run_cfg FACE_LAB_WEB_PORT=4000 FACE_LAB_CORE_PORT=4000 | grep -q "distinct"'
check "session TTL bounds" 'run_cfg FACE_LAB_SESSION_TTL_MS=10 | grep -q "SESSION_TTL"'
mkdir -p "$T/empty" "$T/badmodels"; echo x > "$T/badmodels/face_detection_yunet_2023mar.onnx"; echo x > "$T/badmodels/face_recognition_sface_2021dec.onnx"
check "missing model dir → clear error" 'run_cfg FACE_LAB_MODEL_DIR="$T/empty" | grep -q "YuNet model missing"'
check "tampered model (SHA mismatch) → clear error" 'run_cfg FACE_LAB_MODEL_DIR="$T/badmodels" | grep -q "SHA-256 mismatch"'
if [ -n "${FACE_LAB_MODEL_DIR:-}" ]; then
  check "missing PAD runtime → clear error" 'run_cfg FACE_LAB_PAD_RUNTIME_DIR="$T/empty" | grep -q "PAD model anti-spoof-mn3.onnx missing"'
  # Port held by a process we own: launcher must refuse and name it, never kill it.
  python3 -c 'import socket,time;s=socket.socket();s.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);s.bind(("127.0.0.1",0));s.listen();print(s.getsockname()[1],flush=True);time.sleep(120)' > "$T/port" &
  LISTENER=$!; for _ in $(seq 50); do [ -s "$T/port" ] && break; sleep 0.1; done; P="$(cat "$T/port")"
  check "port conflict → exit 3 naming owner pid, owner left alive" 'out=$(run_cfg FACE_LAB_RESEARCH_PORT="$P"); echo "$out" | grep -q "Port $P (RESEARCH_PORT) already in use by python3 (pid $LISTENER)" && kill -0 "$LISTENER"'
  for codex in 3108 8108 5178; do
    if [ -n "$(ss -ltnH "sport = :$codex")" ]; then
      owner="$(ss -ltnpH "sport = :$codex" | grep -oE 'pid=[0-9]+' | head -1 | cut -d= -f2)"
      check "Codex port $codex in use → refused, pid $owner untouched" 'run_cfg FACE_LAB_CORE_PORT="$codex" | grep -q "Port $codex" && kill -0 "$owner"'
    fi
  done
  mkdir -p "$T/nodeps/scripts/faceid-lab"; cp "$L" "$T/nodeps/scripts/faceid-lab/"
  check "missing server/ai-faceid-lab dependencies → clear error" '{ bash "$T/nodeps/scripts/faceid-lab/faceid-lab.sh" 2>&1 || true; } | grep -q "server dependencies/Prisma client missing"'
else
  echo "SKIP preflight-dependent cases (set FACE_LAB_MODEL_DIR)"
fi
mkdir -p "$T/cfg/scripts/faceid-lab"; cp "$L" "$T/cfg/scripts/faceid-lab/"; echo 'DATABASE_URL=postgres://x' > "$T/cfg/.faceid-lab.local.env"
check "local config rejects non-whitelisted keys (e.g. DATABASE_URL)" '{ bash "$T/cfg/scripts/faceid-lab/faceid-lab.sh" 2>&1 || true; } | grep -q "Unsupported key in .faceid-lab.local.env: DATABASE_URL"'

# ---------- 3. DB isolation predicate ----------
# shellcheck source=scripts/faceid-lab/faceid-lab.sh
iso() { (source "$L"; verify_db_isolation "$@"); }
check "isolation: disposable lab DB accepted" 'iso fixgo_face_research_abc123 127.0.0.1 true fixgo-face-research-abc123'
check "isolation: main ondemand_db rejected" '! iso ondemand_db 127.0.0.1 true ondemand_postgres'
check "isolation: non-loopback host rejected" '! iso fixgo_face_research_abc 10.0.0.5 true fixgo-face-research-abc'
check "isolation: unproven marker rejected" '! iso fixgo_face_research_abc 127.0.0.1 false fixgo-face-research-abc'
check "isolation: foreign container rejected" '! iso fixgo_face_research_abc 127.0.0.1 true ondemand_postgres'

# ---------- 4. status/stop without state ----------
check "status with no state → STOPPED, exit 3" 'out=$(bash "$L" --status); rc=$?; [ $rc = 3 ] && echo "$out" | grep -q STOPPED'
check "stop with no state → no-op, exit 0" 'bash "$L" --stop | grep -q "Nothing to stop"'

echo "TOTAL: $pass passed, $fail failed"
[ "$fail" = 0 ]
