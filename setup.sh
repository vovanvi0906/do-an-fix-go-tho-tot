#!/usr/bin/env bash
set -e

# Chuyen ve thu muc goc cua repo
cd "$(dirname "$0")"

# Load NVM neu co
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

echo "================================================================"
echo "          FIXGO PRO - CAI DAT HE THONG & THU VIEN (LINUX)"
echo "================================================================"
echo ""

# 1. Tu dong tao file .env tu .env.example neu chua co
echo "[1/7] Khoi tao cac file cau hinh .env..."
if [ ! -f "server/.env" ] && [ -f "server/.env.example" ]; then
    cp server/.env.example server/.env
    echo "      [OK] Da tao server/.env"
else
    echo "      [OK] server/.env da ton tai."
fi

if [ ! -f "client/.env.local" ] && [ -f "client/.env.example" ]; then
    cp client/.env.example client/.env.local
    echo "      [OK] Da tao client/.env.local"
else
    echo "      [OK] client/.env.local da ton tai."
fi

if [ ! -f "customer-app/.env" ] && [ -f "customer-app/.env.example" ]; then
    cp customer-app/.env.example customer-app/.env
    echo "      [OK] Da tao customer-app/.env"
else
    echo "      [OK] customer-app/.env da ton tai."
fi

if [ ! -f "worker-app/.env" ] && [ -f "worker-app/.env.example" ]; then
    cp worker-app/.env.example worker-app/.env
    echo "      [OK] Da tao worker-app/.env"
else
    echo "      [OK] worker-app/.env da ton tai."
fi

# 2. Server npm install
echo ""
echo "[2/7] Dang cai dat dependencies cho Server (NestJS)..."
cd server && npm install && cd ..

# 3. Client Admin Web npm install
echo ""
echo "[3/7] Dang cai dat dependencies cho Client (React/Vite)..."
cd client && npm install && cd ..

# 4. Customer App npm install
echo ""
echo "[4/7] Dang cai dat dependencies cho Customer App (Expo)..."
cd customer-app && npm install && cd ..

# 5. Worker App npm install
echo ""
echo "[5/7] Dang cai dat dependencies cho Worker App (Expo)..."
cd worker-app && npm install && cd ..

# 6. Virtualenv Python cho AI Service
echo ""
echo "[6/7] Dang chuan bi virtualenv va thu vien Python cho AI Service..."
if [ ! -d "ai-service/.venv" ]; then
    python3 -m venv ai-service/.venv
fi

ai-service/.venv/bin/pip install --upgrade pip
ai-service/.venv/bin/pip install -r ai-service/requirements.txt

if [ -f "ai-service/scripts/download_models.py" ]; then
    echo "      Dang tai AI Model Weights..."
    ai-service/.venv/bin/python ai-service/scripts/download_models.py
fi

# 7. Docker va Prisma db push
echo ""
echo "[7/7] Khoi dong Docker va dong bo Prisma Database..."
if command -v docker &> /dev/null; then
    docker compose up -d postgres redis
    echo "      Dang cho Database khoi dong san sang (5 giay)..."
    sleep 5
    cd server
    npx prisma generate
    npx prisma db push --skip-generate
    cd ..
else
    echo "      [CANH BAO] Docker chua duoc cai dat hoac chua khoi chay."
fi

# Dong bo IP Wi-Fi
if [ -f "scripts/update-ip.js" ] && command -v node &> /dev/null; then
    node scripts/update-ip.js
fi

echo ""
echo "================================================================"
echo "  [HOAN TAT] DA CAI DAT XONG TOAN BO DANG DU LIEU VA THU VIEN!"
echo "  Ban co the khoi dong du an bang cach chay ./dev-local.sh"
echo "================================================================"

