# MixerGrief — Форма заявки в команду

Сайт с формой заявки + вход через **Discord OAuth** + публикация заявок в Discord-канал (embed). **Готов к деплою на Vercel** (serverless).

## Архитектура (почему так)

Vercel — это serverless (короткоживущие функции), поэтому здесь **нет постоянного бота**:

- **Публикация заявки** — через Discord REST API (обычный HTTP-запрос от имени бота).
- **Сессии** — в подписанных cookie (без серверной памяти и БД).
- **Анти-спам** — мягкий cooldown 5 минут на cookie (для надёжной защиты можно подключить Vercel KV).

```
api/index.js        точка входа Vercel (экспортирует Express-приложение)
src/app.js          все маршруты: OAuth, /api/submit
src/discord.js      REST-публикация заявки (embed)
src/form-config.js  поля формы + валидация (единый источник правды)
src/sign.js         подписанные cookie (stateless-сессии)
src/server.js       локальный запуск (npm start)
public/             сайт (index.html, styles.css, app.js)
vercel.json         маршрутизация + включение public/ в функцию
```

## Что нужно в Discord (один раз)

1. **OAuth-вход:** https://discord.com/developers/applications → твоё приложение →
   **OAuth2** → скопируй **Client ID** и **Client Secret**.
2. **Бот:** вкладка **Bot** → **Reset Token** → токен (`DISCORD_BOT_TOKEN`).
   Пригласи бота на сервер: **OAuth2 → URL Generator** → scope `bot`,
   права **View Channels** + **Send Messages** → открой ссылку, добавь на сервер.
3. **ID канала и роли:** включи режим разработчика (Настройки → Расширенные),
   ПКМ по каналу → Копировать ID (`DISCORD_CHANNEL_ID`),
   ПКМ по роли → Копировать ID (`DISCORD_PING_ROLE_ID`, необязательно).

## Деплой на Vercel

1. Залей проект на GitHub (или через `vercel` CLI).
2. На https://vercel.com → **Add New → Project** → импортируй репозиторий.
   Framework Preset: **Other**, ничего настраивать не нужно — есть `vercel.json`.
3. **Settings → Environment Variables** добавь:
   | Переменная | Значение |
   |---|---|
   | `DISCORD_CLIENT_ID` | из OAuth2 |
   | `DISCORD_CLIENT_SECRET` | из OAuth2 |
   | `DISCORD_REDIRECT_URI` | `https://ТВОЙ-ПРОЕКТ.vercel.app/api/auth/callback` |
   | `DISCORD_BOT_TOKEN` | токен бота |
   | `DISCORD_CHANNEL_ID` | ID канала |
   | `DISCORD_PING_ROLE_ID` | ID роли (необязательно) |
   | `SESSION_SECRET` | длинная случайная строка |
4. **Deploy.** После деплоя узнаешь домен `https://ТВОЙ-ПРОЕКТ.vercel.app`.
5. Вернись в **Discord Developer Portal → OAuth2 → Redirects** и добавь
   `https://ТВОЙ-ПРОЕКТ.vercel.app/api/auth/callback` (точно как в `DISCORD_REDIRECT_URI`).

> Если поменял переменные окружения в Vercel — нажми **Redeploy**, чтобы они применились.

## Локальный запуск (для разработки)

```bash
cp .env.example .env      # заполни значения (DISCORD_REDIRECT_URI оставь на localhost)
npm install
npm start                 # http://localhost:3000
```
Публикация заявки и вход через Discord работают и локально.

## Как поменять вопросы формы
Открой [`src/form-config.js`](src/form-config.js), правь массив `fields`. Типы:
`text` (можно `pattern` + `patternError`), `number` (`min`/`max`),
`textarea` (`minWords`), `choice` (`options: ['Да','Нет']`).
Меняешь там — обновляется форма, валидация и сообщение в Discord.

## Безопасность
- Все секреты — в переменных окружения (`.env` локально, Vercel Settings в проде). `.env` в `.gitignore`.
- Если бот-токен где-то засветился — **Reset Token** в портале и обнови переменную.
