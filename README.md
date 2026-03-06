# 🚌 Корпоративный транспорт

> PWA-приложение для отслеживания корпоративного транспорта в реальном времени.
> Водители транслируют GPS со своих телефонов — сотрудники видят все машины на карте.

---

## Содержание

- [Архитектура](#архитектура)
- [Технологический стек](#технологический-стек)
- [Структура проекта](#структура-проекта)
- [Требования](#требования)
- [Установка и запуск](#установка-и-запуск)
- [Переменные окружения](#переменные-окружения)
- [Тестовые аккаунты](#тестовые-аккаунты)
- [API ключ Яндекс Карт](#api-ключ-яндекс-карт)
- [Как работает GPS-трекинг](#как-работает-gps-трекинг)
- [Оффлайн-режим PWA](#оффлайн-режим-pwa)
- [Деплой в продакшн](#деплой-в-продакшн)
- [FAQ](#faq)

---

## Архитектура

```
┌──────────────────────────────────────┐
│         ТЕЛЕФОН ВОДИТЕЛЯ (PWA)        │
│                                      │
│  Geolocation API (watchPosition)     │
│       │                              │
│  IndexedDB (буфер при потере сети)   │
│       │                              │
│  WebSocket ──────────────────────────┼──────┐
└──────────────────────────────────────┘      │
                                              │
                                    ┌─────────▼──────────┐
                                    │      BACKEND       │
                                    │     (Fastify)      │
                                    │                    │
                                    │  WS приём GPS      │
                                    │  Redis Pub/Sub     │
                                    │  PostgreSQL log    │
                                    └─────────┬──────────┘
                                              │ SSE
                              ┌───────────────▼────────────────┐
                              │    ТЕЛЕФОНЫ СОТРУДНИКОВ (PWA)   │
                              │                                  │
                              │  EventSource → Zustand store     │
                              │  Яндекс Карты v3 → маркеры       │
                              └──────────────────────────────────┘
```

**Почему WebSocket + SSE, а не только WebSocket?**

- **WebSocket** от водителя — нужна двусторонняя связь (heartbeat ping/pong, подтверждения)
- **SSE** для клиентов — надёжнее через мобильный интернет для получения данных; EventSource переподключается автоматически браузером; не требует держать двусторонний канал

**Почему Redis?**

- Хранит последнюю позицию каждой машины (SET, TTL 10 мин) — клиент получает актуальные данные сразу при загрузке без обращения к PostgreSQL
- Pub/Sub — мгновенная рассылка обновлений всем SSE-клиентам без опроса БД

---

## Технологический стек

### Frontend

| Технология        | Версия  | Назначение                          |
|-------------------|---------|-------------------------------------|
| Vite              | 6.x     | Сборщик                             |
| React             | 19.x    | UI-фреймворк                        |
| TypeScript        | 5.7     | Типизация                           |
| Tailwind CSS      | 4.x     | Стили (без конфиг-файла)            |
| React Router      | 7.x     | Роутинг                             |
| TanStack Query    | 5.x     | Серверное состояние и кэш           |
| Zustand           | 5.x     | Клиентское состояние                |
| Яндекс Maps v3    | —       | Карта и маркеры                     |
| vite-plugin-pwa   | 0.21    | Service Worker, PWA, Workbox        |
| idb               | 8.x     | IndexedDB (оффлайн-очередь GPS)     |
| axios             | 1.7     | HTTP-клиент с интерцепторами        |

### Backend

| Технология        | Версия  | Назначение                          |
|-------------------|---------|-------------------------------------|
| Node.js           | 20+ LTS | Среда выполнения                    |
| Fastify           | 5.x     | HTTP + WebSocket сервер             |
| @fastify/websocket| 11.x    | WS поддержка                        |
| @fastify/jwt      | 9.x     | JWT аутентификация                  |
| Prisma            | 6.x     | ORM                                 |
| PostgreSQL        | 16      | Основная БД (история, пользователи) |
| Redis             | 7       | Кэш позиций + Pub/Sub               |
| bcryptjs          | 2.4     | Хэширование паролей                 |
| Zod               | 3.x     | Валидация входных данных            |
| tsx               | 4.x     | Запуск TypeScript в dev-режиме      |

---

## Структура проекта

```
corporate-transport/
├── docker-compose.yml              # PostgreSQL + Redis для разработки
├── README.md
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts              # Vite + PWA + Tailwind + прокси
│   ├── .env.example
│   └── src/
│       ├── app/
│       │   ├── main.tsx            # Точка входа React
│       │   ├── providers.tsx       # QueryClient + RouterProvider
│       │   ├── router.tsx          # Роуты + ProtectedRoute
│       │   └── styles.css          # Tailwind v4 + глобальные стили
│       │
│       ├── pages/                  # Тонкие страницы-компоновщики
│       │   ├── auth/page.tsx       # Страница логина
│       │   └── map/page.tsx        # Главная страница (карта + хедер)
│       │
│       ├── features/               # Независимые модули функциональности
│       │   ├── auth/               # Авторизация
│       │   │   ├── index.ts        # Публичный API фичи
│       │   │   ├── _api.ts         # login / logout / refresh / me
│       │   │   ├── ui/login-form.tsx
│       │   │   └── model/auth-store.ts   # Zustand: user, tokens
│       │   │
│       │   ├── live-map/           # Карта с живыми маркерами
│       │   │   ├── index.ts
│       │   │   ├── ui/live-map.tsx         # Яндекс Карты v3 + маркеры
│       │   │   └── model/
│       │   │       ├── vehicles-store.ts   # Zustand: позиции машин
│       │   │       └── use-vehicles-sse.ts # SSE-подписка на позиции
│       │   │
│       │   └── gps-sender/         # GPS-трекинг (только водитель)
│       │       ├── index.ts
│       │       ├── ui/shift-controls.tsx   # Кнопки старт/стоп смены
│       │       └── model/
│       │           ├── use-gps-sender.ts   # watchPosition → WebSocket
│       │           └── offline-queue.ts    # IndexedDB буфер GPS точек
│       │
│       ├── services/               # Переиспользуемые технические сервисы
│       │   ├── websocket/_ws-client.ts     # WS с реконнектом + heartbeat
│       │   ├── sse/_sse-client.ts          # EventSource обёртка
│       │   └── geolocation/_geo-service.ts # Geolocation API обёртка
│       │
│       └── shared/                 # Ядро: утилиты, типы, конфиг
│           ├── api/http-client.ts  # Axios + JWT интерцепторы + refresh
│           ├── config/
│           │   ├── env.ts          # Переменные окружения (типизированные)
│           │   └── routes.ts       # Константы роутов приложения
│           ├── domain/
│           │   ├── user.ts         # User, AuthTokens, UserRole, LoginCredentials
│           │   └── vehicle.ts      # Vehicle, VehiclePosition, VehicleWithPosition
│           └── lib/
│               ├── cn.ts           # clsx + tailwind-merge
│               └── coords.ts       # Haversine, bearing, lerpLatLng
│
└── backend/
    ├── package.json
    ├── .env.example
    └── src/
        ├── app.ts                  # Fastify сервер, плагины, роуты
        ├── modules/
        │   ├── auth/index.ts       # POST /login /refresh /logout, GET /me
        │   ├── vehicles/index.ts   # GET /vehicles (с позициями из Redis)
        │   └── tracking/index.ts   # WS /ws + SSE /stream + Redis pub/sub
        ├── services/
        │   └── redis.ts            # Redis клиенты, ключи, каналы Pub/Sub
        └── db/
            ├── prisma/schema.prisma
            └── seed.ts             # Тестовые пользователи и машины
```

---

## Требования

| Инструмент    | Версия        | Проверка                |
|---------------|---------------|-------------------------|
| Node.js       | >= 20.0.0 LTS | `node --version`        |
| npm           | >= 10.0.0     | `npm --version`         |
| Docker        | любая         | `docker --version`      |
| Docker Compose| v2+           | `docker compose version`|

---

## Установка и запуск

### Шаг 1 — Инфраструктура (PostgreSQL + Redis)

В корне проекта (где лежит `docker-compose.yml`):

```bash
docker compose up -d
```

Проверить что запустилось:

```bash
docker compose ps
# Оба контейнера должны быть в статусе "running"
```

Что поднимается:
- **PostgreSQL 16** → `localhost:5432` (user: `postgres`, password: `postgres`, db: `corporate_transport`)
- **Redis 7** → `localhost:6379`

---

### Шаг 2 — Backend

```bash
cd backend
```

**2.1 Установить зависимости:**

```bash
npm install
```

**2.2 Настроить переменные окружения:**

```bash
cp .env.example .env
```

Содержимое `.env` (для локальной разработки ничего менять не нужно):

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/corporate_transport"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

**2.3 Применить миграции базы данных:**

```bash
npx prisma generate
npx prisma migrate dev --name init
```

При вопросе `Do you want to create the database?` → нажмите `y`.

**2.4 Заполнить тестовыми данными:**

```bash
npm run db:seed
```

**2.5 Запустить сервер:**

```bash
npm run dev
```

Сервер запустится на `http://localhost:4000`.

Проверить:
```bash
curl http://localhost:4000/health
# {"status":"ok","timestamp":"..."}
```

---

### Шаг 3 — Frontend

Откройте новый терминал:

```bash
cd frontend
```

**3.1 Установить зависимости:**

```bash
npm install
```

**3.2 Настроить переменные окружения:**

```bash
cp .env.example .env
```

Откройте `.env` и **обязательно** добавьте API ключ Яндекс Карт:

```env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
VITE_YANDEX_MAPS_API_KEY=ВАШ_КЛЮЧ_ЗДЕСЬ
VITE_GPS_INTERVAL_MS=4000
```

**3.3 Запустить dev-сервер:**

```bash
npm run dev
```

Откройте в браузере: **http://localhost:3000**

---

## Переменные окружения

### Backend (`backend/.env`)

| Переменная        | По умолчанию                                                     | Описание                            |
|-------------------|------------------------------------------------------------------|-------------------------------------|
| `DATABASE_URL`    | `postgresql://postgres:postgres@localhost:5432/corporate_transport` | Строка подключения к PostgreSQL  |
| `REDIS_URL`       | `redis://localhost:6379`                                         | Строка подключения к Redis          |
| `JWT_SECRET`      | `change-me-in-production-please`                                 | Секрет для подписи JWT токенов      |
| `PORT`            | `4000`                                                           | Порт HTTP/WebSocket сервера         |
| `FRONTEND_URL`    | `http://localhost:3000`                                          | URL фронтенда (настройка CORS)      |

### Frontend (`frontend/.env`)

| Переменная                  | По умолчанию            | Описание                          |
|-----------------------------|-------------------------|-----------------------------------|
| `VITE_API_URL`              | `http://localhost:4000` | URL backend REST API              |
| `VITE_WS_URL`               | `ws://localhost:4000`   | URL WebSocket сервера             |
| `VITE_YANDEX_MAPS_API_KEY`  | *(обязательно)*         | API ключ Яндекс Карт              |
| `VITE_GPS_INTERVAL_MS`      | `4000`                  | Интервал отправки GPS в мс        |

---

## Тестовые аккаунты

| Логин       | Пароль      | Роль      | Машина                         |
|-------------|-------------|-----------|--------------------------------|
| `driver1`   | `password123` | Водитель | Газель 001 (А001АА77)          |
| `driver2`   | `password123` | Водитель | Ford Transit 002 (В002ВВ77)    |
| `employee1` | `password123` | Сотрудник | —                             |

**Сценарий тестирования:**

1. Откройте **два окна браузера** (или два устройства в одной сети)
2. Окно 1: войдите как `driver1` → нажмите **«Начать смену»** → разрешите геолокацию
3. Окно 2: войдите как `employee1` → увидите маркер машины на карте, обновляющийся в реальном времени

---

## API ключ Яндекс Карт

1. Перейдите: [developer.tech.yandex.ru](https://developer.tech.yandex.ru)
2. Войдите с аккаунтом Яндекс (или зарегистрируйтесь)
3. Нажмите **«Подключить API»**
4. Выберите **«JavaScript API и HTTP Геокодер»**
5. Заполните форму: название проекта, в поле «Разрешённые домены» укажите `localhost`
6. Скопируйте выданный ключ и вставьте в `frontend/.env`

> **Бесплатный лимит:** 1000 загрузок карты в сутки — достаточно для разработки и небольшой команды.

---

## Как работает GPS-трекинг

### Водитель (отправка)

```
[Телефон водителя]
  1. Нажать «Начать смену»
  2. navigator.geolocation.watchPosition() запускается
  3. Каждое обновление GPS:
     ├─ [Сеть есть]   → WebSocket.send({type:'position', data:{lat,lng,...}})
     └─ [Сети нет]    → IndexedDB.put(position, {synced: false})
  4. При восстановлении WS:
     └─ flush: IndexedDB → WS пакетом (по порядку timestamp)
  5. «Завершить смену» → GPS стоп, WS закрывается, машина = inactive
```

### Сервер (обработка)

```
[Backend]
  WS получает позицию:
    ├─ Redis SET vehicle:pos:{id}  ← последняя позиция (TTL 10 мин)
    ├─ PostgreSQL INSERT position_logs ← история
    └─ Redis PUBLISH tracking:position ← рассылка клиентам
```

### Клиент (получение)

```
[Телефон сотрудника]
  При загрузке:
    GET /api/vehicles → последние позиции из Redis → маркеры на карту
  SSE (EventSource):
    subscribe tracking:position → updatePosition() → маркер смещается
    subscribe tracking:offline  → setVehicleOffline() → маркер серый
```

---

## Оффлайн-режим PWA

| Ресурс                     | Стратегия кэша    | Срок хранения |
|----------------------------|-------------------|---------------|
| JS, CSS, HTML приложения   | `CacheFirst`      | До следующего деплоя |
| Тайлы Яндекс Карт          | `CacheFirst`      | 7 дней        |
| REST API запросы           | `NetworkFirst`    | 5 минут       |
| GPS-точки при отсутствии сети | IndexedDB      | До отправки   |

**Установить PWA на телефон:**

- **iOS Safari:** Поделиться → «На экран "Домой"»
- **Android Chrome:** ⋮ → «Добавить на главный экран»

После установки приложение запускается как нативное, без строки браузера.

---

## Деплой в продакшн

### Сборка

```bash
# Frontend
cd frontend && npm run build
# Результат: frontend/dist/ — загрузить на CDN/nginx

# Backend
cd backend && npm run build
# Результат: backend/dist/
node dist/app.js
```

### Переменные окружения (продакшн)

**Backend:**
```env
DATABASE_URL="postgresql://user:pass@prod-db:5432/corporate_transport"
REDIS_URL="redis://prod-redis:6379"
JWT_SECRET="минимум-64-символа-случайной-строки-сгенерируйте-openssl-rand-hex-32"
PORT=4000
FRONTEND_URL="https://transport.your-company.com"
```

**Frontend:**
```env
VITE_API_URL=https://api.your-company.com
VITE_WS_URL=wss://api.your-company.com
VITE_YANDEX_MAPS_API_KEY=production-api-key
```

> ⚠️ В продакшне WebSocket и SSE должны работать через HTTPS/WSS.

### Пример конфига nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.your-company.com;

    # REST API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket (водитель → сервер)
    location /ws {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }

    # SSE (сервер → клиенты) — ВАЖНО: отключить буферизацию!
    location /api/tracking/stream {
        proxy_pass http://localhost:4000;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        add_header Cache-Control no-cache;
        add_header X-Accel-Buffering no;
    }
}
```

---

## FAQ

**Карта не загружается**
> Проверьте `VITE_YANDEX_MAPS_API_KEY` в `.env`. Убедитесь что `localhost` добавлен в разрешённые домены ключа.

**Браузер не запрашивает доступ к геолокации**
> Геолокация работает только на `localhost` или по HTTPS. В продакшне обязателен SSL-сертификат.

**Маркер машины не появляется**
> Проверьте в DevTools → Network: 1) WS соединение открыто (вкладка WS), 2) SSE соединение открыто (вкладка EventStream). Убедитесь что Redis запущен.

**Как добавить новую машину или водителя?**
> Через Prisma Studio: `cd backend && npx prisma studio`. Откроется веб-интерфейс на `localhost:5555`.

**Как изменить частоту обновления GPS?**
> `VITE_GPS_INTERVAL_MS` в frontend `.env`. Рекомендуется 3000–10000 мс. Меньше = точнее, но больше трафик и расход батареи.

**Водитель уехал в зону без сети — что происходит?**
> GPS-точки накапливаются в IndexedDB телефона. При восстановлении сети автоматически отправляются пакетом на сервер в хронологическом порядке.

**Сколько водителей поддерживает система?**
> Redis Pub/Sub практически без ограничений. Узкое место — количество одновременных SSE-соединений (каждый клиент держит один поток). Fastify + Node.js легко справляется с тысячами клиентов.
