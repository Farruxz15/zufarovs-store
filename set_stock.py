#!/usr/bin/env python3
"""Отмечает, какие товары есть в наличии, а какие показывать как «Скоро».

Список наличия — файл in_stock.txt, по одной позиции в строке.
Строку можно писать как угодно:
    p01                     — по id товара
    Beauty of Joseon        — по бренду: попадут ВСЕ товары этого бренда
    Dokdo Cleanser          — по куску названия (регистр не важен)
Пустые строки и строки, начинающиеся с #, игнорируются.

Всё, что не совпало ни с одной строкой, получает "soon": true —
в мини-аппе такой товар виден в каталоге, но вместо цены у него
надпись «Скоро», кнопки «в корзину» нет, а цены нет даже в исходнике.

Запуск:  python3 set_stock.py
Скрипт сам пересчитывает цены (reprice.py) в конце.
"""
import pathlib
import sys

import reprice

ROOT = pathlib.Path(__file__).parent
STOCK_FILE = ROOT / 'in_stock.txt'


def haystack(p):
    parts = [p.get('brand', ''), p.get('nameRu', ''), p.get('nameUz', '')]
    return ' '.join(parts).lower()


def main():
    if not STOCK_FILE.exists():
        print(f'Нет файла {STOCK_FILE.name}. Создайте его и впишите товары в наличии.')
        sys.exit(1)

    data = reprice.load_products()
    lines = [ln.strip() for ln in STOCK_FILE.read_text(encoding='utf-8').splitlines()]
    lines = [ln for ln in lines if ln and not ln.startswith('#')]

    in_stock = set()
    unmatched = []
    for ln in lines:
        key = ln.lower()
        hits = [p for p in data if p['id'] == key or key in haystack(p)]
        if not hits:
            unmatched.append(ln)
            continue
        for p in hits:
            in_stock.add(p['id'])
        if len(hits) == 1:
            print(f'  ✓ {ln}  →  {hits[0]["id"]} {hits[0]["nameRu"][:45]}')
        else:
            print(f'  ✓ {ln}  →  совпало товаров: {len(hits)}')
            for p in hits:
                print(f'        {p["id"]} {(p["brand"] + " " + p["nameRu"]).strip()[:55]}')

    if unmatched:
        print('\n! НЕ НАЙДЕНО в каталоге (эти строки ни на что не повлияли):')
        for ln in unmatched:
            print(f'    {ln}')
        print('  Проверьте написание или добавьте товар в каталог.')

    for p in data:
        if p['id'] in in_stock:
            p.pop('soon', None)
        else:
            p['soon'] = True

    reprice.save_products(data)
    print(f'\nВ наличии: {len(in_stock)} · «Скоро»: {len(data) - len(in_stock)} из {len(data)}')
    print('\nПересчитываю цены...')
    reprice.main()


if __name__ == '__main__':
    main()
