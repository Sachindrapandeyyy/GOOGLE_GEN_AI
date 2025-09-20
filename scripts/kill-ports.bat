@echo off
REM Sukoon AI - Kill processes on development ports (Windows)
REM This script helps clean up any processes that might be using the development ports

echo 🧹 Cleaning up development ports...

REM Function to kill process on a specific port
goto :main

:kill_port
    setlocal
    set port=%1
    set name=%2

    REM Find process using the port
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%port% " ^| findstr "LISTENING"') do (
        set pid=%%a
        goto :found_pid
    )

    echo ✅ Port %port% (%name%) is free
    goto :eof

    :found_pid
    echo 🔪 Killing process on port %port% (%name%): PID %pid%
    taskkill /PID %pid% /F >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Could not kill process PID %pid%
    )
    goto :eof

:main
REM Kill processes on all development ports
call :kill_port 8081 "Diary Service"
call :kill_port 8082 "Chat Service"
call :kill_port 8083 "Mood Service"
call :kill_port 8084 "Triage Service"
call :kill_port 8085 "Insights Service"
call :kill_port 8086 "Notifications Service"
call :kill_port 8080 "BFF Service"
call :kill_port 3000 "Frontend"
call :kill_port 9091 "Firestore Emulator"
call :kill_port 9092 "Pub/Sub Emulator"

REM Wait a moment for processes to die
timeout /t 2 /nobreak >nul

echo.
echo ✅ Port cleanup completed!
echo.
echo 💡 You can now start the development environment safely.
pause
