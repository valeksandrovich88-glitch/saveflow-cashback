(()=>{
  const collator=new Intl.Collator('uk-UA',{sensitivity:'base',numeric:true});
  let queued=false;

  function bankName(card){
    return String(card?.dataset?.bank||card?.querySelector('.promo-bank > span:last-child')?.textContent||'').replace(/\s+/g,' ').trim();
  }

  function rebuildPromoBankFilter(){
    const wrap=document.getElementById('promoBankFilter');
    const grid=document.querySelector('#promos .promo-grid');
    const search=document.getElementById('promoSearch');
    if(!wrap||!grid)return;

    const names=[...new Set([...grid.querySelectorAll('.promo-card')].map(bankName).filter(Boolean))]
      .sort((a,b)=>collator.compare(a,b));
    const sig=JSON.stringify(names);
    if(wrap.dataset.sfCanonicalSig===sig)return;

    const selected=new Set([...wrap.querySelectorAll('[data-promo-bank-value]:checked')]
      .map(x=>x.getAttribute('data-promo-bank-value')).filter(Boolean));

    wrap.innerHTML='';
    names.forEach(name=>{
      const label=document.createElement('label');
      label.className='check-row';
      const input=document.createElement('input');
      input.type='checkbox';
      input.setAttribute('data-promo-bank-value',name);
      input.checked=selected.has(name);
      const span=document.createElement('span');
      span.textContent=name;
      label.append(input,span);
      wrap.appendChild(label);
      input.addEventListener('change',()=>search?.dispatchEvent(new Event('input',{bubbles:true})));
    });
    wrap.dataset.sfCanonicalSig=sig;
    search?.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;rebuildPromoBankFilter();});
  }

  schedule();
  const grid=document.querySelector('#promos .promo-grid');
  if(grid)new MutationObserver(schedule).observe(grid,{childList:true,subtree:false});
  window.addEventListener('saveflow-auth-change',()=>setTimeout(schedule,80));
  window.saveflowRefreshPromoBankFilter=schedule;
})();