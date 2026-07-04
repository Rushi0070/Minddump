@echo off
REM ============================================================
REM  sololeveling — start the local studio + preview server.
REM  Double-click this file whenever you want to write.
REM  A terminal window opens and STAYS open running the server.
REM  To stop the server: close that window (or press Ctrl+C).
REM  This runs on its own, so closing Cursor won't kill it.
REM ============================================================
cd /d "%~dp0"

REM Open the studio in your browser after a short head start.
start "" cmd /c "timeout /t 4 >nul & start "" http://localhost:3000/studio"

echo Starting sololeveling dev server...
echo Studio:  http://localhost:3000/studio
echo Blog:    http://localhost:3000/blog
echo (Close this window to stop.)
echo.
call npm run dev
pause
