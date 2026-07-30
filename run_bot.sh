#!/bin/bash
# Запуск бота ZUFAROVS' STORE
cd "$(dirname "$0")"
source .venv/bin/activate
if [ -f bot.env ]; then
  set -a; source bot.env; set +a
else
  echo "⚠️  Нет файла bot.env — скопируйте bot.env.example в bot.env и впишите токен."
  exit 1
fi
echo "▶️  Запускаю бота…  (остановить: Ctrl+C)"
python bot_miniapp.py
