@echo off
setlocal
cd /d "%~dp0"
py -3 -c "import sys; sys.exit(sys.version_info < (3, 7))" >nul 2>&1
if not errorlevel 1 (
  py -3 start-local.py %*
  goto finished
)
python -c "import sys; sys.exit(sys.version_info < (3, 7))" >nul 2>&1
if not errorlevel 1 (
  python start-local.py %*
  goto finished
)
echo Python 3 is required for this local launcher.
echo Install Python 3 from https://www.python.org/downloads/ then run this file again.
pause
exit /b 1
:finished
if errorlevel 1 (
  pause
  exit /b 1
)
exit /b 0
