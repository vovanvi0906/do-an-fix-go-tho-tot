#!/usr/bin/env bash

echo "================================================================"
echo "          DANG DUNG TOAN BO HE THONG FIXGO PRO..."
echo "================================================================"
echo ""

echo "[1/2] Giai phong cac tien trinh Node.js va Python/Uvicorn..."
pkill -f "concurrently" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "[2/2] Dang dung Docker Postgres va Redis..."
docker compose down > /dev/null 2>&1 || true

echo ""
echo "[OK] Toan bo he thong da duoc tat va giai phong tai nguyen sach se!"

