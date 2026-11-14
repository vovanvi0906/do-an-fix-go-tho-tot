#!/usr/bin/env bash

# Chuyen ve thu muc goc cua repo
cd "$(dirname "$0")"

# Load NVM neu co
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Lenh phu (khong tham so = hanh vi mac dinh cu, khong doi gi).
#   ./dev-local.sh --help | faceid [--status|--stop] | all
# FaceID Lab chay hoan toan tach biet (DB tam rieng), KHONG dung server/.env hay DB chinh.
FACEID_LAB_SH="scripts/faceid-lab/faceid-lab.sh"
case "${1:-}" in
    "") ;;
    -h|--help|help)
        cat <<'EOF'
FixGo dev-local.sh
  ./dev-local.sh                   Mac dinh: postgres/redis (compose) + prisma db push + Server :3000, AI :8000, Admin :5173
  ./dev-local.sh faceid            Khoi dong Worker FaceID Lab (stack co lap + web lab), chay nen
  ./dev-local.sh faceid --status   Trang thai process/port/health/PAD policy
  ./dev-local.sh faceid --stop     Dung dung cac process/container do launcher tao
  ./dev-local.sh faceid --help     Cau hinh port/model cua FaceID Lab
  ./dev-local.sh all               FaceID Lab (nen) + luong mac dinh; Ctrl+C dung ca hai
EOF
        exit 0 ;;
    faceid)
        shift
        exec bash "$FACEID_LAB_SH" "$@" ;;
    all)
        shift
        [ $# -eq 0 ] || { echo "ERROR: 'all' khong nhan tham so" >&2; exit 2; }
        bash "$FACEID_LAB_SH" || { echo "ERROR: FaceID Lab khong khoi dong duoc; khong chay tiep luong mac dinh." >&2; exit 1; }
        # Dung FaceID Lab khi luong mac dinh ket thuc (Ctrl+C / loi).
        trap 'bash "$FACEID_LAB_SH" --stop' EXIT
        ;;
    *)
        echo "ERROR: lenh khong hop le: $1 (xem ./dev-local.sh --help)" >&2
        exit 2 ;;
esac

mkdir -p logs

# Tu dong copy .env neu chua co
if [ ! -f "server/.env" ] && [ -f "server/.env.example" ]; then
    cp server/.env.example server/.env
fi
if [ ! -f "client/.env.local" ] && [ -f "client/.env.example" ]; then
    cp client/.env.example client/.env.local
fi

# Khoi dong docker
if command -v docker &> /dev/null; then
    docker compose up -d postgres redis > /dev/null 2>&1
fi

# Chuan bi moi truong AI neu chua co
if [ ! -f "ai-service/.venv/bin/python" ]; then
    python3 -m venv ai-service/.venv
    ai-service/.venv/bin/pip install -r ai-service/requirements.txt > /dev/null 2>&1
fi

if [ ! -f "ai-service/weights/yolov8n.pt" ] && [ -f "ai-service/scripts/download_models.py" ]; then
    ai-service/.venv/bin/python ai-service/scripts/download_models.py
fi

# Dong bo Prisma DB
cd server
npx prisma generate > /dev/null 2>&1
npx prisma db push --skip-generate > /dev/null 2>&1
cd ..

# Update IP
if [ -f "scripts/update-ip.js" ] && command -v node &> /dev/null; then
    node scripts/update-ip.js
fi

echo "================================================================"
echo " DICH VU HE THONG DANG CHAY:"
echo "  - Backend Server:   http://localhost:3000/api"
echo "  - AI Service:       http://localhost:8000/docs"
echo "  - Client Admin Web: http://localhost:5173"
echo ""
echo " * De chay Customer App: mo terminal, vao customer-app va chay npx expo start -c"
echo " * De chay Worker App:   mo terminal, vao worker-app va chay npx expo start -c"
echo "================================================================"
echo ""

npx --yes concurrently -k -n "SERVER,AI,CLIENT" -c "blue,magenta,cyan" \
  "cd server && npm run dev" \
  "cd ai-service && . .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-exclude .venv" \
  "cd client && npm run dev"

