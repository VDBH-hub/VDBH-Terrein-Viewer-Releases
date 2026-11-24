@echo off
setlocal EnableExtensions
title VDBH Terrein Viewer - opruimen

for %%I in ("%~dp0.") do set "FOLDER=%%~fI"
for %%I in ("%~dp0..") do set "PARENT=%%~fI"
for %%I in ("%FOLDER%") do set "FOLDERNAME=%%~nxI"
set "ZIP=%PARENT%\%FOLDERNAME%.zip"

 echo.
echo ================================================
echo   VDBH TERREIN VIEWER - TIJDELIJKE BESTANDEN WISSEN
echo ================================================
echo.
echo Dit verwijdert volledig:
echo   - Deze uitgepakte bouwmap:
echo     %FOLDER%
echo   - Het bijbehorende ZIP-bestand:
echo     %ZIP%
echo.
echo LET OP: bewaar of upload eerst de installer uit de map dist.
echo Deze opruimactie kan niet ongedaan worden gemaakt.
echo.
choice /C JN /N /M "Wil je doorgaan? [J/N] "
if errorlevel 2 goto cancelled

rem Start een apart proces zodat deze map ook zichzelf kan verwijderen.
set "CLEANUP_CMD=%TEMP%\vdbh_cleanup_%RANDOM%.cmd"
(
  echo @echo off
  echo timeout /t 2 /nobreak ^>nul
  echo cd /d "%%TEMP%%"
  echo if exist "%FOLDER%" rmdir /s /q "%FOLDER%"
  echo if exist "%ZIP%" del /f /q "%ZIP%"
  echo del /f /q "%%~f0"
) > "%CLEANUP_CMD%"
start "" /min cmd.exe /c ""%CLEANUP_CMD%""
echo.
echo Opruimen gestart. Dit venster wordt nu gesloten.
timeout /t 2 /nobreak >nul
exit /b 0

:cancelled
echo.
echo Niets verwijderd.
pause
exit /b 0
