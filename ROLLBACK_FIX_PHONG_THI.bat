@echo off
chcp 65001 >nul
echo ============================================
echo   ROLLBACK FIX PHÒNG THI
echo ============================================
echo.

echo ⚠️  CẢNH BÁO: Bạn sắp khôi phục về phiên bản cũ!
echo.
set /p confirm="Bạn có chắc chắn muốn rollback? (Y/N): "

if /i not "%confirm%"=="Y" (
    echo.
    echo ❌ Đã hủy rollback
    pause
    exit /b 0
)

echo.
echo [1/2] Đang khôi phục file cũ...

if exist room-manager.backup.js (
    copy /Y room-manager.backup.js room-manager.js >nul
    echo ✅ Đã khôi phục room-manager.js
) else (
    echo ⚠️  Không tìm thấy backup của room-manager.js
)

if exist script-modern.backup.js (
    copy /Y script-modern.backup.js script-modern.js >nul
    echo ✅ Đã khôi phục script-modern.js
) else (
    echo ⚠️  Không tìm thấy backup của script-modern.js
)

echo.
echo [2/2] Hoàn tất!
echo.
echo ============================================
echo   ✅ ROLLBACK THÀNH CÔNG!
echo ============================================
echo.
echo 📋 Đã khôi phục về phiên bản cũ
echo.
echo 🔍 BƯỚC TIẾP THEO:
echo    1. Reload trang (Ctrl + Shift + R)
echo    2. Kiểm tra lại chức năng
echo.
pause
exit /b 0
