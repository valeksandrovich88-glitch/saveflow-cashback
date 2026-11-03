(()=>{
  const OFFERS=[
    {name:"VixClinic",category:"Аптеки / здоров'я",rate:10,rateText:"10%",note:"На оплати в клініці"},
    {name:"FERM",category:"Одяг та взуття",rate:5,rateText:"5%",note:"Онлайн-покупки"},
    {name:"Estro",category:"Одяг та взуття",rate:8,rateText:"8%",note:"Онлайн-покупки"},
    {name:"Cornix",category:"Спорт та фітнес",rate:5,rateText:"5%",note:"Онлайн-покупки"},
    {name:"Storgom",category:"Техніка",rate:3,rateText:"3%",note:"Онлайн-покупки"},
    {name:"46 Parallel",category:"Продукти",rate:10,rateText:"10%",note:"Онлайн-покупки"},
    {name:"Big Wines",category:"Продукти",rate:10,rateText:"10%",note:"Онлайн-покупки"},
    {name:"Samsonite",category:"Аксесуари / багаж",rate:7,rateText:"7%",note:"Онлайн-покупки"},
    {name:"Fopi",category:"Техніка",rate:11,rateText:"11%",note:"На всі покупки"},
    {name:"CupCult",category:"Продукти",rate:5,rateText:"5%",note:"Онлайн-покупки"},
    {name:"Sun's house",category:"Дім та ремонт",rate:10,rateText:"10%",note:"Онлайн-покупки"},
    {name:"Bagland",category:"Аксесуари / багаж",rate:10,rateText:"10%",note:"Онлайн-покупки"},
    {name:"Modoza",category:"Одяг та взуття",rate:10,rateText:"10%",note:"Онлайн-покупки"},
    {name:"Skay UA",category:"Ювелірні вироби",rate:2,rateText:"2%",note:"Онлайн-покупки"},
    {name:"Agromarket",category:"Дім та ремонт",rate:7,rateText:"7%",note:"Онлайн-покупки"},
    {name:"Breezy",category:"Техніка",rate:5,rateText:"5%",note:"Онлайн-покупки"},
    {name:"Vector D",category:"Одяг та взуття",rate:4,rateText:"4%",note:"На всі покупки"},
    {name:"HEALER",category:"Аптеки / здоров'я",rate:10,rateText:"10%",note:"Онлайн-покупки"},
    {name:"BlankNote",category:"Аксесуари / багаж",rate:5,rateText:"5%",note:"На всі покупки"},
    {name:"Bomond",category:"Краса",rate:6,rateText:"6%",note:"Онлайн-покупки"},
    {name:"Jura",category:"Техніка",rate:4,rateText:"4%",note:"На всі покупки"},
    {name:"ДЕКА",category:"Ювелірні вироби",rate:4,rateText:"4%",note:"На всі покупки"},
    {name:"Balka-Book",category:"Книги та канцтовари",rate:6,rateText:"6%",note:"Онлайн-покупки"},
    {name:"Kachorovska",category:"Одяг та взуття",rate:6,rateText:"6%",note:"Онлайн-покупки"},
    {name:"HOLLYSKIN",category:"Краса",rate:10,rateText:"10%",note:"Онлайн-покупки"},
    {name:"Gepur",category:"Одяг та взуття",rate:8,rateText:"8%",note:"На всі покупки"},
    {name:"Terra Incognita",category:"Спорт та фітнес",rate:10,rateText:"10%",note:"На всі покупки"},
    {name:"YVES ROCHER",category:"Краса",rate:5,rateText:"5%",note:"Онлайн-покупки"},
    {name:"Sisters Aroma",category:"Краса",rate:6,rateText:"6%",note:"Онлайн-покупки"},
    {name:"Lacoste",category:"Одяг та взуття",rate:7,rateText:"7%",note:"Онлайн-покупки"},
    {name:"Кібернетики",category:"Техніка",rate:5,rateText:"5%",note:"На всі покупки"},
    {name:"Secunda",category:"Ювелірні вироби",rate:4,rateText:"4%",note:"На всі покупки"},
    {name:"ОТАК",category:"Техніка",rate:3,rateText:"3%",note:"Покупки в мережі магазинів"},
    {name:"UkrArmor",category:"Одяг та взуття",rate:3,rateText:"3%",note:"На всі покупки"},
    {name:"Robinzon",category:"Аксесуари / багаж",rate:7,rateText:"7%",note:"Онлайн-покупки"},
    {name:"KLR",category:"Транспорт",rate:6,rateText:"6%",note:"Онлайн-оплата"},
    {name:"Must Have",category:"Одяг та взуття",rate:7,rateText:"7%",note:"Онлайн-покупки"},
    {name:"FoodBoom",category:"Продукти",rate:10,rateText:"10%",note:"На всі покупки"},
    {name:"Sushi Master",category:"Кафе та ресторани",rate:5,rateText:"5%",note:"Оплата в застосунку, на сайті та в закладах"},
    {name:"Lampala",category:"Техніка",rate:5,rateText:"5%",note:"Онлайн-покупки"},
    {name:"Kvshop",category:"Техніка",rate:2,rateText:"2%",note:"Онлайн-покупки"},
    {name:"MONOпіца",category:"Кафе та ресторани",rate:5,rateText:"5%",note:"Оплата в застосунку, на сайті та в закладах"},
    {name:"JUL",category:"Одяг та взуття",rate:6,rateText:"6%",note:"Онлайн-покупки"},
    {name:"SafeYourLove",category:"Інше",rate:11,rateText:"11%",note:"Онлайн-покупки"},
    {name:"MEGOGO BOOKS",category:"Книги та канцтовари",rate:7,rateText:"7%",note:"Онлайн-покупки"},
    {name:"tickets.ua",category:"Транспорт",rate:3,rateText:"3%",note:"Оплата в застосунку Tickets.ua"},
    {name:"ЖУК",category:"Техніка",rate:3,rateText:"3%",note:"На всі покупки"},
    {name:"Auchan",category:"Продукти",rate:5,rateText:"5%",note:"Онлайн-покупки"},
    {name:"Mr.SCRUBBER",category:"Краса",rate:10,rateText:"10%",note:"Онлайн-покупки"},
    {name:"Leroy Merlin",category:"Дім та ремонт",rate:3,rateText:"3%",note:"Онлайн-покупки"},
    {name:"Книгарня Є",category:"Книги та канцтовари",rate:4,rateText:"4%",note:"Онлайн-покупки"},
    {name:"Polis.ua",category:"Страхування",rate:10,rateText:"10%",note:"Онлайн-оплати"},
    {name:"Фора",category:"Продукти",rate:3,rateText:"3%",note:"Онлайн-покупки"},
    {name:"Всі.Свої",category:"Одяг та взуття",rate:5,rateText:"5%",note:"Онлайн-покупки"},
    {name:"Yabluka",category:"Техніка",rate:5,rateText:"5%",note:"Онлайн-покупки"},
    {name:"MOYO",category:"Техніка",rate:3,rateText:"3%",note:"На всі покупки"},
    {name:"Veloplaneta",category:"Спорт та фітнес",rate:6,rateText:"6%",note:"Онлайн-покупки"},
    {name:"Rooler",category:"Автотовари та сервіси",rate:6,rateText:"6%",note:"Онлайн-покупки"}
  ];
  const BANK='GlobusPlus';
  const MONTH='2026-11';
  const START='2026-11-01';
  const END='2026-11-30';
  const SOURCE='GlobusPlus app · Від партнерів · листопад 2026';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').toLocaleLowerCase('uk-UA').trim();
  let scheduled=false,busy=false;

  function makeCard(o){
    const el=document.createElement('article');
    el.className='partner-card';
    el.dataset.bank=BANK;
    el.dataset.category=o.category;
    el.dataset.partner=o.name;
    el.dataset.rate=String(o.rate);
    el.dataset.sfGlobusCurrent='1';
    el.dataset.sfSource=SOURCE;
    el.dataset.sfMonth=MONTH;
    el.dataset.start=START;
    el.dataset.end=END;
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек GlobusPlus листопад 2026'].join(' '));
    el.title='GlobusPlus · партнерський кешбек · листопад 2026';
    el.innerHTML=
      '<div class="partner-bank"><span class="mini-logo-wrap"><span class="mini-logo mini-logo-fallback">G</span></span><span>GlobusPlus</span></div>'+
      '<div class="partner-top"><div class="partner-name">'+esc(o.name)+'</div><div class="partner-rate">'+esc(o.rateText)+'</div></div>'+
      '<div class="tag">'+esc(o.category)+'</div>'+
      '<div class="offer-note">'+esc(o.note)+'</div>';
    return el;
  }

  function isGlobus(card){
    const b=norm(card?.dataset?.bank||card?.querySelector?.('.partner-bank span:last-child')?.textContent||'');
    return b==='globusplus'||b==='globus plus';
  }

  function ensureFilters(section){
    const bankPop=section.querySelector('#bankFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(bankPop&&!section.querySelector('[data-bank-value="GlobusPlus"]')){
      const label=document.createElement('label');
      label.className='check-row';
      label.innerHTML='<span class="tiny-logo-wrap"><span class="tiny-logo tiny-logo-fallback">G</span></span><input type="checkbox" data-bank-value="GlobusPlus"><span>GlobusPlus</span>';
      bankPop.appendChild(label);
    }
    const catPop=section.querySelector('#categoryFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(catPop){
      const existing=new Set([...catPop.querySelectorAll('[data-category-value]')].map(x=>x.getAttribute('data-category-value')));
      [...new Set(OFFERS.map(x=>x.category))].forEach(cat=>{
        if(existing.has(cat))return;
        const label=document.createElement('label');
        label.className='check-row';
        label.innerHTML='<input type="checkbox" data-category-value="'+esc(cat)+'"><span>'+esc(cat)+'</span>';
        catPop.appendChild(label);
      });
    }
  }

  function inject(){
    if(busy)return false;
    const section=document.getElementById('partners');
    const grid=section?.querySelector('.partner-grid');
    if(!section||!grid)return false;
    busy=true;
    try{
      ensureFilters(section);
      [...grid.querySelectorAll('.partner-card')].filter(isGlobus).forEach(x=>x.remove());
      const frag=document.createDocumentFragment();
      OFFERS.forEach(o=>frag.appendChild(makeCard(o)));
      grid.appendChild(frag);
      section.dataset.sfGlobusOffers=String(OFFERS.length);
      section.dataset.sfGlobusLoaded='1';
      setTimeout(()=>window.saveflowRefreshBankFilters?.(),0);
      return true;
    }finally{busy=false}
  }

  function ensure(){
    if(busy)return;
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    const cards=[...grid.querySelectorAll('.partner-card')].filter(isGlobus);
    if(cards.filter(x=>x.dataset.sfGlobusCurrent==='1').length!==OFFERS.length||cards.some(x=>x.dataset.sfGlobusCurrent!=='1'))inject();
  }

  function bindObserver(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid||grid.dataset.sfGlobusObserver==='2')return;
    grid.dataset.sfGlobusObserver='2';
    new MutationObserver(()=>{
      if(scheduled||busy)return;
      scheduled=true;
      setTimeout(()=>{scheduled=false;ensure();},80);
    }).observe(grid,{childList:true});
  }

  function boot(){
    if(!inject())return setTimeout(boot,250);
    bindObserver();
    window.saveflowApplyGlobusPartners=inject;
    window.addEventListener('saveflow-auth-change',()=>setTimeout(()=>{inject();bindObserver();},120));
  }
  boot();
})();

(()=>{
  const OFFERS=[
    {name:"WOG",category:"АЗС",rate:6,rateText:"6%",note:"Пальне, товари та смаколики"},
    {name:"VARUS",category:"Продукти",rate:10,rateText:"10%",note:"Оплата в застосунку та на VARUS.UA"},
    {name:"Фокстрот",category:"Техніка",rate:5,rateText:"5%",note:"Ґаджети та інша техніка"}
  ];
  const BANK='Банк Альянс';
  const SOURCE='https://alb.ua/personal/credit_cards';
  const MONTH='2026-11';
  const START='2026-11-01';
  const END='2026-11-30';
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm=s=>String(s||'').toLocaleLowerCase('uk-UA').trim();
  let scheduled=false,busy=false;

  function makeCard(o){
    const el=document.createElement('article');
    el.className='partner-card';
    el.dataset.bank=BANK;
    el.dataset.category=o.category;
    el.dataset.partner=o.name;
    el.dataset.rate=String(o.rate);
    el.dataset.sfAllianceCurrent='1';
    el.dataset.sfSource=SOURCE;
    el.dataset.sfMonth=MONTH;
    el.dataset.start=START;
    el.dataset.end=END;
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек Alliance bank листопад 2026'].join(' '));
    el.title='Банк Альянс · партнерський кешбек · листопад 2026';
    el.innerHTML=
      '<div class="partner-bank"><span class="mini-logo-wrap"><span class="mini-logo mini-logo-fallback">BA</span></span><span>Банк Альянс</span></div>'+
      '<div class="partner-top"><div class="partner-name">'+esc(o.name)+'</div><div class="partner-rate">'+esc(o.rateText)+'</div></div>'+
      '<div class="tag">'+esc(o.category)+'</div>'+
      '<div class="offer-note">'+esc(o.note)+'</div>';
    return el;
  }

  function isAlliance(card){
    const b=norm(card?.dataset?.bank||card?.querySelector?.('.partner-bank span:last-child')?.textContent||'');
    return b==='банк альянс'||b==='alliance bank'||b==='alliance';
  }

  function ensureFilters(section){
    const bankPop=section.querySelector('#bankFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(bankPop&&!section.querySelector('[data-bank-value="Банк Альянс"]')){
      const label=document.createElement('label');
      label.className='check-row';
      label.innerHTML='<span class="tiny-logo-wrap"><span class="tiny-logo tiny-logo-fallback">BA</span></span><input type="checkbox" data-bank-value="Банк Альянс"><span>Банк Альянс</span>';
      bankPop.appendChild(label);
    }
    const catPop=section.querySelector('#categoryFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(catPop){
      const existing=new Set([...catPop.querySelectorAll('[data-category-value]')].map(x=>x.getAttribute('data-category-value')));
      [...new Set(OFFERS.map(x=>x.category))].forEach(cat=>{
        if(existing.has(cat))return;
        const label=document.createElement('label');
        label.className='check-row';
        label.innerHTML='<input type="checkbox" data-category-value="'+esc(cat)+'"><span>'+esc(cat)+'</span>';
        catPop.appendChild(label);
      });
    }
  }

  function inject(){
    if(busy)return false;
    const section=document.getElementById('partners');
    const grid=section?.querySelector('.partner-grid');
    if(!section||!grid)return false;
    busy=true;
    try{
      ensureFilters(section);
      [...grid.querySelectorAll('.partner-card')].filter(isAlliance).forEach(x=>x.remove());
      const frag=document.createDocumentFragment();
      OFFERS.forEach(o=>frag.appendChild(makeCard(o)));
      grid.appendChild(frag);
      section.dataset.sfAllianceOffers=String(OFFERS.length);
      section.dataset.sfAllianceLoaded='1';
      window.saveflowRefreshBankFilters?.();
      return true;
    }finally{busy=false}
  }

  function ensure(){
    if(busy)return;
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    const cards=[...grid.querySelectorAll('.partner-card')].filter(isAlliance);
    if(cards.filter(x=>x.dataset.sfAllianceCurrent==='1').length!==OFFERS.length||cards.some(x=>x.dataset.sfAllianceCurrent!=='1'))inject();
  }

  function boot(){
    if(!inject())return setTimeout(boot,250);
    const grid=document.querySelector('#partners .partner-grid');
    if(grid&&grid.dataset.sfAllianceObserver!=='2'){
      grid.dataset.sfAllianceObserver='2';
      new MutationObserver(()=>{
        if(scheduled||busy)return;
        scheduled=true;
        setTimeout(()=>{scheduled=false;ensure();},80);
      }).observe(grid,{childList:true});
    }
    window.saveflowApplyAlliancePartners=inject;
    window.addEventListener('saveflow-auth-change',()=>setTimeout(ensure,120));
  }
  boot();
})();