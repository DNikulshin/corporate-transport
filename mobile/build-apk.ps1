# Сборка Android APK для Windows PowerShell

Write-Host "🔨 Сборка Android APK..." -ForegroundColor Cyan
Write-Host ""

# Переходим в директорию android
Set-Location -Path "android"

# Очищаем предыдущую сборку
Write-Host "🧹 Очистка..." -ForegroundColor Yellow
& .\gradlew clean

# Собираем debug APK
Write-Host "📦 Сборка debug APK..." -ForegroundColor Green
& .\gradlew assembleDebug

# Проверяем успех
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Сборка завершена успешно!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 APK файл:" -ForegroundColor Cyan
    Write-Host "   app\build\outputs\apk\debug\app-debug.apk"
    Write-Host ""
    Write-Host "📱 Для установки на устройство:" -ForegroundColor Cyan
    Write-Host "   adb install app\build\outputs\apk\debug\app-debug.apk"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Ошибка сборки!" -ForegroundColor Red
    exit 1
}
