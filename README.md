# 🏗️ Control System — система учёта дефектов и контроля работ

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![HeroUI](https://img.shields.io/badge/HeroUI-7C3AED?style=for-the-badge)](https://www.heroui.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0B7A75?style=for-the-badge)](https://orm.drizzle.team/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://www.microsoft.com/windows)
[![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/)
[![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com/)

<p align="center">
  <img src="./screenshot.png" alt="Интерфейс системы" width="1200"/>
  <br/>
  <i>Список дефектов, фильтры, карточка дефекта, файлы и комментарии</i>
</p>

Control System — веб‑приложение на Next.js для ведения дефектов, проектов, объектов и этапов с RBAC, файлами, комментариями и экспортом отчётов. Реализованы App Router + Route Handlers, PostgreSQL + Drizzle ORM и локальное хранилище вложений.

---

## Навигация и действия в UI

- **Дефекты**
  - Список с фильтрами (статус, приоритет, проект/объект/этап, исполнитель), сортировкой и пагинацией.
  - Переход в карточку: клик по заголовку или кнопка `Открыть` в таблице.
  - Создание: кнопка `Создать дефект` открывает модалку с выбором проекта/объекта/этапа, приоритета, дедлайна и исполнителя.
- **Карточка дефекта**
  - Редактирование: заголовок, описание, приоритет, исполнитель, дедлайн, кнопка `Сохранить`.
  - Статусы: набор допустимых переходов (например, Новая → В работе → На проверке → Закрыта/Отменена) — отдельные кнопки.
  - Файлы: кнопка `Загрузить файл` (скрытый input), просмотр списка, скачивание и удаление при правах.
  - Комментарии: добавление, редактирование/удаление автором и ролями `admin/manager`.
  - История: таблица аудита с датой, действием, автором и деталями.
- **Проекты / Объекты / Этапы**
  - Списки и модальные окна создания. Доступно ролям `admin` и `manager`.
- **Отчёты**
  - Экспорт дефектов в CSV/XLSX (ролям `admin`, `manager`, `observer`) через API `GET /api/reports/defects/export` с параметрами.
- **Навигация (Topbar)**
  - Пункты меню видны по ролям: Дефекты — всем; Проекты/Объекты/Этапы — `admin/manager`; Отчёты — `admin/manager/observer`.
  - Справа профиль: имя, должность (description роли), Профиль, Выход.

---

## Архитектура

Архитектура разделена на слои и сервисы:

- **App Router + Route Handlers** — UI и API в одном Next.js проекте.
- **RBAC** — проверка прав на стороне API и видимость пунктов в навбаре.
- **Auth** — JWT в HTTP‑only cookie; middleware защищает приватные маршруты.
- **DB** — PostgreSQL + Drizzle ORM, миграции, явная схема (`db/schema.ts`).
- **Storage** — локальное хранилище файлов (`UPLOAD_DIR`).

```mermaid
classDiagram
    class WebApp {
      +Next.js(App Router)
      +HeroUI UI
      +Topbar & Pages
    }
    class ApiHandlers {
      +/api/auth/*
      +/api/projects|objects|stages
      +/api/defects/*
      +/api/reports/*
    }
    class AuthRBAC {
      +JWT (cookies)
      +Middleware
      +allowRoles()
    }
    class Database {
      +PostgreSQL
      +Drizzle ORM
      +Migrations
    }
    class Storage {
      +UPLOAD_DIR
      +saveFile()
      +download
    }
    WebApp ..> ApiHandlers
    ApiHandlers ..> AuthRBAC
    ApiHandlers ..> Database
    ApiHandlers ..> Storage
```

## Модель данных

```mermaid
erDiagram
  ROLES ||--o{ USERS : has
  USERS ||--o{ DEFECTS : creates
  USERS ||--o{ DEFECTS : assigned
  PROJECTS ||--o{ OBJECTS : contains
  OBJECTS ||--o{ STAGES : contains
  PROJECTS ||--o{ DEFECTS : contains
  OBJECTS ||--o{ DEFECTS : contains
  STAGES ||--o{ DEFECTS : optional
  DEFECTS ||--o{ COMMENTS : has
  USERS ||--o{ COMMENTS : writes
  DEFECTS ||--o{ FILES : has
  USERS ||--o{ FILES : uploads

  ROLES {
    int id PK
    text name
    text description
  }
  USERS {
    uuid id PK
    text email
    text full_name
    int role_id FK
    bool is_active
  }
  PROJECTS {
    int id PK
    text name
    text description
  }
  OBJECTS {
    int id PK
    int project_id FK
    text name
    text address
  }
  STAGES {
    int id PK
    int object_id FK
    text name
  }
  DEFECTS {
    int id PK
    text title
    text status
    text priority
    int project_id FK
    int object_id FK
    int stage_id FK
    uuid assignee_id FK
    uuid creator_id FK
    timestamptz due_date
    timestamptz closed_at
  }
  COMMENTS {
    int id PK
    int defect_id FK
    uuid author_id FK
    text content
  }
  FILES {
    int id PK
    int defect_id FK
    uuid uploader_id FK
    text filename
    text storage_key
    text mime_type
    int size_bytes
  }
```

## Жизненный цикл дефекта

```mermaid
stateDiagram-v2
    [*] --> new: создать
    new --> in_progress: начать работу
    new --> cancelled: отменить

    in_progress --> review: на проверку
    in_progress --> cancelled: отменить

    review --> closed: закрыть
    review --> in_progress: вернуть в работу
    review --> cancelled: отменить

    closed --> [*]
    cancelled --> [*]
```

## Паттерны и практики

- **Adapter** — изоляция файлового хранилища в `lib/storage.ts` (путь из `UPLOAD_DIR`, функции `saveFile`, `getPath`).
- **Service Module** — единые точки входа в инфраструктуру: `lib/db.ts`, `lib/jwt.ts`, `lib/auth.ts`.
- **RBAC** — `allowRoles(session, roles)` на API; в UI пункты меню скрываются по роли.
- **Auditable actions** — история по дефектам (маршруты `.../history` для чтения).

---

## Запуск

### Вариант A: Docker Compose (рекомендуется)

1) Создайте `.env` по образцу `.env.example` и задайте минимум `SESSION_SECRET`.
2) Соберите и поднимите контейнеры:

```bash
docker compose up -d --build
```

Приложение: http://localhost:${APP_PORT:-3000}  
База: сервис `db` внутри Compose. `DATABASE_URL` для `app` собирается автоматически из `POSTGRES_*`.

Логи приложения:

```bash
docker compose logs -f app
```

Остановить:

```bash
docker compose down
```

### Вариант B: локально (Node.js 20+, PostgreSQL установлен)

1) `.env` (пример):

```env
DATABASE_URL=postgres://postgres:1234@localhost:5432/control_system
SESSION_SECRET=super-long-random-secret
JWT_EXPIRES=7d
COOKIE_NAME=token
UPLOAD_DIR=./uploads
```

2) Установка и миграции:

```bash
npm ci
npm run db:migrate
```

3) Запуск дев-сервера:

```bash
npm run dev
```

---

## Первичный вход (seed ролей и админа)

При первом входе на `POST /api/auth/signin` (если в таблице `users` нет записей) бэкенд:
- создаёт базовые роли: `admin`, `manager`, `engineer`, `observer`;
- создаёт пользователя-админа c `email`, переданным в форме, и паролем из этого же запроса;
- выдаёт JWT и сохраняет его в HTTP-only cookie (`COOKIE_NAME`).

То есть, чтобы инициализировать систему: отправьте запрос входа с желаемым `email` и паролем — вы станете администратором.

---

## Матрица ролей (RBAC)

| Раздел/операция                | admin | manager | engineer | observer |
|--------------------------------|:-----:|:-------:|:--------:|:--------:|
| Просмотр дефектов              |   ✓   |    ✓    |    ✓     |    ✓     |
| Создание/редактирование дефектов |   ✓   |    ✓    | автор/исп. |    ✗     |
| Смена статуса дефекта          |   ✓   |    ✓    | автор/исп. |    ✗     |
| Комментарии (CRUD своих)       |   ✓   |    ✓    |    ✓     |    ✗     |
| Комментарии (модерация чужих)  |   ✓   |    ✓    |    ✗     |    ✗     |
| Файлы: загрузка/удаление       |   ✓   |    ✓    | автор/исп. |    ✗     |
| Проекты/Объекты/Этапы: создание|   ✓   |    ✓    |    ✗     |    ✗     |
| Экспорт отчётов                |   ✓   |    ✓    |    ✗     |    ✓     |

Примечание: «автор/исп.» означает, что инженер может изменять дефект, если он автор или назначенный исполнитель.

---

## Тестирование (Postman)

- **Файлы**:
  - Коллекция: `test base/Control System API Tests.postman_collection.json`
  - Окружение: `test base/Control System - Local.postman_environment.json`

- **Шаги**:
  1) Импортируйте коллекцию и окружение в Postman.
  2) Выберите окружение `Control System - Local` и проверьте переменную `base_url` (по умолчанию `http://localhost:3000`).
  3) Выполните `0. Dev / Seed demo data` для заполнения демо-данными.
  4) Выполните `1. Auth → 1.1 Sign in (admin)` — куки сохраняются автоматически (HTTP-only cookie).
  5) Запускайте запросы из разделов: `Reference`, `Defects`, `Comments & Files & History`, `Reports`.
  6) Для `4.3 Upload file` прикрепите любой файл в поле form-data `file`.

- **Учётные записи (после сидирования)**:
  - admin: `admin@demo.local` / `demo1234`
  - manager: `manager@demo.local` / `demo1234`
  - engineer: `engineer@demo.local` / `demo1234`
  - observer: `observer@demo.local` / `demo1234`

- **Примечания**:
  - Если Postman не отправляет cookie, включите Cookie Jar (Cookies — ON) для домена `base_url`.
  - В прод-сборке (`NODE_ENV=production`) сидер требует токен: задайте `SEED_TOKEN` в окружении приложения и вызовите
    `POST {{base_url}}/api/dev/seed?token=ВАШ_ТОКЕН` или добавьте заголовок `Authorization: Bearer ВАШ_ТОКЕН`.

---

## Переменные окружения

- `SESSION_SECRET` — секрет для JWT (обязательно).
- `JWT_EXPIRES` — срок действия JWT (`7d` по умолчанию).
- `COOKIE_NAME` — имя cookie (`token`).
- `DATABASE_URL` — строка подключения (в Docker собирается из `POSTGRES_*`).
- `UPLOAD_DIR` — путь хранения файлов (в Docker `/app/uploads`).
- `APP_PORT` — порт приложения (по умолчанию `3000`).
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT` — для Compose.

---

## Основные эндпоинты

- `POST /api/auth/signin` — вход; создаёт HTTP‑only cookie.
- `POST /api/auth/signout` — выход (очистка cookie).
- `GET /api/auth/me` — сведения о текущем пользователе и его роли/должности.
- `GET|POST /api/projects`, `GET|POST /api/objects`, `GET|POST /api/stages` — справочники.
- `GET|POST /api/defects` — список/создание дефектов (фильтры и пагинация).
- `GET|PATCH /api/defects/:id` — карточка/редактирование, смена статуса.
- `GET|POST /api/defects/:id/comments` — комментарии; `PATCH /api/comments/:id`, `DELETE /api/comments/:id`.
- `GET|POST /api/defects/:id/files` — загрузка/список; `GET /api/files/:id/download`, `DELETE /api/files/:id`.
- `GET /api/defects/:id/history` — история изменений.
- `GET /api/reports/defects/export?format=csv|xlsx&...` — экспорт отчётов.

---

## Roadmap

- Расширить матрицу прав по ролям (UI+API).
- Rate limiting, расширенная валидация и логирование.
- Дашборды и графики в отчётах.
- Настраиваемые статусы/приоритеты.
  - Интеграции с внешними системами (опционально).

-----

## FAQ / Известные вопросы

- Как попасть в систему в первый раз?
  - Отправьте `POST /api/auth/signin` с любым email и паролем — при отсутствии пользователей будет создан админ с этими данными.
- Почему я не вижу кнопку «Создать …»?
{{ ... }}
- Почему пункт «Отчёты» не виден?
  - Видимость в Navbar по ролям: `admin/manager/observer` — видят «Отчёты», остальные — нет.
- Где хранятся файлы?
  - На файловой системе в каталоге `UPLOAD_DIR` (`/app/uploads` в Docker). В БД сохраняются только метаданные и путь (storageKey).
- Как изменить длительность жизни JWT?
  - Переменная `JWT_EXPIRES` (например, `7d`). Не забудьте перезапустить сервис.
- Нужен ли `DATABASE_URL` в Docker?
  - Нет, compose собирает его из `POSTGRES_*`. Для локального запуска без Docker `DATABASE_URL` обязателен.

---
