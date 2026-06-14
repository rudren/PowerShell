@echo off
echo ============================================
echo   Masai United FC - Auto Fix and Start
echo ============================================
echo.

cd /d "%~dp0"

:: Fix PowerShell execution policy
echo [1/3] Fixing PowerShell execution policy...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"
echo Done.

:: Clear Expo cache
echo [2/3] Clearing Expo cache...
if exist "%APPDATA%\Expo" rmdir /s /q "%APPDATA%\Expo" 2>nul
if exist ".expo" rmdir /s /q ".expo" 2>nul
echo Done.

:: Start Expo
echo [3/3] Starting Expo...
echo.
npx expo start --clear

pause
