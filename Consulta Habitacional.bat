@echo off
setlocal
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "PYTHON=%BACKEND%\.venv\Scripts\python.exe"
set "PYTHONW=%BACKEND%\.venv\Scripts\pythonw.exe"

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
  echo No se pudo preparar Python. Instala Python y vuelve a abrir este archivo.
  pause
  exit /b 1
)

"%PYTHON%" "%BACKEND%\configurar_ia_rukan.py"
if errorlevel 1 (
  echo La configuracion de IA quedo pendiente. Vuelve a abrir este archivo para continuar.
  pause
  exit /b 1
)

"%PYTHON%" -c "import django, rest_framework, corsheaders, pandas, openpyxl, dotenv, pypdf, PIL" >nul 2>nul
if errorlevel 1 (
  echo Preparando la plataforma por primera vez...
  "%PYTHON%" -m pip install --disable-pip-version-check -r "%BACKEND%\requirements.txt"
  if errorlevel 1 (
    echo No se pudieron preparar las dependencias de la plataforma.
    pause
    exit /b 1
  )
)

where ollama >nul 2>nul
if errorlevel 1 (
  echo.
  echo Para usar la IA local gratuita se requiere instalar Ollama una sola vez.
  echo Se abrira la descarga oficial. Instalalo y vuelve a abrir este archivo.
  start "" "https://ollama.com/download/windows"
  pause
  exit /b 1
)

ollama list | findstr /I /C:"qwen2.5vl:3b" >nul
if errorlevel 1 (
  echo.
  echo Descargando el modelo local gratuito. Esto ocurre una sola vez y puede tardar varios minutos.
  ollama pull qwen2.5vl:3b
  if errorlevel 1 (
    echo No se pudo descargar el modelo local. Verifica tu conexion y vuelve a abrir este archivo.
    pause
    exit /b 1
  )
)

"%PYTHON%" "%BACKEND%\esperar_api.py" --segundos 1 >nul 2>nul
if errorlevel 1 (
  if not exist "%PYTHONW%" set "PYTHONW=%PYTHON%"
  start "" "%PYTHONW%" "%BACKEND%\iniciar_api.py"
  "%PYTHON%" "%BACKEND%\esperar_api.py" --segundos 35
  if errorlevel 1 (
    echo No fue posible iniciar la plataforma. Vuelve a abrir este archivo.
    pause
    exit /b 1
  )
)

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE%" (
  start "" "%EDGE%" "%ROOT%docs\index.html"
) else (
  start "" "%ROOT%docs\index.html"
)

exit /b 0
