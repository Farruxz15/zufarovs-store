# ZUFAROVS’ STORE Mini App

## Размещение на GitHub Pages
1. Создайте новый публичный репозиторий `zufarovs-miniapp`.
2. Загрузите все файлы из этой папки в корень репозитория.
3. GitHub → Settings → Pages → Deploy from a branch → `main` / root.
4. Полученный HTTPS-адрес добавьте в переменную `MINI_APP_URL` бота.
5. BotFather → /mybots → ваш бот → Bot Settings → Menu Button → Configure menu button → вставьте HTTPS-адрес.

## Локальная проверка
```bash
cd zufarovs-miniapp
python3 -m http.server 8080
```
Откройте http://localhost:8080 в браузере. Передача заказа работает только при открытии внутри Telegram.

## Где менять товары
Все цены, названия и описания находятся в `products.js`.

## Важно
Mini App — статический фронтенд. История заказов и статистика должны сохраняться ботом или серверной базой данных. В комплекте ниже есть обновлённый бот с JSON-журналом заказов.
