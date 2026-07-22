# -*- coding: utf-8 -*-
import re, json, os, shutil

REPO   = os.getcwd()
BASE   = "/Users/macbook/Cosmetics"
IMAGES = os.path.join(REPO, "images")
PJS    = os.path.join(REPO, "products.js")

cand = [d for d in os.listdir(BASE) if d.startswith("Карточк")]
if not cand:
    raise SystemExit("Папка Карточки не найдена в " + BASE)
CARDS = os.path.join(BASE, cand[0])
print("Карточки:", repr(CARDS))

raw = open(PJS, encoding="utf-8").read()
m = re.search(r'window\.PRODUCTS\s*=\s*(\[.*\])', raw, re.S)
data = json.loads(m.group(1))
by_id = {str(p.get("id")): p for p in data}

shutil.copy(PJS, PJS + ".bak")  # бэкап на всякий случай

exts = (".png", ".jpg", ".jpeg", ".webp")
files = [f for f in os.listdir(CARDS)
         if f.lower().endswith(exts) and not f.startswith(".")]

matched, skipped, seen = [], [], {}
for f in sorted(files):
    stem, ext = os.path.splitext(f)
    token = stem.strip().split()[0] if stem.strip() else ""
    if not re.match(r'^p\d+$', token):
        skipped.append((f, "не разобрал ID")); continue
    pid = token
    if pid not in by_id:
        skipped.append((f, "нет товара " + pid + " в базе")); continue
    num = str(int(pid[1:]))                 # p08 -> 8, p199 -> 199
    target = num + ext.lower()
    shutil.copy(os.path.join(CARDS, f), os.path.join(IMAGES, target))
    old = by_id[pid].get("image")
    by_id[pid]["image"] = "images/" + target
    matched.append((pid, f, old, "images/" + target))
    seen.setdefault(pid, []).append(f)

new_json = json.dumps(data, ensure_ascii=False, indent=2)
open(PJS, "w", encoding="utf-8").write(raw[:m.start(1)] + new_json + raw[m.end(1):])

print("\nОБНОВЛЕНО:", len(matched))
for pid, f, old, new in matched:
    print("  " + pid + ": " + f + "  |  " + str(old) + " -> " + new)
if skipped:
    print("\nНЕ ОБРАБОТАНО:")
    for f, why in skipped:
        print("  " + f + "  (" + why + ")")
dups = {k: v for k, v in seen.items() if len(v) > 1}
if dups:
    print("\nДУБЛИ ID (несколько файлов на один ID):", dups)
