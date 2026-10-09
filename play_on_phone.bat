@echo off
setlocal
title Sandtrix Mobile - Trusted HTTPS
cd /d "%~dp0"

set "PY_EXE="
if exist "C:\msys64\ucrt64\bin\python.exe" (
    set "PY_EXE=C:\msys64\ucrt64\bin\python.exe"
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 set "PY_EXE=python"
)

if "%PY_EXE%"=="" (
    echo [ERROR] Python not found.
    pause
    exit /b 1
)

"%PY_EXE%" start_tunnel.py
pause
