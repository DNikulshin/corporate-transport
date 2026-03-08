# Настройка Яндекс Карт (Yandex Maps)

## 1. Получение API ключа

1. Зайдите в [Кабинет разработчика Яндекс](https://developer.tech.yandex.ru/)
2. Нажмите "Подключить API" → "Мобильное приложение"
3. Выберите "Яндекс Карта для Android"
4. Создайте новый ключ
5. Укажите SHA-1 отпечаток вашего ключа подписи
6. Скопируйте API ключ

## 2. Настройка в мобильном приложении

### Для локальной разработки:

1. Обновите файл `mobile/.env`:

```bash
EXPO_PUBLIC_YANDEX_MAPS_API_KEY=ваш-api-ключ
```

2. Пересоберите нативные файлы:

```bash
npx expo prebuild --clean
```

## 3. Сборка приложения

### Вариант A: Development Build (локально)

Требуется Android Studio:

```bash
npx expo run:android
```

Эта команда:

- Соберет кастомный Expo Go с поддержкой Yandex Maps
- Запустит эмулятор или подключенное устройство
- Установит приложение

### Вариант B: EAS Build (в облаке)

```bash
# Установите EAS CLI
npm install -g eas-cli

# Войдите в аккаунт Expo
eas login

# Настройте проект
eas build:configure

# Соберите development версию
eas build --profile development --platform android

# Или production версию
eas build --profile production --platform android
```

## 4. Настройка Android

### Получение SHA-1 отпечатка

Для debug сборки:

```bash
cd android
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Или используйте готовый скрипт:

```bash
npx expo config --type introspect | grep android.debugSha256
```

### Добавление отпечатка в Яндекс

1. Вставьте SHA-1 в настройках API ключа в кабинете Яндекса
2. Дождитесь активации ключа (обычно 5-10 минут)

## 5. Проверка работы

После сборки и установки:

1. Запустите приложение на устройстве/эмуляторе
2. Войдите как водитель или сотрудник
3. Должна отобразиться карта Яндекс с маркерами автомобилей

## Troubleshooting

### Ошибка "Cannot read property 'init' of null":

- Выполните `npx expo prebuild --clean`
- Пересоберите приложение: `npx expo run:android`
- Убедитесь что API ключ действителен

### Карта не отображается:

- Проверьте API ключ в `.env`
- Убедитесь что ключ активен в кабинете разработчика
- Проверьте SHA-1 отпечаток в настройках ключа
- Проверьте логи: `npx expo start --go`

### Маркеры не видны:

- Убедитесь что у автомобилей есть координаты
- Проверьте масштаб карты (zoom level)
- Попробуйте приблизить карту

### Ошибки компиляции:

- Очистите кэш: `npx expo start -c`
- Пересоберите подкасты: `cd android && ./gradlew clean`
- Удалите node_modules: `rm -rf node_modules && npm install`
