"""ZUFAROVS' STORE bot + Telegram Mini App checkout.
Python 3.10+, python-telegram-bot 22+
"""
import json, logging, os
from datetime import datetime
from pathlib import Path
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, KeyboardButton, ReplyKeyboardMarkup, ReplyKeyboardRemove, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, ConversationHandler, ContextTypes, filters

logging.basicConfig(format='%(asctime)s | %(levelname)s | %(name)s | %(message)s', level=logging.INFO)
BOT_TOKEN=os.getenv('BOT_TOKEN','').strip()
ADMIN_ID=int(os.getenv('ADMIN_ID','8879836353'))
MINI_APP_URL=os.getenv('MINI_APP_URL','').strip()
CONSULTANT=os.getenv('CONSULTANT_USERNAME','Zufarovsstore').lstrip('@')
CARD_NUMBER=os.getenv('CARD_NUMBER','').strip()
CARD_HOLDER=os.getenv('CARD_HOLDER','Zufarova Sarvinoz')
CARD_BANK=os.getenv('CARD_BANK','Uzcard')
FREE_DELIVERY=200_000; DELIVERY_PRICE=30_000
ORDERS_FILE=Path(__file__).with_name('orders.jsonl')
CONTACT, ADDRESS, HOME, PAYMENT, RECEIPT = range(5)

def money(n): return f"{int(n):,}".replace(',',' ')
def store_keyboard():
    rows=[]
    if MINI_APP_URL:
        rows.append([KeyboardButton('🛍 Открыть магазин', web_app=WebAppInfo(url=MINI_APP_URL))])
    return ReplyKeyboardMarkup(rows, resize_keyboard=True, is_persistent=True)

def consultant_keyboard():
    return InlineKeyboardMarkup([[InlineKeyboardButton('💬 Написать консультанту', url=f'https://t.me/{CONSULTANT}')]])

def items_text(d):
    return '\n'.join(f"• {x['name']} × {x['qty']} — {money(x['price']*x['qty'])} сум" for x in d['items'])

def persist_order(d,user):
    row={'created_at':datetime.now().isoformat(timespec='seconds'),'telegram_id':user.id,'username':user.username,'items':d['items'],'subtotal':d['subtotal'],'delivery':d['delivery'],'total':d['total'],'name':d.get('name'),'phone':d.get('phone'),'address':d.get('address'),'payment':d.get('payment')}
    with ORDERS_FILE.open('a',encoding='utf-8') as f:f.write(json.dumps(row,ensure_ascii=False)+'\n')

async def start(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
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
    d=ctx.user_data;d.clear();d['items']=data['items'];d['subtotal']=sum(int(x['price'])*int(x['qty']) for x in d['items']);d['delivery']=0 if d['subtotal']>=FREE_DELIVERY else DELIVERY_PRICE;d['total']=d['subtotal']+d['delivery'];d['lang']=data.get('lang','ru')
    kb=ReplyKeyboardMarkup([[KeyboardButton('📱 Отправить мой контакт',request_contact=True)]],resize_keyboard=True,one_time_keyboard=True)
    await update.effective_message.reply_text(f"🛒 *Корзина*\n\n{items_text(d)}\n\nИтого с доставкой: *{money(d['total'])} сум*\n\nОтправьте контакт одной кнопкой.",parse_mode='Markdown',reply_markup=kb)
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
    return await ask_payment(m,ctx)

async def home(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    extra=(update.message.text or '').strip();ctx.user_data['address']='📍 Геолокация'+(f' + {extra}' if extra!='—' else '')
    return await ask_payment(update.message,ctx)

async def ask_payment(m,ctx):
    d=ctx.user_data;kb=InlineKeyboardMarkup([[InlineKeyboardButton('💵 Наличными при получении',callback_data='pay:cash')],[InlineKeyboardButton('💳 Картой заранее',callback_data='pay:card')],[InlineKeyboardButton('❌ Отменить',callback_data='pay:cancel')]])
    await m.reply_text(f"📋 *Ваш заказ*\n\n{items_text(d)}\n\nТовары: {money(d['subtotal'])} сум\nДоставка: {'бесплатно' if d['delivery']==0 else money(d['delivery'])+' сум'}\n*Итого: {money(d['total'])} сум*\n\n👤 {d['name']}\n📱 {d['phone']}\n📍 {d['address']}",parse_mode='Markdown',reply_markup=kb)
    return PAYMENT

async def payment(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    q=update.callback_query;await q.answer();d=ctx.user_data
    if q.data=='pay:cancel':d.clear();await q.edit_message_text('Заказ отменён.'); await q.message.reply_text('Магазин можно открыть кнопкой ниже.', reply_markup=store_keyboard()); return ConversationHandler.END
    if q.data=='pay:cash':
        d['payment']='Наличными при получении';await send_admin(ctx,q.from_user,d);persist_order(d,q.from_user);await q.edit_message_text('✅ Спасибо за заказ! Консультант скоро свяжется с вами.'); await q.message.reply_text('Магазин всегда доступен кнопкой ниже.', reply_markup=store_keyboard()); d.clear(); return ConversationHandler.END
    if not CARD_NUMBER:
        await q.answer('Номер карты не настроен',show_alert=True);return PAYMENT
    d['payment']='Карта заранее'
    await q.edit_message_text(f"💳 *Оплата картой*\n\nСумма: *{money(d['total'])} сум*\n\n`{CARD_NUMBER}`\n{CARD_HOLDER}\n{CARD_BANK}\n\nПосле перевода отправьте сюда фотографию чека.",parse_mode='Markdown')
    return RECEIPT

async def receipt(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    if not update.message.photo:
        await update.message.reply_text('Отправьте чек фотографией.');return RECEIPT
    d=ctx.user_data;await send_admin(ctx,update.effective_user,d,update.message.photo[-1].file_id);persist_order(d,update.effective_user);await update.message.reply_text('✅ Спасибо за заказ! Чек получен. Консультант проверит оплату и свяжется с вами.', reply_markup=store_keyboard()); d.clear(); return ConversationHandler.END

async def send_admin(ctx,user,d,photo=None):
    text=("🔔 *НОВЫЙ ЗАКАЗ*\n\n"+items_text(d)+f"\n\nТовары: {money(d['subtotal'])} сум\nДоставка: {money(d['delivery'])} сум\n*Итого: {money(d['total'])} сум*\nОплата: {d['payment']}\n\n👤 {d['name']}\n📱 `{d['phone']}`\n📍 {d['address']}\nTelegram: @{user.username or '—'} (ID {user.id})")
    if photo:await ctx.bot.send_photo(ADMIN_ID,photo,caption=text,parse_mode='Markdown')
    else:await ctx.bot.send_message(ADMIN_ID,text,parse_mode='Markdown')
    if d.get('lat') and d.get('lon'):await ctx.bot.send_location(ADMIN_ID,d['lat'],d['lon'])

async def today(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id!=ADMIN_ID:return
    rows=[]
    if ORDERS_FILE.exists():
        for line in ORDERS_FILE.read_text(encoding='utf-8').splitlines():
            try:r=json.loads(line);rows.append(r)
            except:pass
    day=datetime.now().date().isoformat();today_rows=[r for r in rows if r.get('created_at','').startswith(day)]
    await update.message.reply_text(f"📊 Сегодня\nЗаказов: {len(today_rows)}\nПродажи: {money(sum(r.get('total',0) for r in today_rows))} сум")

async def orders(update:Update,ctx:ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id!=ADMIN_ID:return
    if not ORDERS_FILE.exists():await update.message.reply_text('Заказов пока нет.');return
    rows=[json.loads(x) for x in ORDERS_FILE.read_text(encoding='utf-8').splitlines() if x.strip()][-10:]
    text='🧾 Последние заказы\n\n'+'\n\n'.join(f"{r['created_at']} — {r['name']} — {money(r['total'])} сум" for r in reversed(rows))
    await update.message.reply_text(text)

async def cancel(update:Update,ctx:ContextTypes.DEFAULT_TYPE): ctx.user_data.clear(); await update.message.reply_text('Заказ отменён. Магазин можно открыть кнопкой ниже.', reply_markup=store_keyboard()); return ConversationHandler.END

def main():
    if not BOT_TOKEN:raise RuntimeError('BOT_TOKEN is empty')
    app=Application.builder().token(BOT_TOKEN).build()
    conv=ConversationHandler(entry_points=[MessageHandler(filters.StatusUpdate.WEB_APP_DATA,web_order)],states={CONTACT:[MessageHandler(filters.CONTACT|(filters.TEXT&~filters.COMMAND),contact)],ADDRESS:[MessageHandler(filters.LOCATION|(filters.TEXT&~filters.COMMAND),address)],HOME:[MessageHandler(filters.TEXT&~filters.COMMAND,home)],PAYMENT:[CallbackQueryHandler(payment,pattern='^pay:')],RECEIPT:[MessageHandler(filters.PHOTO|(filters.TEXT&~filters.COMMAND),receipt)]},fallbacks=[CommandHandler('cancel',cancel)],allow_reentry=True)
    app.add_handler(CommandHandler('start',start)); app.add_handler(CommandHandler('today',today)); app.add_handler(CommandHandler('orders',orders)); app.add_handler(conv)
    print('Bot started');app.run_polling()
if __name__=='__main__':main()
