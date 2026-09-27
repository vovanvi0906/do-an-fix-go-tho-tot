@echo off
setlocal enabledelayedexpansion
title FixGo Pro - Native Dev Environment

if not exist "logs" mkdir "logs"

echo [1/3] Dong bo Prisma Database...
cd doan-kltn-backend
call npx prisma generate
call npx prisma db push --skip-generate
cd ..

echo [2/3] Dong bo IP Wi-Fi cho Mobile...
node scripts\update-ip.js

echo [3/3] Khoi chay cac ung dung...
start "FixGo Mobile - Expo Metro" cmd /k "cd doan-kltn-mobile && npx expo start -c"

npx --yes concurrently -k -n "BACKEND,AI,WEB" -c "blue,magenta,cyan" ^
  "cd doan-kltn-backend && npm run dev" ^
  "cd ai-service && .venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --port 8000 --reload" ^
  "cd doan-kttn-frontend && npm run dev"
