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

"%PYTHON%" "%BACKEND%\configurar_ia_rukan.py"
if errorlevel 1 (
  echo.
  echo La plataforma necesita una clave de OpenAI para la lectura automatica de Rukan.
  echo Puedes configurarla con "Configurar IA Rukan.bat".
  pause
  exit /b 1
)

"%PYTHON%" -c "import django, rest_framework, corsheaders, pandas, openpyxl, dotenv, pypdf, PIL" >nul 2>nul
if errorlevel 1 (
  echo Preparando la plataforma por primera vez...
  "%PYTHON%" -m pip install --disable-pip-version-check -r "%BACKEND%\requirements.txt"
  if errorlevel 1 (
    echo No se pudieron instalar las dependencias de la plataforma.
    pause
    exit /b 1
  )
)

start "Consulta Habitacional API IA" cmd /k "cd /d ""%BACKEND%"" && set USE_SQLITE=1 && "".venv\Scripts\python.exe"" manage.py migrate && "".venv\Scripts\python.exe"" manage.py runserver 127.0.0.1:8000"
"%PYTHON%" "%BACKEND%\esperar_api.py" --segundos 35
if errorlevel 1 (
  echo.
  echo La web no se abrira porque la API local no pudo iniciar.
  echo Revisa la ventana "Consulta Habitacional API IA" para ver el motivo.
  pause
  exit /b 1
)

start "" "%ROOT%docs\index.html"
