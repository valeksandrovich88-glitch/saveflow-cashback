(()=>{
  const OFFERS=[];
  const SOURCE="https://help.sensebank.com.ua/uk_UA/360017053059";
  const BANK='Sense Bank';
  const MONTH='2026-11';
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
    el.dataset.start='2026-11-01';
    el.dataset.end='2026-11-30';
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек Sense Bank листопад 2026'].join(' '));
    el.title='Sense Bank · персоналізовані пропозиції в Sense SuperApp';
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