const tg=window.Telegram?.WebApp;
if(tg){tg.ready();tg.expand();}

/* ---- Тема: светлая / тёмная ---- */
const THEME_BG={light:'#f7f4ef',dark:'#141312'};
const ICON_MOON='<svg class="top-ico" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>';
const ICON_SUN='<svg class="top-ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
function systemTheme(){
  if(tg?.colorScheme) return tg.colorScheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light';
}
function applyTheme(t){
  const theme=t==='dark'?'dark':'light';
  document.documentElement.setAttribute('data-theme',theme);
  const bg=THEME_BG[theme];
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',bg);
  tg?.setHeaderColor?.(bg); tg?.setBackgroundColor?.(bg);
  const btn=document.querySelector('#themeBtn');
  if(btn){btn.innerHTML=theme==='dark'?ICON_SUN:ICON_MOON;btn.setAttribute('aria-label',theme==='dark'?'Светлая тема':'Тёмная тема');}
}
// стартовая тема: ручной выбор > Telegram/система
let theme=localStorage.getItem('theme')||systemTheme();
applyTheme(theme);
// если пользователь не выбирал вручную — следуем за Telegram/системой
if(!localStorage.getItem('theme')){
  tg?.onEvent?.('themeChanged',()=>{ if(!localStorage.getItem('theme')) applyTheme(systemTheme()); });
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change',e=>{
    if(!localStorage.getItem('theme')) applyTheme(e.matches?'dark':'light');
  });
}
document.querySelector('#themeBtn')?.addEventListener('click',()=>{
  theme=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';
  localStorage.setItem('theme',theme);
  applyTheme(theme);
});

let lang=localStorage.getItem('lang')||'ru';
let cart=JSON.parse(localStorage.getItem('cart')||'{}');
let payMethod=localStorage.getItem('payMethod')||'cash';
let favorites=new Set(JSON.parse(localStorage.getItem('favorites')||'[]'));
let activeCategory='all';
let activeSkin=new Set();
let activeConcern=new Set();
let sortMode='relevance';
let currentProduct=null;
let currentView='catalog';
let quizStep=-1;
let quizAnswers={skin:null,concerns:[],goal:null};
let routine=[];

const i18n={
ru:{heroBadge:'Оригинальная косметика из Кореи 🇰🇷',heroTitle:'Уход, который подходит именно вашей коже',heroText:'Короткая диагностика поможет подобрать базовую программу ухода.',heroQuiz:'Подобрать уход',heroCatalog:'Открыть каталог',catalog:'Каталог',count:'СРЕДСТВ',fav:'Избранное',search:'Поиск по названию или задаче',all:'Все',categories:{cleanser:'Очищение',toner:'Тонеры',serum:'Сыворотки',cream:'Кремы',spf:'SPF',makeup:'Макияж',set:'Наборы',mask:'Маски',hair:'Волосы',other:'Другое'},navQuiz:'Подбор',cart:'Корзина',emptyCatalog:'По вашему запросу ничего не найдено.',emptyFav:'Сохраняйте понравившиеся товары — они появятся здесь.',emptyCart:'Корзина пока пуста.',items:'Товары',delivery:'Доставка',total:'Итого',free:'Бесплатно',deliveryPaid:'Яндекс / BTS Express',weightLabel:'Вес заказа',deliveryNote:'Бесплатная доставка от 500 000 сум. По Узбекистану — Яндекс Доставка или BTS Express (оплата по тарифу службы).',checkout:'Оформить заказ',clearCart:'Очистить корзину',ordersLink:'Мои заказы',ordersTitle:'Мои заказы',ordersEmpty:'Здесь появятся ваши оформленные заказы.',repeat:'Повторить',orderItems:'товаров',relatedTitle:'С этим берут',freeLeft:'До бесплатной доставки: ',freeReached:'Бесплатная доставка ✓',filters:'Фильтры',skinLabel:'ТИП КОЖИ',concernLabel:'ЗАДАЧА',sortLabel:'СОРТИРОВКА',sortRelevance:'По релевантности',sortPriceAsc:'Сначала дешевле',sortPriceDesc:'Сначала дороже',reset:'Сбросить',apply:'Показать',found:'Найдено',added:'Добавлено в корзину',removed:'Удалено',soon:'Скоро',soonToast:'Этого товара пока нет в наличии',detailsBenefits:'Для чего это средство',detailsUse:'Как использовать',volume:'Объём',origin:'Производство',add:'Добавить в корзину',quizIntroTitle:'Подберём базовый уход',quizIntroText:'Ответьте на несколько вопросов. Рекомендация носит косметический, а не медицинский характер.',start:'Начать диагностику',back:'Назад',next:'Далее',show:'Показать программу',restart:'Пройти заново',addRoutine:'Добавить программу в корзину',resultTitle:'Ваш базовый уход',resultText:'Мы составили простую программу из средств, подходящих под выбранные задачи.',morning:'Утро',evening:'Вечер',step:'Шаг',quiz:[{title:'Какой у вас тип кожи?',hint:'Выберите один вариант.',multi:false,key:'skin',options:{dry:'Сухая',oily:'Жирная',combination:'Комбинированная',sensitive:'Чувствительная',normal:'Нормальная'}},{title:'Что вас беспокоит?',hint:'Можно выбрать несколько вариантов.',multi:true,key:'concerns',options:{acne:'Акне',postacne:'Постакне',pigmentation:'Пигментация',dehydration:'Обезвоженность',redness:'Покраснение',pores:'Поры',dullness:'Тусклый тон'}},{title:'Какой результат важнее?',hint:'Выберите основную цель ухода.',multi:false,key:'goal',options:{calm:'Успокоить кожу',hydrate:'Увлажнить',brighten:'Выровнять тон',clean:'Очистить поры',protect:'Защитить от солнца'}}]},
uz:{heroBadge:'Koreyadan original kosmetika 🇰🇷',heroTitle:'Aynan teringizga mos parvarish',heroText:'Qisqa diagnostika asosiy parvarish dasturini tanlashga yordam beradi.',heroQuiz:'Parvarish tanlash',heroCatalog:'Katalogni ochish',catalog:'Katalog',count:'MAHSULOT',fav:'Sevimlilar',search:'Nomi yoki vazifasi bo‘yicha qidirish',all:'Barchasi',categories:{cleanser:'Tozalash',toner:'Tonerlar',serum:'Serumlar',cream:'Kremlar',spf:'SPF',makeup:'Makiyaj',set:'To‘plamlar',mask:'Niqoblar',hair:'Sochlar',other:'Boshqa'},navQuiz:'Tanlash',cart:'Savat',emptyCatalog:'So‘rovingiz bo‘yicha mahsulot topilmadi.',emptyFav:'Yoqtirgan mahsulotlarni saqlang — ular shu yerda ko‘rinadi.',emptyCart:'Savat hozircha bo‘sh.',items:'Mahsulotlar',delivery:'Yetkazib berish',total:'Jami',free:'Bepul',deliveryPaid:'Yandex / BTS Express',weightLabel:'Buyurtma vazni',deliveryNote:'500 000 so‘mdan bepul yetkazib berish. O‘zbekiston bo‘ylab — Yandex Delivery yoki BTS Express (tarif bo‘yicha to‘lov).',checkout:'Buyurtma berish',clearCart:'Savatni tozalash',ordersLink:'Buyurtmalarim',ordersTitle:'Buyurtmalarim',ordersEmpty:'Bu yerda rasmiylashtirilgan buyurtmalaringiz ko‘rinadi.',repeat:'Takrorlash',orderItems:'mahsulot',relatedTitle:'Bu bilan olishadi',freeLeft:'Bepul yetkazishgacha: ',freeReached:'Bepul yetkazib berish ✓',filters:'Filtrlar',skinLabel:'TERI TURI',concernLabel:'VAZIFA',sortLabel:'SARALASH',sortRelevance:'Mosligi bo‘yicha',sortPriceAsc:'Avval arzoni',sortPriceDesc:'Avval qimmati',reset:'Tozalash',apply:'Ko‘rsatish',found:'Topildi',added:'Savatga qo‘shildi',removed:'O‘chirildi',soon:'Tez kunda',soonToast:'Bu mahsulot hozircha mavjud emas',detailsBenefits:'Mahsulot nima uchun',detailsUse:'Qanday ishlatiladi',volume:'Hajmi',origin:'Ishlab chiqarilgan',add:'Savatga qo‘shish',quizIntroTitle:'Asosiy parvarishni tanlaymiz',quizIntroText:'Bir nechta savolga javob bering. Tavsiya tibbiy emas, kosmetik xarakterga ega.',start:'Diagnostikani boshlash',back:'Orqaga',next:'Keyingi',show:'Dasturni ko‘rsatish',restart:'Qayta boshlash',addRoutine:'Dasturni savatga qo‘shish',resultTitle:'Sizning asosiy parvarishingiz',resultText:'Tanlangan ehtiyojlarga mos oddiy parvarish dasturini tuzdik.',morning:'Ertalab',evening:'Kechqurun',step:'Qadam',quiz:[{title:'Teringiz turi qanday?',hint:'Bitta variantni tanlang.',multi:false,key:'skin',options:{dry:'Quruq',oily:'Yog‘li',combination:'Aralash',sensitive:'Sezgir',normal:'Normal'}},{title:'Nima bezovta qiladi?',hint:'Bir nechta variantni tanlash mumkin.',multi:true,key:'concerns',options:{acne:'Akne',postacne:'Postakne',pigmentation:'Pigmentatsiya',dehydration:'Suvsizlanish',redness:'Qizarish',pores:'Teshikchalar',dullness:'Xira rang'}},{title:'Qaysi natija muhimroq?',hint:'Asosiy maqsadni tanlang.',multi:false,key:'goal',options:{calm:'Terini tinchlantirish',hydrate:'Namlashtirish',brighten:'Rangni tekislash',clean:'Teshikchalarni tozalash',protect:'Quyoshdan himoya'}}]}
};

const fmt=n=>new Intl.NumberFormat('ru-RU').format(n)+' сум';

/* ===== ОГИРЛИК / ВЕС =====
   Огирлик учун туловни хар бир махсулот НАРХИГА кушиб куйилган (reprice.py),
   шунинг учун саватда алохида "доплата за вес" сатри йук.
   Нархларни кайта хисоблаш: python3 reprice.py (курс ва наценка шу ерда).
   Огирлик факат кадоклаш учун курсатилади. */
const DEFAULT_WEIGHT = 0.2;     // огирлиги курсатилмаган махсулот учун (кг)

const fmtKg = w => (Math.round(w*100)/100).toLocaleString('ru-RU') + ' kg';

/* ===== "СКОРО" / TEZ KUNDA =====
   Махсулот омборда булмаса: products.js да "soon": true, нархи эса
   умуман йук (reprice.py уни ёзмайди). Бунда нарх кураётган одамга хам,
   сахифа кодида хам куринмайди. Саватга кушиш имконсиз.
   Руйхатни узгартириш: in_stock.txt + python3 set_stock.py */
const isSoon = p => !!(p && p.soon);
const priceHtml = p => isSoon(p) ? `<span class="soon-badge">${tr().soon}</span>` : fmt(p.price);
const tr=()=>i18n[lang];
const pName=p=>lang==='ru'?p.nameRu:p.nameUz;
const pDesc=p=>lang==='ru'?p.shortRu:p.shortUz;
const pUse=p=>lang==='ru'?p.useRu:p.useUz;
const purpose=p=>pDesc(p);

/* ---------- QIDIRUV / ПОИСК (kirill+lotin, 2 tilda, xatoga chidamli) ---------- */
const CYR2LAT={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'c','ч':'ch','ш':'sh','щ':'sh','ъ':'','ы':'i','ь':'','э':'e','ю':'yu','я':'ya','ў':'o','қ':'q','ғ':'g','ҳ':'h','і':'i','ї':'i'};
const translit=s=>String(s||'').replace(/[а-яёўқғҳії]/g,c=>CYR2LAT[c]!==undefined?CYR2LAT[c]:c);
const nrm=s=>translit(String(s||'').toLowerCase()).replace(/[^a-z0-9]+/g,' ').trim();
const skel=s=>nrm(s).replace(/kh/g,'x').replace(/q/g,'k').replace(/ch/g,'c').replace(/sh/g,'s').replace(/ts/g,'c').replace(/[yj]/g,'i').replace(/(.)\1+/g,'$1');
function lev(a,b){if(a===b)return 0;if(Math.abs(a.length-b.length)>2)return 9;let prev=[...Array(b.length+1).keys()];for(let i=1;i<=a.length;i++){const cur=[i];for(let j=1;j<=b.length;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur}return prev[b.length]}
function catWords(p){const out=[p.category];for(const L of ['ru','uz']){const d=i18n[L];if(!d)continue;if(d.categories&&d.categories[p.category])out.push(d.categories[p.category]);for(const st of (d.quiz||[]))for(const k of [...(p.concerns||[]),...(p.skin||[])])if(st.options&&st.options[k])out.push(st.options[k])}return out.join(' ')}
const _idx=new Map();
function idxOf(p){if(!_idx.has(p.id)){const raw=[p.brand,p.nameRu,p.nameUz,p.shortRu,p.shortUz,p.useRu,p.useUz,p.volume,catWords(p)].join(' ');_idx.set(p.id,{n:nrm(raw),s:skel(raw)})}return _idx.get(p.id)}
function matchesQuery(p,q){
 if(!q)return true;
 const ix=idxOf(p),nq=nrm(q),sq=skel(q);
 if(!nq)return true;
 if(ix.n.includes(nq)||ix.s.includes(sq))return true;
 const nTok=ix.n.split(' '),sTok=ix.s.split(' ');
 return nq.split(' ').filter(Boolean).every(t=>{
  const st=skel(t);
  if(ix.n.includes(t)||ix.s.includes(st))return true;
  const tol=t.length>=7?2:t.length>=4?1:0;
  if(!tol)return false;
  return nTok.some(w=>lev(t,w)<=tol)||sTok.some(w=>lev(st,w)<=tol);
 });
}


/* Плейсхолдер для отсутствующих/битых фото товаров */
const IMG_PLACEHOLDER="data:image/svg+xml;utf8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#f3efe9"/><g fill="none" stroke="#c9bfae" stroke-width="4"><circle cx="100" cy="86" r="30"/><path d="M40 168c0-30 27-46 60-46s60 16 60 46"/></g></svg>');
document.addEventListener('error',e=>{const t=e.target;if(t&&t.tagName==='IMG'&&!t.dataset.fallback){t.dataset.fallback='1';t.src=IMG_PLACEHOLDER;t.style.objectFit='contain'}},true);

function haptic(type='light'){tg?.HapticFeedback?.impactOccurred?.(type)}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1600)}
function save(){localStorage.setItem('cart',JSON.stringify(cart));localStorage.setItem('favorites',JSON.stringify([...favorites]));updateCartBadge()}

function productCard(p){
 return `<article class="product-card">
 <button class="favorite-button ${favorites.has(p.id)?'active':''}" onclick="toggleFavorite('${p.id}',event)" aria-label="favorite">${favorites.has(p.id)?'♥':'♡'}</button>
 <button class="product-image-button" onclick="openProduct('${p.id}')"><img loading="lazy" src="${p.image}" alt="${pName(p)}"></button>
 <div class="product-info"><div class="brand">${p.brand}</div><h3>${pName(p)}</h3><div class="product-purpose">${purpose(p)}</div><div class="product-footer"><div class="price">${priceHtml(p)}</div>${isSoon(p)?'':`<button class="quick-add" onclick="addToCart('${p.id}',event)" aria-label="add">+</button>`}</div></div>
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
   matchesQuery(p,q)&&
   (activeSkin.size===0||[...activeSkin].some(s=>(p.skin||[]).includes(s)))&&
   (activeConcern.size===0||[...activeConcern].some(c=>(p.concerns||[]).includes(c)))
 );
 // товары «скоро» без цены — всегда в конце списка при сортировке по цене
 if(sortMode==='priceAsc')items=[...items].sort((a,b)=>(isSoon(a)-isSoon(b))||(a.price-b.price));
 else if(sortMode==='priceDesc')items=[...items].sort((a,b)=>(isSoon(a)-isSoon(b))||(b.price-a.price));
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
function openFilters(){renderFilters();document.querySelector('#filterSheet').classList.add('open');document.body.style.overflow='hidden';syncNative()}
function closeFilters(){document.querySelector('#filterSheet').classList.remove('open');document.body.style.overflow='';syncNative()}
function resetFilters(){activeSkin.clear();activeConcern.clear();sortMode='relevance';renderFilters();renderCatalog();haptic()}
function renderFavorites(){
 const items=PRODUCTS.filter(p=>favorites.has(p.id));
 document.querySelector('#favGrid').innerHTML=items.map(productCard).join('');
 document.querySelector('#favEmpty').textContent=tr().emptyFav;
 document.querySelector('#favEmpty').classList.toggle('hidden',items.length>0);
}
function toggleFavorite(id,event){event?.stopPropagation();favorites.has(id)?favorites.delete(id):favorites.add(id);save();renderCatalog();renderFavorites();if(currentProduct?.id===id)syncModalFavorite();haptic()}
function addToCart(id,event,qty=1){event?.stopPropagation();
 // товар «скоро» купить нельзя — сюда можно попасть из старой корзины или «Повторить»
 if(isSoon(PRODUCTS.find(p=>p.id===id))){toast(tr().soonToast);return}
 cart[id]=(cart[id]||0)+qty;save();renderCart();toast(tr().added);haptic('medium')}
function updateCartBadge(){const count=Object.values(cart).reduce((a,b)=>a+b,0);document.querySelector('#cartCount').textContent=count;document.querySelector('#cartCount').classList.toggle('hidden',count===0)}
function changeQty(id,delta){cart[id]=(cart[id]||0)+delta;if(cart[id]<=0)delete cart[id];save();renderCart();haptic()}
function removeFromCart(id){delete cart[id];save();renderCart();toast(tr().removed)}
function clearCart(){if(!Object.keys(cart).length)return;cart={};save();renderCart();toast(tr().removed);haptic('medium')}
function renderCart(){
 // товар мог стать «скоро» уже после того, как попал в сохранённую корзину
 const dropped=Object.keys(cart).filter(id=>isSoon(PRODUCTS.find(p=>p.id===id)));
 if(dropped.length){dropped.forEach(id=>delete cart[id]);save()}
 const entries=Object.entries(cart);let subtotal=0,weight=0;
 document.querySelector('#cartItems').innerHTML=entries.map(([id,qty])=>{const p=PRODUCTS.find(x=>x.id===id);if(!p)return'';subtotal+=p.price*qty;weight+=(p.weight??DEFAULT_WEIGHT)*qty;return `<article class="cart-item"><img src="${p.image}" alt="${pName(p)}"><div><div class="cart-item-head"><div><div class="brand">${p.brand}</div><h3>${pName(p)}</h3></div><button class="remove-item" onclick="removeFromCart('${id}')">×</button></div><div class="cart-item-bottom"><div class="qty-control"><button onclick="changeQty('${id}',-1)">−</button><strong>${qty}</strong><button onclick="changeQty('${id}',1)">+</button></div><strong>${fmt(p.price*qty)}</strong></div></div></article>`}).join('');
 const FREE=500000,reached=subtotal>=FREE,pct=Math.min(100,Math.round(subtotal/FREE*100));
 document.querySelector('#subtotal').textContent=fmt(subtotal);
 document.querySelector('#delivery').textContent=reached?tr().free:tr().deliveryPaid;
 document.querySelector('#cartWeight').textContent=fmtKg(weight);
 document.querySelector('#total').textContent=fmt(subtotal);
 document.querySelector('#freeProgressFill').style.width=pct+'%';
 document.querySelector('#freeProgress').classList.toggle('reached',reached);
 document.querySelector('#freeProgressText').textContent=reached?tr().freeReached:tr().freeLeft+fmt(FREE-subtotal);
 document.querySelector('#cartEmpty').textContent=tr().emptyCart;document.querySelector('#cartEmpty').classList.toggle('hidden',entries.length>0);document.querySelector('#cartSummary').classList.toggle('hidden',entries.length===0);updateCartBadge();syncNative();
}

function openProduct(id){currentProduct=PRODUCTS.find(p=>p.id===id);if(!currentProduct)return;document.querySelector('#modalImage').src=currentProduct.image;document.querySelector('#modalImage').alt=pName(currentProduct);document.querySelector('#modalBrand').textContent=currentProduct.brand;document.querySelector('#modalName').textContent=pName(currentProduct);document.querySelector('#modalPrice').innerHTML=priceHtml(currentProduct);document.querySelector('#modalAdd').classList.toggle('hidden',isSoon(currentProduct));document.querySelector('#modalDesc').textContent=pDesc(currentProduct);document.querySelector('#modalBenefits').textContent=pDesc(currentProduct);document.querySelector('#modalUse').textContent=pUse(currentProduct);document.querySelector('#modalVolume').textContent=currentProduct.volume;document.querySelector('#modalTags').innerHTML=[...(currentProduct.skin||[]),...(currentProduct.concerns||[])].filter(x=>x!=='all').slice(0,5).map(x=>`<span class="tag">${labelTag(x)}</span>`).join('');syncModalFavorite();renderRelated(currentProduct);document.querySelector('#modal').classList.add('open');document.body.style.overflow='hidden';syncNative();}
function relatedProducts(p,limit=6){
 const shared=q=>(q.concerns||[]).filter(c=>(p.concerns||[]).includes(c)).length;
 return PRODUCTS.filter(x=>x.id!==p.id&&x.category===p.category)
   .sort((a,b)=>shared(b)-shared(a))
   .slice(0,limit);
}
function renderRelated(p){
 const wrap=document.querySelector('#relatedWrap'),row=document.querySelector('#relatedRow');
 const items=relatedProducts(p);
 wrap.classList.toggle('hidden',items.length===0);
 document.querySelector('#relatedLabel').textContent=tr().relatedTitle;
 row.innerHTML=items.map(x=>`<button class="related-card" onclick="openProduct('${x.id}')"><img loading="lazy" src="${x.image}" alt="${pName(x)}"><span class="related-name">${pName(x)}</span><span class="related-price">${priceHtml(x)}</span></button>`).join('');
}
function labelTag(x){const all={dry:'Сухая кожа',oily:'Жирная кожа',combination:'Комбинированная',sensitive:'Чувствительная',normal:'Нормальная',acne:'Акне',postacne:'Постакне',pigmentation:'Пигментация',dehydration:'Увлажнение',redness:'Покраснение',pores:'Поры',dullness:'Сияние'};const uz={dry:'Quruq teri',oily:'Yog‘li teri',combination:'Aralash teri',sensitive:'Sezgir teri',normal:'Normal teri',acne:'Akne',postacne:'Postakne',pigmentation:'Pigmentatsiya',dehydration:'Namlik',redness:'Qizarish',pores:'Teshikchalar',dullness:'Yorqinlik'};return (lang==='ru'?all:uz)[x]||x}
function syncModalFavorite(){const b=document.querySelector('#modalFavorite');const active=currentProduct&&favorites.has(currentProduct.id);b.textContent=active?'♥':'♡';b.classList.toggle('active',active)}
function closeModal(){document.querySelector('#modal').classList.remove('open');document.body.style.overflow='';syncNative()}

function switchView(id){currentView=id;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id));document.querySelector('#homeHero').classList.toggle('hidden',id!=='catalog');if(id==='favorites')renderFavorites();if(id==='reviews')renderReviewShots();if(id==='cart')renderCart();window.scrollTo({top:0,behavior:'smooth'});haptic();syncNative()}

/* ---------- Нативные кнопки Telegram (MainButton / BackButton) ---------- */
function anyOverlayOpen(){return['#modal','#filterSheet','#ordersModal','#checkoutSheet'].some(s=>document.querySelector(s)?.classList.contains('open'))}
function handleBack(){
 if(document.querySelector('#shotLightbox').classList.contains('open'))return closeShot();
 if(document.querySelector('#checkoutSheet').classList.contains('open'))return closeCheckout();
 if(document.querySelector('#ordersModal').classList.contains('open'))return closeOrders();
 if(document.querySelector('#filterSheet').classList.contains('open'))return closeFilters();
 if(document.querySelector('#modal').classList.contains('open'))return closeModal();
 if(currentView!=='catalog')return switchView('catalog');
}
function syncNative(){
 const mb=tg?.MainButton,bb=tg?.BackButton;
 if(bb){(anyOverlayOpen()||currentView!=='catalog')?bb.show():bb.hide();}
 if(mb){
  const count=Object.values(cart).reduce((a,b)=>a+b,0);
  if(currentView==='cart'&&count>0&&!anyOverlayOpen()){
   const subtotal=Object.entries(cart).reduce((s,[id,q])=>{const p=PRODUCTS.find(x=>x.id===id);return s+(p?p.price*q:0)},0);
   mb.setParams?.({color:(getComputedStyle(document.documentElement).getPropertyValue('--green').trim())||'#355847',text_color:'#ffffff'});
   mb.setText(`${tr().checkout} · ${fmt(subtotal)}`);mb.show();
  } else mb.hide();
 }
}

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
function best(category,count=1,exclude=[]){return PRODUCTS.filter(p=>p.category===category&&!exclude.includes(p.id)&&!isSoon(p)).sort((a,b)=>scoreProduct(b)-scoreProduct(a)).slice(0,count)}
function buildRoutine(){
 const cleanser=best('cleanser',1),toner=best('toner',1),serum=best('serum',1),cream=best('cream',1),spf=best('spf',1);routine=[...cleanser,...toner,...serum,...cream,...spf].filter((p,i,a)=>a.findIndex(x=>x.id===p.id)===i);
 document.querySelector('#quizResultsTitle').textContent=tr().resultTitle;document.querySelector('#quizResultsText').textContent=tr().resultText;
 const morning=[...cleanser,...toner,...serum,...cream,...spf];const evening=[...cleanser,...toner,...serum,...cream];document.querySelector('#routineBlocks').innerHTML=routineBlock(tr().morning,morning)+routineBlock(tr().evening,evening);document.querySelector('#addRoutine').textContent=tr().addRoutine;document.querySelector('#restartQuiz').textContent=tr().restart;
}
function routineBlock(title,items){return `<div class="routine-section"><h3>${title}</h3>${items.map((p,i)=>`<div class="routine-item"><span>${i+1}</span><img src="${p.image}"><b>${pName(p)}</b></div>`).join('')}</div>`}
function addRoutine(){routine.forEach(p=>cart[p.id]=(cart[p.id]||0)+1);save();renderCart();toast(tr().added);switchView('cart')}
function restartQuiz(){quizStep=-1;quizAnswers={skin:null,concerns:[],goal:null};showQuizStep()}

function checkout(){openCheckout();}
function submitOrder(){
 const c=CHECKOUT_I18N[lang]||CHECKOUT_I18N.ru;
 const name=document.querySelector('#buyerName').value.trim();
 const phone=document.querySelector('#buyerPhone').value.trim();
 if(!name){toast(c.needName);document.querySelector('#buyerName').focus();return}
 if(phone.replace(/\D/g,'').length<7){toast(c.needPhone);document.querySelector('#buyerPhone').focus();return}
 localStorage.setItem('buyerName',name);localStorage.setItem('buyerPhone',phone);
 const items=Object.entries(cart).map(([id,qty])=>{const p=PRODUCTS.find(x=>x.id===id);return p?{id:p.id,name:pName(p),qty,price:p.price}:null}).filter(Boolean);if(!items.length){toast(tr().emptyCart);return}const subtotal=items.reduce((s,i)=>s+i.price*i.qty,0);const weight=Object.entries(cart).reduce((s,[id,q])=>{const p=PRODUCTS.find(x=>x.id===id);return s+((p?.weight??DEFAULT_WEIGHT)*q)},0);const payload={type:'order',lang,name,phone,items,subtotal,weight:Math.round(weight*100)/100,total:subtotal,payMethod,payment:PAY_TEXT[payMethod]||PAY_TEXT.cash};saveOrderHistory(payload);
 let json=JSON.stringify(payload);
 // Telegram.sendData не принимает больше 4096 байт — постепенно ужимаем названия
 for(const cut of [40,20,8,0]){
  if(json.length<=4000)break;
  json=JSON.stringify({...payload,items:items.map(i=>{const o={id:i.id,qty:i.qty,price:i.price};if(cut)o.name=String(i.name).slice(0,cut);return o})});
 }
 if(json.length>4096){alert(lang==='ru'?'Слишком много позиций в заказе для одной отправки. Разделите заказ на части или напишите консультанту.':'Buyurtmada juda ko‘p pozitsiya. Buyurtmani bo‘lib yuboring yoki konsultantga yozing.');return}
 if(tg&&typeof tg.sendData==='function'){
  const wrongLaunchMsg=lang==='ru'
   ?'Заказ не отправился. Похоже, магазин открыт через кнопку «Меню» или ссылку.\n\nЗакройте это окно и откройте магазин через кнопку «🛍 Открыть магазин» под полем ввода в чате бота — тогда заказ уйдёт.'
   :'Buyurtma yuborilmadi. Do‘kon «Menu» tugmasi yoki havola orqali ochilgan bo‘lishi mumkin.\n\nBu oynani yoping va do‘konni bot chatidagi «🛍 Открыть магазин» tugmasi orqali oching — shunda buyurtma ketadi.';
  try{
   tg.sendData(json); // при правильном запуске Telegram сам закроет приложение
   // если через 2 сек всё ещё открыто — sendData молча не сработал (открыто не через кнопку бота)
   setTimeout(()=>alert(wrongLaunchMsg),2000);
  }catch(e){alert(wrongLaunchMsg)}
 }else{
  navigator.clipboard?.writeText(json);
  alert(lang==='ru'?'Откройте магазин внутри Telegram через кнопку «🛍 Открыть магазин», чтобы оформить заказ.':'Buyurtma uchun do‘konni Telegram ichida «🛍 Открыть магазин» tugmasi orqali oching.')
 }
}

/* ---------- История заказов (localStorage) ---------- */
function loadOrderHistory(){try{return JSON.parse(localStorage.getItem('orderHistory')||'[]')}catch{return[]}}
function saveOrderHistory(payload){const list=loadOrderHistory();list.unshift({ts:Date.now(),items:payload.items,total:payload.total});localStorage.setItem('orderHistory',JSON.stringify(list.slice(0,20)))}
function repeatOrder(i){const o=loadOrderHistory()[i];if(!o)return;o.items.forEach(it=>{if(PRODUCTS.some(p=>p.id===it.id))cart[it.id]=(cart[it.id]||0)+it.qty});save();renderCart();closeOrders();switchView('cart');toast(tr().added)}
function renderOrders(){
 const list=loadOrderHistory();document.querySelector('#ordersTitle').textContent=tr().ordersTitle;
 const empty=document.querySelector('#ordersEmpty');empty.textContent=tr().ordersEmpty;empty.classList.toggle('hidden',list.length>0);
 document.querySelector('#ordersList').innerHTML=list.map((o,i)=>{
  const date=new Date(o.ts).toLocaleDateString(lang==='ru'?'ru-RU':'uz-UZ',{day:'2-digit',month:'short',year:'numeric'});
  const count=o.items.reduce((s,x)=>s+x.qty,0);
  const names=o.items.map(x=>x.name).slice(0,3).join(', ')+(o.items.length>3?'…':'');
  return `<div class="order-row"><div class="order-row-main"><div class="order-date">${date}</div><div class="order-names">${names}</div><div class="order-meta">${count} ${tr().orderItems} · <b>${fmt(o.total)}</b></div></div><button class="secondary order-repeat" onclick="repeatOrder(${i})">${tr().repeat}</button></div>`;
 }).join('');
}
function openOrders(){renderOrders();document.querySelector('#ordersModal').classList.add('open');document.body.style.overflow='hidden';syncNative()}
function closeOrders(){document.querySelector('#ordersModal').classList.remove('open');document.body.style.overflow='';syncNative()}

/* ---------- Отзывы покупателей ----------
   Скриншоты переписок из Telegram кладите в images/reviews/
   и перечислите здесь. Порядок = порядок показа. */
const REVIEW_SHOTS=[
 // 'images/reviews/otziv1.jpg',
 // 'images/reviews/otziv2.jpg',
];
function renderReviewShots(){
 const wrap=document.querySelector('#reviewShots'),empty=document.querySelector('#reviewsViewEmpty');
 const data=REVIEWS[lang]||REVIEWS.ru;
 document.querySelector('#reviewsViewEyebrow').textContent=data.viewEyebrow;
 document.querySelector('#reviewsViewTitle').textContent=data.viewTitle;
 if(!REVIEW_SHOTS.length){wrap.innerHTML='';empty.textContent=data.empty;empty.classList.remove('hidden');return}
 empty.classList.add('hidden');
 wrap.innerHTML=REVIEW_SHOTS.map(src=>`<button class="review-shot-btn" onclick="openShot('${src}')"><img loading="lazy" src="${src}" alt="Отзыв из Telegram"></button>`).join('');
}
function openShot(src){const lb=document.querySelector('#shotLightbox');document.querySelector('#shotLightboxImg').src=src;lb.classList.add('open');document.body.style.overflow='hidden';haptic()}
function closeShot(){document.querySelector('#shotLightbox').classList.remove('open');document.body.style.overflow=''}

/* ---------- Способ оплаты (нал / карта) ---------- */
const PAY={
 ru:{label:'СПОСОБ ОПЛАТЫ',cash:'💵 Наличными',card:'💳 Картой'},
 uz:{label:'TO‘LOV USULI',cash:'💵 Naqd',card:'💳 Karta'}
};
const PAY_TEXT={cash:'Наличными при получении',card:'Карта заранее'};
function updatePayUI(){document.querySelectorAll('.pay-option').forEach(b=>b.classList.toggle('active',b.dataset.pay===payMethod))}
function setPay(m){payMethod=m;localStorage.setItem('payMethod',m);updatePayUI();haptic()}

/* ---------- Форма контакта (имя + телефон) в аппе ---------- */
const CHECKOUT_I18N={
 ru:{title:'Ваши данные',name:'Имя',phone:'Телефон',namePh:'Ваше имя',phonePh:'+998 90 123 45 67',grab:'📱 Взять номер из Telegram',hint:'Геолокацию отправите в чате бота следующим шагом.',submit:'Отправить заказ',needName:'Введите имя',needPhone:'Введите телефон',noContact:'Введите номер вручную'},
 uz:{title:'Ma’lumotlaringiz',name:'Ism',phone:'Telefon',namePh:'Ismingiz',phonePh:'+998 90 123 45 67',grab:'📱 Telegramdan raqamni olish',hint:'Geolokatsiyani keyingi qadamda bot chatida yuborasiz.',submit:'Buyurtmani yuborish',needName:'Ismni kiriting',needPhone:'Telefon raqamini kiriting',noContact:'Raqamni qo‘lda kiriting'}
};
function openCheckout(){
 if(!Object.keys(cart).length){toast(tr().emptyCart);return}
 const c=CHECKOUT_I18N[lang]||CHECKOUT_I18N.ru;
 document.querySelector('#checkoutTitle').textContent=c.title;
 document.querySelector('#nameFieldLabel').textContent=c.name;
 document.querySelector('#phoneFieldLabel').textContent=c.phone;
 document.querySelector('#buyerName').placeholder=c.namePh;
 document.querySelector('#buyerPhone').placeholder=c.phonePh;
 document.querySelector('#grabContact').textContent=c.grab;
 document.querySelector('#checkoutHint').textContent=c.hint;
 document.querySelector('#checkoutSubmit').textContent=c.submit;
 // подставляем сохранённые данные или имя из Telegram
 const tgUser=tg?.initDataUnsafe?.user;
 const nameEl=document.querySelector('#buyerName'),phoneEl=document.querySelector('#buyerPhone');
 if(!nameEl.value)nameEl.value=localStorage.getItem('buyerName')||[tgUser?.first_name,tgUser?.last_name].filter(Boolean).join(' ')||'';
 if(!phoneEl.value)phoneEl.value=localStorage.getItem('buyerPhone')||'';
 // кнопку «взять номер» показываем только если Telegram это умеет
 document.querySelector('#grabContact').style.display=tg?.requestContact?'':'none';
 document.querySelector('#checkoutSheet').classList.add('open');document.body.style.overflow='hidden';syncNative();
 requestAnimationFrame(()=>{if(!nameEl.value)nameEl.focus()});
}
function closeCheckout(){document.querySelector('#checkoutSheet').classList.remove('open');document.body.style.overflow='';syncNative()}
function grabContact(){
 const c=CHECKOUT_I18N[lang]||CHECKOUT_I18N.ru;
 if(!tg?.requestContact){toast(c.noContact);return}
 try{tg.requestContact((ok,evt)=>{
  if(!ok)return;
  const ct=evt?.responseUnsafe?.contact||evt?.response?.contact||evt?.contact;
  if(ct?.phone_number)document.querySelector('#buyerPhone').value=ct.phone_number;
  const nm=document.querySelector('#buyerName');
  if(!nm.value&&ct?.first_name)nm.value=[ct.first_name,ct.last_name].filter(Boolean).join(' ');
  haptic();
 });}catch(e){toast(c.noContact)}
}

const REVIEWS={
 ru:{title:'Отзывы покупателей',eyebrow:'ОТЗЫВЫ',navLabel:'Отзывы',viewTitle:'Отзывы',viewEyebrow:'TELEGRAM',empty:'Скоро здесь появятся скриншоты реальных отзывов из Telegram.',items:[
  {name:'Дилноза',stars:5,text:'Кожа стала заметно ровнее за 3 недели. Всё оригинал, упаковка целая, доставка быстрая.'},
  {name:'Малика',stars:5,text:'Подобрала уход через квиз — попадание идеальное. Тон выровнялся, покраснения ушли.'},
  {name:'Ирода',stars:5,text:'Заказываю уже второй раз. Цены честные, консультант всегда на связи. Рекомендую!'},
  {name:'Севара',stars:4,text:'Хорошая корейская косметика, приятные текстуры. Ждала доставку чуть дольше, но всё ок.'},
  {name:'Нигора',stars:5,text:'Сыворотка просто топ, кожа сияет. Спасибо за подробную инструкцию по применению.'}
 ]},
 uz:{title:'Xaridorlar fikri',eyebrow:'IZOHLAR',navLabel:'Izohlar',viewTitle:'Izohlar',viewEyebrow:'TELEGRAM',empty:'Tez orada bu yerda Telegramdagi haqiqiy izohlar skrinshotlari paydo bo‘ladi.',items:[
  {name:'Dilnoza',stars:5,text:'3 haftada teri sezilarli darajada tekislandi. Hammasi original, qadoq butun, yetkazish tez.'},
  {name:'Malika',stars:5,text:'Quiz orqali parvarish tanladim — juda mos keldi. Rang tekislandi, qizarish yo‘qoldi.'},
  {name:'Iroda',stars:5,text:'Ikkinchi marta buyurtma qilyapman. Narxlar halol, konsultant doim aloqada. Tavsiya qilaman!'},
  {name:'Sevara',stars:4,text:'Yaxshi koreys kosmetikasi, teksturasi yoqimli. Yetkazishni biroz kutdim, lekin hammasi zo‘r.'},
  {name:'Nigora',stars:5,text:'Serum juda zo‘r, teri porlaydi. Qo‘llash bo‘yicha batafsil yo‘riqnoma uchun rahmat.'}
 ]}
};

function applyLanguage(){
 document.documentElement.lang=lang;document.querySelector('#langBtn').textContent=lang.toUpperCase();document.querySelector('#heroBadge').textContent=tr().heroBadge;document.querySelector('#heroTitle').textContent=tr().heroTitle;document.querySelector('#heroText').textContent=tr().heroText;document.querySelector('#heroQuiz').textContent=tr().heroQuiz;document.querySelector('#heroCatalog').textContent=tr().heroCatalog;document.querySelector('#catalogEyebrow').textContent=PRODUCTS.length+' '+tr().count;document.querySelector('#catalogTitle').textContent=tr().catalog;document.querySelector('#favoritesShortcut').textContent=tr().fav;document.querySelector('#search').placeholder=tr().search;document.querySelector('#favoritesTitle').textContent=tr().fav;document.querySelector('#cartTitle').textContent=tr().cart;document.querySelector('#itemsLabel').textContent=tr().items;document.querySelector('#deliveryLabel').textContent=tr().delivery;document.querySelector('#weightLabel').textContent=tr().weightLabel;document.querySelector('#totalLabel').textContent=tr().total;document.querySelector('#deliveryNote').textContent=tr().deliveryNote;document.querySelector('#checkout').textContent=tr().checkout;document.querySelector('#navCatalog').textContent=tr().catalog;document.querySelector('#navQuiz').textContent=tr().navQuiz;document.querySelector('#navFavorites').textContent=tr().fav;document.querySelector('#navCart').textContent=tr().cart;document.querySelector('#benefitSummary').textContent=tr().detailsBenefits;document.querySelector('#useSummary').textContent=tr().detailsUse;document.querySelector('#volumeLabel').textContent=tr().volume;document.querySelector('#originLabel').textContent=tr().origin;document.querySelector('#modalAdd').textContent=tr().add;document.querySelector('#quizIntroTitle').textContent=tr().quizIntroTitle;document.querySelector('#quizIntroText').textContent=tr().quizIntroText;document.querySelector('#startQuiz').textContent=tr().start;document.querySelector('#filterBtnLabel').textContent=tr().filters;document.querySelector('#filterSheetTitle').textContent=tr().filters;document.querySelector('#filterSkinLabel').textContent=tr().skinLabel;document.querySelector('#filterConcernLabel').textContent=tr().concernLabel;document.querySelector('#filterSortLabel').textContent=tr().sortLabel;document.querySelector('#filterReset').textContent=tr().reset;document.querySelector('#filterApply').textContent=tr().apply;document.querySelector('#clearCart').textContent=tr().clearCart;document.querySelector('#ordersShortcut').textContent=tr().ordersLink;renderCategories();renderCatalog();renderFilters();renderFavorites();renderCart();showQuizStep();document.querySelector('#navReviews').textContent=(REVIEWS[lang]||REVIEWS.ru).navLabel;const _pay=PAY[lang]||PAY.ru;document.querySelector('#payLabel').textContent=_pay.label;document.querySelector('#payCash').textContent=_pay.cash;document.querySelector('#payCard').textContent=_pay.card;updatePayUI();if(currentView==='reviews')renderReviewShots();if(currentProduct)openProduct(currentProduct.id);
}

document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
document.querySelector('#homeButton').onclick=()=>switchView('catalog');
document.querySelector('#search').oninput=renderCatalog;
document.querySelector('#searchClear').onclick=()=>{const s=document.querySelector('#search');s.value='';renderCatalog();s.focus()};
document.querySelector('#searchBtn').onclick=()=>{
  if(!document.querySelector('#catalog').classList.contains('active'))switchView('catalog');
  document.querySelector('#searchBar').classList.remove('hidden');
  document.querySelector('#homeHero').classList.add('hidden'); // прячем баннер, чтобы товары были видны
  requestAnimationFrame(()=>document.querySelector('#search').focus());
  window.scrollTo({top:0,behavior:'smooth'});
  haptic();
};
function closeSearch(){const s=document.querySelector('#search');s.value='';renderCatalog();document.querySelector('#searchBar').classList.add('hidden');document.querySelector('#homeHero').classList.toggle('hidden',currentView!=='catalog')}
document.querySelector('#searchCancel').onclick=closeSearch;
document.querySelector('#search').addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch()});
document.querySelector('#filterBtn').onclick=openFilters;
document.querySelector('#filterClose').onclick=closeFilters;
document.querySelector('#filterBackdrop').onclick=closeFilters;
document.querySelector('#filterApply').onclick=closeFilters;
document.querySelector('#filterReset').onclick=resetFilters;
document.querySelector('#clearCart').onclick=clearCart;
document.querySelector('#payCash').onclick=()=>setPay('cash');document.querySelector('#payCard').onclick=()=>setPay('card');
document.querySelector('#langBtn').onclick=()=>{lang=lang==='ru'?'uz':'ru';localStorage.setItem('lang',lang);applyLanguage();haptic()};
document.querySelector('#closeModal').onclick=closeModal;document.querySelector('#modalBackdrop').onclick=closeModal;
document.querySelector('#modalFavorite').onclick=()=>currentProduct&&toggleFavorite(currentProduct.id);
document.querySelector('#modalAdd').onclick=()=>{if(currentProduct)addToCart(currentProduct.id);closeModal()};
document.querySelector('#startQuiz').onclick=()=>{quizStep=0;showQuizStep()};document.querySelector('#quizNext').onclick=quizNext;document.querySelector('#quizBack').onclick=quizBack;document.querySelector('#addRoutine').onclick=addRoutine;document.querySelector('#restartQuiz').onclick=restartQuiz;document.querySelector('#checkout').onclick=checkout;
document.querySelector('#ordersShortcut').onclick=openOrders;document.querySelector('#ordersClose').onclick=closeOrders;document.querySelector('#ordersBackdrop').onclick=closeOrders;
document.querySelector('#shotLightboxClose').onclick=closeShot;document.querySelector('#shotLightbox').addEventListener('click',e=>{if(e.target.id!=='shotLightboxImg')closeShot()});
document.querySelector('#checkoutSubmit').onclick=submitOrder;document.querySelector('#checkoutClose').onclick=closeCheckout;document.querySelector('#checkoutBackdrop').onclick=closeCheckout;document.querySelector('#grabContact').onclick=grabContact;
document.querySelector('#buyerPhone').addEventListener('keydown',e=>{if(e.key==='Enter')submitOrder()});

if(tg){tg.BackButton?.onClick?.(handleBack);tg.MainButton?.onClick?.(checkout);}
applyLanguage();switchView('catalog');
