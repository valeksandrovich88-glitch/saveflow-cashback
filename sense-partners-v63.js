(()=>{
  const OFFERS=[{"name":"Prom.ua","category":"Маркетплейси","rate":2,"rateText":"2%","note":"Онлайн-оплати · ліміт 500 бонусів/міс"},{"name":"MustHave","category":"Одяг та взуття","rate":7,"rateText":"7%","note":"Онлайн-покупки"},{"name":"Kachoroska","category":"Одяг та взуття","rate":6,"rateText":"6%","note":"Онлайн-покупки"},{"name":"Gepur","category":"Одяг та взуття","rate":8,"rateText":"8%","note":"Магазини та онлайн"},{"name":"OneByOne","category":"Одяг та взуття","rate":8,"rateText":"8%","note":"Магазини та онлайн"},{"name":"Mogoza","category":"Одяг та взуття","rate":0,"rateText":"225 бонусів / чек","note":"Фіксований кешбек за кожен чек"},{"name":"Bagland","category":"Аксесуари / багаж","rate":10,"rateText":"10%","note":"Онлайн-покупки"},{"name":"Samsonite","category":"Аксесуари / багаж","rate":7,"rateText":"7%","note":"Онлайн-оплати"},{"name":"Bomond","category":"Краса","rate":6,"rateText":"6%","note":"Онлайн-покупки"},{"name":"Pleso","category":"Онлайн-сервіси","rate":10,"rateText":"10%","note":"Консультація психолога · ліміт 500 бонусів/міс"},{"name":"SAMSUNG","category":"Техніка","rate":3,"rateText":"3%","note":"Samsung Experience Store та samsungshop.com.ua · ліміт 300 бонусів"},{"name":"КІБЕРНЕТИКИ","category":"Техніка","rate":5,"rateText":"5%","note":"У магазинах та онлайн"},{"name":"MOYO","category":"Техніка","rate":3,"rateText":"3%","note":"У мережі та на сайті"},{"name":"YABLUKA","category":"Техніка","rate":5,"rateText":"5%","note":"Онлайн на ya.ua · ліміт 500 бонусів"},{"name":"Будинок Іграшок","category":"Дитячі товари","rate":5,"rateText":"5%","note":"Онлайн-покупки"},{"name":"MEGOGO BOOKS","category":"Книги та канцтовари","rate":10,"rateText":"10%","note":"Книжки онлайн"},{"name":"Книгарня Є","category":"Книги та канцтовари","rate":4,"rateText":"4%","note":"Онлайн-покупки"},{"name":"TICKETS.UA","category":"Транспорт","rate":5,"rateText":"5%","note":"Оплата квитків у застосунку"},{"name":"OXFORD MEDICAL","category":"Медицина","rate":3,"rateText":"3%","note":"Медичні послуги у Київському регіоні"},{"name":"AMEDA","category":"Медицина","rate":5,"rateText":"5%","note":"Послуги · ліміт 500 бонусів/міс"},{"name":"Agromarket","category":"Сад та город","rate":7,"rateText":"7%","note":"Онлайн-покупки"},{"name":"Leroy Merlin","category":"Дім та ремонт","rate":3,"rateText":"3%","note":"Онлайн-покупки"},{"name":"Apollo Next","category":"Спорт","rate":15,"rateText":"15%","note":"Перша онлайн-підписка для нових клієнтів · ліміт 750 бонусів"},{"name":"Sushi Master","category":"Кафе та ресторани","rate":5,"rateText":"5%","note":"Онлайн-замовлення з оплатою карткою Sense Bank"},{"name":"Львівська майстерня шоколаду","category":"Кафе та ресторани","rate":5,"rateText":"5%","note":"Онлайн-покупки"},{"name":"STORGOM","category":"Дім та ремонт","rate":3,"rateText":"3%","note":"Енергонезалежне обладнання онлайн · ліміт 500 бонусів"},{"name":"ROBINZON","category":"Спорт","rate":7,"rateText":"7%","note":"Онлайн-покупки · ліміт 500 бонусів"},{"name":"VELOPLANETA","category":"Спорт","rate":6,"rateText":"6%","note":"Онлайн-покупки · ліміт 500 бонусів"},{"name":"TOUS","category":"Ювелірні вироби","rate":5,"rateText":"5%","note":"Покупки від 3000 грн карткою Sense Bank"}];
  const SOURCE="https://sensebank.ua/cash-u-news/zovten-iz-cashu-club-otrimujte-bilse-bonusiv-za-sodenni-pokupki";
  const BANK='Sense Bank';
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
    el.dataset.sfSenseCurrent='1';
    el.dataset.sfSource=SOURCE;
    el.dataset.sfMonth=MONTH;
    el.dataset.start='2026-10-01';
    el.dataset.end='2026-10-31';
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек Sense Bank жовтень 2026'].join(' '));
    el.title='Офіційна пропозиція Sense Bank на жовтень 2026';
    el.innerHTML=
      '<div class="partner-bank"><span class="mini-logo-wrap">'+
        '<img class="mini-logo" src="https://sensebank.com.ua/favicon.ico" alt="" onerror="this.style.display=\'none\'">'+
        '<span class="mini-logo mini-logo-fallback">SB</span></span><span>Sense Bank</span></div>'+
      '<div class="partner-top"><div class="partner-name">'+esc(o.name)+'</div><div class="partner-rate">'+esc(o.rateText)+'</div></div>'+
      '<div class="tag">'+esc(o.category)+'</div>'+
      '<div class="offer-note">'+esc(o.note)+'</div>';
    const img=el.querySelector('img');
    if(img)img.addEventListener('load',()=>{const fb=img.nextElementSibling;if(fb)fb.style.display='none';});
    return el;
  }

  function isSenseCard(card){
    const b=norm(card?.dataset?.bank||card?.querySelector?.('.partner-bank span:last-child')?.textContent||'');
    return b==='sense bank'||b==='sense';
  }

  function ensureBankFilter(section){
    if(section.querySelector('[data-bank-value="Sense Bank"]'))return;
    const pop=section.querySelector('#bankFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(!pop)return;
    const label=document.createElement('label');
    label.className='check-row';
    label.innerHTML='<span class="tiny-logo-wrap"><span class="tiny-logo tiny-logo-fallback">SB</span></span><input type="checkbox" data-bank-value="Sense Bank"><span>Sense Bank</span>';
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
    [...grid.querySelectorAll('.partner-card')].filter(isSenseCard).forEach(x=>x.remove());
    const frag=document.createDocumentFragment();
    OFFERS.forEach(o=>frag.appendChild(makeCard(o)));
    grid.appendChild(frag);
    section.dataset.sfSenseOffers=String(OFFERS.length);
    section.dataset.sfSenseLoaded='1';
    apply();
    return true;
  }

  function ensure(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    const sense=[...grid.querySelectorAll('.partner-card')].filter(isSenseCard);
    const current=sense.filter(x=>x.dataset.sfSenseCurrent==='1').length;
    const stale=sense.some(x=>x.dataset.sfSenseCurrent!=='1');
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
    window.saveflowApplySensePartners=()=>{inject();};
    window.addEventListener('saveflow-auth-change',()=>setTimeout(ensure,100));
  }
  boot();
})();