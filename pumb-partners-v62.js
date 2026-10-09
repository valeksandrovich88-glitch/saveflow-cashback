(()=>{
  const OFFERS=[{"name":"SleepSharm","category":"Дім та ремонт","rate":10,"rateText":"10%","note":"Домашній текстиль"},{"name":"MEGOGO","category":"Розваги","rate":30,"rateText":"30%","note":"Передплата"},{"name":"Goodevas","category":"Дитячі товари","rate":5,"rateText":"5%","note":"Розвивальні товари"},{"name":"GUDZYK","category":"Аксесуари / багаж","rate":7,"rateText":"7%","note":"Вироби з екофетру й екошкіри"},{"name":"Readeat.com","category":"Книги та канцтовари","rate":11,"rateText":"11%","note":"Книжки онлайн"},{"name":"FoodBoom","category":"Продукти","rate":10,"rateText":"10%","note":"Усі продукти"},{"name":"KREDENS SHOP","category":"Продукти","rate":10,"rateText":"10%","note":"Кава та супутні товари"},{"name":"TEAHOUSE","category":"Продукти","rate":20,"rateText":"20%","note":"Чай та кава онлайн"},{"name":"KREDENS CAFE","category":"Кафе та ресторани","rate":3,"rateText":"3%","note":"Усе у кав'ярнях"},{"name":"MONOпіца","category":"Кафе та ресторани","rate":5,"rateText":"5%","note":"Доставка та їжа в ресторанах"},{"name":"Spell","category":"Продукти","rate":15,"rateText":"15%","note":"Солодощі та подарунки"},{"name":"Sushi Master","category":"Кафе та ресторани","rate":5,"rateText":"5%","note":"Доставка та їжа в ресторанах"},{"name":"ChaCha","category":"Кафе та ресторани","rate":10,"rateText":"10%","note":"Усе меню ресторану"},{"name":"FIZI","category":"Продукти","rate":5,"rateText":"5%","note":"Корисні батончики"},{"name":"Корисна крамниця","category":"Продукти","rate":5,"rateText":"5%","note":"Натуральні продукти"},{"name":"ЧИСТИЙ СМАК","category":"Продукти","rate":5,"rateText":"5%","note":"Корисні продукти"},{"name":"VARUS","category":"Продукти","rate":7,"rateText":"до 7%","note":"Продукти та напої"},{"name":"Rice&Fish","category":"Кафе та ресторани","rate":5,"rateText":"5%","note":"Замовлення їжі"},{"name":"Львівська майстерня шоколаду","category":"Продукти","rate":7,"rateText":"7%","note":"Шоколад"},{"name":"Sushi Icons","category":"Кафе та ресторани","rate":5,"rateText":"5%","note":"Суші, роли та інше"},{"name":"VARVAR","category":"Продукти","rate":10,"rateText":"10%","note":"Крафтове пиво"},{"name":"Brayval-coffee","category":"Продукти","rate":5,"rateText":"5%","note":"Кава, аксесуари та послуги"},{"name":"46 Parallel","category":"Продукти","rate":10,"rateText":"10%","note":"Тихе та ігристе вино"},{"name":"Gemini","category":"Продукти","rate":5,"rateText":"5%","note":"Кава та чай"},{"name":"TRAVKA","category":"Продукти","rate":15,"rateText":"15%","note":"Органічні чаї"},{"name":"ЕКО Маркет","category":"Продукти","rate":5,"rateText":"до 5%","note":"Усе в мережі маркетів"},{"name":"!FEST Доставка","category":"Кафе та ресторани","rate":5,"rateText":"5%","note":"Доставка їжі"},{"name":"Glovo","category":"Кафе та ресторани","rate":15,"rateText":"15%","note":"Перше замовлення"},{"name":"KIMS","category":"Послуги","rate":10,"rateText":"10%","note":"Послуги хімчистки"},{"name":"MINK","category":"Послуги","rate":7,"rateText":"7%","note":"Онлайн-сервіс хімчистки"},{"name":"Teren","category":"Дім та ремонт","rate":5,"rateText":"5%","note":"Охоронні системи"},{"name":"Ecosoft","category":"Дім та ремонт","rate":5,"rateText":"5%","note":"Фільтри для води"},{"name":"Аквамаркет","category":"Дім та ремонт","rate":5,"rateText":"5%","note":"Плитка та сантехніка"},{"name":"Aroma Buro","category":"Дім та ремонт","rate":7,"rateText":"7%","note":"Ароматовари"},{"name":"PROMENU","category":"Дім та ремонт","rate":3,"rateText":"3%","note":"Посуд та аксесуари"},{"name":"Akvo","category":"Дім та ремонт","rate":5,"rateText":"5%","note":"Системи очищення води"},{"name":"WOW FUN","category":"Дитячі товари","rate":5,"rateText":"5%","note":"Колекційні іграшки"},{"name":"SOVA","category":"Ювелірні вироби","rate":5,"rateText":"5%","note":"Ювелірні вироби"},{"name":"Swarovski","category":"Ювелірні вироби","rate":3,"rateText":"3%","note":"Годинники та ювелірні вироби"},{"name":"LOVE YOU","category":"Ювелірні вироби","rate":5,"rateText":"5%","note":"Ювелірні вироби"},{"name":"DEKA","category":"Ювелірні вироби","rate":5,"rateText":"5%","note":"Годинники"},{"name":"Секунда","category":"Ювелірні вироби","rate":5,"rateText":"5%","note":"Годинники"},{"name":"Pandora","category":"Ювелірні вироби","rate":5,"rateText":"5%","note":"Ювелірні вироби"},{"name":"MOYO","category":"Маркетплейси","rate":3,"rateText":"3%","note":"Асортимент магазину"},{"name":"Bomond","category":"Краса","rate":6,"rateText":"6%","note":"Косметика та парфуми онлайн"},{"name":"ОН Клінік","category":"Аптеки / здоров'я","rate":5,"rateText":"5%","note":"Послуги клініки"},{"name":"Оксфорд Медікал","category":"Аптеки / здоров'я","rate":3,"rateText":"3%","note":"Медичні послуги"},{"name":"Клініка РоміТаль","category":"Аптеки / здоров'я","rate":3,"rateText":"3%","note":"Медичні послуги"},{"name":"LOVESPACE","category":"Інше","rate":10,"rateText":"10%","note":"Товари для дорослих"},{"name":"Treviso","category":"Аптеки / здоров'я","rate":5,"rateText":"5%","note":"Окуляри, лінзи та послуги"},{"name":"Smile Medical Clinic","category":"Аптеки / здоров'я","rate":7,"rateText":"7%","note":"Стоматологічні послуги"},{"name":"krkr.com.ua","category":"Краса","rate":5,"rateText":"5%","note":"Косметика та інше"},{"name":"Центр Ока","category":"Аптеки / здоров'я","rate":3,"rateText":"3%","note":"Усі послуги клініки"},{"name":"N`JOY","category":"Інше","rate":10,"rateText":"10%","note":"Товари для дорослих"},{"name":"Платформа pleso","category":"Аптеки / здоров'я","rate":10,"rateText":"10%","note":"Онлайн-психотерапія"},{"name":"A-OPTICA","category":"Аптеки / здоров'я","rate":5,"rateText":"5%","note":"Товари та послуги оптики"},{"name":"Med-Magazin.ua","category":"Аптеки / здоров'я","rate":5,"rateText":"5%","note":"Медична техніка та інше"},{"name":"АМЕДА","category":"Аптеки / здоров'я","rate":5,"rateText":"5%","note":"Медичні послуги"},{"name":"HoldYou","category":"Аптеки / здоров'я","rate":20,"rateText":"20%","note":"Психологічна консультація"},{"name":"PROSTOR.UA","category":"Краса","rate":7,"rateText":"7%","note":"Б'юті-засоби та інше"},{"name":"SANE","category":"Краса","rate":15,"rateText":"15%","note":"Косметика та догляд"},{"name":"Concert.ua","category":"Розваги","rate":5,"rateText":"5%","note":"Квитки онлайн"},{"name":"Terra Incognita","category":"Спорт","rate":10,"rateText":"10%","note":"Туристичне спорядження"},{"name":"tramp","category":"Спорт","rate":10,"rateText":"10%","note":"Активний відпочинок"},{"name":"Cornix","category":"Спорт","rate":10,"rateText":"10%","note":"Спорт та дозвілля"},{"name":"Онлайн Фітнес","category":"Спорт","rate":20,"rateText":"20%","note":"Онлайн-тренування"},{"name":"Uzspace","category":"Спорт","rate":10,"rateText":"10%","note":"Пляшки та термоси"},{"name":"Base Camp","category":"Спорт","rate":5,"rateText":"5%","note":"Товари для туризму"},{"name":"ROCK FRONT","category":"Спорт","rate":10,"rateText":"10%","note":"Туристичне спорядження"},{"name":"Apollo Next","category":"Спорт","rate":10,"rateText":"10%","note":"Перша фітнес-підписка"},{"name":"Замкнені","category":"Розваги","rate":7,"rateText":"7%","note":"Подарункові сертифікати"},{"name":"Gepur","category":"Одяг та взуття","rate":8,"rateText":"8%","note":"Дизайнерський одяг"},{"name":"DUNA","category":"Одяг та взуття","rate":5,"rateText":"5%","note":"Шкарпетки, білизна та піжами"},{"name":"Авіація Галичини","category":"Одяг та взуття","rate":5,"rateText":"5%","note":"Патріотичний одяг"},{"name":"BlankNote","category":"Аксесуари / багаж","rate":5,"rateText":"5%","note":"Сумки та аксесуари зі шкіри"},{"name":"Bugatti","category":"Одяг та взуття","rate":5,"rateText":"5%","note":"Кожна купівля"},{"name":"INTERTOP","category":"Одяг та взуття","rate":8,"rateText":"8%","note":"Одяг та взуття"},{"name":"OnebyOne","category":"Одяг та взуття","rate":8,"rateText":"8%","note":"Жіночий одяг та взуття"},{"name":"Samsonite","category":"Аксесуари / багаж","rate":7,"rateText":"7%","note":"Валізи, рюкзаки та інше"},{"name":"Brabrabra","category":"Одяг та взуття","rate":8,"rateText":"8%","note":"Білизна та інші товари"},{"name":"Sambag","category":"Аксесуари / багаж","rate":12,"rateText":"12%","note":"Сумки та аксесуари"},{"name":"Bagland","category":"Аксесуари / багаж","rate":10,"rateText":"10%","note":"Сумки, рюкзаки та інше"},{"name":"Estro","category":"Одяг та взуття","rate":8,"rateText":"8%","note":"Взуття, одяг та аксесуари"},{"name":"Туристичне страхування","category":"Страхування","rate":10,"rateText":"10%","note":"Купівля поліса"},{"name":"OnTaxi","category":"Таксі","rate":7,"rateText":"7%","note":"Поїздки та доставка"},{"name":"TAXI838","category":"Таксі","rate":10,"rateText":"10%","note":"Поїздки"},{"name":"Кібернетики","category":"Техніка","rate":5,"rateText":"5%","note":"Ґаджети та техніка"},{"name":"КТС.ua","category":"Техніка","rate":5,"rateText":"5%","note":"Ґаджети та техніка"},{"name":"Fopi.ua","category":"Техніка","rate":10,"rateText":"10%","note":"Електроніка та техніка"},{"name":"Магазин Bosh","category":"Техніка","rate":5,"rateText":"5%","note":"Bosch та Siemens"},{"name":"STORGOM","category":"Техніка","rate":3,"rateText":"3%","note":"Інструменти та техніка"},{"name":"Фокстрот","category":"Техніка","rate":5,"rateText":"до 5%","note":"Ґаджети, техніка та аксесуари"},{"name":"Tehnohata","category":"Техніка","rate":5,"rateText":"5%","note":"Кухонна техніка"},{"name":"JURA","category":"Техніка","rate":5,"rateText":"5%","note":"Кавомашини та аксесуари"},{"name":"Dreame","category":"Техніка","rate":5,"rateText":"5%","note":"Техніка"},{"name":"MOVA","category":"Техніка","rate":5,"rateText":"5%","note":"Техніка"},{"name":"Lampala","category":"Техніка","rate":10,"rateText":"10%","note":"Музичні товари"},{"name":"Samsung Experience Store","category":"Техніка","rate":3,"rateText":"3%","note":"Техніка та електроніка"},{"name":"Yabluka","category":"Техніка","rate":5,"rateText":"5%","note":"Техніка та аксесуари"},{"name":"iSpace","category":"Техніка","rate":5,"rateText":"5%","note":"Apple та інша техніка"},{"name":"Будинок Іграшок","category":"Дитячі товари","rate":5,"rateText":"5%","note":"Дитячі іграшки"},{"name":"MYplay","category":"Дитячі товари","rate":5,"rateText":"5%","note":"Дитячі іграшки"},{"name":"КнигоЛенд","category":"Книги та канцтовари","rate":10,"rateText":"10%","note":"Книжки"},{"name":"Mathema.me","category":"Освіта","rate":7,"rateText":"7%","note":"Онлайн-школа з математики"},{"name":"MEGOGO BOOKS","category":"Книги та канцтовари","rate":10,"rateText":"10%","note":"Книжки"},{"name":"Balka Book","category":"Книги та канцтовари","rate":10,"rateText":"10%","note":"Книжки"},{"name":"BUKI School","category":"Освіта","rate":2,"rateText":"2%","note":"Навчання"},{"name":"INTELLECTUM","category":"Освіта","rate":20,"rateText":"20%","note":"Усі курси"},{"name":"MasterZoo","category":"Тварини","rate":5,"rateText":"5%","note":"Зоотовари"},{"name":"Say Meow","category":"Тварини","rate":5,"rateText":"5%","note":"Кігтеточки-лежанки"},{"name":"АТЛ","category":"Автотовари та сервіси","rate":5,"rateText":"5%","note":"Автотовари та сервіс"},{"name":"Автострахування","category":"Страхування","rate":10,"rateText":"10%","note":"Купівля поліса"},{"name":"Parallel","category":"АЗС","rate":2,"rateText":"2%","note":"Пальне та інші товари"}];
  const SOURCE='https://about.pumb.ua/presscenter/narodnyy_bankir/item/8286-pumb-proponu-bljshe-keshbeku-schomsyacya';
  const BANK='ПУМБ';
  const MONTH='2026-10';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').toLocaleLowerCase('uk-UA').trim();
  const collator=new Intl.Collator('uk-UA',{sensitivity:'base',numeric:true});
  let applying=false,scheduled=false;

  function makeCard(o){
    const el=document.createElement('article');
    el.className='partner-card';
    el.dataset.bank=BANK;
    el.dataset.category=o.category;
    el.dataset.partner=o.name;
    el.dataset.rate=String(o.rate);
    el.dataset.sfPumbCurrent='1';
    el.dataset.sfSource=SOURCE;
    el.dataset.sfMonth=MONTH;
    el.dataset.start='2026-10-01';
    el.dataset.end='2026-10-31';
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек ПУМБ жовтень 2026'].join(' '));
    el.title='Офіційна пропозиція ПУМБ на жовтень 2026';
    el.innerHTML=
      '<div class="partner-bank"><span class="mini-logo-wrap">'+
        '<img class="mini-logo" src="https://www.pumb.ua/favicon.ico" alt="" onerror="this.style.display=\'none\'">'+
        '<span class="mini-logo mini-logo-fallback">П</span></span><span>ПУМБ</span></div>'+
      '<div class="partner-top"><div class="partner-name">'+esc(o.name)+'</div><div class="partner-rate">'+esc(o.rateText)+'</div></div>'+
      '<div class="tag">'+esc(o.category)+'</div>'+
      '<div class="offer-note">'+esc(o.note)+'</div>';
    const img=el.querySelector('img');
    if(img)img.addEventListener('load',()=>{const fb=img.nextElementSibling;if(fb)fb.style.display='none';});
    return el;
  }

  function ensureBankFilter(section){
    if(section.querySelector('[data-bank-value="ПУМБ"]'))return;
    const pop=section.querySelector('#bankFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(!pop)return;
    const label=document.createElement('label');
    label.className='check-row';
    label.innerHTML='<span class="tiny-logo-wrap"><span class="tiny-logo tiny-logo-fallback">П</span></span><input type="checkbox" data-bank-value="ПУМБ"><span>ПУМБ</span>';
    pop.appendChild(label);
  }

  function ensureCategoryFilters(section){
    const pop=section.querySelector('#categoryFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(!pop)return;
    const existing=new Set([...pop.querySelectorAll('[data-category-value]')].map(x=>x.getAttribute('data-category-value')));
    [...new Set(OFFERS.map(x=>x.category))].sort(collator.compare).forEach(cat=>{
      if(existing.has(cat))return;
      const label=document.createElement('label');
      label.className='check-row';
      label.innerHTML='<input type="checkbox" data-category-value="'+esc(cat)+'"><span>'+esc(cat)+'</span>';
      pop.appendChild(label);
    });
  }

  function expired(card){
    const end=card.dataset.end;
    if(!end)return false;
    const d=new Date(end+'T23:59:59');
    return !Number.isNaN(d.getTime()) && d.getTime()<Date.now();
  }

  function labelFor(inputs,id,allText,attr){
    const el=document.getElementById(id);if(!el)return;
    const vals=inputs.filter(x=>x.checked).map(x=>x.getAttribute(attr));
    el.textContent=!vals.length?allText:(vals.length===1?vals[0]:'Кілька');
  }

  function apply(){
    if(applying)return;
    const section=document.getElementById('partners');
    const grid=section?.querySelector('.partner-grid');
    if(!section||!grid)return;
    applying=true;
    try{
      const search=section.querySelector('#partnerSearch');
      const sort=section.querySelector('#partnerSort');
      const bankChecks=[...section.querySelectorAll('[data-bank-value]')];
      const catChecks=[...section.querySelectorAll('[data-category-value]')];
      const banks=new Set(bankChecks.filter(x=>x.checked).map(x=>x.getAttribute('data-bank-value')));
      const cats=new Set(catChecks.filter(x=>x.checked).map(x=>x.getAttribute('data-category-value')));
      const q=norm(search?.value||'');
      const cards=[...grid.querySelectorAll('.partner-card')];
      const mode=sort?.value||'rate';
      cards.sort((a,b)=>{
        if(mode==='rate'){
          const d=Number(b.dataset.rate||0)-Number(a.dataset.rate||0);
          if(d)return d;
          const n=collator.compare(a.dataset.partner||'',b.dataset.partner||'');if(n)return n;
          return collator.compare(a.dataset.bank||'',b.dataset.bank||'');
        }
        if(mode==='bank'){
          const d=collator.compare(a.dataset.bank||'',b.dataset.bank||'');if(d)return d;
          const n=collator.compare(a.dataset.partner||'',b.dataset.partner||'');if(n)return n;
          return Number(b.dataset.rate||0)-Number(a.dataset.rate||0);
        }
        const d=collator.compare(a.dataset.category||'',b.dataset.category||'');if(d)return d;
        const n=collator.compare(a.dataset.partner||'',b.dataset.partner||'');if(n)return n;
        return collator.compare(a.dataset.bank||'',b.dataset.bank||'');
      }).forEach(card=>grid.appendChild(card));
      let visible=0;
      cards.forEach(card=>{
        const ok=!expired(card)
          &&(!banks.size||banks.has(card.dataset.bank))
          &&(!cats.size||cats.has(card.dataset.category))
          &&(!q||norm(card.dataset.search||[card.dataset.bank,card.dataset.partner,card.dataset.category,card.textContent].join(' ')).includes(q));
        card.hidden=!ok;
        if(ok)visible++;
      });
      section.querySelector('#partnerEmpty')?.classList.toggle('show',visible===0);
      labelFor(bankChecks,'bankFilterLabel','Всі банки','data-bank-value');
      labelFor(catChecks,'categoryFilterLabel','Всі категорії','data-category-value');
    }finally{applying=false;}
  }

  function inject(){
    const section=document.getElementById('partners');
    const grid=section?.querySelector('.partner-grid');
    if(!section||!grid)return false;
    ensureBankFilter(section);
    ensureCategoryFilters(section);
    grid.querySelectorAll('.partner-card[data-bank="ПУМБ"]').forEach(x=>x.remove());
    const frag=document.createDocumentFragment();
    OFFERS.forEach(o=>frag.appendChild(makeCard(o)));
    grid.appendChild(frag);
    section.dataset.sfPumbOffers=String(OFFERS.length);
    section.dataset.sfPumbLoaded='1';
    apply();
    return true;
  }

  function ensure(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    const current=grid.querySelectorAll('.partner-card[data-bank="ПУМБ"][data-sf-pumb-current="1"]').length;
    const stale=grid.querySelector('.partner-card[data-bank="ПУМБ"]:not([data-sf-pumb-current="1"])');
    if(current!==OFFERS.length||stale)inject();
  }

  function bind(){
    const section=document.getElementById('partners');
    if(!section)return false;
    section.addEventListener('input',e=>{if(e.target?.id==='partnerSearch')apply();});
    section.addEventListener('change',e=>{
      if(e.target?.matches?.('[data-bank-value],[data-category-value],#partnerSort'))apply();
    });
    section.querySelector('#resetPartnerFilters')?.addEventListener('click',()=>{
      setTimeout(()=>{
        section.querySelectorAll('[data-bank-value],[data-category-value]').forEach(x=>x.checked=false);
        const search=section.querySelector('#partnerSearch');if(search)search.value='';
        const sort=section.querySelector('#partnerSort');if(sort)sort.value='rate';
        apply();
      },0);
    });
    const grid=section.querySelector('.partner-grid');
    if(grid)new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      setTimeout(()=>{scheduled=false;ensure();},50);
    }).observe(grid,{childList:true});
    return true;
  }

  function boot(){
    if(!inject())return setTimeout(boot,250);
    bind();
    window.saveflowApplyPumbPartners=()=>{inject();};
    window.addEventListener('saveflow-auth-change',()=>setTimeout(ensure,100));
  }
  boot();
})();