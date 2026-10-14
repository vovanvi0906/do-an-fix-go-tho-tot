@echo off
setlocal enabledelayedexpansion
set NODE_EXTRA_CA_CERTS=
title FixGo Pro - 1-Click All-in-One Runner

:: Chuyen thu muc lam viec ve goc du an
cd /d "%~dp0"

echo ================================================================
echo       FIXGO PRO - ALL-IN-ONE 1-CLICK RUNNER (WINDOWS)
echo ================================================================
echo.

:: 1. Tao thu muc logs
if not exist "logs" mkdir "logs"

:: 2. Tu dong sao chep cac file .env mau neu chua ton tai (Self-healing)
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

:: 3. Kiem tra va khoi dong Docker Containers (neu co Docker)
where docker >nul 2>&1
if %ERRORLEVEL% equ 0 (
    docker info >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo [1/5] Khoi dong Database & Redis qua Docker...
        docker compose up -d postgres redis >nul 2>&1
    )
)

:: 4. Kiem tra virtualenv AI & tu dong tai Model Weights neu thieu
echo [2/5] Kiem tra moi truong AI & Model Weights...
if not exist "ai-service\.venv\Scripts\python.exe" (
    echo   - Dang tao virtualenv cho AI Service...
    where py >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        py -3 -m venv ai-service\.venv
    ) else (
        python -m venv ai-service\.venv
    )
    call ai-service\.venv\Scripts\pip install -r ai-service\requirements.txt >nul 2>&1
)

if not exist "ai-service\weights\yolov8n.pt" (
    echo   - Dang tu dong tai AI Model Weights...
    call ai-service\.venv\Scripts\python.exe ai-service\scripts\download_models.py
)

:: 5. Dong bo Prisma Database
echo [3/5] Dong bo Prisma Database Schema...
cd doan-kltn-backend
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate >nul 2>&1
cd ..

:: 6. Tu dong dong bo dia chi IP Wi-Fi cho Mobile Expo
echo [4/5] Dong bo IP Wi-Fi may tinh vao Mobile App...
node scripts\update-ip.js >nul 2>&1

:: 7. Mo cua so doc lap cho Expo Metro (hien thi QR Code)
echo [5/5] Khoi dong cac dich vu he thong...
start "FixGo Mobile - Expo Metro (QR Code)" cmd /k "cd doan-kltn-mobile && npx expo start -c"

echo.
echo ================================================================
echo  HE THONG DANG CHAY THANH CONG:
echo   - Backend API:    http://localhost:3000/api
echo   - AI Service:     http://localhost:8000/docs
echo   - Web Admin:      http://localhost:5173
echo   - Mobile App:     Quet ma QR tren cua so Expo Metro vua mo
echo.
echo  * Nhan [Ctrl + C] de dung cac dich vu tai day.
echo  * Chay stop.bat neu muon tat sach toan bo tien trinh.
echo ================================================================
echo.

:: Cua so chinh quan ly Backend, AI va Web Admin
npx --yes concurrently -k -n "BACKEND,AI,WEB" -c "blue,magenta,cyan" ^
  "cd doan-kltn-backend && npm run dev" ^
  "cd ai-service && .venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload" ^
  "cd doan-kttn-frontend && npm run dev"
