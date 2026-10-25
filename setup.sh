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
echo "[1/6] Khoi tao cac file cau hinh .env..."
if [ ! -f "doan-kltn-backend/.env" ] && [ -f "doan-kltn-backend/.env.example" ]; then
    cp doan-kltn-backend/.env.example doan-kltn-backend/.env
    echo "      [OK] Da tao doan-kltn-backend/.env"
else
    echo "      [OK] doan-kltn-backend/.env da ton tai."
fi

if [ ! -f "doan-kttn-frontend/.env.local" ] && [ -f "doan-kttn-frontend/.env.example" ]; then
    cp doan-kttn-frontend/.env.example doan-kttn-frontend/.env.local
    echo "      [OK] Da tao doan-kttn-frontend/.env.local"
else
    echo "      [OK] doan-kttn-frontend/.env.local da ton tai."
fi

if [ ! -f "doan-kltn-mobile/.env" ] && [ -f "doan-kltn-mobile/.env.example" ]; then
    cp doan-kltn-mobile/.env.example doan-kltn-mobile/.env
    echo "      [OK] Da tao doan-kltn-mobile/.env"
else
    echo "      [OK] doan-kltn-mobile/.env da ton tai."
fi

# 2. Backend npm install
echo ""
echo "[2/6] Dang cai dat dependencies cho Backend (NestJS)..."
cd doan-kltn-backend && npm install && cd ..

# 3. Web Admin npm install
echo ""
echo "[3/6] Dang cai dat dependencies cho Frontend (React/Vite)..."
cd doan-kttn-frontend && npm install && cd ..

# 4. Mobile npm install
echo ""
echo "[4/6] Dang cai dat dependencies cho Mobile (Expo)..."
cd doan-kltn-mobile && npm install && cd ..

# 5. Virtualenv Python cho AI Service
echo ""
echo "[5/6] Dang chuan bi virtualenv va thu vien Python cho AI Service..."
if [ ! -d "ai-service/.venv" ]; then
    python3 -m venv ai-service/.venv
fi

ai-service/.venv/bin/pip install --upgrade pip
ai-service/.venv/bin/pip install -r ai-service/requirements.txt

if [ -f "ai-service/scripts/download_models.py" ]; then
    echo "      Dang tai AI Model Weights..."
    ai-service/.venv/bin/python ai-service/scripts/download_models.py
fi

# 6. Docker va Prisma db push
echo ""
echo "[6/6] Khoi dong Docker va dong bo Prisma Database..."
if command -v docker &> /dev/null; then
    docker compose up -d postgres redis
    echo "      Dang cho Database khoi dong san sang (5 giay)..."
    sleep 5
    cd doan-kltn-backend
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

