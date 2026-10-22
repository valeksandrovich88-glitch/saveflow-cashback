(()=>{
  const BANK='monobank';
  const MONTH='2026-10';
  const START='2026-10-01';
  const END='2026-10-31';
  const SOURCE='monobank app · Кешбек від партнерів за жовтень 2026';
  const OFFERS=[
    {name:'ANSWEAR.ua',category:'Одяг та взуття',rate:8,rateText:'8%',note:'Онлайн-покупки'},
    {name:'Алло',category:'Техніка',rate:5,rateText:'5%',note:''},
    {name:'Фокстрот',category:'Техніка',rate:5,rateText:'5%',note:''},
    {name:'Аптека оптових цін',category:"Аптеки / здоров'я",rate:5,rateText:'5%',note:''},
    {name:'Аптека 9-1-1',category:"Аптеки / здоров'я",rate:5,rateText:'5%',note:''},
    {name:'Parallel',category:'АЗС',rate:3,rateText:'3%',note:''},
    {name:'TAXI838',category:'Таксі',rate:10,rateText:'10%',note:''},
    {name:'fozzyshop.ua',category:'Продукти',rate:10,rateText:'10%',note:'Перша покупка'},
    {name:'Glovo',category:'Кафе та ресторани',rate:15,rateText:'15%',note:'Перше замовлення'},
    {name:'Petslike.ua',category:'Тварини',rate:12,rateText:'12%',note:''},
    {name:'Optimeal & Club4Paws',category:'Тварини',rate:12,rateText:'12%',note:'Онлайн-покупки'},
    {name:'krkr.com.ua',category:'Краса',rate:7,rateText:'7%',note:'Онлайн-покупки'},
    {name:'MEGOGO BOOKS',category:'Книги та канцтовари',rate:10,rateText:'10%',note:'Онлайн-покупки'},
    {name:'PRM.com',category:'Одяг та взуття',rate:20,rateText:'20%',note:'Онлайн-покупки'},
    {name:'Calvin Klein',category:'Одяг та взуття',rate:10,rateText:'10%',note:''},
    {name:'INTERTOP APP',category:'Одяг та взуття',rate:8,rateText:'8%',note:'Замовлення з застосунку'},
    {name:'Tommy Hilfiger',category:'Одяг та взуття',rate:10,rateText:'10%',note:''},
    {name:'Colins.ua',category:'Одяг та взуття',rate:10,rateText:'10%',note:'Онлайн-покупки'},
    {name:'Lacoste.ua',category:'Одяг та взуття',rate:8,rateText:'8%',note:''},
    {name:'DUNA.ua',category:'Одяг та взуття',rate:10,rateText:'10%',note:'Онлайн-покупки'},
    {name:'KTC',category:'Техніка',rate:6,rateText:'6%',note:''},
    {name:'Магазини Bosch',category:'Техніка',rate:7,rateText:'7%',note:''},
    {name:'Teahouse.ua',category:'Продукти',rate:20,rateText:'20%',note:'Онлайн-покупки'},
    {name:'KLR bus',category:'Транспорт',rate:10,rateText:'10%',note:'Перша покупка'}
  ];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').toLocaleLowerCase('uk-UA').trim();
  let busy=false,queued=false;

  function makeCard(o){
    const el=document.createElement('article');
    el.className='partner-card';
    el.dataset.bank=BANK;
    el.dataset.category=o.category;
    el.dataset.partner=o.name;
    el.dataset.rate=String(o.rate);
    el.dataset.sfMonoCurrent='1';
    el.dataset.sfSource=SOURCE;
    el.dataset.sfMonth=MONTH;
    el.dataset.start=START;
    el.dataset.end=END;
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек monobank жовтень 2026'].join(' '));
    el.title='monobank · партнерський кешбек за жовтень 2026';
    el.innerHTML=
      '<div class="partner-bank"><span class="mini-logo-wrap"><span class="mini-logo mini-logo-fallback">mono</span></span><span>monobank</span></div>'+
      '<div class="partner-top"><div class="partner-name">'+esc(o.name)+'</div><div class="partner-rate">'+esc(o.rateText)+'</div></div>'+
      '<div class="tag">'+esc(o.category)+'</div>'+
      (o.note?'<div class="offer-note">'+esc(o.note)+'</div>':'');
    return el;
  }

  function inject(){
    if(busy)return false;
    const section=document.getElementById('partners');
    const grid=section?.querySelector('.partner-grid');
    if(!section||!grid)return false;
    busy=true;
    try{
      grid.querySelectorAll('.partner-card[data-bank="monobank"]').forEach(x=>x.remove());
      const frag=document.createDocumentFragment();
      OFFERS.forEach(o=>frag.appendChild(makeCard(o)));
      grid.appendChild(frag);
      section.dataset.sfMonoOffers=String(OFFERS.length);
      section.dataset.sfMonoLoaded='1';
      window.saveflowRefreshBankFilters?.();
      return true;
    }finally{busy=false}
  }

  function ensure(){
    if(busy)return;
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    const current=grid.querySelectorAll('.partner-card[data-bank="monobank"][data-sf-mono-current="1"]').length;
    if(current!==OFFERS.length)inject();
  }

  function boot(){
    if(!inject())return setTimeout(boot,250);
    const grid=document.querySelector('#partners .partner-grid');
    if(grid)new MutationObserver(()=>{
      if(queued||busy)return;
      queued=true;
      setTimeout(()=>{queued=false;ensure()},80);
    }).observe(grid,{childList:true});
    window.saveflowApplyMonoPartners=inject;
    window.addEventListener('saveflow-auth-change',()=>setTimeout(ensure,120));
  }
  boot();
})();