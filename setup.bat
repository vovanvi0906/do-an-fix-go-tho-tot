@echo off
setlocal enabledelayedexpansion
title FixGo Pro - Initial Setup & Dependencies Installer

echo ================================================================
echo           FIXGO PRO - CAI DAT DU AN CHO MAY MOI
echo ================================================================
echo.

:: 1. Tao thu muc logs
if not exist "logs" mkdir "logs"

:: 2. Kiem tra cac cong cu can thiet tren may
echo [1/6] Kiem tra moi truong he thong (Node.js, Python, Docker)...

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Chua cai dat Node.js tren may! Vui long cai dat Node.js LTS truoc.
    pause
    exit /b 1
)

where py >nul 2>&1
if %ERRORLEVEL% neq 0 (
    where python >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Chua cai dat Python! Vui long cai dat Python 3.10+ va tick 'Add to PATH'.
        pause
        exit /b 1
    )
)

where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Chua tim thay Docker CLI. Hay dam bao da cai Docker Desktop de chay database.
)

:: 3. Cai dat Backend (NestJS + Prisma)
echo.
echo [2/6] Cai dat Dependencies cho Backend (doan-kltn-backend)...
cd doan-kltn-backend

if not exist ".env" (
    if exist ".env.example" (
        echo  - Tao file .env tu .env.example...
        copy .env.example .env >nul
    )
)

echo  - Chay npm install...
call npm install

echo  - Khoi tao Prisma Client...
call npx prisma generate
cd ..

:: 4. Cai dat AI Service (Python Virtual Environment)
echo.
echo [3/6] Cai dat moi truong va thu vien cho AI Service (ai-service)...
cd ai-service

if not exist ".venv\Scripts\python.exe" (
    echo  - Dang tao virtualenv .venv...
    where py >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        py -3 -m venv .venv
    ) else (
        python -m venv .venv
    )
)

echo  - Nang cap pip va cai dat requirements.txt...
call .venv\Scripts\python -m pip install --upgrade pip >nul 2>&1
call .venv\Scripts\pip install -r requirements.txt
cd ..

:: 5. Cai dat Frontend Web (Vite + React)
echo.
echo [4/6] Cai dat Dependencies cho Web Admin (doan-kttn-frontend)...
cd doan-kttn-frontend
call npm install
cd ..

:: 6. Cai dat Mobile App (Expo / React Native)
echo.
echo [5/6] Cai dat Dependencies cho Mobile App (doan-kltn-mobile)...
cd doan-kltn-mobile
call npm install
cd ..

:: 7. Tai truoc cac Docker Image (PostGIS, Redis)
echo.
echo [6/6] Tai san cac Docker Image can thiet ve may...
docker compose pull

echo.
echo ================================================================
echo  CAI DAT HOAN TAT! DONG MAY MOI DA SAN SANG SU DUNG.
echo ================================================================
echo  De khoi chay toan bo he thong, chi can chay lenh:
echo     dev.bat (tren CMD) hoac .\dev.bat (tren PowerShell)
echo ================================================================
echo.
pause