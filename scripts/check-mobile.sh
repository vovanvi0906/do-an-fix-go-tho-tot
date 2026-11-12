#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm --prefix customer-app run test:ci
npm --prefix worker-app run test:ci
npm --prefix server test -- --runInBand
npm --prefix server run build
