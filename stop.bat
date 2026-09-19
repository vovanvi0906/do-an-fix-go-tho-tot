@echo off
title FixGo Pro - Stop Development Environment

echo ================================================================
echo          FIXGO PRO - DUNG TOAN BO HE THONG DEV
echo ================================================================
echo.

echo [1/2] Dang tat Docker Database & Redis...
docker compose down

echo [2/2] Dang giai phong cac tien trinh Node/Python local...
:: Tim va tat cac process chiem cong 3000 & 8000 neu can
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ================================================================
echo  Toan bo he thong da dung va giai phong RAM thanh cong!
echo ================================================================
pause
