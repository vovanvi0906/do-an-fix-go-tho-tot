#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"
FIXGO_USB_ROOT="$(pwd -P)"
export PYTHONDONTWRITEBYTECODE=1
export ULTRALYTICS_AUTOINSTALL=false

# Load NVM
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  set +u
  source "$NVM_DIR/nvm.sh"
  set -u
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

echo "=========================================="
echo " FIXGO - ANDROID USB DEVELOPMENT"
echo "=========================================="

# Kiểm tra cấu hình
if [ ! -f server/.env ]; then
  echo "ERROR: Thiếu server/.env"
  exit 1
fi

if [ ! -x ai-service/.venv/bin/python ]; then
  echo "ERROR: Thiếu AI virtual environment."
  echo "Tạo virtualenv riêng tại ai-service/.venv và cài requirements; không dùng dev-local.sh vì script đó có db push."
  exit 1
fi

if [ ! -f customer-app/.env.local ] ||
   [ ! -f worker-app/.env.local ]; then
  echo "ERROR: Chưa có .env.local cho 2 app."
  exit 1
fi

# Kiểm tra cả API và Socket dùng localhost
for app in customer-app worker-app; do
  if ! grep -qx \
    'EXPO_PUBLIC_API_URL=http://127.0.0.1:3000/api' \
    "$app/.env.local" ||
     ! grep -qx \
    'EXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:3000' \
    "$app/.env.local"; then
    echo "ERROR: $app/.env.local chưa cấu hình USB localhost."
    exit 1
  fi
done

# Không dùng nhầm listener từ worktree khác; kiểm tra trước mọi side effect.
node scripts/assert-usb-ports-free.cjs
echo "Source worktree: $FIXGO_USB_ROOT"
echo "Backend: $FIXGO_USB_ROOT/server"
echo "FastAPI: $FIXGO_USB_ROOT/ai-service/main.py"
echo "Customer: $FIXGO_USB_ROOT/customer-app (8081)"
echo "Worker: $FIXGO_USB_ROOT/worker-app (8082)"

# Khởi động Docker services
echo "Starting PostgreSQL and Redis..."
# Các worktree dùng chung container_name. Không yêu cầu Compose của worktree mới
# tạo lại container thuộc project khác (có thể conflict hoặc thay đổi stack đang dùng).
if docker inspect ondemand_postgres ondemand_redis >/dev/null 2>&1; then
  for container in ondemand_postgres ondemand_redis; do
    if [ "$(docker inspect -f '{{.State.Running}}' "$container")" != true ]; then
      echo "ERROR: $container đã tồn tại nhưng chưa chạy. Điều phối stack trước khi chạy USB."
      exit 1
    fi
  done
  echo "Reusing running PostgreSQL/Redis containers; no compose changes."
elif docker inspect ondemand_postgres >/dev/null 2>&1 || docker inspect ondemand_redis >/dev/null 2>&1; then
  echo "ERROR: Stack PostgreSQL/Redis chỉ tồn tại một phần. Điều phối stack trước khi chạy USB."
  exit 1
else
  docker compose up -d postgres redis
fi

# Prisma: chỉ generate, không sửa database schema
echo "Checking Prisma..."
(
  cd server
  npx prisma validate
  npx prisma generate
  node scripts/usb-runtime-preflight.cjs
)

# ADB Reverse
echo "Configuring Android USB..."
bash scripts/dev-usb-connect.sh "$@"

echo ""
echo "=========================================="
echo " FIXGO SERVICES"
echo "=========================================="
echo " Backend:    http://127.0.0.1:3000/api"
echo " Swagger:    http://127.0.0.1:3000/api/docs"
echo " AI Service: http://127.0.0.1:8000/docs"
echo " Admin Web:  http://127.0.0.1:5173"
echo ""
echo " Customer Metro: 8081"
echo " Worker Metro:   8082"
echo "=========================================="

# Khởi động Backend + AI + Admin + hai Metro từ chính worktree này.
# CI chặn Expo tự chọn cổng khác khi có tranh chấp sau bước preflight.
npx --yes concurrently -k \
  -n "SERVER,AI,CLIENT,CUSTOMER,WORKER" \
  -c "blue,magenta,cyan,green,yellow" \
  "cd server && npm run dev" \
  "node scripts/start-usb-ai.cjs" \
  "cd client && npm run dev -- --strictPort" \
  "cd customer-app && CI=1 npm run start:debug -- --localhost" \
  "cd worker-app && FACE_RESEARCH_APP=false CI=1 npm run start:debug -- --localhost"
