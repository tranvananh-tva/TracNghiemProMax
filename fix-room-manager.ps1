# Script để sửa tất cả window.quizManager.showToast thành this.showToast
$filePath = "e:\Trắc Nghiệm Pro\room-manager.js"
$content = Get-Content $filePath -Raw

# Thay thế tất cả window.quizManager.showToast thành this.showToast
# NGOẠI TRỪ dòng kiểm tra if (window.quizManager && window.quizManager.showToast)
$lines = $content -split "`n"
$newLines = @()

foreach ($line in $lines) {
    # Giữ nguyên dòng kiểm tra
    if ($line -match "if \(window\.quizManager && window\.quizManager\.showToast\)") {
        $newLines += $line
    }
    # Giữ nguyên dòng return trong showToast method
    elseif ($line -match "window\.quizManager\.showToast\(message, type\);") {
        $newLines += $line
    }
    # Thay thế các dòng khác
    else {
        $newLine = $line -replace "window\.quizManager\.showToast", "this.showToast"
        $newLines += $newLine
    }
}

$newContent = $newLines -join "`n"
Set-Content $filePath $newContent -NoNewline

Write-Host "✅ Đã sửa xong file room-manager.js"
