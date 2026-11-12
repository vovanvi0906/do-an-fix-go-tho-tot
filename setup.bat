@echo off
setlocal enabledelayedexpansion
title FixGo Pro - Full Setup (Install Dependencies)

cd /d "%~dp0"

echo ================================================================
echo           FIXGO PRO - CAI DAT HE THONG & THU VIEN
echo ================================================================
echo.

:: 1. Kiem tra file .env mau va copy neu chua co
echo [1/6] Khoi tao cac file cau hinh .env...
if not exist "server\.env" (
    if exist "server\.env.example" (
        copy "server\.env.example" "server\.env" >nul
        echo       [OK] Da tao server/.env
    )
) else (
    echo       [OK] server/.env da ton tai.
)

if not exist "client\.env.local" (
    if exist "client\.env.example" (
        copy "client\.env.example" "client\.env.local" >nul
        echo       [OK] Da tao client/.env.local
    )
) else (
    echo       [OK] client/.env.local da ton tai.
)

if not exist "customer-app\.env" (
    if exist "customer-app\.env.example" (
        copy "customer-app\.env.example" "customer-app\.env" >nul
        echo       [OK] Da tao customer-app/.env
    )
) else (
    echo       [OK] customer-app/.env da ton tai.
)

:: 2. Cai dat thu vien Backend
echo.
echo [2/6] Dang cai dat dependencies cho Backend (NestJS)...
cd server
call npm install
cd ..

:: 3. Cai dat thu vien Web Admin
echo.
echo [3/6] Dang cai dat dependencies cho Frontend (React/Vite)...
cd client
call npm install
cd ..

:: 4. Cai dat thu vien Mobile App
echo.
echo [4/6] Dang cai dat dependencies cho Mobile (Expo)...
cd customer-app
call npm install
cd ..

:: 5. Tao virtualenv va cai dat thu vien Python cho AI Service
echo.
echo [5/6] Dang chuan bi virtualenv va thu vien Python cho AI Service...
if not exist "ai-service\.venv" (
    where py >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        py -3 -m venv ai-service\.venv
    ) else (
        python -m venv ai-service\.venv
    )
)

call ai-service\.venv\Scripts\python.exe -m pip install --upgrade pip >nul 2>&1
call ai-service\.venv\Scripts\pip install -r ai-service\requirements.txt

if exist "ai-service\scripts\download_models.py" (
    echo       Dang tai Model Weights (YOLOv8)...
    call ai-service\.venv\Scripts\python.exe ai-service\scripts\download_models.py
)

:: 6. Khoi dong Docker va chay Prisma db push
echo.
echo [6/6] Khoi dong Docker va dong bo Prisma Database...
where docker >nul 2>&1
if %ERRORLEVEL% equ 0 (
    docker compose up -d postgres redis
    echo       Dang cho Database khoi dong san sang (5 giay)...
    timeout /t 5 /nobreak >nul
    cd server
    call npx prisma generate
    call npx prisma db push --skip-generate
    cd ..
) else (
    echo       [CANH BAO] Khong tim thay Docker trong PATH. Vui long bat Docker Desktop truoc khi chay backend.
)

:: Cap nhat IP cho Mobile
if exist "scripts\update-ip.js" (
    node scripts\update-ip.js
)

echo.
echo ================================================================
echo  [HOAN TAT] DA CAI DAT XONG TOAN BO DANG DU LIEU VA THU VIEN!
echo  Ban co the chay dev-local.bat de khoi dong toan bo he thong.
echo ================================================================
pause

