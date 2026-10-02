@echo off
setlocal
title SIGEP - Servidor Local (Backend 8000 + Frontend 5173)
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "PYTHON=%BACKEND%\.venv\Scripts\python.exe"
set "PYTHONW=%BACKEND%\.venv\Scripts\pythonw.exe"

echo =================================================================
echo   INICIANDO SERVICIOS LOCALES DE SIGEP
echo =================================================================

if not exist "%BACKEND%\.env" (
  copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
)

if not exist "%FRONTEND%\.env" (
  if exist "%FRONTEND%\.env.example" (
    copy "%FRONTEND%\.env.example" "%FRONTEND%\.env" >nul
  )
)

if not exist "%PYTHON%" (
  echo Preparando entorno Python backend...
  where py >nul 2>nul
  if errorlevel 1 (
    python -m venv "%BACKEND%\.venv"
  ) else (
    py -m venv "%BACKEND%\.venv"
  )
)

if not exist "%PYTHON%" (
  echo Error: Python no encontrado. Instala Python para continuar.
  pause
  exit /b 1
)

echo [1/3] Comprobando Backend Django (127.0.0.1:8000)...
"%PYTHON%" "%BACKEND%\esperar_api.py" --segundos 2 >nul 2>nul
if errorlevel 1 (
  echo   - Deteniendo instancias colgadas previas...
  "%PYTHON%" "%BACKEND%\detener_api_anterior.py" >nul 2>nul
  if not exist "%PYTHONW%" set "PYTHONW=%PYTHON%"
  echo   - Iniciando backend en segundo plano...
  start "SIGEP Backend" "%PYTHONW%" "%BACKEND%\iniciar_api.py"
  "%PYTHON%" "%BACKEND%\esperar_api.py" --segundos 25
  if errorlevel 1 (
    echo   [ERROR] No se pudo levantar el backend Django.
    echo   Revisa el registro en %%LOCALAPPDATA%%\ConsultaHabitacionalEP\api.log
    pause
    exit /b 1
  )
)
echo   [OK] Backend Django activo en http://127.0.0.1:8000/api/

echo [2/3] Comprobando Frontend React (Vite)...
if not exist "%FRONTEND%\node_modules" (
  echo   - Instalando paquetes npm en frontend...
  pushd "%FRONTEND%"
  call npm install
  popd
)

echo [3/3] Iniciando servidor de desarrollo Vite (puerto 5173)...
echo.
echo =================================================================
echo   SERVICIOS OPERACIONALES:
echo   - Backend API: http://127.0.0.1:8000/api/
echo   - Frontend:    http://localhost:5173/
echo =================================================================
echo.

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" (
  start "" "%EDGE%" "http://localhost:5173"
) else (
  start "" "http://localhost:5173"
)

pushd "%FRONTEND%"
call npm run dev
popd

pause
