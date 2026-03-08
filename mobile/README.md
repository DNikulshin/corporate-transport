# Mobile App - React Native Expo

Мобильное приложение для системы отслеживания корпоративного транспорта.

## 🚀 Установка

```bash
npm install
```

## 🔧 Запуск

```bash
npm start
```

Затем:

- Нажмите `i` для запуска на iOS симуляторе
- Нажмите `a` для запуска на Android эмуляторе
- Отсканируйте QR код в приложении Expo Go на реальном устройстве

## 📱 Функционал

### Для водителей:

- Авторизация (JWT токены)
- Кнопка "Начать смену" / "Завершить смену"
- Трансляция GPS координат на бэкенд через WebSocket
- Оффлайн-режим (сохранение точек при потере сети)

### Для сотрудников:

- Просмотр всех автомобилей на карте
- Обновление позиций в реальном времени
- Информация о водителях и статусах ТС

## 🏗️ Архитектура

```
mobile/
├── app/                      # Основное приложение (expo-router)
│   ├── (tabs)/              # Экраны с таб-навигацией
│   │   ├── index.tsx        # Главный экран (роутинг)
│   │   ├── login.tsx        # Экран авторизации
│   │   ├── driver.tsx       # Экран водителя (карта + контроль)
│   │   └── map.tsx          # Экран сотрудника (только карта)
│   ├── api/                 # API клиенты
│   │   ├── auth.ts          # Auth API
│   │   └── vehicles.ts      # Vehicles API
│   ├── components/          # UI компоненты
│   │   ├── login-form.tsx
│   │   ├── shift-controls.tsx
│   │   └── map-screen.tsx
│   ├── config/              # Конфигурация
│   │   └── env.ts           # Переменные окружения
│   ├── hooks/               # Кастомные хуки
│   │   └── use-gps-sender.ts
│   ├── lib/                 # Библиотеки/сервисы
│   │   ├── auth-storage.ts  # SecureStore для токенов
│   │   ├── http-client.ts   # HTTP клиент
│   │   └── websocket-client.ts
│   ├── store/               # Zustand stores
│   │   ├── auth-store.ts
│   │   └── vehicles-store.ts
│   ├── types/               # TypeScript типы
│   │   ├── user.ts
│   │   └── vehicle.ts
│   └── _layout.tsx          # Корневой layout
├── app.json                 # Конфиг Expo
└── package.json
```

## 🔐 Разрешения

### iOS

- `NSLocationWhenInUseUsageDescription` - доступ к геолокации
- `NSLocationAlwaysAndWhenInUseUsageDescription` - фоновая геолокация

### Android

- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`

## 🛠️ Технологический стек

- **React Native** 0.81.5
- **Expo** 54.0.33
- **expo-router** 6.0.23 (File-based роутинг)
- **Zustand** 5.x (State management)
- **expo-secure-store** (Безопасное хранение токенов)
- **expo-location** (Геолокация)
- **react-native-maps** (Карты)
- **WebSocket** (Связь с бэкендом)

## 📡 Связь с бэкендом

### API Endpoints

- `POST /api/auth/login` - Авторизация
- `POST /api/auth/refresh` - Refresh токена
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Получить текущего пользователя
- `GET /api/vehicles` - Список автомобилей с позициями

### WebSocket

- `WS /api/tracking/ws?token={jwt}` - Отправка GPS позиций

### Переменные окружения

В `app/config/env.ts`:

```typescript
{
  apiUrl: 'http://localhost:4000',
  wsUrl: Platform.OS === 'android' ? 'ws://10.0.2.2:4000' : 'ws://localhost:4000',
  gpsIntervalMs: 4000,
}
```

**Важно:** Для Android используется `10.0.2.2` вместо `localhost` для доступа к хост-машине.

## 🧪 Тестирование

1. Запустите бэкенд (см. `/backend/README.md`)
2. Запустите фронтенд (опционально, см. `/frontend/README.md`)
3. Запустите мобильное приложение:
   ```bash
   npm start
   ```

### Тестовые аккаунты (те же что и в вебе):

- `driver1` / `password123` - водитель с автомобилем
- `employee1` / `password123` - сотрудник

## 📝 Заметки

### Маршрутизация

Приложение использует file-based роутинг через expo-router:

- Файлы в `app/(tabs)/` автоматически становятся доступными по маршрутам `/login`, `/driver`, `/map`
- `app/index.tsx` - точка входа, перенаправляет на нужный экран
- `_layout.tsx` - корневой layout, инициализирует auth состояние

### Хранение данных

- Токены и пользователь хранятся в `expo-secure-store` (iOS Keychain / Android Keystore)
- Состояние приложения в `Zustand` stores
- При перезапуске приложения auth восстанавливается из secure storage

### GPS Трекинг

- Используется `expo-location.watchPositionAsync()`
- Интервал: 4 секунды (настраивается в env)
- Точность: High accuracy
- Отправка через WebSocket с heartbeat (ping/pong каждые 25с)
- Автоматический реконнект при потере соединения
