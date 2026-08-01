"""ZUFAROVS' STORE bot + Telegram Mini App checkout.
Python 3.10+, python-telegram-bot 22+
"""
import json, logging, os, html
from datetime import datetime
from pathlib import Path
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, KeyboardButton, ReplyKeyboardMarkup, ReplyKeyboardRemove, WebAppInfo, MenuButtonDefault
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, ConversationHandler, ContextTypes, filters

logging.basicConfig(format='%(asctime)s | %(levelname)s | %(name)s | %(message)s', level=logging.INFO)
BOT_TOKEN=os.getenv('BOT_TOKEN','').strip()
# Кому уходят уведомления о заказах. Можно несколько ID через запятую,
# например: ADMIN_ID=8879836353,123456789 (Фаррух + Сарвиноз).
# Свой ID человек может узнать у бота @userinfobot.
ADMIN_IDS=[int(x) for x in os.getenv('ADMIN_ID','8879836353').replace(' ','').split(',') if x]
ADMIN_ID=ADMIN_IDS[0]
MINI_APP_URL=os.getenv('MINI_APP_URL','').strip()
CONSULTANT=os.getenv('CONSULTANT_USERNAME','Zufarovsstore').lstrip('@')
CARD_NUMBER=os.getenv('CARD_NUMBER','').strip()
CARD_HOLDER=os.getenv('CARD_HOLDER','Zufarova Sarvinoz')
CARD_BANK=os.getenv('CARD_BANK','Uzcard')
# Доставку курьер (Яндекс / BTS Express) берёт отдельно по своему тарифу,
# поэтому в сумму заказа она не входит. Итог = только товары: стоимость веса
# уже зашита в цену каждого товара (см. reprice.py).
DEFAULT_WEIGHT=0.2
# Ниже — только для внутреннего расчёта прибыли в уведомлении админу.
# Клиенту эти цифры не показываются никогда. Значения держать
# такими же, как константы в reprice.py.
KG_FEE_USD=int(os.getenv('KG_FEE_USD','10'))
USD_RATE=int(os.getenv('USD_RATE','12350'))
ORDERS_FILE=Path(__file__).with_name('orders.jsonl')
# Откуда пришёл человек. В ссылке это часть после ?start=,
# например t.me/zufarovs_store_bot?start=ig_bio → source = 'ig_bio'.
# Пишем в visits.jsonl и подставляем в заказ, чтобы видеть,
# какая площадка реально приводит покупателей, а не просто клики.
VISITS_FILE=Path(__file__).with_name('visits.jsonl')
SOURCE_NAMES={
    'ig_bio':'Instagram · шапка профиля',
    'ig_stories':'Instagram · сторис',
    'ig_reels':'Instagram · reels',
    'ig_post':'Instagram · пост',
    'ig_dm':'Instagram · директ',
    'tg':'Telegram-канал',
}
CONTACT, ADDRESS, HOME, PAYMENT, RECEIPT = range(5)

def money(n): return f"{int(n):,}".replace(',',' ')

def load_costs():
    """Закупочные цены {id: сум}. В публичный репозиторий они не попадают.

    На Railway — переменная окружения PRODUCT_COSTS (JSON), заполняется
    командой: python3 export_costs.py
    Локально — файл costs.json (он в .gitignore).
    """
    raw=os.getenv('PRODUCT_COSTS','').strip()
    if raw:
        try: return json.loads(raw)
        except json.JSONDecodeError: logging.error('PRODUCT_COSTS не разобрался как JSON — прибыль считаться не будет')
    f=Path(__file__).with_name('costs.json')
    if f.exists():
        try: return json.loads(f.read_text(encoding='utf-8'))
        except json.JSONDecodeError: logging.error('costs.json битый — прибыль считаться не будет')
    logging.warning('Закупочные цены недоступны: в уведомлении не будет блока прибыли')
    return {}

COSTS=load_costs()

def profit_block(d):
    """Служебный блок для админа: закупка, стоимость веса, прибыль."""
    if not COSTS: return ''
    cost=0; unknown=[]
    for x in d['items']:
        c=COSTS.get(x['id'])
        if c is None: unknown.append(x.get('name') or x['id'])
        else: cost+=int(c)*int(x['qty'])
    weight_cost=round(float(d.get('weight') or 0)*KG_FEE_USD*USD_RATE)
    profit=d['subtotal']-cost-weight_cost
    pct=round(profit/d['subtotal']*100) if d['subtotal'] else 0
    lines=[f"\n\n➖➖➖➖➖\n📊 <b>Только для нас</b>",
           f"Закупка: {money(cost)} сум",
           f"Доставка из Кореи: {money(weight_cost)} сум",
           f"<b>Прибыль: {money(profit)} сум ({pct}%)</b>"]
    if unknown:
        lines.append(f"⚠️ нет закупки: {html.escape(', '.join(str(u) for u in unknown))} — прибыль занижена")
    return '\n'.join(lines)

def store_keyboard():
    rows=[]
    if MINI_APP_URL:
        rows.append([KeyboardButton('🛍 Открыть магазин', web_app=WebAppInfo(url=MINI_APP_URL))])
    return ReplyKeyboardMarkup(rows, resize_keyboard=True, is_persistent=True)

def consultant_keyboard():
    return InlineKeyboardMarkup([[InlineKeyboardButton('💬 Написать консультанту', url=f'https://t.me/{CONSULTANT}')]])

def items_text(d):
    return '\n'.join(f"• {x.get('name') or x['id']} × {x['qty']} — {money(x['price']*x['qty'])} сум" for x in d['items'])

def items_html(d):
    return '\n'.join(f"• {html.escape(str(x.get('name') or x['id']))} × {x['qty']} — {money(x['price']*x['qty'])} сум" for x in d['items'])

def card_message(total, with_items, d):
    """Сообщение с реквизитами. Номер карты в <code> — копируется по нажатию в Telegram."""
    items_block = f"{items_html(d)}\n\n" if with_items else ""
    sum_label = "Сумма к оплате" if with_items else "Сумма"
    return (
        f"💳 <b>Оплата картой</b>\n\n{items_block}"
        f"{sum_label}: <b>{money(total)} сум</b>\n\n"
        f"<code>{html.escape(CARD_NUMBER)}</code>\n"
        f"{html.escape(CARD_HOLDER)}\n{html.escape(CARD_BANK)}\n\n"
        f"После перевода отправьте сюда фотографию чека."
    )

def persist_order(d,user):
    row={'created_at':datetime.now().isoformat(timespec='seconds'),'telegram_id':user.id,'username':user.username,'items':d['items'],'subtotal':d['subtotal'],'weight':d.get('weight',0),'total':d['total'],'name':d.get('name'),'phone':d.get('phone'),'address':d.get('address'),'payment':d.get('payment'),'source':d.get('source')}
    with ORDERS_FILE.open('a',encoding='utf-8') as f:f.write(json.dumps(row,ensure_ascii=False)+'\n')

def persist_visit(user,source):
    row={'created_at':datetime.now().isoformat(timespec='seconds'),'telegram_id':user.id,'username':user.username,'source':source}
    with VISITS_FILE.open('a',encoding='utf-8') as f:f.write(json.dumps(row,ensure_ascii=False)+'\n')

async def start(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    # ?start=ig_bio и т.п. — метка источника из ссылки
    source=(ctx.args[0] if ctx.args else '').strip()[:64]
    if source:
        ctx.user_data['source']=source
        try:persist_visit(update.effective_user,source)
        except Exception:logging.exception('не удалось записать визит')
    text=("✨ *Добро пожаловать в ZUFAROVS’ STORE*\n\n"
          "Премиальная оригинальная корейская косметика 🇰🇷\n\n"
          "• Подробные карточки товаров\n"
          "• Персональный подбор ухода\n"
          "• Корзина и быстрое оформление\n\n"
          "Нажмите кнопку *🛍 Открыть магазин* внизу.")
    await update.message.reply_text(text, parse_mode='Markdown', reply_markup=store_keyboard())
    await update.message.reply_text("Нужна помощь с выбором?", reply_markup=consultant_keyboard())

async def web_order(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    try:data=json.loads(update.effective_message.web_app_data.data)
    except Exception:
        await update.effective_message.reply_text('Не удалось прочитать корзину. Откройте магазин заново.'); return ConversationHandler.END
    if data.get('type')!='order' or not data.get('items'):
        await update.effective_message.reply_text('Корзина пуста.'); return ConversationHandler.END
    d=ctx.user_data;d.clear();d['items']=data['items']
    d['subtotal']=sum(int(x['price'])*int(x['qty']) for x in d['items'])
    # вес нужен только для упаковки: на сумму заказа он не влияет
    d['weight']=round(float(data.get('weight') or 0),2)
    d['total']=d['subtotal']
    d['lang']=data.get('lang','ru')
    d['pay_method']=data.get('payMethod')  # 'cash' | 'card' — выбрано в мини-аппе
    d['name']=(data.get('name') or '').strip()
    d['phone']=(data.get('phone') or '').strip()
    summary=f"🛒 *Корзина*\n\n{items_text(d)}\n\nТовары: {money(d['subtotal'])} сум\nИтого: *{money(d['total'])} сум*\n_Доставка (Яндекс / BTS Express) оплачивается курьеру отдельно._"
    if d['name'] and d['phone']:
        # контакт уже собран в мини-аппе — просим только геолокацию
        kb=ReplyKeyboardMarkup([[KeyboardButton('📍 Отправить геолокацию',request_location=True)],['✍️ Ввести адрес']],resize_keyboard=True,one_time_keyboard=True)
        await update.effective_message.reply_text(f"{summary}\n\n👤 {d['name']}\n📱 {d['phone']}\n\nТеперь отправьте геолокацию одной кнопкой или введите адрес.",parse_mode='Markdown',reply_markup=kb)
        return ADDRESS
    kb=ReplyKeyboardMarkup([[KeyboardButton('📱 Отправить мой контакт',request_contact=True)]],resize_keyboard=True,one_time_keyboard=True)
    await update.effective_message.reply_text(f"{summary}\n\nОтправьте контакт одной кнопкой.",parse_mode='Markdown',reply_markup=kb)
    return CONTACT

async def contact(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    m=update.message;d=ctx.user_data
    if m.contact:d['name']=' '.join(filter(None,[m.contact.first_name,m.contact.last_name])) or '—';d['phone']=m.contact.phone_number
    else:d['name']=m.from_user.first_name or '—';d['phone']=(m.text or '').strip()
    kb=ReplyKeyboardMarkup([[KeyboardButton('📍 Отправить геолокацию',request_location=True)],['✍️ Ввести адрес']],resize_keyboard=True,one_time_keyboard=True)
    await m.reply_text('Теперь отправьте геолокацию одной кнопкой или введите адрес.',reply_markup=kb)
    return ADDRESS

async def address(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    m=update.message;d=ctx.user_data
    if m.location:
        d['lat']=m.location.latitude;d['lon']=m.location.longitude;d['address']='📍 Геолокация'
        await m.reply_text('Напишите номер дома/квартиры/офиса или отправьте «—».',reply_markup=ReplyKeyboardRemove());return HOME
    text=(m.text or '').strip()
    if text=='✍️ Ввести адрес':
        await m.reply_text('Введите район, улицу и дом:',reply_markup=ReplyKeyboardRemove());return ADDRESS
    d['address']=text;d['lat']=d['lon']=None
    return await proceed_after_address(m,ctx)

async def home(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    extra=(update.message.text or '').strip();ctx.user_data['address']='📍 Геолокация'+(f' + {extra}' if extra!='—' else '')
    return await proceed_after_address(update.message,ctx)

async def proceed_after_address(m,ctx):
    """Если способ оплаты уже выбран в мини-аппе — не переспрашиваем."""
    d=ctx.user_data;pm=d.get('pay_method')
    if pm=='cash':
        d['payment']='Наличными при получении'
        await send_admin(ctx,m.from_user,d);persist_order(d,m.from_user)
        await m.reply_text(f"✅ *Заказ принят!*\n\n{items_text(d)}\n\n*Итого: {money(d['total'])} сум*\n💵 Оплата: наличными при получении\n_Доставка курьером оплачивается отдельно._\n\nКонсультант скоро свяжется с вами.",parse_mode='Markdown',reply_markup=store_keyboard())
        d.clear();return ConversationHandler.END
    if pm=='card':
        d['payment']='Карта заранее'
        if not CARD_NUMBER:
            await send_admin(ctx,m.from_user,d);persist_order(d,m.from_user)
            await m.reply_text('✅ Заказ принят! Консультант свяжется с вами по оплате картой.',reply_markup=store_keyboard());d.clear();return ConversationHandler.END
        await m.reply_text(card_message(d['total'],True,d),parse_mode='HTML',reply_markup=ReplyKeyboardRemove())
        return RECEIPT
    # способ не пришёл из аппа (старая версия) — спрашиваем в чате
    return await ask_payment(m,ctx)

async def ask_payment(m,ctx):
    d=ctx.user_data;kb=InlineKeyboardMarkup([[InlineKeyboardButton('💵 Наличными при получении',callback_data='pay:cash')],[InlineKeyboardButton('💳 Картой заранее',callback_data='pay:card')],[InlineKeyboardButton('❌ Отменить',callback_data='pay:cancel')]])
    await m.reply_text(f"📋 *Ваш заказ*\n\n{items_text(d)}\n\nТовары: {money(d['subtotal'])} сум\n*Итого: {money(d['total'])} сум*\n_Доставка курьером оплачивается отдельно._\n\n👤 {d['name']}\n📱 {d['phone']}\n📍 {d['address']}",parse_mode='Markdown',reply_markup=kb)
    return PAYMENT

async def payment(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query;await q.answer();d=ctx.user_data
    if q.data=='pay:cancel':d.clear();await q.edit_message_text('Заказ отменён.'); await q.message.reply_text('Магазин можно открыть кнопкой ниже.', reply_markup=store_keyboard()); return ConversationHandler.END
    if q.data=='pay:cash':
        d['payment']='Наличными при получении';await send_admin(ctx,q.from_user,d);persist_order(d,q.from_user);await q.edit_message_text('✅ Спасибо за заказ! Консультант скоро свяжется с вами.'); await q.message.reply_text('Магазин всегда доступен кнопкой ниже.', reply_markup=store_keyboard()); d.clear(); return ConversationHandler.END
    if not CARD_NUMBER:
        await q.answer('Номер карты не настроен',show_alert=True);return PAYMENT
    d['payment']='Карта заранее'
    await q.edit_message_text(card_message(d['total'],False,d),parse_mode='HTML')
    return RECEIPT

async def receipt(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    if not update.message.photo:
        await update.message.reply_text('Отправьте чек фотографией.');return RECEIPT
    d=ctx.user_data;await send_admin(ctx,update.effective_user,d,update.message.photo[-1].file_id);persist_order(d,update.effective_user);await update.message.reply_text('✅ Спасибо за заказ! Чек получен. Консультант проверит оплату и свяжется с вами.', reply_markup=store_keyboard()); d.clear(); return ConversationHandler.END

def source_line(d):
    """Откуда пришёл клиент — строка для уведомления админу."""
    s=d.get('source')
    if not s:return ''
    return f"\n📣 Источник: {html.escape(SOURCE_NAMES.get(s,s))}"

async def send_admin(ctx,user,d,photo=None):
    text=("🔔 <b>НОВЫЙ ЗАКАЗ</b>\n\n"+items_html(d)+f"\n\nТовары: {money(d['subtotal'])} сум\n<b>Итого: {money(d['total'])} сум</b>\n<i>+ доставка курьером (Яндекс / BTS) по тарифу</i>\nОплата: {html.escape(str(d['payment']))}\n\n👤 {html.escape(str(d['name']))}\n📱 <code>{html.escape(str(d['phone']))}</code>\n📍 {html.escape(str(d['address']))}\nTelegram: @{html.escape(str(user.username or '—'))} (ID {user.id})"+source_line(d)+profit_block(d))
    for admin in ADMIN_IDS:
        try:
            if photo:await ctx.bot.send_photo(admin,photo,caption=text,parse_mode='HTML')
            else:await ctx.bot.send_message(admin,text,parse_mode='HTML')
            if d.get('lat') and d.get('lon'):await ctx.bot.send_location(admin,d['lat'],d['lon'])
        except Exception:
            # один недоступный получатель не должен ронять доставку остальным
            logging.exception('Не удалось отправить заказ админу %s',admin)

async def today(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id not in ADMIN_IDS:return
    rows=[]
    if ORDERS_FILE.exists():
        for line in ORDERS_FILE.read_text(encoding='utf-8').splitlines():
            try:r=json.loads(line);rows.append(r)
            except:pass
    day=datetime.now().date().isoformat();today_rows=[r for r in rows if r.get('created_at','').startswith(day)]
    await update.message.reply_text(f"📊 Сегодня\nЗаказов: {len(today_rows)}\nПродажи: {money(sum(r.get('total',0) for r in today_rows))} сум")

async def orders(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id not in ADMIN_IDS:return
    if not ORDERS_FILE.exists():await update.message.reply_text('Заказов пока нет.');return
    rows=[json.loads(x) for x in ORDERS_FILE.read_text(encoding='utf-8').splitlines() if x.strip()][-10:]
    text='🧾 Последние заказы\n\n'+'\n\n'.join(f"{r['created_at']} — {r['name']} — {money(r['total'])} сум" for r in reversed(rows))
    await update.message.reply_text(text)

async def sources(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    """Сколько человек пришло с каждой ссылки и сколько из них купило."""
    if update.effective_user.id not in ADMIN_IDS:return
    def read(path):
        if not path.exists():return []
        out=[]
        for line in path.read_text(encoding='utf-8').splitlines():
            try:out.append(json.loads(line))
            except:pass
        return out
    visits,orders_rows=read(VISITS_FILE),read(ORDERS_FILE)
    if not visits:
        await update.message.reply_text('Переходов по ссылкам с метками пока нет.\nСсылка выглядит так: t.me/zufarovs_store_bot?start=ig_bio');return
    keys=sorted({v['source'] for v in visits}|{r.get('source') for r in orders_rows if r.get('source')})
    lines=[]
    for k in keys:
        people={v['telegram_id'] for v in visits if v['source']==k}
        buys=[r for r in orders_rows if r.get('source')==k]
        total=sum(r.get('total',0) for r in buys)
        lines.append(f"{SOURCE_NAMES.get(k,k)}\n  переходов: {len(people)} · заказов: {len(buys)} · {money(total)} сум")
    await update.message.reply_text('📣 Откуда приходят\n\n'+'\n\n'.join(lines))

async def cancel(update:Update,ctx:ContextTypes.DEFAULT_TYPE): ctx.user_data.clear(); await update.message.reply_text('Заказ отменён. Магазин можно открыть кнопкой ниже.', reply_markup=store_keyboard()); return ConversationHandler.END

async def post_init(app):
    # Убираем голубую кнопку-меню «Магазин» рядом с полем ввода —
    # остаётся только нижняя кнопка «🛍 Открыть магазин».
    try:
        await app.bot.set_chat_menu_button(menu_button=MenuButtonDefault())
        logging.info('Menu button сброшен на стандартный (голубая кнопка «Магазин» убрана).')
    except Exception as e:
        logging.warning('Не удалось сбросить menu button: %s', e)

def main():
    if not BOT_TOKEN:raise RuntimeError('BOT_TOKEN is empty')
    if MINI_APP_URL:
        logging.info('MINI_APP_URL = %s  (кнопка магазина будет показана)', MINI_APP_URL)
    else:
        logging.warning('MINI_APP_URL НЕ ЗАДАН — кнопка «🛍 Открыть магазин» НЕ появится, '
                        'и заказы из мини-аппа НЕ будут доходить. Задайте MINI_APP_URL и перезапустите.')
    app=Application.builder().token(BOT_TOKEN).post_init(post_init).build()
    conv=ConversationHandler(entry_points=[MessageHandler(filters.StatusUpdate.WEB_APP_DATA,web_order)],states={CONTACT:[MessageHandler(filters.CONTACT|(filters.TEXT&~filters.COMMAND),contact)],ADDRESS:[MessageHandler(filters.LOCATION|(filters.TEXT&~filters.COMMAND),address)],HOME:[MessageHandler(filters.TEXT&~filters.COMMAND,home)],PAYMENT:[CallbackQueryHandler(payment,pattern='^pay:')],RECEIPT:[MessageHandler(filters.PHOTO|(filters.TEXT&~filters.COMMAND),receipt)]},fallbacks=[CommandHandler('cancel',cancel)],allow_reentry=True)
    app.add_handler(CommandHandler('start',start)); app.add_handler(CommandHandler('today',today)); app.add_handler(CommandHandler('orders',orders)); app.add_handler(CommandHandler('sources',sources)); app.add_handler(conv)
    print('Bot started');app.run_polling()
if __name__=='__main__':main()
