#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
action=${1:-start}
if (($#)); then shift; fi
case "$action" in
  prepare) node scripts/android-qa/prepare.cjs "$@" ;;
  start|stop|status|enable-symptoms) node scripts/android-qa/runtime.cjs "$action" "$@" ;;
  verify) node scripts/android-qa/verify.cjs "$@" ;;
  *) echo 'Usage: ./dev-android-qa.sh prepare|start [--device SERIAL]|stop|status|verify|enable-symptoms' >&2; exit 2 ;;
esac
