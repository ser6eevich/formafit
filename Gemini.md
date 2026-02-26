# Описание проекта: AI Fitness Telegram Mini App
Ты — Senior Full-Stack Developer и эксперт по интеграции OpenAI API. Твоя задача — написать Telegram Mini App для новичков в тренажерном зале.

## 1. Язык и Коммуникация (СТРОГОЕ ПРАВИЛО)
- **Все размышления (thinking process), пошаговые планы, объяснения логики и ответы мне ДОЛЖНЫ быть исключительно на русском языке.**
- **Комментарии в коде** (JSDoc, пояснения сложных алгоритмов) также пиши на русском языке.
- Названия переменных, функций, компонентов, таблиц БД и эндпоинтов API оставляй на английском (согласно общепринятым стандартам разработки: camelCase, PascalCase, snake_case).

## 2. Стек технологий
- Frontend: React (Next.js App Router), Tailwind CSS, Framer Motion (для анимаций).
- Интеграция TG: @twa-dev/sdk (Telegram Web App SDK).
- Backend: Next.js Route Handlers (API) или Node.js.
- База данных: PostgreSQL, Prisma ORM.
- AI: OpenAI API (gpt-4o-mini для чата/логики, gpt-4o для Vision).
- Деплой: Docker (target environment: Ubuntu VPS in the Netherlands).

## 3. UI/UX Гайдлайны (Строго)
- Дизайн: Экосистема Apple. Чистый минимализм, много воздуха (whitespace), скругленные углы (rounded-2xl, rounded-3xl), эффект glassmorphism (backdrop-blur) где уместно.
- Шрифты: Системные. Строго использовать семейство San Francisco (SF Pro) / `-apple-system, BlinkMacSystemFont`.
- Анимации: Плавные переходы между экранами, легкий scale при нажатии на кнопки (Framer Motion).
- Избегать визуального шума. Данные по БЖУ выводить в виде круговых прогресс-баров. В карточках упражнений использовать подготовленные motion-лупы (mp4/gif), без сторонних iframe.

## 4. Схема Базы Данных (Prisma - Драфт)
- `User`: telegramId, name, age, weight, height, goal, injuries, experienceLevel, createdAt.
- `Workout`: id, userId, date, type (generated/custom), status (planned/completed).
- `ExerciseLog`: id, workoutId, exerciseId, sets (JSON - reps, weight), rpe (easy/normal/hard).
- `NutritionLog`: id, userId, date, photoUrl (optional), items (JSON - name, calories, protein, carbs, fats).
- `ChatHistory`: id, userId, role (user/assistant), content, timestamp.

## 5. Правила работы с AI (Промпты и Контекст)
- System Prompt должен быть динамическим. При каждом обращении к API сервер должен инжектить актуальные данные из таблицы `User`.
- Формат общения AI: Дружелюбный фитнес-бро, поддерживающий, но профессиональный. Короткие ответы, оптимизированные для чтения с экрана телефона во время отдыха между подходами.
- Структурированный вывод: Для генерации тренировок, оценки питания и составления списков покупок ВСЕГДА использовать `response_format: { type: "json_object" }` и передавать строгую схему JSON.

## 6. Зависимости и Логика
- Авто-прогрессия: При завершении тренировки скрипт анализирует `ExerciseLog`. Если `rpe === 'easy'`, для этого упражнения на следующую неделю `weight` увеличивается на 2.5.
- Vision API: Изображения от пользователя (еда) сжимаются перед отправкой в OpenAI для экономии токенов и ускорения ответа.
- Telegram Theme: Приложение должно автоматически адаптироваться под `tgWebAppThemeParams` (Dark/Light mode пользователя).

## 7. Процесс разработки (Инструкция для AI)
1. Сначала генерируй Prisma schema и настраивай подключение к БД.
2. Затем создавай базовый Layout с навигацией (Tab bar) и интеграцией TG SDK.
3. Разрабатывай модули пошагово: Onboarding -> Workouts -> Nutrition -> AI Chat.
4. Перед написанием или изменением сложного компонента, кратко опиши его логику на русском языке для моего подтверждения.