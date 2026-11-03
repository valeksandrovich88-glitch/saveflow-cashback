(()=>{
  const BANK='А-Банк';
  const SOURCE='https://finance.ua/ua/cards/cashback-review';
  const MONTH='2026-11';
  const START='2026-11-01';
  const END='2026-11-30';
  const OFFERS=[
    {name:'Yabluka',category:'Техніка',rate:5,rateText:'5%',note:'Максимальний кешбек 500 грн'},
    {name:'WOG',category:'АЗС',rate:3,rateText:'3%',note:'Сервіси самообслуговування · максимум 500 грн'},
    {name:'INTERTOP',category:'Одяг та взуття',rate:4,rateText:'4%',note:'Сайт та застосунок · максимум 200 грн'},
    {name:'Balka Book',category:'Книги та канцтовари',rate:6,rateText:'6%',note:''},
    {name:'ОН Клінік',category:"Аптеки / здоров'я",rate:5,rateText:'5%',note:'Від 1000 грн · максимум 500 грн'},
    {name:'Книгарня Є',category:'Книги та канцтовари',rate:4,rateText:'4%',note:'Максимум 500 грн'},
    {name:'Varus.ua',category:'Продукти',rate:7,rateText:'7%',note:'Онлайн-замовлення від 1500 грн'},
    {name:'MOYO',category:'Техніка',rate:3,rateText:'3%',note:'Максимум 500 грн'},
    {name:'Sushi Master',category:'Кафе та ресторани',rate:5,rateText:'5%',note:'Є регіональні винятки'},
    {name:'Tickets.ua',category:'Транспорт',rate:3,rateText:'3%',note:'Максимум 500 грн'},
    {name:'MEGOGO BOOKS',category:'Книги та канцтовари',rate:8,rateText:'8%',note:''},
    {name:'Yves Rocher',category:'Краса',rate:7,rateText:'7%',note:''},
    {name:'Кібернетики',category:'Техніка',rate:5,rateText:'5%',note:'Максимум 500 грн'},
    {name:'KIMS',category:'Послуги',rate:10,rateText:'10%',note:'Максимум 500 грн'},
    {name:'Vivat',category:'Книги та канцтовари',rate:7,rateText:'7%',note:''},
    {name:'KTC.ua',category:'Техніка',rate:5,rateText:'5%',note:'Максимум 500 грн'},
    {name:'KLR Bus',category:'Транспорт',rate:5,rateText:'5%',note:'Покупки на сайті klr.com.ua'},
    {name:'Leroy Merlin',category:'Дім та ремонт',rate:3,rateText:'3%',note:'Онлайн-покупки · максимум 1000 грн'},
    {name:'UkrArmor',category:'Одяг та взуття',rate:5,rateText:'5%',note:'Військове спорядження'},
    {name:"Cher'17",category:'Одяг та взуття',rate:8,rateText:'8%',note:'Інтернет-покупки'},
    {name:'Biblioteque de Parfum',category:'Краса',rate:12,rateText:'12%',note:'Максимум 500 грн'},
    {name:'One by One',category:'Одяг та взуття',rate:8,rateText:'8%',note:''},
    {name:'Mathema.me',category:'Освіта',rate:10,rateText:'10%',note:'Максимум 500 грн'},
    {name:'Estro',category:'Одяг та взуття',rate:8,rateText:'8%',note:''},
    {name:'Mr. Scrubber',category:'Краса',rate:10,rateText:'10%',note:''},
    {name:'Lacoste.ua',category:'Одяг та взуття',rate:7,rateText:'7%',note:''},
    {name:'Telemart',category:'Техніка',rate:3,rateText:'3%',note:'Максимум 500 грн'},
    {name:'DUNA.ua',category:'Одяг та взуття',rate:6,rateText:'6%',note:''}
  ];

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').toLocaleLowerCase('uk-UA').replace(/\s+/g,' ').trim();
  let scheduled=false,busy=false;

  function makeCard(o){
    const el=document.createElement('article');
    el.className='partner-card';
    el.dataset.bank=BANK;
    el.dataset.category=o.category;
    el.dataset.partner=o.name;
    el.dataset.rate=String(o.rate);
    el.dataset.sfAbankCurrent='1';
    el.dataset.sfSource=SOURCE;
    el.dataset.sfMonth=MONTH;
    el.dataset.start=START;
    el.dataset.end=END;
    el.dataset.search=norm([BANK,'àбанк',o.name,o.category,o.rateText,o.note,'партнерський кешбек листопад 2026'].join(' '));
    el.title='A-Банк · партнерський кешбек · листопад 2026';
    el.innerHTML=
      '<div class="partner-bank"><span class="mini-logo-wrap"><span class="mini-logo mini-logo-fallback">à</span></span><span>'+BANK+'</span></div>'+
      '<div class="partner-top"><div class="partner-name">'+esc(o.name)+'</div><div class="partner-rate">'+esc(o.rateText)+'</div></div>'+
      '<div class="tag">'+esc(o.category)+'</div>'+
      (o.note?'<div class="offer-note">'+esc(o.note)+'</div>':'');
    return el;
  }

  function isAbank(card){
    const b=norm(card?.dataset?.bank||card?.querySelector?.('.partner-bank span:last-child')?.textContent||'');
    return b==='а-банк'||b==='àбанк'||b==='абанк';
  }

  function ensureFilters(section){
    const bankPop=section.querySelector('#bankFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(bankPop&&!bankPop.querySelector('[data-bank-value="А-Банк"]')){
      const label=document.createElement('label');
      label.className='check-row';
      label.innerHTML='<span class="tiny-logo-wrap"><span class="tiny-logo tiny-logo-fallback">à</span></span><input type="checkbox" data-bank-value="А-Банк"><span>А-Банк</span>';
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
      [...grid.querySelectorAll('.partner-card')].filter(isAbank).forEach(x=>x.remove());
      const frag=document.createDocumentFragment();
      OFFERS.forEach(o=>frag.appendChild(makeCard(o)));
      grid.appendChild(frag);
      section.dataset.sfAbankOffers=String(OFFERS.length);
      section.dataset.sfAbankLoaded='1';
      window.saveflowRefreshBankFilters?.();
      return true;
    }finally{busy=false}
  }

  function ensure(){
    if(busy)return;
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    const cards=[...grid.querySelectorAll('.partner-card')].filter(isAbank);
    const current=cards.filter(x=>x.dataset.sfAbankCurrent==='1');
    if(current.length!==OFFERS.length||cards.some(x=>x.dataset.sfAbankCurrent!=='1'))inject();
  }

  function boot(){
    if(!inject())return setTimeout(boot,250);
    const grid=document.querySelector('#partners .partner-grid');
    if(grid&&grid.dataset.sfAbankObserver!=='2'){
      grid.dataset.sfAbankObserver='2';
      new MutationObserver(()=>{
        if(scheduled||busy)return;
        scheduled=true;
        setTimeout(()=>{scheduled=false;ensure();},80);
      }).observe(grid,{childList:true});
    }
    window.saveflowApplyAbankPartners=inject;
    window.addEventListener('saveflow-auth-change',()=>setTimeout(ensure,120));
  }
  boot();
})();