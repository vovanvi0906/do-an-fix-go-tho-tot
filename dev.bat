@echo off
setlocal enabledelayedexpansion
title FixGo Pro - Unified Development Environment

echo ================================================================
echo           FIXGO PRO - UNIFIED DEV STARTER (QR CODE MODE)
echo ================================================================
echo.

:: 1. Tao thu muc logs neu chua co
if not exist "logs" mkdir "logs"

:: 2. Kiem tra Docker Desktop
echo [1/4] Kiem tra Docker Desktop...
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker Desktop chua duoc bat! Vui long bat Docker truoc.
    pause
    exit /b 1
)

:: 3. Khoi chay Docker Postgres va Redis
echo [2/4] Khoi dong Postgres va Redis qua Docker...
docker compose up -d >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Khong the khoi dong Docker containers.
    pause
    exit /b 1
)

:: 4. Chuan bi moi truong AI va dong bo Database
echo [3/4] Chuan bi moi truong AI va dong bo Database...
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

:: 6. Khoi chay he thong va xuat truc tiep Ma QR len Terminal
echo [5/5] Khoi dong cac dich vu va hien thi Ma QR ket noi...
echo.
echo ================================================================
echo  DICH VU CHAY NGAM (Xem log chi tiet tai thu muc logs/):
echo   - Backend API:  http://localhost:3000/api  (logs\backend.log)
echo   - AI Service:   http://localhost:8000/docs (logs\ai.log)
echo   - Web Admin:    http://localhost:5173      (logs\web.log)
echo ================================================================
echo.
echo Dang khoi dong Metro Bundler de tao ma QR...
echo.

npx --yes concurrently -k --raw ^
  "cd doan-kltn-backend && npm run dev > ..\logs\backend.log 2>&1" ^
  "cd ai-service && .venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ..\logs\ai.log 2>&1" ^
  "cd doan-kttn-frontend && npm run dev > ..\logs\web.log 2>&1" ^
  "cd doan-kltn-mobile && npx expo start -c"