@echo off
setlocal enabledelayedexpansion
title FixGo Pro - Unified Development Environment

echo ================================================================
echo           FIXGO PRO - UNIFIED DEV STARTER (CLEAN MODE)
echo ================================================================
echo.

:: 1. Tao thu muc chua log neu chua co
if not exist "%~dp0logs" mkdir "%~dp0logs"

:: 2. Kiem tra Docker Desktop
echo [1/4] Kiem tra Docker Desktop...
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Docker Desktop chua duoc bat! Vui long bat Docker truoc.
    pause
    exit /b 1
)

:: 3. Khoi chay Docker Database va Cache
echo [2/4] Khoi dong Postgres va Redis qua Docker...
docker compose up -d >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Khong the khoi dong Docker containers.
    pause
    exit /b 1
)

:: 4. Chuan bi Database va AI Environment
echo [3/4] Chuan bi moi truong AI va dong bo Database...
if not exist "%~dp0ai-service\.venv\Scripts\python.exe" (
    echo  - Dang tao virtualenv cho AI...
    py -3 -m venv "%~dp0ai-service\.venv"
    call "%~dp0ai-service\.venv\Scripts\pip" install -r "%~dp0ai-service\requirements.txt" >nul 2>&1
)

cd /d "%~dp0doan-kltn-backend"
call npx prisma generate >nul 2>&1
call npx prisma db push --skip-generate >nul 2>&1

:: 5. Khoi chay va dieu huong log vao thu muc logs/
echo [4/4] Khoi dong toan bo cac dich vu...
cd /d "%~dp0"

echo.
echo ================================================================
echo  HE THONG DANG HOAT DONG (Logs duoc ghi ngam vao thu muc /logs):
echo   - Backend API:    http://localhost:3000/api
echo   - Swagger Docs:   http://localhost:3000/api/docs
echo   - AI Service:     http://localhost:8000/docs
echo   - Frontend Web:   http://localhost:5173
echo   - Mobile App:     http://localhost:8081
echo.
echo  FILE LOG DEBUG (Xem truc tiep trong IDE):
echo   - Backend log:    logs\backend.log
echo   - AI Service log: logs\ai.log
echo   - Web Admin log:  logs\web.log
echo   - Mobile log:     logs\mobile.log
echo ================================================================
echo.
echo Nhan [Ctrl + C] de dung toan bo he thong.
echo.

npx --yes concurrently -k --names "BACKEND,AI,WEB,MOBILE" -c "blue.bold,magenta.bold,cyan.bold,yellow.bold" ^
  "cd doan-kltn-backend && npm run dev > ..\logs\backend.log 2>&1" ^
  "cd ai-service && .venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ..\logs\ai.log 2>&1" ^
  "cd doan-kttn-frontend && npm run dev > ..\logs\web.log 2>&1" ^
  "cd doan-kltn-mobile && npm start > ..\logs\mobile.log 2>&1"
  