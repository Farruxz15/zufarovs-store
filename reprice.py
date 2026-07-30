#!/usr/bin/env python3
"""Пересчёт розничных цен каталога zufarovs-store.

Розничная цена = (закупка + цена веса) × наценка, округлённая до 1000 сум,
где цена веса = weight (кг) × KG_FEE_USD × USD_RATE.

Вес зашит в цену каждого товара, поэтому отдельной доплаты за вес
в корзине больше нет — клиент видит финальный ценник.

Закупочные цены НЕ лежат в products.js: репозиторий публичный, и держать
там свою маржу нельзя. Они хранятся в costs.json, который в .gitignore
и остаётся только на локальной машине. При первом запуске costs.json
создаётся из текущих цен products.js.

Скрипт идемпотентный: цена всегда считается от закупки из costs.json,
поэтому повторный запуск не накрутит наценку второй раз.

У товаров с "soon": true (нет в наличии) цена не публикуется вообще —
в products.js у них price: null. Список наличия — in_stock.txt,
применяется скриптом set_stock.py, который потом сам зовёт этот.

Что где менять:
  курс доллара, ставку за кг, наценку — константы ниже
  вес товара                         — поле "weight" в products.js
  закупочную цену                    — costs.json
  что есть в наличии                 — in_stock.txt + python3 set_stock.py
Потом: python3 reprice.py
"""
import json
import pathlib

USD_RATE = 12350    # 1$ в сумах
KG_FEE_USD = 10     # доставка из Кореи, $ за 1 кг
MARKUP = 1.25       # наценка на полную себестоимость (закупка + вес)
ROUND_TO = 1000     # до чего округляем ценник, сум
DEFAULT_WEIGHT = 0.2  # если у товара не указан вес, кг

ROOT = pathlib.Path(__file__).parent
PRODUCTS = ROOT / 'products.js'
COSTS = ROOT / 'costs.json'


def load_products():
    src = PRODUCTS.read_text(encoding='utf-8')
    return json.loads(src[src.index('['):src.rindex(']') + 1])


def save_products(data):
    body = json.dumps(data, ensure_ascii=False, indent=2)
    PRODUCTS.write_text(f'window.PRODUCTS = {body};\n', encoding='utf-8')


def retail(cost, weight):
    ship = weight * KG_FEE_USD * USD_RATE
    return int(round((cost + ship) * MARKUP / ROUND_TO) * ROUND_TO)


def main():
    data = load_products()

    if COSTS.exists():
        costs = json.loads(COSTS.read_text(encoding='utf-8'))
    else:
        # первый запуск: цены в products.js — это ещё закупочные
        costs = {p['id']: p['price'] for p in data}
        COSTS.write_text(json.dumps(costs, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'Создан {COSTS.name}: закупка по {len(costs)} товарам (файл в .gitignore).')

    missing = [p['id'] for p in data if p['id'] not in costs]
    if missing:
        print(f'! Нет закупочной цены, цена не изменена: {", ".join(missing)}')
        print(f'  Впишите их в {COSTS.name} и запустите скрипт снова.')

    changed = []
    soon = 0
    for p in data:
        if p.get('soon'):
            # нет в наличии: цена не публикуется — её не должно быть
            # ни на экране, ни в исходнике products.js
            p['price'] = None
            soon += 1
            continue
        cost = costs.get(p['id'])
        if cost is None:
            continue
        new = retail(cost, p.get('weight', DEFAULT_WEIGHT))
        if new != p['price']:
            changed.append((p['id'], p['price'], new))
            p['price'] = new

    save_products(data)
    print(f'Курс {USD_RATE} сум/$ · {KG_FEE_USD}$/кг · наценка ×{MARKUP} · округление до {ROUND_TO}')
    print(f'Товаров в каталоге: {len(data)} · в продаже: {len(data) - soon} · «скоро»: {soon}')
    print(f'Цен изменено: {len(changed)}')


if __name__ == '__main__':
    main()
