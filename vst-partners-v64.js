(()=>{
  const OFFERS=[{"name":"БРСМ-Нафта","category":"АЗС","rate":2,"rateText":"2%","note":"Кешбек на пальне"},{"name":"E-ZOO","category":"Тварини","rate":5,"rateText":"5%","note":"Товари для домашніх улюбленців"},{"name":"Concert.ua","category":"Розваги","rate":5,"rateText":"5%","note":"Квитки на події"},{"name":"APOLLO NEXT","category":"Спорт","rate":2,"rateText":"2%","note":"Спортивний простір"},{"name":"Neftek","category":"АЗС","rate":2.5,"rateText":"2,5%","note":"Пальне та інші товари"},{"name":"ОН Клінік","category":"Медицина","rate":5,"rateText":"5%","note":"Усі послуги клініки"},{"name":"Дека","category":"Ювелірні вироби","rate":5,"rateText":"5%","note":"Годинники та ювелірні вироби"},{"name":"Секунда","category":"Ювелірні вироби","rate":5,"rateText":"5%","note":"Годинники, музичні інструменти та аксесуари"},{"name":"MYplay","category":"Дитячі товари","rate":5,"rateText":"5%","note":"Іграшки та дитячі товари"}];
  const BANK='VST bank';
  const SOURCE='https://vstbank.ua/private/cashback-from-partners';
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
    el.dataset.sfVstCurrent='1';
    el.dataset.sfSource=SOURCE;
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек VST bank'].join(' '));
    el.title='Поточна офіційна партнерська пропозиція VST bank';
    el.innerHTML=
      '<div class="partner-bank"><span class="mini-logo-wrap"><span class="mini-logo mini-logo-fallback">VS</span></span><span>VST bank</span></div>'+
      '<div class="partner-top"><div class="partner-name">'+esc(o.name)+'</div><div class="partner-rate">'+esc(o.rateText)+'</div></div>'+
      '<div class="tag">'+esc(o.category)+'</div>'+
      '<div class="offer-note">'+esc(o.note)+'</div>';
    return el;
  }

  function isVst(card){
    const b=norm(card?.dataset?.bank||card?.querySelector?.('.partner-bank span:last-child')?.textContent||'');
    return b==='vst bank'||b==='vst';
  }

  function ensureFilters(section){
    const bankPop=section.querySelector('#bankFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(bankPop&&!section.querySelector('[data-bank-value="VST bank"]')){
      const label=document.createElement('label');
      label.className='check-row';
      label.innerHTML='<span class="tiny-logo-wrap"><span class="tiny-logo tiny-logo-fallback">VS</span></span><input type="checkbox" data-bank-value="VST bank"><span>VST bank</span>';
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
    [...grid.querySelectorAll('.partner-card')].filter(isVst).forEach(x=>x.remove());
    const frag=document.createDocumentFragment();
    OFFERS.forEach(o=>frag.appendChild(makeCard(o)));
    grid.appendChild(frag);
    section.dataset.sfVstOffers=String(OFFERS.length);
    section.dataset.sfVstLoaded='1';
    setTimeout(()=>window.saveflowApplySensePartners?.(),0);
    return true;
  }

  function ensure(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    const cards=[...grid.querySelectorAll('.partner-card')].filter(isVst);
    if(cards.filter(x=>x.dataset.sfVstCurrent==='1').length!==OFFERS.length||cards.some(x=>x.dataset.sfVstCurrent!=='1'))inject();
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
    window.saveflowApplyVstPartners=inject;
    window.addEventListener('saveflow-auth-change',()=>setTimeout(()=>{inject();bindObserver();},120));
  }
  boot();
})();