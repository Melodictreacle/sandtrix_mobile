@echo off
setlocal
title Sandtrix Mobile Server
cd /d "%~dp0"

echo ========================================================
echo          SANDTRIX MOBILE - LOCAL DEV SERVER
echo ========================================================
echo.

set "PY_EXE="

if exist "C:\msys64\ucrt64\bin\python.exe" (
    set "PY_EXE=C:\msys64\ucrt64\bin\python.exe"
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 set "PY_EXE=python"
)

if not "%PY_EXE%"=="" (
    "%PY_EXE%" serve.py
) else (
    echo [INFO] Python not found, launching PowerShell HTTP server on port 8080...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "& { $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://*:8080/'); $listener.Start(); Write-Host 'Listening on http://localhost:8080 ...'; while ($listener.IsListening) { $context = $listener.GetContext(); $req = $context.Request; $res = $context.Response; $path = '.' + $req.RawUrl.Split('?')[0]; if ($path -eq './') { $path = './index.html' }; if (Test-Path $path) { $bytes = [System.IO.File]::ReadAllBytes($path); $res.ContentLength64 = $bytes.Length; $res.OutputStream.Write($bytes, 0, $bytes.Length) } else { $res.StatusCode = 404 }; $res.OutputStream.Close() } }"
)

pause
