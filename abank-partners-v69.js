(()=>{
  const BANK='àбанк';
  const SOURCE='https://a-bank.com.ua/services/cashback';
  const OFFERS=[
    {name:'АТБ',category:'Продукти',note:'Найбільша українська мережа супермаркетів'},
    {name:'WOG',category:'АЗС',note:'Мережа автозаправних комплексів гарного настрою'},
    {name:'АНЦ',category:'Аптеки / здоров\'я',note:'Найбільша аптечна мережа України'},
    {name:'MOYO',category:'Техніка',note:'Омніканальний ритейлер техніки й електроніки'},
    {name:'Opti',category:'Таксі',note:'Мобільний застосунок для замовлення таксі'},
    {name:'Master Zoo',category:'Тварини',note:'Мультибрендовий магазин товарів для тварин'},
    {name:'Книгарня Є',category:'Книги та канцтовари',note:'Найбільший вибір літератури'},
    {name:'Bomond.ua',category:'Краса',note:'Усі провідні світові бренди'},
    {name:'Euroclub',category:'Транспорт',note:'Лідер на ринку світових перевезень'}
  ];
  const VISIBLE_OFFERS=OFFERS.filter(o=>String(o.rateText||'').trim()||Number(o.rate)>0);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').toLocaleLowerCase('uk-UA').replace(/\s+/g,' ').trim();
  let scheduled=false;

  function makeCard(o){
    const el=document.createElement('article');
    el.className='partner-card';
    el.dataset.bank=BANK;
    el.dataset.category=o.category;
    el.dataset.partner=o.name;
    el.dataset.rate='0';
    el.dataset.sfAbankCurrent='1';
    el.dataset.sfSource=SOURCE;
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек'].join(' '));
    el.title='Офіційний партнер àбанку. Поточний відсоток залежить від актуальної пропозиції банку.';
    el.innerHTML=
      '<div class="partner-bank"><span class="mini-logo-wrap"><span class="mini-logo mini-logo-fallback">à</span></span><span>'+BANK+'</span></div>'+
      '<div class="partner-top"><div class="partner-name">'+esc(o.name)+'</div><div class="partner-rate">—</div></div>'+
      '<div class="tag">'+esc(o.category)+'</div>'+
      '<div class="offer-note">'+esc(o.note)+'</div>';
    return el;
  }

  function isAbank(card){
    const bank=norm(card?.dataset?.bank||card?.querySelector?.('.partner-bank span:last-child')?.textContent||'');
    return bank==='àбанк'||bank==='а-банк'||bank==='абанк';
  }

  function ensureFilters(section){
    const bankPop=section.querySelector('#bankFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    const bankRows=bankPop?[...bankPop.querySelectorAll('label')].filter(l=>l.querySelector('[data-bank-value="'+BANK+'"]')):[];
    if(!VISIBLE_OFFERS.length){
      bankRows.forEach(x=>x.remove());
      return;
    }
    if(bankPop&&!bankRows.length){
      const label=document.createElement('label');
      label.className='check-row';
      label.innerHTML='<input type="checkbox" data-bank-value="'+BANK+'"><span>'+BANK+'</span>';
      bankPop.appendChild(label);
    }
    const catPop=section.querySelector('#categoryFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(catPop){
      const existing=new Set([...catPop.querySelectorAll('[data-category-value]')].map(x=>x.getAttribute('data-category-value')));
      [...new Set(VISIBLE_OFFERS.map(x=>x.category))].forEach(cat=>{
        if(existing.has(cat))return;
        const label=document.createElement('label');
        label.className='check-row';
        label.innerHTML='<input type="checkbox" data-category-value="'+esc(cat)+'"><span>'+esc(cat)+'</span>';
        catPop.appendChild(label);
      });
    }
  }

  function ensureNote(section){
    let note=section.querySelector('.sf-abank-partner-note');
    if(!note){
      note=document.createElement('div');
      note.className='sf-abank-partner-note';
      note.style.cssText='margin:10px 0 0;font-size:11px;line-height:1.45;color:#5f6d64;';
      const grid=section.querySelector('.partner-grid');
      grid?.insertAdjacentElement('afterend',note);
    }
    if(note){
      note.textContent='Актуальні ставки і партнерські пропозиції можуть бути індивідуальними. Тому список може бути неповним.';
    }
  }

  function inject(){
    const section=document.getElementById('partners');
    const grid=section?.querySelector('.partner-grid');
    if(!section||!grid)return false;
    ensureFilters(section);
    ensureNote(section);
    [...grid.querySelectorAll('.partner-card')].filter(card=>{
      if(!isAbank(card))return false;
      const rate=norm(card.querySelector('.partner-rate')?.textContent||'');
      return card.dataset.sfAbankCurrent==='1'||!rate||rate==='—';
    }).forEach(x=>x.remove());
    const frag=document.createDocumentFragment();
    VISIBLE_OFFERS.forEach(o=>frag.appendChild(makeCard(o)));
    grid.appendChild(frag);
    section.dataset.sfAbankOffers=String(VISIBLE_OFFERS.length);
    section.dataset.sfAbankLoaded='1';
    return true;
  }

  function ensure(){
    const section=document.getElementById('partners');
    const grid=section?.querySelector('.partner-grid');
    if(!section||!grid)return;
    const cards=[...grid.querySelectorAll('.partner-card')].filter(isAbank);
    const auto=cards.filter(x=>x.dataset.sfAbankCurrent==='1');
    if(auto.length!==VISIBLE_OFFERS.length||auto.some(x=>!norm(x.querySelector('.partner-rate')?.textContent||'')||norm(x.querySelector('.partner-rate')?.textContent||'')==='—'))inject();
    else{ensureFilters(section);ensureNote(section);}
  }

  function bindObserver(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid||grid.dataset.sfAbankObserver==='1')return;
    grid.dataset.sfAbankObserver='1';
    new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      setTimeout(()=>{scheduled=false;ensure();},80);
    }).observe(grid,{childList:true});
  }

  function boot(){
    if(!inject())return setTimeout(boot,250);
    bindObserver();
    window.saveflowApplyAbankPartners=inject;
    window.addEventListener('saveflow-auth-change',()=>setTimeout(()=>{inject();bindObserver();},120));
  }
  boot();
})();