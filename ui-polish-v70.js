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
      width:22px!important;
      height:22px!important;
      flex:0 0 22px!important;
      margin-right:2px!important;
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
      padding:0!important;
      overflow:visible!important;
    }
    #categories th[data-sf-extra-bank="Картка Rozetka"] .sf-inline-logo img{
      width:22px!important;
      height:22px!important;
      object-fit:contain!important;
      mix-blend-mode:multiply!important;
      border-radius:0!important;
      background:transparent!important;
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

  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  const displayBankName=value=>value==='Картка Rozetka'?'Rozetka':value;

  function cardBank(card){
    return norm(card?.dataset?.bank||
      card?.querySelector('.partner-bank > span:last-child,.promo-bank > span:last-child')?.textContent||'');
  }

  function allBankNames(){
    const names=new Set();
    document.querySelectorAll('#categories thead th').forEach((th,i)=>{
      if(i===0)return;
      const name=norm(th.dataset.sfBankOrderName||th.querySelector('.bank-name')?.textContent||th.textContent);
      if(name)names.add(name);
    });
    document.querySelectorAll('#partners .partner-card,#promos .promo-card').forEach(card=>{
      const name=cardBank(card);if(name)names.add(name);
    });
    return [...names].sort((a,b)=>collator.compare(displayBankName(a),displayBankName(b)));
  }

  function canonicalBankFilter(wrap,names,attr){
    if(!wrap)return false;
    const rows=[...wrap.querySelectorAll(':scope > label.check-row')];
    if(rows.length!==names.length)return false;
    if(wrap.querySelector('.tiny-logo-wrap,.tiny-logo,.tiny-logo-fallback'))return false;
    return rows.every((label,i)=>{
      const input=label.querySelector('input['+attr+']');
      const span=label.querySelector(':scope > span:last-child');
      return input?.getAttribute(attr)===names[i] && norm(span?.textContent)===displayBankName(names[i]);
    });
  }

  function rebuildBankFilter(wrap,names,attr,search){
    if(!wrap)return;
    const sig=JSON.stringify(names);
    if(wrap.dataset.sfAllBanksSig===sig&&canonicalBankFilter(wrap,names,attr))return;

    const selected=new Set([...wrap.querySelectorAll('input['+attr+']:checked')]
      .map(x=>x.getAttribute(attr)).filter(Boolean));

    wrap.replaceChildren();
    names.forEach(name=>{
      const label=document.createElement('label');
      label.className='check-row check-row--plain';
      const input=document.createElement('input');
      input.type='checkbox';
      input.setAttribute(attr,name);
      input.checked=selected.has(name);
      const span=document.createElement('span');
      span.textContent=displayBankName(name);
      label.append(input,span);
      wrap.appendChild(label);
      input.addEventListener('change',()=>search?.dispatchEvent(new Event('input',{bubbles:true})));
    });
    wrap.dataset.sfAllBanksSig=sig;
    search?.dispatchEvent(new Event('input',{bubbles:true}));
  }

  function rebuildAllBankFilters(){
    const names=allBankNames();
    if(!names.length)return;
    const partnerWrap=document.querySelector('#partners #bankFilterLabel')?.closest('details')?.querySelector('.filter-pop')
      || document.querySelector('#partners .filter-pop:has([data-bank-value])');
    const promoWrap=document.getElementById('promoBankFilter');
    rebuildBankFilter(partnerWrap,names,'data-bank-value',document.getElementById('partnerSearch'));
    rebuildBankFilter(promoWrap,names,'data-promo-bank-value',document.getElementById('promoSearch'));
  }

  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      rebuildAllBankFilters();
      polishStaticUi();
    });
  }

  function polishStaticUi(){
    document.querySelectorAll('#promos .filter-pop .tiny-logo-wrap,#partners .filter-pop .tiny-logo-wrap').forEach(el=>el.remove());
    const promoKicker=document.querySelector('#promos .section-kicker');
    if(promoKicker)promoKicker.textContent='Тимчасові або умовні пропозиції, акції, знижки';
    document.querySelectorAll('.update-log').forEach(el=>el.remove());
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

  const promoGrid=document.querySelector('#promos .promo-grid');
  if(promoGrid)new MutationObserver(schedule).observe(promoGrid,{childList:true});
  const partnerGrid=document.querySelector('#partners .partner-grid');
  if(partnerGrid)new MutationObserver(schedule).observe(partnerGrid,{childList:true});

  const promoFilter=document.getElementById('promoBankFilter');
  if(promoFilter)new MutationObserver(schedule).observe(promoFilter,{childList:true,subtree:true});
  const partnerBankFilter=document.querySelector('#partners #bankFilterLabel')?.closest('details')?.querySelector('.filter-pop')
    || document.querySelector('#partners .filter-pop:has([data-bank-value])');
  if(partnerBankFilter)new MutationObserver(schedule).observe(partnerBankFilter,{childList:true,subtree:true});

  window.addEventListener('saveflow-auth-change',()=>setTimeout(()=>{
    polishStaticUi();schedule();bindExclusiveMenus('#promos');bindExclusiveMenus('#partners');
  },80));
  window.saveflowRefreshPromoBankFilter=schedule;
  window.saveflowRefreshBankFilters=schedule;
})();
