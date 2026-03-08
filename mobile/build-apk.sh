#!/bin/bash

echo "🔨 Сборка Android APK..."
echo ""

# Переходим в директорию android
cd android

# Очищаем предыдущую сборку
echo "🧹 Очистка..."
./gradlew clean

# Собираем debug APK
echo "📦 Сборка debug APK..."
./gradlew assembleDebug

# Проверяем успех
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Сборка завершена успешно!"
    echo ""
    echo "📍 APK файл:"
    echo "   app/build/outputs/apk/debug/app-debug.apk"
    echo ""
    echo "📱 Для установки на устройство:"
    echo "   adb install app/build/outputs/apk/debug/app-debug.apk"
    echo ""
else
    echo ""
    echo "❌ Ошибка сборки!"
    exit 1
fi
