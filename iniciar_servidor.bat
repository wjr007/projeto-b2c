@echo off
title Servidor 3D - Copo Personalizado Cargill
cd /d "%~dp0"

echo ========================================================
echo  Iniciando Servidor 3D (Copo Personalizado Cargill)
echo ========================================================

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Iniciando via Node.js...
    node server.js
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Iniciando via Python...
    python -m http.server 8080
    goto end
)

echo Iniciando via PowerShell...
powershell -ExecutionPolicy Bypass -File server.ps1

:end
pause
