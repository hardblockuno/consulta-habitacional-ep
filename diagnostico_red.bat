@echo off
setlocal
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "PYTHON=%BACKEND%\.venv\Scripts\python.exe"

if not exist "%PYTHON%" (
  where python >nul 2>nul
  if not errorlevel 1 set "PYTHON=python"
)

if not exist "%PYTHON%" (
  echo No se encontro Python en el entorno virtual ni en el sistema.
  pause
  exit /b 1
)

"%PYTHON%" "%BACKEND%\diagnostico_red.py"
echo.
pause
