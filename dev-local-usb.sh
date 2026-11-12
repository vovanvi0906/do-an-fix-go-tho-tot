#!/usr/bin/env bash
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

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
  echo "Hãy chuẩn bị bằng dev-local.sh trước."
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

# Khởi động Docker services
echo "Starting PostgreSQL and Redis..."
docker compose up -d postgres redis

# Prisma: chỉ generate, không sửa database schema
echo "Checking Prisma..."
(
  cd server
  npx prisma validate
  npx prisma generate
)

# ADB Reverse
echo "Configuring Android USB..."
bash scripts/dev-usb-connect.sh

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

# Khởi động Backend + AI + Admin
npx --yes concurrently -k \
  -n "SERVER,AI,CLIENT" \
  -c "blue,magenta,cyan" \
  "cd server && npm run dev" \
  "cd ai-service && . .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-exclude .venv" \
  "cd client && npm run dev"
