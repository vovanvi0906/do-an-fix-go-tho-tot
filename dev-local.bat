@echo off
setlocal enabledelayedexpansion
set NODE_EXTRA_CA_CERTS=
title FixGo Pro - Unified Dev Environment (Live Console)

:: Chuyen thu muc lam viec ve goc du an
cd /d "%~dp0"

echo ================================================================
echo      FIXGO PRO - UNIFIED DEV ENVIRONMENT (1-CLICK RUNNER)
echo ================================================================
echo.

:: 1. Tao thu muc logs neu chua co
if not exist "logs" mkdir "logs"

:: 2. Tu dong sao chep cac file .env mau neu chua ton tai (Self-healing)
if not exist "server\.env" (
    if exist "server\.env.example" (
        copy "server\.env.example" "server\.env" >nul
        echo [INFO] Da tu dong tao server/.env tu .env.example
    )
)

if not exist "client\.env.local" (
    if exist "client\.env.example" (
        copy "client\.env.example" "client\.env.local" >nul
        echo [INFO] Da tu dong tao client/.env.local tu .env.example
    )
)

:: 3. Kiem tra va khoi chay Docker Containers neu co Docker Desktop
where docker >nul 2>&1
if %ERRORLEVEL% equ 0 (
    docker info >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo [1/4] Khoi dong Postgres va Redis qua Docker...
        docker compose up -d postgres redis >nul 2>&1
    )
)

:: 4. Chuan bi moi truong AI virtualenv neu chua co
if not exist "ai-service\.venv\Scripts\python.exe" (
    echo [2/4] Dang tao virtualenv cho AI Service...
    where py >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        py -3 -m venv ai-service\.venv
    ) else (
        python -m venv ai-service\.venv
    )
    call ai-service\.venv\Scripts\pip install -r ai-service\requirements.txt >nul 2>&1
)

if not exist "ai-service\weights\yolov8n.pt" (
    echo [INFO] Dang tu dong tai AI Model Weights...
    call ai-service\.venv\Scripts\python.exe ai-service\scripts\download_models.py
)

:: 5. Dong bo Prisma Database
echo [3/4] Dong bo Prisma Database...
cd server
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate >nul 2>&1
cd ..

:: 6. Tu dong dong bo dia chi IP Wi-Fi may tinh vao Mobile App...
echo [4/4] Dong bo dia chi IP Wi-Fi may tinh vao Mobile App...
node scripts\update-ip.js
echo.

echo ================================================================
echo  DICH VU HE THONG DANG CHAY:
echo   - Backend Server:   http://localhost:3000/api
echo   - AI Service:       http://localhost:8000/docs
echo   - Client Admin Web: http://localhost:5173
echo.
echo  * De chay Customer App: mo terminal khac, vao customer-app va chay npx expo start -c
echo  * De chay Worker App:   mo terminal khac, vao worker-app va chay npx expo start -c
echo ================================================================
echo.

:: Cua so chinh quan ly va hien thi truc tiep log cac dich vu Backend, AI va Web Admin
npx --yes concurrently -k -n "SERVER,AI,CLIENT" -c "blue,magenta,cyan" ^
  "cd server && npm run dev" ^
  "cd ai-service && .venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-exclude .venv" ^
  "cd client && npm run dev"
