#!/usr/bin/env bash

# Chuyen ve thu muc goc cua repo
cd "$(dirname "$0")"

# Load NVM neu co
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

mkdir -p logs

# Tu dong copy .env neu chua co
if [ ! -f "doan-kltn-backend/.env" ] && [ -f "doan-kltn-backend/.env.example" ]; then
    cp doan-kltn-backend/.env.example doan-kltn-backend/.env
fi
if [ ! -f "doan-kttn-frontend/.env.local" ] && [ -f "doan-kttn-frontend/.env.example" ]; then
    cp doan-kttn-frontend/.env.example doan-kttn-frontend/.env.local
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
cd doan-kltn-backend
npx prisma generate > /dev/null 2>&1
npx prisma db push --skip-generate > /dev/null 2>&1
cd ..

# Update IP
if [ -f "scripts/update-ip.js" ] && command -v node &> /dev/null; then
    node scripts/update-ip.js
fi

echo "================================================================"
echo " DICH VU HE THONG DANG CHAY:"
echo "  - Backend API:  http://localhost:3000/api"
echo "  - AI Service:   http://localhost:8000/docs"
echo "  - Web Admin:    http://localhost:5173"
echo ""
echo " * De chay Mobile App khi can: mo terminal khac, vao doan-kltn-mobile va chay npx expo start -c"
echo "================================================================"
echo ""

npx --yes concurrently -k -n "BACKEND,AI,WEB" -c "blue,magenta,cyan" \
  "cd doan-kltn-backend && npm run dev" \
  "cd ai-service && . .venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-exclude .venv" \
  "cd doan-kttn-frontend && npm run dev"

