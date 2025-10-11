@echo off
chcp 65001 >nul
echo ============================================
echo   SỬA LỖI PHÒNG THI - THIẾT BỊ KHÁC
echo ============================================
echo.

echo [1/4] Đang backup file cũ...
if exist room-manager.js (
    copy /Y room-manager.js room-manager.backup.js >nul
    echo ✅ Đã backup room-manager.js
) else (
    echo ⚠️  Không tìm thấy room-manager.js
)

if exist script-modern.js (
    copy /Y script-modern.js script-modern.backup.js >nul
    echo ✅ Đã backup script-modern.js
) else (
    echo ⚠️  Không tìm thấy script-modern.js
)

echo.
echo [2/4] Đang áp dụng fix...

if exist room-manager-fixed.js (
    copy /Y room-manager-fixed.js room-manager.js >nul
    echo ✅ Đã cập nhật room-manager.js
) else (
    echo ❌ Không tìm thấy room-manager-fixed.js
    goto :error
)

if exist script-modern-fixed.js (
    copy /Y script-modern-fixed.js script-modern.js >nul
    echo ✅ Đã cập nhật script-modern.js
) else (
    echo ❌ Không tìm thấy script-modern-fixed.js
    goto :error
)

echo.
echo [3/4] Kiểm tra file...
if exist room-manager.js (
    echo ✅ room-manager.js OK
) else (
    echo ❌ room-manager.js MISSING
    goto :error
)

if exist script-modern.js (
    echo ✅ script-modern.js OK
) else (
    echo ❌ script-modern.js MISSING
    goto :error
)

echo.
echo [4/4] Hoàn tất!
echo.
echo ============================================
echo   ✅ ÁP DỤNG FIX THÀNH CÔNG!
echo ============================================
echo.
echo 📋 Các file đã được cập nhật:
echo    - room-manager.js (backup: room-manager.backup.js)
echo    - script-modern.js (backup: script-modern.backup.js)
echo.
echo 🔍 BƯỚC TIẾP THEO:
echo    1. Mở trình duyệt và reload trang (Ctrl + Shift + R)
echo    2. Mở Console (F12) để kiểm tra log
echo    3. Test tạo phòng và join từ thiết bị khác
echo.
echo 📖 Xem hướng dẫn chi tiết: HUONG_DAN_SUA_LOI_PHONG_THI.md
echo.
echo 🔄 Để rollback về phiên bản cũ, chạy: ROLLBACK_FIX_PHONG_THI.bat
echo.
pause
exit /b 0

:error
echo.
echo ============================================
echo   ❌ LỖI KHI ÁP DỤNG FIX
echo ============================================
echo.
echo Vui lòng kiểm tra:
echo    - File room-manager-fixed.js có tồn tại không?
echo    - File script-modern-fixed.js có tồn tại không?
echo.
pause
exit /b 1
