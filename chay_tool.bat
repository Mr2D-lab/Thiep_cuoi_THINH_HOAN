@echo off
title Cong Cu Chinh Thiep Cuoi 2026
chcp 65001 >nul
cd /d "%~dp0"
python tool_chinh_thiep.py
if %errorlevel% neq 0 (
    echo.
    echo Co loi xay ra khi khoi chay ung dung.
    echo Nhan mot phim bat ky de thoat...
    pause >nul
)
