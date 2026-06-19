@echo off
setlocal
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "PYTHON=%BACKEND%\.venv\Scripts\python.exe"

if not exist "%BACKEND%\.env" (
  copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
)

if not exist "%PYTHON%" (
  where py >nul 2>nul
  if errorlevel 1 (
    python -m venv "%BACKEND%\.venv"
  ) else (
    py -m venv "%BACKEND%\.venv"
  )
)

if not exist "%PYTHON%" (
  echo No se pudo crear el entorno de Python. Instala Python y vuelve a intentar.
  pause
  exit /b 1
)

"%PYTHON%" "%BACKEND%\configurar_ia_rukan.py" --forzar
if errorlevel 1 (
  echo.
  echo No se realizaron cambios en la configuracion de IA.
) else (
  echo.
  echo Configuracion guardada. Puedes abrir la plataforma normalmente.
)
pause
