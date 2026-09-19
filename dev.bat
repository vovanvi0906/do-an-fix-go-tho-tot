@echo off
setlocal enabledelayedexpansion
set NODE_EXTRA_CA_CERTS=
title FixGo Pro - Core Services (Backend, AI, Web Admin)

echo ================================================================
echo           FIXGO PRO - UNIFIED DEV ENVIRONMENT (DUAL WINDOW)
echo ================================================================
echo.

:: 1. Tao thu muc logs neu chua co
if not exist "logs" mkdir "logs"

:: Tu dong sao chep cac file .env mau neu chua ton tai (Self-healing on fresh clone)
if not exist "doan-kltn-backend\.env" (
    if exist "doan-kltn-backend\.env.example" (
        copy "doan-kltn-backend\.env.example" "doan-kltn-backend\.env" >nul
        echo [INFO] Da tu dong tao doan-kltn-backend/.env tu .env.example
    )
)

if not exist "doan-kttn-frontend\.env.local" (
    if exist "doan-kttn-frontend\.env.example" (
        copy "doan-kttn-frontend\.env.example" "doan-kttn-frontend\.env.local" >nul
        echo [INFO] Da tu dong tao doan-kttn-frontend/.env.local tu .env.example
    )
)

:: 2. Kiem tra Docker Desktop
echo [1/5] Kiem tra Docker Desktop...
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker Desktop chua duoc bat! Vui long bat Docker truoc.
    pause
    exit /b 1
)

:: 3. Khoi chay Docker Postgres va Redis
echo [2/5] Khoi dong Postgres va Redis qua Docker...
docker compose up -d >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Khong the khoi dong Docker containers.
    pause
    exit /b 1
)

:: 4. Chuan bi moi truong AI va dong bo Database
echo [3/5] Chuan bi moi truong AI va dong bo Database...
if not exist "ai-service\.venv\Scripts\python.exe" (
    echo  - Dang tao virtualenv cho AI...
    py -3 -m venv ai-service\.venv
    call ai-service\.venv\Scripts\pip install -r ai-service\requirements.txt >nul 2>&1
)

cd doan-kltn-backend
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate >nul 2>&1
cd ..

:: 5. Tu dong cap nhat IPv4 Wi-Fi cho Mobile Expo
echo [4/5] Dong bo dia chi IP Wi-Fi may tinh vao Mobile App...
node scripts\update-ip.js
echo.

:: 6. Khoi chay Dual-Terminal: Cua so Expo rieng biet & Cua so Dich vu Chinh
echo [5/5] Khoi dong cac dich vu theo mo hinh Dual-Terminal...
echo.
echo ================================================================
echo  DICH VU CHAY NGAM (Xem log chi tiet tai thu muc logs/):
echo   - Backend API:  http://localhost:3000/api  (logs\backend.log)
echo   - AI Service:   http://localhost:8000/docs (logs\ai.log)
echo   - Web Admin:    http://localhost:5173      (logs\web.log)
echo.
echo  CUA SO EXPO METRO BUNDLER:
echo   - Ma QR Code va hotkey Expo duoc mo tai cua so rieng biet.
echo   - Nhan [Ctrl + C] tai day de dung Backend, AI va Web Admin.
echo   - Chay stop.bat neu muon tat toan bo Docker va tien trinh.
echo ================================================================
echo.

:: Mo cua so doc lap cho Expo Metro Bundler (hien thi QR Code rieng)
start "FixGo Mobile - Expo Metro (QR Code)" cmd /k "cd doan-kltn-mobile && npx expo start -c"

:: Cua so chinh quan ly cac dich vu Backend, AI va Frontend
npx --yes concurrently -k ^
  "cd doan-kltn-backend && npm run dev > ..\logs\backend.log 2>&1" ^
  "cd ai-service && .venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ..\logs\ai.log 2>&1" ^
  "cd doan-kttn-frontend && npm run dev > ..\logs\web.log 2>&1"