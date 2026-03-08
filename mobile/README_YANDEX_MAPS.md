# Инструкция по запуску Яндекс Карт в мобильном приложении

## ✅ Что уже сделано:

1. ✅ Установлена библиотека `react-native-yamap`
2. ✅ Настроен API ключ Яндекса: `0c3c2c36-736e-4285-843a-2f4c3968c728`
3. ✅ Добавлен API ключ в AndroidManifest.xml
4. ✅ Инициализация в \_layout.tsx
5. ✅ Пересобраны нативные файлы (prebuild)

## 🚀 Запуск приложения

### Вариант 1: Локальная сборка (требуется Android Studio)

```bash
cd mobile
npx expo run:android
```

Эта команда:

- Соберет кастомный Development Build с Yandex Maps
- Запустит эмулятор или подключенное устройство
- Установит и запустит приложение

**Время первой сборки:** 5-10 минут

### Вариант 2: EAS Build в облаке

```bash
# Установка EAS CLI
npm install -g eas-cli

# Вход в аккаунт Expo
eas login

# Конфигурация проекта
eas build:configure

# Сборка development версии
eas build --profile development --platform android

# Или production версии
eas build --profile production --platform android
```

После сборки скачайте APK файл и установите на устройство.

### Вариант 3: Быстрый тест без карт

Если нужно быстро протестировать приложение без карт, используйте список автомобилей (можно временно вернуть в map-screen.tsx).

## 📱 После запуска

1. Откройте приложение на устройстве/эмуляторе
2. Войдите как водитель:
   - Логин: `driver1`
   - Пароль: `password123`
3. Должна отобразиться карта Яндекс с маркерами автомобилей

## 🔧 Troubleshooting

### Ошибка "Cannot read property 'init' of null"

- Убедитесь что выполнен `npx expo prebuild --clean`
- Пересоберите приложение: `npx expo run:android`
- Проверьте что API ключ добавлен в AndroidManifest.xml

### Карта не загружается

- Проверьте интернет соединение
- Убедитесь что API ключ активен в кабинете разработчика Яндекс
- Проверьте SHA-1 отпечаток в настройках ключа

### Ошибки компиляции

```bash
# Очистка кэша
npx expo start -c

# Очистка Gradle
cd android
./gradlew clean

# Переустановка зависимостей
rm -rf node_modules
npm install
npx expo prebuild --clean
```

## 📝 Важные заметки

1. **Development Build ≠ Expo Go**: Это кастомная версия Expo Go с вашими нативными модулями
2. **Пересборка требуется**: При добавлении новых нативных библиотек нужно пересобирать билд
3. **API ключ**: Храните ключ в безопасности, не коммитьте в git
4. **SHA-1 отпечаток**: Для production сборки нужно добавить SHA-1 отпечаток в настройки API ключа Яндекса

## 🔗 Полезные ссылки

- Документация react-native-yamap: https://github.com/volga-volga/react-native-yamap
- Кабинет разработчика Яндекс: https://developer.tech.yandex.ru/
- Expo Development Build: https://docs.expo.dev/development/introduction/
