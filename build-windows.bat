@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "APP_VERSION=1.0.1"
title VDBH Terrein Viewer %APP_VERSION% - Windows installer bouwen

echo ==================================================
echo   VDBH Terrein Viewer %APP_VERSION% - Windows installer bouwen
echo ==================================================
echo.

where node >nul 2>nul
if not errorlevel 1 goto node_ready

echo Node.js is niet gevonden. Automatische installatie wordt gestart...
where winget >nul 2>nul
if errorlevel 1 goto no_winget
call winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements
if errorlevel 1 goto install_failed
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%LocalAppData%\Programs\nodejs\node.exe" set "PATH=%LocalAppData%\Programs\nodejs;%PATH%"
where node >nul 2>nul
if errorlevel 1 goto restart_needed

:node_ready
where npm >nul 2>nul
if errorlevel 1 goto npm_missing
echo Node.js:
node -v
echo.

set "npm_config_fetch_retries=5"
set "npm_config_fetch_retry_mintimeout=20000"
set "npm_config_fetch_retry_maxtimeout=120000"
set "npm_config_fetch_timeout=600000"

echo Changelog controleren...
node -e "const p=require('./package.json');const c=require('./changelog.json');if(!c.entries.some(e=>e.version===p.version)){console.error('Changelog ontbreekt voor versie '+p.version);process.exit(1)}"
if errorlevel 1 goto build_error

echo Bouwonderdelen installeren...
call npm install --no-audit --no-fund
if errorlevel 1 goto build_error

set "ATTEMPT=1"
:build_retry
echo.
echo Windows-installer bouwen - poging %ATTEMPT% van 3...
call npm run dist:win -- --publish never
if not errorlevel 1 goto success
if "%ATTEMPT%"=="3" goto build_error
echo.
echo De build is mislukt, mogelijk door een tijdelijke download-time-out.
echo Wacht 20 seconden; daarna wordt opnieuw geprobeerd...
timeout /t 20 /nobreak >nul
set /a ATTEMPT+=1
goto build_retry

:success
echo.
echo ==================================================
echo KLAAR! De installer en updatebestanden staan in:
echo %CD%\dist
echo.
echo Upload straks de Setup.exe, latest.yml EN het .blockmap-bestand naar de GitHub-release.
echo Upload ook het .blockmap-bestand als dat is aangemaakt.
echo ==================================================
start "" "%CD%\dist"
pause
exit /b 0

:no_winget
echo winget ontbreekt. Installeer Node.js LTS via https://nodejs.org/.
goto failed
:install_failed
echo Automatische Node.js-installatie is mislukt.
goto failed
:restart_needed
echo Node.js is geinstalleerd. Sluit dit venster en start build-windows.bat opnieuw.
goto failed
:npm_missing
echo npm is niet gevonden. Herstart Windows of installeer Node.js LTS opnieuw.
goto failed
:build_error
echo.
echo Het bouwen is mislukt. Controleer de internetverbinding en probeer later opnieuw.
echo Sluit andere npm- of Electron-buildvensters. Bij HTTP 504 probeert het script automatisch opnieuw.
:failed
pause
exit /b 1
