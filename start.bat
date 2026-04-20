@echo off
echo.
echo ========================================
echo   TG Broadcast Panel - Local Baslatici
echo ========================================
echo.

docker compose -f docker-compose.local.yml up --build

pause
