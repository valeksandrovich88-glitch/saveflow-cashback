(()=>{
  const BANK='monobank';
  const MONTH='2026-11';
  const START='2026-11-01';
  const END='2026-11-30';
  const SOURCE='monobank app · Кешбек від партнерів за листопад 2026';
  const monoStyle=document.createElement('style');
  monoStyle.id='saveflow-mono-partner-logo-v3';
  monoStyle.textContent=`
    .partner-card[data-bank="monobank"] .partner-bank{
      gap:6px!important;
    }
    .partner-card[data-bank="monobank"] .partner-bank > :not(.sf-mono-partner-logo):not(:last-child){
      display:none!important;
    }
    .partner-card[data-bank="monobank"] .sf-mono-partner-logo{
      display:inline-grid!important;
      place-items:center!important;
      width:15px!important;
      height:15px!important;
      min-width:15px!important;
      max-width:15px!important;
      flex:0 0 15px!important;
      overflow:visible!important;
    }
    .partner-card[data-bank="monobank"] .sf-mono-partner-logo svg{
      display:block!important;
      width:15px!important;
      height:15px!important;
      max-width:15px!important;
      max-height:15px!important;
      overflow:visible!important;
    }
  `;
  document.getElementById(monoStyle.id)?.remove();
  document.head.appendChild(monoStyle);
  const OFFERS=[
    {name:'ANSWEAR.ua',category:'Одяг та взуття',rate:8,rateText:'8%',note:'Онлайн-покупки'},
    {name:'Алло',category:'Техніка',rate:5,rateText:'5%',note:''},
    {name:'Фокстрот',category:'Техніка',rate:5,rateText:'5%',note:''},
    {name:'WOG',category:'АЗС',rate:2,rateText:'2%',note:'На сервіси самообслуговування'},
    {name:'Parallel',category:'АЗС',rate:3,rateText:'3%',note:''},
    {name:'Аптека оптових цін',category:"Аптеки / здоров'я",rate:5,rateText:'5%',note:''},
    {name:'Аптека 9-1-1',category:"Аптеки / здоров'я",rate:5,rateText:'5%',note:''},
    {name:'fozzyshop.ua',category:'Продукти',rate:10,rateText:'10%',note:'Перша покупка'},
    {name:'Glovo',category:'Кафе та ресторани',rate:15,rateText:'15%',note:'Перше замовлення'},
    {name:'PRM.com',category:'Одяг та взуття',rate:25,rateText:'25%',note:'Онлайн-покупки'},
    {name:'Calvin Klein',category:'Одяг та взуття',rate:10,rateText:'10%',note:''},
    {name:'Tommy Hilfiger',category:'Одяг та взуття',rate:10,rateText:'10%',note:''},
    {name:'Colins.ua',category:'Одяг та взуття',rate:10,rateText:'10%',note:'Онлайн-покупки'},
    {name:'Lacoste.ua',category:'Одяг та взуття',rate:8,rateText:'8%',note:''},
    {name:'DUNA.ua',category:'Одяг та взуття',rate:10,rateText:'10%',note:'Онлайн-покупки'},
    {name:'INTERTOP APP',category:'Одяг та взуття',rate:6,rateText:'6%',note:'Замовлення з застосунку'},
    {name:'Petslike.ua',category:'Тварини',rate:12,rateText:'12%',note:''},
    {name:'Optimeal & Club4Paws',category:'Тварини',rate:12,rateText:'12%',note:'Онлайн-покупки'},
    {name:'krkr.com.ua',category:'Краса',rate:7,rateText:'7%',note:'Онлайн-покупки'},
    {name:'MEGOGO BOOKS',category:'Книги та канцтовари',rate:10,rateText:'10%',note:'Онлайн-покупки'},
    {name:'Магазини Bosch',category:'Техніка',rate:10,rateText:'10%',note:''},
    {name:'KTC',category:'Техніка',rate:6,rateText:'6%',note:''},
    {name:'Telemart',category:'Техніка',rate:5,rateText:'5%',note:'Перша покупка'},
    {name:'tickets.ua APP',category:'Транспорт',rate:6,rateText:'6%',note:'Перша покупка в застосунку'},
    {name:'KLR bus',category:'Транспорт',rate:10,rateText:'10%',note:'Перша покупка'},
    {name:'Teahouse.ua',category:'Продукти',rate:20,rateText:'20%',note:'Онлайн-покупки'}
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
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек monobank листопад 2026'].join(' '));
    el.title='monobank · партнерський кешбек за листопад 2026';
    const monoLogo='<span class="sf-mono-partner-logo" aria-hidden="true"><svg viewBox="0 0 20 20"><rect x="2.5" y="2.5" width="15" height="15" rx="4.4" fill="#1b1f29"/><text x="10" y="10.45" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="5.5" font-weight="800" fill="#fff">mono</text></svg></span>';
    el.innerHTML=
      '<div class="partner-bank">'+monoLogo+'<span>monobank</span></div>'+
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