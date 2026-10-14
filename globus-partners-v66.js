(()=>{
  const OFFERS=[{name:"OnTaxi",category:"Таксі",rate:10,rateText:"10%",note:"До 500 грн кешбеку · власні та кредитні кошти"}];
  const BANK='GlobusPlus';
  const SOURCE='https://globusplus.ua/cashback';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').toLocaleLowerCase('uk-UA').trim();
  let scheduled=false;

  function makeCard(o){
    const el=document.createElement('article');
    el.className='partner-card';
    el.dataset.bank=BANK;
    el.dataset.category=o.category;
    el.dataset.partner=o.name;
    el.dataset.rate=String(o.rate);
    el.dataset.sfGlobusCurrent='1';
    el.dataset.sfSource=SOURCE;
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек GlobusPlus'].join(' '));
    el.title='Офіційно підтверджений партнер GlobusPlus';
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
    if(catPop&&!catPop.querySelector('[data-category-value="Таксі"]')){
      const label=document.createElement('label');
      label.className='check-row';
      label.innerHTML='<input type="checkbox" data-category-value="Таксі"><span>Таксі</span>';
      catPop.appendChild(label);
    }
  }

  function inject(){
    const section=document.getElementById('partners');
    const grid=section?.querySelector('.partner-grid');
    if(!section||!grid)return false;
    ensureFilters(section);
    [...grid.querySelectorAll('.partner-card')].filter(isGlobus).forEach(x=>x.remove());
    const frag=document.createDocumentFragment();
    OFFERS.forEach(o=>frag.appendChild(makeCard(o)));
    grid.appendChild(frag);
    section.dataset.sfGlobusOffers=String(OFFERS.length);
    section.dataset.sfGlobusLoaded='1';
    setTimeout(()=>window.saveflowApplySensePartners?.(),0);
    return true;
  }

  function ensure(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    const cards=[...grid.querySelectorAll('.partner-card')].filter(isGlobus);
    if(cards.filter(x=>x.dataset.sfGlobusCurrent==='1').length!==OFFERS.length||cards.some(x=>x.dataset.sfGlobusCurrent!=='1'))inject();
  }

  function bindObserver(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    new MutationObserver(()=>{
      if(scheduled)return;
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
    {name:"WOG",category:"АЗС",rate:4,rateText:"4%",note:"Пальне, товари та смаколики"},
    {name:"VARUS",category:"Продукти",rate:10,rateText:"10%",note:"Оплата в застосунку та на VARUS.UA"},
    {name:"Фокстрот",category:"Техніка",rate:5,rateText:"5%",note:"Ґаджети та інша техніка"},
    {name:"UPG",category:"АЗС",rate:4,rateText:"4%",note:"Пальне, страви, кава та товари"}
  ];
  const BANK='Банк Альянс';
  const SOURCE='https://alb.ua/personal/credit_cards';
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const norm=s=>String(s||'').toLocaleLowerCase('uk-UA').trim();
  let scheduled=false;

  function makeCard(o){
    const el=document.createElement('article');
    el.className='partner-card';
    el.dataset.bank=BANK;
    el.dataset.category=o.category;
    el.dataset.partner=o.name;
    el.dataset.rate=String(o.rate);
    el.dataset.sfAllianceCurrent='1';
    el.dataset.sfSource=SOURCE;
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек Alliance bank'].join(' '));
    el.title='Поточна офіційна партнерська пропозиція Банк Альянс';
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
    const section=document.getElementById('partners');
    const grid=section?.querySelector('.partner-grid');
    if(!section||!grid)return false;
    ensureFilters(section);
    [...grid.querySelectorAll('.partner-card')].filter(isAlliance).forEach(x=>x.remove());
    const frag=document.createDocumentFragment();
    OFFERS.forEach(o=>frag.appendChild(makeCard(o)));
    grid.appendChild(frag);
    section.dataset.sfAllianceOffers=String(OFFERS.length);
    section.dataset.sfAllianceLoaded='1';
    setTimeout(()=>window.saveflowApplySensePartners?.(),0);
    return true;
  }
  function ensure(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    const cards=[...grid.querySelectorAll('.partner-card')].filter(isAlliance);
    if(cards.filter(x=>x.dataset.sfAllianceCurrent==='1').length!==OFFERS.length||cards.some(x=>x.dataset.sfAllianceCurrent!=='1'))inject();
  }
  function bindObserver(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      setTimeout(()=>{scheduled=false;ensure();},80);
    }).observe(grid,{childList:true});
  }
  function boot(){
    if(!inject())return setTimeout(boot,250);
    bindObserver();
    window.saveflowApplyAlliancePartners=inject;
    window.addEventListener('saveflow-auth-change',()=>setTimeout(()=>{inject();bindObserver();},120));
  }
  boot();
})();
