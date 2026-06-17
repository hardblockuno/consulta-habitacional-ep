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
  if %errorlevel%==0 (
    py -m venv "%BACKEND%\.venv"
  ) else (
    python -m venv "%BACKEND%\.venv"
  )
)

"%PYTHON%" -m pip install -r "%BACKEND%\requirements.txt"

start "Consulta Habitacional API IA" cmd /k "cd /d ""%BACKEND%"" && set USE_SQLITE=1 && "".venv\Scripts\python.exe"" manage.py migrate && "".venv\Scripts\python.exe"" manage.py runserver 127.0.0.1:8000"
timeout /t 3 >nul
start "" "%ROOT%docs\index.html"
