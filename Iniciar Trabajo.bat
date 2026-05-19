@echo off
setlocal
cd /d "%~dp0"

call :find_git
if not defined GIT_EXE (
  echo No se encontro Git. Instala Git o revisa el PATH.
  pause
  exit /b 1
)

echo Sincronizando cambios desde GitHub...
"%GIT_EXE%" pull
if errorlevel 1 (
  echo.
  echo No se pudo completar git pull. Revisa si hay cambios locales pendientes o problemas de conexion.
  pause
  exit /b 1
)

echo.
echo Abriendo Consulta Habitacional...
start "" "%~dp0docs\index.html"
timeout /t 3 /nobreak >nul
exit /b 0

:find_git
where git >nul 2>nul
if not errorlevel 1 (
  set "GIT_EXE=git"
  exit /b 0
)

if exist "C:\Program Files\Git\cmd\git.exe" (
  set "GIT_EXE=C:\Program Files\Git\cmd\git.exe"
  exit /b 0
)

exit /b 1
