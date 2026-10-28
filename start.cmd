@echo off
rem Dwuklik: uruchamia serwer i otwiera strone w przegladarce. Zamknij to okno, zeby wylaczyc.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1" -Open
pause
