@echo off
title CRM Sellos - Iniciando...
color 0A

echo ============================================
echo      CRM SELLOS - Sistema de Fotopolimeros
echo ============================================
echo.
echo Iniciando el sistema...
echo.

:: Obtener la carpeta donde esta este script
set "BASE=%~dp0"

:: Iniciar Backend en nueva ventana
echo [1/2] Iniciando Backend (puerto 5000)...
start "CRM - Backend" cmd /k "cd /d "%BASE%backend" && echo Backend CRM - Puerto 5000 && echo. && node server.js"

:: Esperar 3 segundos para que el backend levante
timeout /t 3 /nobreak >nul

:: Iniciar Frontend en nueva ventana
echo [2/2] Iniciando Frontend (puerto 3000)...
start "CRM - Frontend" cmd /k "cd /d "%BASE%frontend" && echo Frontend CRM - Puerto 3000 && echo. && npm start"

echo.
echo ============================================
echo  El sistema se esta iniciando...
echo  - Backend:  http://localhost:5000
echo  - Frontend: http://localhost:3000
echo.
echo  El navegador se abrira automaticamente.
echo  (Puede tardar 30-60 segundos la primera vez)
echo ============================================
echo.
pause
