#!/usr/bin/env python3
"""
products.js dan har bir mahsulot uchun alohida HTML sahifa yasaydi.
Ishlatish:  python3 build_seo.py
Natija:     p/<id>.html, katalog.html, sitemap.xml, robots.txt
products.js o'zgargan har safar qayta ishlating.
"""
import json, os, re, html, datetime

# ---------- SOZLAMALAR ----------
SITE = "https://farruxz15.github.io/zufarovs-store"
TG_APP = "https://t.me/zufarovs_store_bot"   # <-- BOT/MINI APP HAVOLASI. TEKSHIRIB TO'G'IRLANG
SHOP = "ZUFAROVS’ STORE"
CITY = "Ташкенте"        # предложный падеж: "в Ташкенте"
CITY_N = "Ташкент"       # именительный
# --------------------------------

root = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(root, "products.js"), encoding="utf-8").read()
P = json.loads(src[src.find("["): src.rfind("]") + 1])
P = [p for p in P if p.get("price")]          # narxi 0 bo'lganlar sahifaga chiqmaydi

CAT = {"cleanser": "Очищение", "toner": "Тонер", "serum": "Сыворотка", "cream": "Крем",
       "spf": "Солнцезащита", "makeup": "Макияж", "mask": "Маска", "hair": "Уход за волосами",
       "set": "Набор", "other": "Другое", "moisture": "Увлажнение"}

e = lambda s: html.escape(str(s or ""), quote=True)
money = lambda n: f"{n:,}".replace(",", " ")


def clip(s, n=155):
    s = re.sub(r"\s+", " ", (s or "")).strip()
    return s if len(s) <= n else s[:n - 1].rsplit(" ", 1)[0] + "…"


def title_of(p):
    name = p["nameRu"]
    return name if p["brand"] and p["brand"].lower() in name.lower() else f'{p["brand"]} {name}'.strip()


HEAD = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="product">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:site_name" content="{shop}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
:root{{--bg:#f7f4ef;--ink:#1f1d1a;--muted:#746f68;--green:#355847;--line:#e5ded4;--soft:#eee8df}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font-family:Manrope,system-ui,sans-serif;line-height:1.6}}
.wrap{{max-width:720px;margin:0 auto;padding:20px 16px 60px}}
a{{color:var(--green)}}
.crumb{{font-size:12px;color:var(--muted);margin-bottom:18px}}
.card{{background:#fff;border:1px solid var(--line);border-radius:26px;overflow:hidden}}
.ph{{background:#f3efe9;display:grid;place-items:center;min-height:220px;padding:20px}}
.ph img{{width:100%;max-height:320px;object-fit:contain}}
.body{{padding:22px}}
.eyebrow{{font-size:10px;letter-spacing:.16em;color:var(--muted);font-weight:800;text-transform:uppercase}}
h1{{font-family:'Playfair Display',serif;font-size:29px;line-height:1.12;margin:6px 0 12px}}
.price{{font-size:23px;font-weight:800;margin:0 0 4px}}
.old{{color:var(--muted);text-decoration:line-through;font-size:15px;font-weight:400;margin-left:8px}}
.cta{{display:block;text-align:center;background:var(--green);color:#fff;text-decoration:none;
border-radius:16px;padding:16px;font-weight:800;margin:20px 0 10px}}
.note{{font-size:12px;color:var(--muted);margin:0}}
h2{{font-size:15px;margin:26px 0 6px}}
p{{margin:0 0 12px}}
.tags{{display:flex;flex-wrap:wrap;gap:7px;margin:14px 0 0;padding:0;list-style:none}}
.tags li{{background:var(--soft);border-radius:999px;padding:7px 11px;font-size:11px;font-weight:700}}
.meta{{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}}
.meta div{{background:var(--bg);border-radius:14px;padding:12px}}
.meta span{{display:block;font-size:10px;color:var(--muted);margin-bottom:3px}}
.meta strong{{font-size:14px}}
footer{{margin-top:36px;font-size:12px;color:var(--muted)}}
.grid{{display:grid;grid-template-columns:1fr;gap:8px;padding:0;margin:16px 0 0;list-style:none}}
.grid a{{display:flex;justify-content:space-between;gap:12px;background:#fff;border:1px solid var(--line);
border-radius:14px;padding:12px 14px;text-decoration:none;color:var(--ink);font-size:14px}}
.grid b{{white-space:nowrap;color:var(--green)}}
@media(min-width:640px){{.grid{{grid-template-columns:1fr 1fr}}}}
</style>
{ld}
</head>
<body><div class="wrap">
"""


def product_page(p):
    t = title_of(p)
    url = f"{SITE}/p/{p['id']}.html"
    desc = clip(p.get("shortRu") or t)
    seo_title = f"{t} — купить в {CITY} | {SHOP}"
    img = f"{SITE}/{p['image']}"
    ld = json.dumps({
        "@context": "https://schema.org", "@type": "Product",
        "name": t, "description": desc, "brand": {"@type": "Brand", "name": p["brand"] or SHOP},
        "image": img, "category": CAT.get(p["category"], p["category"]),
        "offers": {"@type": "Offer", "url": url, "price": p["price"], "priceCurrency": "UZS",
                   "availability": "https://schema.org/InStock",
                   "seller": {"@type": "Organization", "name": SHOP}}
    }, ensure_ascii=False, indent=None)
    out = HEAD.format(title=e(seo_title), desc=e(desc), url=url, shop=e(SHOP),
                      ld=f'<script type="application/ld+json">{ld}</script>')
    old = f'<span class="old">{money(p["oldPrice"])} сум</span>' if p.get("oldPrice") else ""
    tags = "".join(f"<li>{e(x)}</li>" for x in (p.get("concerns") or []))
    out += f"""<p class="crumb"><a href="{SITE}/katalog.html">Каталог</a> → {e(CAT.get(p['category'], p['category']))}</p>
<article class="card">
<div class="ph"><img src="{SITE}/{e(p['image'])}" alt="{e(t)}" loading="lazy"></div>
<div class="body">
<p class="eyebrow">{e(p['brand'] or 'Корея')}</p>
<h1>{e(t)}</h1>
<p class="price">{money(p['price'])} сум{old}</p>
<a class="cta" href="{TG_APP}">Заказать в Telegram</a>
<p class="note">Заказ оформляется в Telegram. Доставка по {CITY} и Узбекистану, плюс 10$ за каждый килограмм веса заказа.</p>
<h2>Описание</h2><p>{e(p.get('shortRu'))}</p>
<h2>Как применять</h2><p>{e(p.get('useRu'))}</p>
{f'<ul class="tags">{tags}</ul>' if tags else ''}
<div class="meta">
<div><span>Категория</span><strong>{e(CAT.get(p['category'], p['category']))}</strong></div>
<div><span>Объём</span><strong>{e(p.get('volume') or '—')}</strong></div>
</div>
</div></article>
<footer>{e(SHOP)} — оригинальная корейская косметика, {e(CITY_N)}.
<a href="{SITE}/katalog.html">Весь каталог</a></footer>
</div></body></html>"""
    return out


def catalog_page():
    url = f"{SITE}/katalog.html"
    desc = f"Каталог корейской косметики в {CITY}: {len(P)} товаров — уход, макияж, SPF. Заказ в Telegram."
    out = HEAD.format(title=e(f"Каталог корейской косметики в {CITY} | {SHOP}"),
                      desc=e(desc), url=url, shop=e(SHOP), ld="")
    out += f"<h1>Каталог — {len(P)} товаров</h1><p>{e(desc)}</p>"
    by = {}
    for p in P:
        by.setdefault(p["category"], []).append(p)
    for c, items in sorted(by.items(), key=lambda x: -len(x[1])):
        out += f'<h2>{e(CAT.get(c, c))} ({len(items)})</h2><ul class="grid">'
        for p in sorted(items, key=lambda x: title_of(x)):
            out += (f'<li><a href="{SITE}/p/{p["id"]}.html"><span>{e(title_of(p))}</span>'
                    f'<b>{money(p["price"])} сум</b></a></li>')
        out += "</ul>"
    out += f'<footer><a href="{SITE}/">Открыть магазин</a></footer></div></body></html>'
    return out


os.makedirs(os.path.join(root, "p"), exist_ok=True)
for p in P:
    open(os.path.join(root, "p", p["id"] + ".html"), "w", encoding="utf-8").write(product_page(p))
open(os.path.join(root, "katalog.html"), "w", encoding="utf-8").write(catalog_page())

today = datetime.date.today().isoformat()
urls = [(SITE + "/", "1.0"), (f"{SITE}/katalog.html", "0.9")] + \
       [(f"{SITE}/p/{p['id']}.html", "0.7") for p in P]
sm = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u, pr in urls:
    sm.append(f"<url><loc>{u}</loc><lastmod>{today}</lastmod><priority>{pr}</priority></url>")
sm.append("</urlset>")
open(os.path.join(root, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(sm))
open(os.path.join(root, "robots.txt"), "w", encoding="utf-8").write(
    f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")

print(f"{len(P)} ta sahifa yasaldi + katalog.html + sitemap.xml + robots.txt")
