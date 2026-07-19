const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand();tg.setHeaderColor?.('#f7f4ef');tg.setBackgroundColor?.('#f7f4ef');}

let lang=localStorage.getItem('lang')||'ru';
let cart=JSON.parse(localStorage.getItem('cart')||'{}');
let favorites=new Set(JSON.parse(localStorage.getItem('favorites')||'[]'));
let activeCategory='all';
let activeSkin=new Set();
let activeConcern=new Set();
let sortMode='relevance';
let currentProduct=null;
let quizStep=-1;
let quizAnswers={skin:null,concerns:[],goal:null};
let routine=[];

const i18n={
ru:{heroBadge:'Оригинальная косметика из Кореи 🇰🇷',heroTitle:'Уход, который подходит именно вашей коже',heroText:'Короткая диагностика поможет подобрать базовую программу ухода.',heroQuiz:'Подобрать уход',heroCatalog:'Открыть каталог',catalog:'Каталог',count:'СРЕДСТВ',fav:'Избранное',search:'Поиск по названию или задаче',all:'Все',categories:{cleanser:'Очищение',toner:'Тонеры',serum:'Сыворотки',cream:'Кремы',spf:'SPF',makeup:'Макияж',set:'Наборы',mask:'Маски',hair:'Волосы',other:'Другое'},navQuiz:'Подбор',cart:'Корзина',emptyCatalog:'По вашему запросу ничего не найдено.',emptyFav:'Сохраняйте понравившиеся товары — они появятся здесь.',emptyCart:'Корзина пока пуста.',items:'Товары',delivery:'Доставка',total:'Итого',free:'Бесплатно',deliveryPaid:'Яндекс / BTS Express',weightLabel:'Вес заказа',kgFeeLabel:'Доплата за вес (10$/кг)',weightNote:'Дополнительно к доставке взимается 10$ за каждый килограмм веса заказа. Вес предварительный — окончательная сумма подтверждается при упаковке.',deliveryNote:'Бесплатная доставка от 500 000 сум. По Узбекистану — Яндекс Доставка или BTS Express (оплата по тарифу службы).',checkout:'Оформить заказ',clearCart:'Очистить корзину',freeLeft:'До бесплатной доставки: ',freeReached:'Бесплатная доставка ✓',filters:'Фильтры',skinLabel:'ТИП КОЖИ',concernLabel:'ЗАДАЧА',sortLabel:'СОРТИРОВКА',sortRelevance:'По релевантности',sortPriceAsc:'Сначала дешевле',sortPriceDesc:'Сначала дороже',reset:'Сбросить',apply:'Показать',found:'Найдено',added:'Добавлено в корзину',removed:'Удалено',detailsBenefits:'Для чего это средство',detailsUse:'Как использовать',volume:'Объём',origin:'Производство',add:'Добавить в корзину',quizIntroTitle:'Подберём базовый уход',quizIntroText:'Ответьте на несколько вопросов. Рекомендация носит косметический, а не медицинский характер.',start:'Начать диагностику',back:'Назад',next:'Далее',show:'Показать программу',restart:'Пройти заново',addRoutine:'Добавить программу в корзину',resultTitle:'Ваш базовый уход',resultText:'Мы составили простую программу из средств, подходящих под выбранные задачи.',morning:'Утро',evening:'Вечер',step:'Шаг',quiz:[{title:'Какой у вас тип кожи?',hint:'Выберите один вариант.',multi:false,key:'skin',options:{dry:'Сухая',oily:'Жирная',combination:'Комбинированная',sensitive:'Чувствительная',normal:'Нормальная'}},{title:'Что вас беспокоит?',hint:'Можно выбрать несколько вариантов.',multi:true,key:'concerns',options:{acne:'Акне',postacne:'Постакне',pigmentation:'Пигментация',dehydration:'Обезвоженность',redness:'Покраснение',pores:'Поры',dullness:'Тусклый тон'}},{title:'Какой результат важнее?',hint:'Выберите основную цель ухода.',multi:false,key:'goal',options:{calm:'Успокоить кожу',hydrate:'Увлажнить',brighten:'Выровнять тон',clean:'Очистить поры',protect:'Защитить от солнца'}}]},
uz:{heroBadge:'Koreyadan original kosmetika 🇰🇷',heroTitle:'Aynan teringizga mos parvarish',heroText:'Qisqa diagnostika asosiy parvarish dasturini tanlashga yordam beradi.',heroQuiz:'Parvarish tanlash',heroCatalog:'Katalogni ochish',catalog:'Katalog',count:'MAHSULOT',fav:'Sevimlilar',search:'Nomi yoki vazifasi bo‘yicha qidirish',all:'Barchasi',categories:{cleanser:'Tozalash',toner:'Tonerlar',serum:'Serumlar',cream:'Kremlar',spf:'SPF',makeup:'Makiyaj',set:'To‘plamlar',mask:'Niqoblar',hair:'Sochlar',other:'Boshqa'},navQuiz:'Tanlash',cart:'Savat',emptyCatalog:'So‘rovingiz bo‘yicha mahsulot topilmadi.',emptyFav:'Yoqtirgan mahsulotlarni saqlang — ular shu yerda ko‘rinadi.',emptyCart:'Savat hozircha bo‘sh.',items:'Mahsulotlar',delivery:'Yetkazib berish',total:'Jami',free:'Bepul',deliveryPaid:'Yandex / BTS Express',weightLabel:'Buyurtma vazni',kgFeeLabel:'Vazn uchun qo‘shimcha (10$/kg)',weightNote:'Yetkazib berishdan tashqari buyurtmaning har bir kilogrammi uchun 10$ olinadi. Vazn taxminiy — yakuniy summa qadoqlash paytida tasdiqlanadi.',deliveryNote:'500 000 so‘mdan bepul yetkazib berish. O‘zbekiston bo‘ylab — Yandex Delivery yoki BTS Express (tarif bo‘yicha to‘lov).',checkout:'Buyurtma berish',clearCart:'Savatni tozalash',freeLeft:'Bepul yetkazishgacha: ',freeReached:'Bepul yetkazib berish ✓',filters:'Filtrlar',skinLabel:'TERI TURI',concernLabel:'VAZIFA',sortLabel:'SARALASH',sortRelevance:'Mosligi bo‘yicha',sortPriceAsc:'Avval arzoni',sortPriceDesc:'Avval qimmati',reset:'Tozalash',apply:'Ko‘rsatish',found:'Topildi',added:'Savatga qo‘shildi',removed:'O‘chirildi',detailsBenefits:'Mahsulot nima uchun',detailsUse:'Qanday ishlatiladi',volume:'Hajmi',origin:'Ishlab chiqarilgan',add:'Savatga qo‘shish',quizIntroTitle:'Asosiy parvarishni tanlaymiz',quizIntroText:'Bir nechta savolga javob bering. Tavsiya tibbiy emas, kosmetik xarakterga ega.',start:'Diagnostikani boshlash',back:'Orqaga',next:'Keyingi',show:'Dasturni ko‘rsatish',restart:'Qayta boshlash',addRoutine:'Dasturni savatga qo‘shish',resultTitle:'Sizning asosiy parvarishingiz',resultText:'Tanlangan ehtiyojlarga mos oddiy parvarish dasturini tuzdik.',morning:'Ertalab',evening:'Kechqurun',step:'Qadam',quiz:[{title:'Teringiz turi qanday?',hint:'Bitta variantni tanlang.',multi:false,key:'skin',options:{dry:'Quruq',oily:'Yog‘li',combination:'Aralash',sensitive:'Sezgir',normal:'Normal'}},{title:'Nima bezovta qiladi?',hint:'Bir nechta variantni tanlash mumkin.',multi:true,key:'concerns',options:{acne:'Akne',postacne:'Postakne',pigmentation:'Pigmentatsiya',dehydration:'Suvsizlanish',redness:'Qizarish',pores:'Teshikchalar',dullness:'Xira rang'}},{title:'Qaysi natija muhimroq?',hint:'Asosiy maqsadni tanlang.',multi:false,key:'goal',options:{calm:'Terini tinchlantirish',hydrate:'Namlashtirish',brighten:'Rangni tekislash',clean:'Teshikchalarni tozalash',protect:'Quyoshdan himoya'}}]}
};

const fmt=n=>new Intl.NumberFormat('ru-RU').format(n)+' сум';

/* ===== ОГИРЛИК БУЙИЧА КУШИМЧА ТУЛОВ / ДОПЛАТА ЗА ВЕС =====
   Доставкадан ТАШКАРИ: хар 1 кг учун 10$.
   USD_RATE ни курс узгарганда шу ердан янгиланг. */
const KG_FEE_USD = 10;          // 1 кг учун доллар
const USD_RATE   = 12200;       // ← 1$ = ... сум. КУРСНИ ШУ ЕРДАН ЯНГИЛАНГ
const ROUND_UP_KG = false;      // true = тулик кг гача юкорига думалатади (0.3 кг → 1 кг)
const DEFAULT_WEIGHT = 0.2;     // огирлиги курсатилмаган махсулот учун (кг)

const kgFeeSum = w => Math.round((ROUND_UP_KG ? Math.ceil(w) : w) * KG_FEE_USD * USD_RATE);
const fmtKg = w => (Math.round(w*100)/100).toLocaleString('ru-RU') + ' kg';
const tr=()=>i18n[lang];
const pName=p=>lang==='ru'?p.nameRu:p.nameUz;
const pDesc=p=>lang==='ru'?p.shortRu:p.shortUz;
const pUse=p=>lang==='ru'?p.useRu:p.useUz;
const purpose=p=>pDesc(p);

function haptic(type='light'){tg?.HapticFeedback?.impactOccurred?.(type)}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1600)}
function save(){localStorage.setItem('cart',JSON.stringify(cart));localStorage.setItem('favorites',JSON.stringify([...favorites]));updateCartBadge()}

function productCard(p){
 return `<article class="product-card">
 <button class="favorite-button ${favorites.has(p.id)?'active':''}" onclick="toggleFavorite('${p.id}',event)" aria-label="favorite">${favorites.has(p.id)?'♥':'♡'}</button>
 <button class="product-image-button" onclick="openProduct('${p.id}')"><img loading="lazy" src="${p.image}" alt="${pName(p)}"></button>
 <div class="product-info"><div class="brand">${p.brand}</div><h3>${pName(p)}</h3><div class="product-purpose">${purpose(p)}</div><div class="product-footer"><div class="price">${fmt(p.price)}</div><button class="quick-add" onclick="addToCart('${p.id}',event)" aria-label="add">+</button></div></div>
 </article>`;
}

function renderCategories(){
 const cats=['all','cleanser','toner','serum','cream','spf','mask','makeup','hair','other','set'];
 document.querySelector('#categoryChips').innerHTML=cats.map(c=>`<button class="category-chip ${activeCategory===c?'active':''}" onclick="setCategory('${c}')">${c==='all'?tr().all:tr().categories[c]}</button>`).join('');
}
function setCategory(c){activeCategory=c;renderCategories();renderCatalog();haptic()}
function renderCatalog(){
 const q=document.querySelector('#search').value.trim().toLowerCase();
 document.querySelector('#searchClear').classList.toggle('hidden',!q);
 let items=PRODUCTS.filter(p=>
   (activeCategory==='all'||p.category===activeCategory)&&
   (`${p.brand} ${pName(p)} ${pDesc(p)}`.toLowerCase().includes(q))&&
   (activeSkin.size===0||[...activeSkin].some(s=>(p.skin||[]).includes(s)))&&
   (activeConcern.size===0||[...activeConcern].some(c=>(p.concerns||[]).includes(c)))
 );
 if(sortMode==='priceAsc')items=[...items].sort((a,b)=>a.price-b.price);
 else if(sortMode==='priceDesc')items=[...items].sort((a,b)=>b.price-a.price);
 document.querySelector('#grid').innerHTML=items.map(productCard).join('');
 document.querySelector('#catalogEmpty').textContent=tr().emptyCatalog;
 document.querySelector('#catalogEmpty').classList.toggle('hidden',items.length>0);
 document.querySelector('#resultCount').textContent=`${tr().found}: ${items.length}`;
 updateFilterBadge();
}
function activeFilterCount(){return activeSkin.size+activeConcern.size+(sortMode==='relevance'?0:1)}
function updateFilterBadge(){
 const n=activeFilterCount();const badge=document.querySelector('#filterCount');const btn=document.querySelector('#filterBtn');
 badge.textContent=n;badge.classList.toggle('hidden',n===0);btn.classList.toggle('has-active',n>0);
}
function renderFilters(){
 const skinVals=['dry','oily','combination','sensitive','normal'];
 const concernVals=['acne','postacne','pigmentation','dehydration','redness','pores','dullness'];
 document.querySelector('#filterSkin').innerHTML=skinVals.map(v=>`<button class="filter-chip ${activeSkin.has(v)?'active':''}" onclick="toggleFilter('skin','${v}')">${labelTag(v)}</button>`).join('');
 document.querySelector('#filterConcern').innerHTML=concernVals.map(v=>`<button class="filter-chip ${activeConcern.has(v)?'active':''}" onclick="toggleFilter('concern','${v}')">${labelTag(v)}</button>`).join('');
 const sorts=[['relevance',tr().sortRelevance],['priceAsc',tr().sortPriceAsc],['priceDesc',tr().sortPriceDesc]];
 document.querySelector('#filterSort').innerHTML=sorts.map(([v,l])=>`<button class="${sortMode===v?'active':''}" onclick="setSort('${v}')">${l}</button>`).join('');
}
function toggleFilter(kind,v){const set=kind==='skin'?activeSkin:activeConcern;set.has(v)?set.delete(v):set.add(v);renderFilters();renderCatalog();haptic()}
function setSort(v){sortMode=v;renderFilters();renderCatalog();haptic()}
function openFilters(){renderFilters();document.querySelector('#filterSheet').classList.add('open');document.body.style.overflow='hidden'}
function closeFilters(){document.querySelector('#filterSheet').classList.remove('open');document.body.style.overflow=''}
function resetFilters(){activeSkin.clear();activeConcern.clear();sortMode='relevance';renderFilters();renderCatalog();haptic()}
function renderFavorites(){
 const items=PRODUCTS.filter(p=>favorites.has(p.id));
 document.querySelector('#favGrid').innerHTML=items.map(productCard).join('');
 document.querySelector('#favEmpty').textContent=tr().emptyFav;
 document.querySelector('#favEmpty').classList.toggle('hidden',items.length>0);
}
function toggleFavorite(id,event){event?.stopPropagation();favorites.has(id)?favorites.delete(id):favorites.add(id);save();renderCatalog();renderFavorites();if(currentProduct?.id===id)syncModalFavorite();haptic()}
function addToCart(id,event,qty=1){event?.stopPropagation();cart[id]=(cart[id]||0)+qty;save();renderCart();toast(tr().added);haptic('medium')}
function updateCartBadge(){const count=Object.values(cart).reduce((a,b)=>a+b,0);document.querySelector('#cartCount').textContent=count;document.querySelector('#cartCount').classList.toggle('hidden',count===0)}
function changeQty(id,delta){cart[id]=(cart[id]||0)+delta;if(cart[id]<=0)delete cart[id];save();renderCart();haptic()}
function removeFromCart(id){delete cart[id];save();renderCart();toast(tr().removed)}
function clearCart(){if(!Object.keys(cart).length)return;cart={};save();renderCart();toast(tr().removed);haptic('medium')}
function renderCart(){
 const entries=Object.entries(cart);let subtotal=0,weight=0;
 document.querySelector('#cartItems').innerHTML=entries.map(([id,qty])=>{const p=PRODUCTS.find(x=>x.id===id);if(!p)return'';subtotal+=p.price*qty;weight+=(p.weight??DEFAULT_WEIGHT)*qty;return `<article class="cart-item"><img src="${p.image}" alt="${pName(p)}"><div><div class="cart-item-head"><div><div class="brand">${p.brand}</div><h3>${pName(p)}</h3></div><button class="remove-item" onclick="removeFromCart('${id}')">×</button></div><div class="cart-item-bottom"><div class="qty-control"><button onclick="changeQty('${id}',-1)">−</button><strong>${qty}</strong><button onclick="changeQty('${id}',1)">+</button></div><strong>${fmt(p.price*qty)}</strong></div></div></article>`}).join('');
 const FREE=500000,reached=subtotal>=FREE,pct=Math.min(100,Math.round(subtotal/FREE*100));
 document.querySelector('#subtotal').textContent=fmt(subtotal);
 document.querySelector('#delivery').textContent=reached?tr().free:tr().deliveryPaid;
 const kgFee=kgFeeSum(weight);
 document.querySelector('#cartWeight').textContent=fmtKg(weight);
 document.querySelector('#kgFee').textContent=fmt(kgFee);
 document.querySelector('#total').textContent=fmt(subtotal+kgFee);
 document.querySelector('#freeProgressFill').style.width=pct+'%';
 document.querySelector('#freeProgress').classList.toggle('reached',reached);
 document.querySelector('#freeProgressText').textContent=reached?tr().freeReached:tr().freeLeft+fmt(FREE-subtotal);
 document.querySelector('#cartEmpty').textContent=tr().emptyCart;document.querySelector('#cartEmpty').classList.toggle('hidden',entries.length>0);document.querySelector('#cartSummary').classList.toggle('hidden',entries.length===0);updateCartBadge();
}

function openProduct(id){currentProduct=PRODUCTS.find(p=>p.id===id);if(!currentProduct)return;document.querySelector('#modalImage').src=currentProduct.image;document.querySelector('#modalImage').alt=pName(currentProduct);document.querySelector('#modalBrand').textContent=currentProduct.brand;document.querySelector('#modalName').textContent=pName(currentProduct);document.querySelector('#modalPrice').textContent=fmt(currentProduct.price);document.querySelector('#modalDesc').textContent=pDesc(currentProduct);document.querySelector('#modalBenefits').textContent=pDesc(currentProduct);document.querySelector('#modalUse').textContent=pUse(currentProduct);document.querySelector('#modalVolume').textContent=currentProduct.volume;document.querySelector('#modalTags').innerHTML=[...(currentProduct.skin||[]),...(currentProduct.concerns||[])].filter(x=>x!=='all').slice(0,5).map(x=>`<span class="tag">${labelTag(x)}</span>`).join('');syncModalFavorite();document.querySelector('#modal').classList.add('open');document.body.style.overflow='hidden';}
function labelTag(x){const all={dry:'Сухая кожа',oily:'Жирная кожа',combination:'Комбинированная',sensitive:'Чувствительная',normal:'Нормальная',acne:'Акне',postacne:'Постакне',pigmentation:'Пигментация',dehydration:'Увлажнение',redness:'Покраснение',pores:'Поры',dullness:'Сияние'};const uz={dry:'Quruq teri',oily:'Yog‘li teri',combination:'Aralash teri',sensitive:'Sezgir teri',normal:'Normal teri',acne:'Akne',postacne:'Postakne',pigmentation:'Pigmentatsiya',dehydration:'Namlik',redness:'Qizarish',pores:'Teshikchalar',dullness:'Yorqinlik'};return (lang==='ru'?all:uz)[x]||x}
function syncModalFavorite(){const b=document.querySelector('#modalFavorite');const active=currentProduct&&favorites.has(currentProduct.id);b.textContent=active?'♥':'♡';b.classList.toggle('active',active)}
function closeModal(){document.querySelector('#modal').classList.remove('open');document.body.style.overflow=''}

function switchView(id){document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));document.querySelector('#homeHero').classList.toggle('hidden',id!=='catalog');if(id==='favorites')renderFavorites();if(id==='cart')renderCart();window.scrollTo({top:0,behavior:'smooth'});haptic()}

function showQuizStep(){
 const intro=quizStep===-1,results=quizStep===tr().quiz.length;
 document.querySelector('#quizIntro').classList.toggle('active',intro);document.querySelector('#quizQuestion').classList.toggle('active',!intro&&!results);document.querySelector('#quizResults').classList.toggle('active',results);
 const progress=intro?0:results?100:((quizStep+1)/tr().quiz.length)*100;document.querySelector('#quizProgress').style.width=progress+'%';
 if(!intro&&!results){const q=tr().quiz[quizStep];document.querySelector('#quizStepLabel').textContent=`${tr().step} ${quizStep+1} / ${tr().quiz.length}`;document.querySelector('#quizQuestionTitle').textContent=q.title;document.querySelector('#quizQuestionHint').textContent=q.hint;const current=quizAnswers[q.key];document.querySelector('#quizOptions').innerHTML=Object.entries(q.options).map(([value,label])=>{const selected=q.multi?current.includes(value):current===value;return `<button class="quiz-option ${selected?'selected':''}" onclick="selectQuizOption('${value}')">${label}</button>`}).join('');document.querySelector('#quizBack').textContent=tr().back;document.querySelector('#quizNext').textContent=quizStep===tr().quiz.length-1?tr().show:tr().next;}
 if(results)buildRoutine();
}
function selectQuizOption(value){const q=tr().quiz[quizStep];if(q.multi){const arr=quizAnswers[q.key];arr.includes(value)?arr.splice(arr.indexOf(value),1):arr.push(value)}else quizAnswers[q.key]=value;showQuizStep();haptic()}
function quizNext(){const q=tr().quiz[quizStep];const val=quizAnswers[q.key];if((q.multi&&!val.length)||(!q.multi&&!val)){toast(lang==='ru'?'Выберите вариант':'Variantni tanlang');return}quizStep++;showQuizStep()}
function quizBack(){quizStep=Math.max(-1,quizStep-1);showQuizStep()}
function scoreProduct(p){let score=0;if(quizAnswers.skin&&(p.skin||[]).includes(quizAnswers.skin))score+=5;if((p.skin||[]).includes('all'))score+=2;for(const c of quizAnswers.concerns)if((p.concerns||[]).includes(c))score+=4;if(quizAnswers.goal==='protect'&&p.category==='spf')score+=8;if(quizAnswers.goal==='clean'&&p.category==='cleanser')score+=5;if(quizAnswers.goal==='hydrate'&&(p.concerns||[]).includes('dehydration'))score+=5;if(quizAnswers.goal==='brighten'&&((p.concerns||[]).includes('pigmentation')||(p.concerns||[]).includes('dullness')))score+=5;if(quizAnswers.goal==='calm'&&((p.concerns||[]).includes('redness')||(p.skin||[]).includes('sensitive')))score+=5;return score}
function best(category,count=1,exclude=[]){return PRODUCTS.filter(p=>p.category===category&&!exclude.includes(p.id)).sort((a,b)=>scoreProduct(b)-scoreProduct(a)).slice(0,count)}
function buildRoutine(){
 const cleanser=best('cleanser',1),toner=best('toner',1),serum=best('serum',1),cream=best('cream',1),spf=best('spf',1);routine=[...cleanser,...toner,...serum,...cream,...spf].filter((p,i,a)=>a.findIndex(x=>x.id===p.id)===i);
 document.querySelector('#quizResultsTitle').textContent=tr().resultTitle;document.querySelector('#quizResultsText').textContent=tr().resultText;
 const morning=[...cleanser,...toner,...serum,...cream,...spf];const evening=[...cleanser,...toner,...serum,...cream];document.querySelector('#routineBlocks').innerHTML=routineBlock(tr().morning,morning)+routineBlock(tr().evening,evening);document.querySelector('#addRoutine').textContent=tr().addRoutine;document.querySelector('#restartQuiz').textContent=tr().restart;
}
function routineBlock(title,items){return `<div class="routine-section"><h3>${title}</h3>${items.map((p,i)=>`<div class="routine-item"><span>${i+1}</span><img src="${p.image}"><b>${pName(p)}</b></div>`).join('')}</div>`}
function addRoutine(){routine.forEach(p=>cart[p.id]=(cart[p.id]||0)+1);save();renderCart();toast(tr().added);switchView('cart')}
function restartQuiz(){quizStep=-1;quizAnswers={skin:null,concerns:[],goal:null};showQuizStep()}

function checkout(){
 const items=Object.entries(cart).map(([id,qty])=>{const p=PRODUCTS.find(x=>x.id===id);return p?{id:p.id,name:p.nameUz,qty,price:p.price}:null}).filter(Boolean);if(!items.length){toast(tr().emptyCart);return}const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0);const weight=Object.entries(cart).reduce((s,[id,q])=>{const p=PRODUCTS.find(x=>x.id===id);return s+((p?.weight??DEFAULT_WEIGHT)*q)},0);const kgFee=kgFeeSum(weight);const payload={type:'order',lang,items,subtotal,weight:Math.round(weight*100)/100,kgFeeUsd:KG_FEE_USD,usdRate:USD_RATE,kgFee,total:subtotal+kgFee};if(tg?.sendData){tg.sendData(JSON.stringify(payload));tg.close()}else{navigator.clipboard?.writeText(JSON.stringify(payload));alert(lang==='ru'?'Откройте магазин внутри Telegram для оформления заказа.':'Buyurtma uchun do‘konni Telegram ichida oching.')}
}

function applyLanguage(){
 document.documentElement.lang=lang;document.querySelector('#langBtn').textContent=lang.toUpperCase();document.querySelector('#heroBadge').textContent=tr().heroBadge;document.querySelector('#heroTitle').textContent=tr().heroTitle;document.querySelector('#heroText').textContent=tr().heroText;document.querySelector('#heroQuiz').textContent=tr().heroQuiz;document.querySelector('#heroCatalog').textContent=tr().heroCatalog;document.querySelector('#catalogEyebrow').textContent=PRODUCTS.length+' '+tr().count;document.querySelector('#catalogTitle').textContent=tr().catalog;document.querySelector('#favoritesShortcut').textContent=tr().fav;document.querySelector('#search').placeholder=tr().search;document.querySelector('#favoritesTitle').textContent=tr().fav;document.querySelector('#cartTitle').textContent=tr().cart;document.querySelector('#itemsLabel').textContent=tr().items;document.querySelector('#deliveryLabel').textContent=tr().delivery;document.querySelector('#weightLabel').textContent=tr().weightLabel;document.querySelector('#kgFeeLabel').textContent=tr().kgFeeLabel;document.querySelector('#weightNote').textContent=tr().weightNote;document.querySelector('#totalLabel').textContent=tr().total;document.querySelector('#deliveryNote').textContent=tr().deliveryNote;document.querySelector('#checkout').textContent=tr().checkout;document.querySelector('#navCatalog').textContent=tr().catalog;document.querySelector('#navQuiz').textContent=tr().navQuiz;document.querySelector('#navFavorites').textContent=tr().fav;document.querySelector('#navCart').textContent=tr().cart;document.querySelector('#benefitSummary').textContent=tr().detailsBenefits;document.querySelector('#useSummary').textContent=tr().detailsUse;document.querySelector('#volumeLabel').textContent=tr().volume;document.querySelector('#originLabel').textContent=tr().origin;document.querySelector('#modalAdd').textContent=tr().add;document.querySelector('#quizIntroTitle').textContent=tr().quizIntroTitle;document.querySelector('#quizIntroText').textContent=tr().quizIntroText;document.querySelector('#startQuiz').textContent=tr().start;document.querySelector('#filterBtnLabel').textContent=tr().filters;document.querySelector('#filterSheetTitle').textContent=tr().filters;document.querySelector('#filterSkinLabel').textContent=tr().skinLabel;document.querySelector('#filterConcernLabel').textContent=tr().concernLabel;document.querySelector('#filterSortLabel').textContent=tr().sortLabel;document.querySelector('#filterReset').textContent=tr().reset;document.querySelector('#filterApply').textContent=tr().apply;document.querySelector('#clearCart').textContent=tr().clearCart;renderCategories();renderCatalog();renderFilters();renderFavorites();renderCart();showQuizStep();if(currentProduct)openProduct(currentProduct.id);
}

document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
document.querySelector('#homeButton').onclick=()=>switchView('catalog');
document.querySelector('#search').oninput=renderCatalog;
document.querySelector('#searchClear').onclick=()=>{const s=document.querySelector('#search');s.value='';renderCatalog();s.focus()};
document.querySelector('#filterBtn').onclick=openFilters;
document.querySelector('#filterClose').onclick=closeFilters;
document.querySelector('#filterBackdrop').onclick=closeFilters;
document.querySelector('#filterApply').onclick=closeFilters;
document.querySelector('#filterReset').onclick=resetFilters;
document.querySelector('#clearCart').onclick=clearCart;
document.querySelector('#langBtn').onclick=()=>{lang=lang==='ru'?'uz':'ru';localStorage.setItem('lang',lang);applyLanguage();haptic()};
document.querySelector('#closeModal').onclick=closeModal;document.querySelector('#modalBackdrop').onclick=closeModal;
document.querySelector('#modalFavorite').onclick=()=>currentProduct&&toggleFavorite(currentProduct.id);
document.querySelector('#modalAdd').onclick=()=>{if(currentProduct)addToCart(currentProduct.id);closeModal()};
document.querySelector('#startQuiz').onclick=()=>{quizStep=0;showQuizStep()};document.querySelector('#quizNext').onclick=quizNext;document.querySelector('#quizBack').onclick=quizBack;document.querySelector('#addRoutine').onclick=addRoutine;document.querySelector('#restartQuiz').onclick=restartQuiz;document.querySelector('#checkout').onclick=checkout;

applyLanguage();switchView('catalog');
