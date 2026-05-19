@echo off
setlocal
cd /d "%~dp0"

call :find_git
if not defined GIT_EXE (
  echo No se encontro Git. Instala Git o revisa el PATH.
  pause
  exit /b 1
)

echo Estado actual:
"%GIT_EXE%" status --short
echo.

set /p COMMIT_MSG=Escribe el mensaje del commit: 
if "%COMMIT_MSG%"=="" (
  echo.
  echo No se hizo commit porque el mensaje estaba vacio.
  pause
  exit /b 1
)

echo.
echo Agregando cambios...
"%GIT_EXE%" add .
if errorlevel 1 (
  echo No se pudieron agregar los cambios.
  pause
  exit /b 1
)

"%GIT_EXE%" diff --cached --quiet
if not errorlevel 1 (
  echo.
  echo No hay cambios para guardar.
  pause
  exit /b 0
)

echo.
echo Creando commit...
"%GIT_EXE%" commit -m "%COMMIT_MSG%"
if errorlevel 1 (
  echo.
  echo No se pudo crear el commit.
  pause
  exit /b 1
)

echo.
echo Subiendo cambios a GitHub...
"%GIT_EXE%" push
if errorlevel 1 (
  echo.
  echo El commit quedo creado localmente, pero no se pudo hacer push.
  echo Cuando se resuelva el problema, ejecuta: git push
  pause
  exit /b 1
)

echo.
echo Listo. Cambios guardados y subidos.
pause
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
