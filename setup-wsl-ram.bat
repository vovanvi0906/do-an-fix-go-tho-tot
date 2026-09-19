@echo off
title FixGo Pro - Configure WSL2 RAM Cap

echo ================================================================
echo      CAU HINH KHOA TRAN RAM WSL2 / DOCKER DESKTOP (2GB)
echo ================================================================
echo.

set WSL_CONFIG=%USERPROFILE%\.wslconfig

echo Dang ghi cau hinh vao: %WSL_CONFIG% ...
(
echo [wsl2]
echo memory=2GB
echo processors=2
echo swap=1GB
echo autoMemoryReclaim=gradual
) > "%WSL_CONFIG%"

echo.
echo [OK] Da tao file .wslconfig thanh cong!
echo Dang khoi dong lai WSL2 de ap dung cau hinh...
wsl --shutdown >nul 2>&1

echo.
echo ================================================================
echo  DA KHOA TRAN RAM WSL2 VE 2GB THANH CONG!
echo  Hay khoi dong lai Docker Desktop neu Docker dang chay.
echo ================================================================
pause
