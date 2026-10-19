(()=>{
  const st=document.createElement('style');
  st.id='sf-filter-polish-v70';
  st.textContent=`
    #promos .filter-pop,
    #partners .filter-pop{
      min-width:250px!important;
      max-width:min(340px,calc(100vw - 28px))!important;
      box-sizing:border-box!important;
    }
    #promos .filter-pop .check-row,
    #partners .filter-pop .check-row{
      display:flex!important;
      align-items:center!important;
      gap:8px!important;
      width:100%!important;
      box-sizing:border-box!important;
      min-height:31px!important;
      padding:6px 8px!important;
    }
    #promos .filter-pop .check-row > span:last-child,
    #partners .filter-pop .check-row > span:last-child{
      display:block!important;
      flex:1 1 auto!important;
      min-width:0!important;
      width:auto!important;
      max-width:none!important;
      white-space:normal!important;
      overflow:visible!important;
      text-overflow:clip!important;
      color:#102219!important;
      opacity:1!important;
      font-size:11px!important;
      line-height:1.2!important;
    }
    #promos #promoBankFilter .check-row > input{
      flex:0 0 auto!important;
    }
    #promos #promoBankFilter .tiny-logo-wrap{
      display:none!important;
    }
    @media(max-width:760px){
      #promos .filter-pop,#partners .filter-pop{
        min-width:min(270px,calc(100vw - 24px))!important;
      }
    }
  `;
  document.head.appendChild(st);

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