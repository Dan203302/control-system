# Control System — README

Проект: внутренняя система управления задачами (users/roles/tasks/comments/files/audit). Клиент и серверная часть реализованы в рамках одного приложения на Next.js (App Router + Route Handlers).

## Краткое описание
Система обеспечивает создание и ведение задач, комментариев и вложений, разграничение прав по ролям, а также аудит ключевых действий. Хранение данных — PostgreSQL.

## Стек технологий
- Next.js 15 (App Router, Route Handlers)
- TypeScript
- Tailwind CSS, HeroUI v2
- PostgreSQL
- Drizzle ORM (работа с БД и миграции)

## ER-диаграмма (структура БД)
- enum `task_status`: `new`, `in_progress`, `blocked`, `done`, `archived`
- enum `task_priority`: `low`, `medium`, `high`, `urgent`

### Таблицы

#### roles
| Поле |
| --- |
| id |
| name |
| description |
| created_at |
| updated_at |
 
- PK: `id`

#### users
| Поле |
| --- |
| id |
| email |
| password_hash |
| full_name |
| role_id |
| is_active |
| last_login_at |
| created_at |
| updated_at |
 
- PK: `id`
- FK: `role_id` → `roles.id`

#### tasks
| Поле |
| --- |
| id |
| title |
| description |
| status |
| priority |
| assignee_id |
| creator_id |
| due_date |
| closed_at |
| created_at |
| updated_at |
 
- PK: `id`
- FK: `assignee_id` → `users.id`
- FK: `creator_id` → `users.id`

#### comments
| Поле |
| --- |
| id |
| task_id |
| author_id |
| content |
| created_at |
| deleted_at |
 
- PK: `id`
- FK: `task_id` → `tasks.id`
- FK: `author_id` → `users.id`

#### files
| Поле |
| --- |
| id |
| task_id |
| uploader_id |
| filename |
| storage_key |
| mime_type |
| size_bytes |
| checksum_sha256 |
| created_at |
 
- PK: `id`
- FK: `task_id` → `tasks.id`
- FK: `uploader_id` → `users.id`

#### audit_log
| Поле |
| --- |
| id |
| actor_id |
| entity_type |
| entity_id |
| action |
| details |
| created_at |
 
- PK: `id`
- FK: `actor_id` → `users.id` (nullable)

#### settings
| Поле |
| --- |
| key |
| value |
| updated_at |
 
- PK: `key`

## План разработки

Бэкенд (Next.js Route Handlers)
- [ ] Настройка проекта и базовой архитектуры
  - [ ] Структура проекта и зависимости
  - [x] Подключение к PostgreSQL
- [ ] Аутентификация и авторизация
  - [x] Регистрация и вход пользователей
  - [x] Сессии на HTTP-only cookie
  - [x] JWT токены (подпись/проверка)
  - [x] RBAC (роли и права)
  - [x] Middleware для проверки авторизации
- [x] API для проектов/объектов/этапов
  - [x] CRUD projects
  - [x] CRUD objects
  - [x] CRUD stages
- [ ] API для задач
  - [x] CRUD задач
  - [x] Статусы, приоритеты, дедлайны
  - [x] Назначение исполнителей
  - [x] Поиск и фильтрация
  - [x] История изменений (аудит)
- [ ] API для комментариев и файлов
  - [x] CRUD для комментариев
  - [x] Загрузка/скачивание вложений
  - [ ] История изменений
- [ ] Отчётность и аналитика (опционально)
  - [x] Экспорт CSV/Excel
  - [x] API статистики
- [ ] Безопасность
  - [ ] Rate limiting и валидация данных
  - [ ] Защита от XSS/CSRF, логирование ошибок

Фронтенд (Next.js App Router)
- [ ] Настройка проекта и базовые компоненты
  - [x] Инициализация и стилизация
  - [x] Маршрутизация
  - [x] Сервисы для работы с API
- [ ] Аутентификация и авторизация
  - [ ] Формы регистрации/входа
    - [x] Форма входа
    - [x] Форма регистрации
  - [x] Управление сессиями
  - [x] Защита маршрутов
- [ ] Управление задачами
  - [x] Список с фильтрацией и сортировкой
  - [ ] Детальная страница задачи
  - [ ] Формы создания и редактирования
  - [ ] Управление участниками/исполнителями
- [ ] Комментарии и файлы
  - [ ] Лента комментариев
  - [ ] Загрузка и просмотр вложений
  - [ ] История изменений
- [ ] Отчётность и аналитика (опционально)
  - [ ] Страницы отчётов/статистики
  - [ ] Графики/диаграммы при необходимости

