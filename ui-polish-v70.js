(()=>{
  const st=document.createElement('style');
  st.id='sf-filter-polish-v70';
  st.textContent=`
    #promos .filter-menu,
    #partners .filter-menu{position:relative;z-index:20}
    #promos .filter-menu[open],
    #partners .filter-menu[open]{z-index:80}
    #promos .filter-pop,
    #partners .filter-pop{
      min-width:250px!important;
      max-width:min(340px,calc(100vw - 28px))!important;
      box-sizing:border-box!important;
      z-index:90!important;
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
    #promos .filter-pop .tiny-logo-wrap,
    #partners .filter-pop .tiny-logo-wrap,
    #promos .filter-pop .tiny-logo,
    #partners .filter-pop .tiny-logo{
      display:none!important;
    }
    body.site-user-mode .cash-td.user-personal-edited::after{
      display:none!important;
      content:none!important;
    }
    #categories th[data-sf-extra-bank="Банк Власний Рахунок"] .sf-inline-logo,
    #categories th[data-sf-extra-bank="Картка Rozetka"] .sf-inline-logo{
      width:30px!important;
      height:22px!important;
      flex:0 0 30px!important;
      margin-right:2px!important;
    }
    #partners .partner-card[data-bank="Банк Власний Рахунок"] .sf-inline-logo{
      width:26px!important;
      height:20px!important;
      flex:0 0 26px!important;
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

  function canonicalPromoFilter(wrap,names){
    const rows=[...wrap.querySelectorAll(':scope > label.check-row')];
    if(rows.length!==names.length)return false;
    if(wrap.querySelector('.tiny-logo-wrap,.tiny-logo,.tiny-logo-fallback'))return false;
    return rows.every((label,i)=>{
      const input=label.querySelector('input[data-promo-bank-value]');
      const span=label.querySelector(':scope > span:last-child');
      return input?.getAttribute('data-promo-bank-value')===names[i] &&
        String(span?.textContent||'').trim()===names[i];
    });
  }

  function rebuildPromoBankFilter(){
    const wrap=document.getElementById('promoBankFilter');
    const grid=document.querySelector('#promos .promo-grid');
    const search=document.getElementById('promoSearch');
    if(!wrap||!grid)return;

    const names=[...new Set([...grid.querySelectorAll('.promo-card')].map(bankName).filter(Boolean))]
      .sort((a,b)=>collator.compare(a,b));
    const sig=JSON.stringify(names);
    if(wrap.dataset.sfCanonicalSig===sig&&canonicalPromoFilter(wrap,names))return;

    const selected=new Set([...wrap.querySelectorAll('[data-promo-bank-value]:checked')]
      .map(x=>x.getAttribute('data-promo-bank-value')).filter(Boolean));

    wrap.innerHTML='';
    names.forEach(name=>{
      const label=document.createElement('label');
      label.className='check-row check-row--plain';
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

  function polishStaticUi(){
    document.querySelectorAll('#promos .filter-pop .tiny-logo-wrap,#partners .filter-pop .tiny-logo-wrap').forEach(el=>el.remove());
    const promoKicker=document.querySelector('#promos .section-kicker');
    if(promoKicker)promoKicker.textContent='Тимчасові або умовні пропозиції, акції, знижки';
    document.querySelectorAll('.update-log summary > span').forEach(el=>{
      if(/^V\d+\s*→\s*V\d+$/i.test(String(el.textContent||'').trim()))el.remove();
    });
  }

  function bindExclusiveMenus(section){
    const root=document.querySelector(section);
    if(!root||root.dataset.sfExclusiveFilters==='1')return;
    root.dataset.sfExclusiveFilters='1';
    root.querySelectorAll('details.filter-menu').forEach(details=>{
      details.addEventListener('toggle',()=>{
        if(!details.open)return;
        root.querySelectorAll('details.filter-menu[open]').forEach(other=>{
          if(other!==details)other.open=false;
        });
      });
    });
  }

  polishStaticUi();
  schedule();
  bindExclusiveMenus('#promos');
  bindExclusiveMenus('#partners');
  const grid=document.querySelector('#promos .promo-grid');
  if(grid)new MutationObserver(schedule).observe(grid,{childList:true,subtree:false});
  const promoFilter=document.getElementById('promoBankFilter');
  if(promoFilter)new MutationObserver(()=>{schedule();polishStaticUi();}).observe(promoFilter,{childList:true,subtree:true});
  const partnerFilters=document.querySelector('#partners .filters');
  if(partnerFilters)new MutationObserver(polishStaticUi).observe(partnerFilters,{childList:true,subtree:true});
  window.addEventListener('saveflow-auth-change',()=>setTimeout(()=>{polishStaticUi();schedule();bindExclusiveMenus('#promos');bindExclusiveMenus('#partners');},80));
  window.saveflowRefreshPromoBankFilter=schedule;
})();