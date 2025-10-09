@echo off
echo ========================================
echo    KHOI DONG SERVER CHIA SE QUIZ
echo ========================================
echo.

REM Kiem tra Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js chua duoc cai dat!
    echo Vui long tai va cai dat Node.js tu: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js da duoc cai dat
echo.

REM Kiem tra npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm khong tim thay!
    pause
    exit /b 1
)

echo [OK] npm da san sang
echo.

REM Kiem tra dependencies
if not exist "node_modules\" (
    echo [INFO] Dang cai dat dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Cai dat dependencies that bai!
        pause
        exit /b 1
    )
    echo [OK] Cai dat dependencies thanh cong
    echo.
)

REM Kiem tra file server.js
if not exist "server.js" (
    echo [ERROR] Khong tim thay file server.js!
    pause
    exit /b 1
)

echo [OK] File server.js ton tai
echo.

REM Kiem tra file shared-quizzes.json
if not exist "shared-quizzes.json" (
    echo [INFO] Tao file shared-quizzes.json...
    echo [] > shared-quizzes.json
    echo [OK] Da tao file shared-quizzes.json
    echo.
)

echo ========================================
echo    KHOI DONG SERVER...
echo ========================================
echo.
echo Server se chay tai: http://localhost:3000
echo API endpoint: http://localhost:3000/api/shared-quizzes
echo.
echo Nhan Ctrl+C de dung server
echo ========================================
echo.

REM Khoi dong server
node server.js

pause
