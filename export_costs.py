#!/usr/bin/env python3
"""Готовит закупочные цены для переменной окружения бота на Railway.

Зачем: боту нужна закупка, чтобы считать прибыль в уведомлении о заказе.
Положить costs.json в репозиторий нельзя — он публичный, и любой человек
увидел бы себестоимость и маржу. Поэтому закупка едет в бот отдельно,
секретной переменной Railway.

Запуск:
    python3 export_costs.py

Скрипт печатает одну строку JSON. Дальше:
    Railway → проект → сервис worker → Variables → New Variable
    Name:  PRODUCT_COSTS
    Value: (вставить напечатанную строку целиком)
    → Deploy

Повторять после каждого изменения закупочных цен в costs.json.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
COSTS = ROOT / 'costs.json'


def main():
    if not COSTS.exists():
        print(f'Нет файла {COSTS.name}. Сначала запустите reprice.py.', file=sys.stderr)
        sys.exit(1)

    costs = json.loads(COSTS.read_text(encoding='utf-8'))
    # компактно, без пробелов — переменная окружения должна быть в одну строку
    payload = json.dumps(costs, separators=(',', ':'), ensure_ascii=False)

    print(f'Товаров: {len(costs)} · длина строки: {len(payload)} символов', file=sys.stderr)
    print('Скопируйте строку ниже целиком в Railway → Variables → PRODUCT_COSTS\n', file=sys.stderr)
    print(payload)


if __name__ == '__main__':
    main()
