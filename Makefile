.PHONY: up down install migrate seed dev-backend dev-frontend dev clean

# Поднять инфраструктуру
up:
	docker compose up -d
	@echo "✅ PostgreSQL и Redis запущены"

# Остановить инфраструктуру
down:
	docker compose down

# Установить все зависимости
install:
	cd backend && npm install
	cd frontend && npm install
	@echo "✅ Зависимости установлены"

# Применить миграции и заполнить БД
migrate:
	cd backend && npx prisma generate && npx prisma migrate dev --name init

seed:
	cd backend && npm run db:seed

# Запустить бэкенд
dev-backend:
	cd backend && npm run dev

# Запустить фронтенд
dev-frontend:
	cd frontend && npm run dev

# Полная первоначальная установка
setup: up install migrate seed
	@echo ""
	@echo "🚀 Проект готов к запуску!"
	@echo ""
	@echo "Запустите в двух терминалах:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"
	@echo ""
	@echo "Затем откройте: http://localhost:3000"

# Очистить сборки
clean:
	rm -rf frontend/dist backend/dist
	@echo "✅ Сборки удалены"
