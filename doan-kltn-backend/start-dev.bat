@echo off
title FixGo Pro - Backend Dev Starter

echo ==============================================
echo KHOI DONG HE THONG BACKEND (LOW RAM MODE)
echo ==============================================
echo.

echo 1. Kiem tra va bat Docker Database...
docker compose up -d

echo 2. Cho Database on dinh (3 giay)...
timeout /t 3 /nobreak >nul

echo 3. Dong bo Schema...
call npx prisma db push

echo 4. Kiem tra va Tao Super Admin...
call node prisma/seed.js

echo 5. Khoi dong NestJS Server...
call npm run dev