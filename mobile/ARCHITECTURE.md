# 🏗️ Архитектура мобильного приложения

## Общая схема системы

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORPORATE TRANSPORT SYSTEM                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   BACKEND    │         │   FRONTEND   │         │    MOBILE    │
│  (Fastify)   │◄───────►│  (React PWA) │         │ (React Native)│
│              │  HTTP   │              │         │              │
│ PostgreSQL   │  WS     │  Yandex      │  API    │  Expo        │
│ Redis        │  SSE    │  Maps        │  WS     │  GPS         │
└──────────────┘         └──────────────┘         └──────────────┘
       ▲                        ▲                        ▲
       │                        │                        │
       └────────────────────────┴────────────────────────┘
                         Shared Backend
```

## Детальная архитектура Mobile App

```
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE APP (Expo)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   PRESENTATION LAYER                  │   │
│  │                                                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │   │
│  │  │ LoginScreen  │  │ DriverScreen │  │  MapScreen │ │   │
│  │  │  (login.tsx) │  │ (driver.tsx) │  │  (map.tsx) │ │   │
│  │  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘ │   │
│  │         │                 │                 │        │   │
│  │  ┌──────▼─────────────────▼─────────────────▼──────┐ │   │
│  │  │            UI COMPONENTS LAYER                   │ │   │
│  │  │  ┌────────────┐ ┌──────────────┐ ┌───────────┐  │ │   │
│  │  │  │ LoginForm  │ │ ShiftControls│ │MapComponent│  │ │   │
│  │  │  └────────────┘ └──────────────┘ └───────────┘  │ │   │
│  │  └──────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
│                             │                                │
│  ┌──────────────────────────▼──────────────────────────────┐│
│  │                   BUSINESS LOGIC LAYER                  ││
│  │                                                         ││
│  │  ┌─────────────────┐           ┌─────────────────────┐ ││
│  │  │ useGpsSender    │           │ useVehiclesSSE      │ ││
│  │  │ (GPS tracking)  │           │ (Real-time updates) │ ││
│  │  └────────┬────────┘           └──────────┬──────────┘ ││
│  │           │                                │            ││
│  │  ┌────────▼────────────────────────────────▼─────────┐ ││
│  │  │              ZUSTAND STORES                        │ ││
│  │  │  ┌──────────────┐      ┌──────────────────────┐   │ ││
│  │  │  │ auth-store   │      │ vehicles-store       │   │ ││
│  │  │  │ - user       │      │ - vehicles[]         │   │ ││
│  │  │  │ - tokens     │      │ - lastUpdated        │   │ ││
│  │  │  │ - isAuth     │      │                      │   │ ││
│  │  │  └──────────────┘      └──────────────────────┘   │ ││
│  │  └───────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────┘│
│                              │                               │
│  ┌───────────────────────────▼──────────────────────────────┐
│  │                    DATA ACCESS LAYER                     │
│  │                                                          │
│  │  ┌──────────────┐         ┌──────────────────────┐     │
│  │  │ authApi      │         │ vehiclesApi          │     │
│  │  │ - login      │         │ - getAll()           │     │
│  │  │ - logout     │         │                      │     │
│  │  │ - refresh    │         │                      │     │
│  │  └──────┬───────┘         └──────────┬───────────┘     │
│  │         │                            │                  │
│  │  ┌──────▼────────────────────────────▼──────────────┐  │
│  │  │           httpClient (Fetch API)                  │  │
│  │  │  - JWT interceptors                               │  │
│  │  │  - Error handling                                 │  │
│  │  └───────────────────────────────────────────────────┘  │
│  └──────────────────────────────────────────────────────────┘
│                               │
│  ┌────────────────────────────▼─────────────────────────────┐
│  │                   INFRASTRUCTURE LAYER                   │
│  │                                                          │
│  │  ┌──────────────────┐      ┌──────────────────────┐    │
│  │  │ WsClient         │      │ expo-location        │    │
│  │  │ - WebSocket conn │      │ - watchPosition      │    │
│  │  │ - Heartbeat      │      │ - Permissions        │    │
│  │  │ - Reconnect      │      │                      │    │
│  │  └──────────────────┘      └──────────────────────┘    │
│  │                                                          │
│  │  ┌──────────────────┐      ┌──────────────────────┐    │
│  │  │ authStorage      │      │ react-native-maps    │    │
│  │  │ - SecureStore    │      │ - MapView            │    │
│  │  │ - JWT tokens     │      │ - Markers            │    │
│  │  └──────────────────┘      └──────────────────────┘    │
│  └──────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Fastify)                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/auth/login         → JWT Auth                   │  │
│  │  /api/auth/refresh       → Token Refresh              │  │
│  │  /api/auth/logout        → Clear Session              │  │
│  │  /api/vehicles           → Get Vehicles + Positions   │  │
│  │  /api/tracking/ws        → WebSocket (GPS positions)  │  │
│  │  /api/tracking/stream    → SSE (Real-time updates)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────┐   │
│  │ PostgreSQL  │    │   Redis     │    │  Fastify     │   │
│  │ - Users     │    │ - Positions │    │  Server      │   │
│  │ - Vehicles  │    │ - Pub/Sub   │    │              │   │
│  │ - Logs      │    │ - Cache     │    │              │   │
│  └─────────────┘    └─────────────┘    └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Поток данных: Водитель начинает смену

```
┌─────────────┐
│DriverScreen │
└──────┬──────┘
       │ 1. Нажать "Начать смену"
       ▼
┌─────────────────┐
│ useGpsSender    │
└──────┬──────────┘
       │ 2. Request location permission
       ▼
┌──────────────────┐
│ expo-location    │
│ watchPositionAsync│
└──────┬───────────┘
       │ 3. Каждые 4 сек: { lat, lng, heading, speed }
       ▼
┌──────────────────┐
│ WsClient.send()  │
│ { type: 'position',│
│   data: {...} }  │
└──────┬───────────┘
       │ 4. WebSocket.send(JSON.stringify(data))
       ▼
┌─────────────────────────────────────────┐
│         BACKEND /ws endpoint            │
└──────┬──────────────────────────────────┘
       │ 5. Process position
       ├─► Redis SET vehicle:pos:{id} (TTL 600s)
       ├─► PostgreSQL INSERT position_logs
       └─► Redis PUBLISH tracking:position
              │
              ▼
       ┌──────────────────────────────┐
       │  All SSE clients receive     │
       │  { type: 'position', ... }   │
       └──────────────────────────────┘
```

## Поток данных: Сотрудник видит карту

```
┌────────────┐
│ MapScreen  │
└─────┬──────┘
      │ 1. ComponentDidMount
      ▼
┌──────────────────┐
│ useEffect hook   │
└─────┬────────────┘
      │ 2. Load vehicles
      ▼
┌──────────────────┐
│ vehiclesApi.getAll()│
└─────┬────────────┘
      │ 3. GET /api/vehicles
      ▼
┌─────────────────────────────┐
│      BACKEND                │
│ 1. Prisma: SELECT * FROM vehicles│
│ 2. Redis: GET vehicle:pos:{id}  │
│ 3. Return merged data       │
└─────┬───────────────────────┘
      │ 4. Vehicle[] with positions
      ▼
┌─────────────────────┐
│ useVehiclesStore   │
│ setVehicles(vehicles)│
└─────┬───────────────┘
      │ 5. Update state
      ▼
┌─────────────────────┐
│ MapView component  │
│ Render markers      │
└─────────────────────┘

Параллельно:
┌──────────────────────┐
│ Polling interval     │
│ (every 5 seconds)    │
└──────┬───────────────┘
       │ Repeat steps 2-5
       ▼
    Update positions
```

## State Management (Zustand)

### Auth Store

```typescript
{
  user: User | null,           // { id, username, fullName, role, vehicleId }
  accessToken: string | null,  // JWT access token
  isAuthenticated: boolean,    // Auth flag
  isLoading: boolean,          // Loading state

  setAuth(user, token)         // Set auth state
  clearAuth()                  // Clear auth
  isDriver()                   // Check if driver
}
```

### Vehicles Store

```typescript
{
  vehicles: Vehicle[],         // Array of vehicles with positions
  lastUpdated: number | null,  // Last update timestamp

  setVehicles(vehicles)        // Set all vehicles
  updatePosition(position)     // Update single vehicle position
  setVehicleOffline(id)        // Mark vehicle as offline
}
```

## Безопасность

### Токены хранятся в:

- **iOS**: Keychain (encrypted)
- **Android**: Keystore (encrypted)

### JWT Flow:

```
Login
  ↓
Backend returns: { accessToken (15m), refreshToken (30d) }
  ↓
Store in SecureStore
  ↓
Every request: Authorization: Bearer {accessToken}
  ↓
If accessToken expired:
  - POST /api/auth/refresh with refreshToken
  - Get new accessToken
  - Retry original request
  ↓
Logout: Clear SecureStore
```

## Производительность

### Оптимизации:

1. **WebSocket** держит одно соединение (не переподключается постоянно)
2. **Heartbeat** каждые 25 сек предотвращает разрыв соединения
3. **Reconnect** с exponential backoff (2s → 3s → 4.5s → ... max 30s)
4. **Polling** для сотрудников (вместо SSE проще в реализации)
5. **Memoization** через React hooks
6. **SecureStore** быстрее чем localStorage

### Будущие улучшения:

- [ ] SSE вместо polling для сотрудников
- [ ] Offline queue для GPS точек
- [ ] Background location для водителей
- [ ] Push notifications
- [ ] Image caching

## Масштабирование

### Как приложение масштабируется:

**Backend**:

- Redis Pub/Sub → тысячи SSE клиентов
- WebSocket → сотни одновременных водителей
- PostgreSQL → миллионы записей позиций

**Mobile**:

- Zustand → реактивные обновления без ре-рендеров
- React Native → нативная производительность
- Expo → OTA обновления

## Отличия от веб-версии

| Аспект    | Web (PWA)       | Mobile (Expo)                    |
| --------- | --------------- | -------------------------------- |
| Роутинг   | React Router    | expo-router                      |
| Карты     | Yandex Maps v3  | react-native-maps (Google/Apple) |
| Хранилище | localStorage    | SecureStore (Keychain/Keystore)  |
| GPS       | Geolocation API | expo-location                    |
| State     | Zustand         | Zustand ✅                       |
| Offline   | IndexedDB       | AsyncStorage (TODO)              |
| SSE       | EventSource     | Polling (TODO)                   |
