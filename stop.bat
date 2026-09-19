@echo off
title FixGo Pro - Stop All Services
echo ================================================================
echo           DANG DUNG TOAN BO HE THONG FIXGO PRO...
echo ================================================================
echo.
echo [1/2] Dang giai phong cac tien trinh Node.js va Python...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM uvicorn.exe >nul 2>&1

echo [2/2] Dang dung Docker Postgres va Redis...
docker compose down >nul 2>&1

echo.
echo [OK] Toan bo he thong da duoc tat va giai phong tai nguyen sach se!
timeout /t 2 >nul
