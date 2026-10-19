(()=>{
  const ADMIN_KEY='saveflow.matrixOverrides.v1';
  const USER_KEY='saveflow.userMatrixOverrides.v1';
  const TODAY='2026-10-19';
  const EXTRA_BANKS=[
    {
      name:'Банк Власний Рахунок',
      mark:'ВР',
      source:'https://bvr.ua/',
      cells:{
        'Продукти':{
          value:'—',
          note:'Категорійного кешбеку на всі продукти немає. +1% балобонусами діє саме за покупки у «Сільпо» карткою Банк Власний Рахунок — див. блок «Партнери».',
          source:'https://bvr.ua/',
          tier:'official_partner_only'
        }
      }
    },
    {
      name:'Картка Rozetka',
      mark:'RZ',
      source:'https://rozetka.com.ua/ua/pages/rozetka-card-bonus/',
      cells:{
        'Усі покупки':{
          value:'1%',
          note:'Базово 1% бонусними ₴ за покупки. Щомісяця автоматично діють 4% у трьох категоріях; точні категорії місяця показуються у застосунку Rozetka. Окремі ліміти — до 1 000 бонусних ₴ за напрям.',
          source:'https://rozetka.com.ua/ua/pages/rozetka-card-bonus/',
          tier:'official'
        }
      }
    }
  ];

  const BVR_PARTNERS=[
    {
      name:'Сільпо',
      category:'Продукти',
      rate:1,
      rateText:'1%',
      source:'https://bvr.ua/',
      note:'+1% балобонусами додатково за покупки у «Сільпо», зокрема за акційні товари та за кредитні кошти. Максимум — 500 балобонусів на місяць.'
    },
    {
      name:'E-ZOO',
      category:'Тварини',
      rate:10,
      rateText:'до 10%',
      source:'https://silpo.ua/offers/other/xochete-balobonusy-navit-za-tovary-zi-znyzhkamy',
      note:'Партнер прямо названий у поточній офіційній пропозиції «Власного Рахунку». «До 10%» — загальний максимум партнерської винагороди; фактична ставка залежить від конкретної пропозиції.'
    },
    {
      name:'MEGOGO BOOKS',
      category:'Книги та канцтовари',
      rate:10,
      rateText:'до 10%',
      source:'https://silpo.ua/offers/other/xochete-balobonusy-navit-za-tovary-zi-znyzhkamy',
      note:'Партнер прямо названий у поточній офіційній пропозиції «Власного Рахунку». «До 10%» — загальний максимум партнерської винагороди; фактична ставка залежить від конкретної пропозиції.'
    },
    {
      name:'ON Clinic',
      category:"Аптеки / здоров'я",
      rate:10,
      rateText:'до 10%',
      source:'https://silpo.ua/offers/other/xochete-balobonusy-navit-za-tovary-zi-znyzhkamy',
      note:'Партнер прямо названий у поточній офіційній пропозиції «Власного Рахунку». «До 10%» — загальний максимум партнерської винагороди; фактична ставка залежить від конкретної пропозиції.'
    }
  ];

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  const baseHtml=new Map();
  let ensuring=false;
  let extraActive=null;

  function parse(key,fallback){
    try{const x=JSON.parse(localStorage.getItem(key)||'');return x&&typeof x==='object'&&!Array.isArray(x)?x:fallback;}
    catch(_){return fallback;}
  }
  function role(){return document.documentElement.dataset.saveflowRole||'public';}
  function matrixHeaders(){
    return [...document.querySelectorAll('#categories thead th')].map(th=>norm(th.querySelector('.bank-name')?.textContent||th.textContent));
  }
  function cellMeta(td){
    const tr=td.closest('tr');
    if(!tr)return {category:'',bank:'',col:-1};
    const cells=[...tr.children], col=cells.indexOf(td), heads=matrixHeaders();
    return {
      category:norm(tr.querySelector('.category strong')?.textContent||tr.children[0]?.textContent),
      bank:heads[col]||'',
      col
    };
  }
  function cellKey(td){
    const m=cellMeta(td);
    return m.category+'|||'+m.bank;
  }
  function renderBaseCell(def){
    if(!def)return '<span class="dash">—</span>';
    const classes=['cash'];
    if(def.note)classes.push('has-scope');
    const tip=def.note?'<span class="scope-badge" tabindex="0" aria-label="'+esc(def.note)+'" data-tip="'+esc(def.note)+'">?</span>':'';
    return '<div class="'+classes.join(' ')+'" data-source="'+esc(def.source||'')+'" data-source-tier="'+esc(def.tier||'official')+'" data-checked="'+TODAY+'"><span class="cash-value">'+esc(def.value||'—')+'</span>'+tip+'</div>';
  }
  function renderOverride(ov){
    if(!ov||ov.empty||!String(ov.value||'').trim())return '<span class="dash">—</span>';
    if(ov.end&&new Date(ov.end+'T23:59:59')<new Date())return '<span class="dash">—</span>';
    const classes=['cash'];
    if(ov.best)classes.push('best');
    if(ov.note)classes.push('has-scope');
    const attrs=[
      ov.end?' data-end="'+esc(ov.end)+'"':'',
      ov.source?' data-source="'+esc(ov.source)+'"':'',
      ov.sourceTier?' data-source-tier="'+esc(ov.sourceTier)+'"':'',
      ov.checked?' data-checked="'+esc(ov.checked)+'"':''
    ].join('');
    const tip=ov.note?'<span class="scope-badge" tabindex="0" aria-label="'+esc(ov.note)+'" data-tip="'+esc(ov.note)+'">?</span>':'';
    return '<div class="'+classes.join(' ')+'"'+attrs+'><span class="cash-value">'+esc(ov.value)+'</span>'+tip+'</div>';
  }

  function ensureColumns(){
    if(ensuring)return;
    const table=document.querySelector('#categories .matrix-card table');
    const headRow=table?.querySelector('thead tr');
    if(!table||!headRow)return;
    ensuring=true;
    try{
      for(const bank of EXTRA_BANKS){
        const existing=[...headRow.children].find(th=>norm(th.querySelector('.bank-name')?.textContent||th.textContent)===bank.name);
        if(existing)continue;

        const th=document.createElement('th');
        th.dataset.sfExtraBank=bank.name;
        th.innerHTML='<div class="bank-head"><span class="bank-logo-wrap"><span class="bank-logo bank-logo-fallback">'+esc(bank.mark)+'</span></span><div class="bank-name">'+esc(bank.name)+'</div></div>';
        headRow.appendChild(th);

        table.querySelectorAll('tbody tr').forEach(tr=>{
          const cat=norm(tr.querySelector('.category strong')?.textContent||tr.children[0]?.textContent);
          const td=document.createElement('td');
          td.className='cash-td';
          td.dataset.sfExtraBank=bank.name;
          const html=renderBaseCell(bank.cells[cat]);
          td.innerHTML=html;
          tr.appendChild(td);
          baseHtml.set(cat+'|||'+bank.name,html);
        });
      }
      applyExtraOverrides();
      setTimeout(()=>window.saveflowApplyUserBanks?.(),0);
    }finally{ensuring=false;}
  }

  function applyExtraOverrides(){
    const admin=parse(ADMIN_KEY,{});
    const personal=role()==='user'?parse(USER_KEY,{}):{};
    document.querySelectorAll('#categories .matrix-card table tbody td[data-sf-extra-bank]').forEach(td=>{
      const key=cellKey(td);
      const ov=Object.prototype.hasOwnProperty.call(personal,key)?personal[key]:admin[key];
      const base=baseHtml.get(key)||'<span class="dash">—</span>';
      const html=ov?renderOverride(ov):base;
      if(td.innerHTML!==html)td.innerHTML=html;
      td.classList.toggle('user-edited',!!ov);
    });
  }

  function saveExtraOverride(ov,action){
    if(!extraActive)return;
    const key=extraActive.key;
    const storageKey=role()==='user'?USER_KEY:ADMIN_KEY;
    const all=parse(storageKey,{});
    all[key]=ov;
    localStorage.setItem(storageKey,JSON.stringify(all));
    if(role()==='user')window.saveflowCloud?.syncUserMatrix?.(all);
    applyExtraOverrides();
    window.saveflowLogChange?.({scope:role()==='user'?'user':'admin',section:'Матриця',action,target:key});
    closeExtraEditor();
  }
  function resetExtraOverride(){
    if(!extraActive)return;
    const key=extraActive.key;
    const storageKey=role()==='user'?USER_KEY:ADMIN_KEY;
    const all=parse(storageKey,{});
    delete all[key];
    localStorage.setItem(storageKey,JSON.stringify(all));
    if(role()==='user')window.saveflowCloud?.syncUserMatrix?.(all);
    applyExtraOverrides();
    window.saveflowLogChange?.({scope:role()==='user'?'user':'admin',section:'Матриця',action:role()==='user'?'Скинуто персональну ставку':'Повернуто базове значення',target:key});
    closeExtraEditor();
  }

  function openExtraEditor(td){
    if(!document.querySelector('#categories .matrix-card')?.classList.contains('matrix-editing'))return;
    const modal=document.getElementById('matrixEditorModal');
    if(!modal)return;
    const m=cellMeta(td), key=m.category+'|||'+m.bank;
    const all=parse(role()==='user'?USER_KEY:ADMIN_KEY,{});
    const ov=all[key];
    const cash=td.querySelector('.cash');
    const val=document.getElementById('matrixValueInput');
    const note=document.getElementById('matrixNoteInput');
    const end=document.getElementById('matrixEndInput');
    const best=document.getElementById('matrixBestInput');
    const source=document.getElementById('matrixSourceInput');
    const tier=document.getElementById('matrixSourceTierInput');
    const checked=document.getElementById('matrixCheckedInput');
    const preview=document.getElementById('matrixSourcePreview');
    const ctx=document.getElementById('matrixEditorContext');

    extraActive={td,key,bank:m.bank,category:m.category};
    modal.dataset.sfExtraActive='1';
    if(val)val.value=ov?String(ov.value||''):norm(cash?.querySelector('.cash-value')?.textContent||'').replace(/^—$/,'');
    if(note)note.value=ov?String(ov.note||''):String(cash?.querySelector('.scope-badge')?.dataset.tip||'');
    if(end)end.value=ov?String(ov.end||''):String(cash?.dataset.end||'');
    if(best)best.checked=ov?!!ov.best:!!cash?.classList.contains('best');
    const src=ov?.source??cash?.dataset.source??'';
    const st=ov?.sourceTier??cash?.dataset.sourceTier??'';
    const ch=ov?.checked??cash?.dataset.checked??'';
    if(source)source.value=src;
    if(tier)tier.value=st;
    if(checked)checked.value=ch;
    if(preview)preview.innerHTML=src?'Поточне джерело: <a href="'+esc(src)+'" target="_blank" rel="noopener noreferrer">'+esc(src)+'</a>'+(st?' · '+esc(st):'')+(ch?' · перевірено '+esc(ch):''):'Для цієї ставки джерело в базі ще не вказано.';
    if(ctx)ctx.textContent=m.bank+' · '+m.category;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    setTimeout(()=>val?.focus(),0);
  }
  function closeExtraEditor(){
    const modal=document.getElementById('matrixEditorModal');
    modal?.classList.remove('open');
    modal?.setAttribute('aria-hidden','true');
    if(modal)delete modal.dataset.sfExtraActive;
    extraActive=null;
  }

  function bindExtraEditor(){
    document.addEventListener('click',e=>{
      const td=e.target.closest?.('#categories .matrix-card table tbody td[data-sf-extra-bank]');
      if(td&&document.querySelector('#categories .matrix-card')?.classList.contains('matrix-editing')){
        e.preventDefault();
        openExtraEditor(td);
      }
    });

    document.addEventListener('click',e=>{
      if(!extraActive)return;
      const id=e.target?.id||'';
      if(id==='matrixSaveEdit'){
        e.preventDefault();e.stopImmediatePropagation();
        const value=document.getElementById('matrixValueInput')?.value.trim()||'';
        if(!value){
          const input=document.getElementById('matrixValueInput');
          input?.setCustomValidity('Введи значення кешбеку або натисни «Очистити клітинку».');
          input?.reportValidity();
          input?.focus();
          setTimeout(()=>input?.setCustomValidity(''),3000);
          return;
        }
        saveExtraOverride({
          value,
          note:document.getElementById('matrixNoteInput')?.value.trim()||'',
          end:document.getElementById('matrixEndInput')?.value||'',
          best:!!document.getElementById('matrixBestInput')?.checked,
          empty:false,
          source:role()==='admin'?(document.getElementById('matrixSourceInput')?.value.trim()||''):undefined,
          sourceTier:role()==='admin'?(document.getElementById('matrixSourceTierInput')?.value||''):undefined,
          checked:role()==='admin'?(document.getElementById('matrixCheckedInput')?.value||''):undefined,
          updatedAt:new Date().toISOString()
        },role()==='user'?'Збережено персональну ставку':'Змінено глобальну ставку');
      }else if(id==='matrixClearCell'){
        e.preventDefault();e.stopImmediatePropagation();
        saveExtraOverride({value:'',note:'',end:'',best:false,empty:true,updatedAt:new Date().toISOString()},role()==='user'?'Очищено персональну ставку':'Очищено глобальну ставку');
      }else if(id==='matrixResetCell'){
        e.preventDefault();e.stopImmediatePropagation();
        resetExtraOverride();
      }else if(id==='matrixCancelEdit'||id==='matrixEditorClose'){
        setTimeout(closeExtraEditor,0);
      }
    },true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&extraActive)setTimeout(closeExtraEditor,0);});
  }

  function makeBvrCard(o){
    const el=document.createElement('article');
    el.className='partner-card';
    el.dataset.bank='Банк Власний Рахунок';
    el.dataset.category=o.category;
    el.dataset.partner=o.name;
    el.dataset.rate=String(o.rate);
    el.dataset.sfBvrCurrent='1';
    el.dataset.sfSource=o.source;
    el.dataset.search=norm(['Банк Власний Рахунок',o.name,o.category,o.rateText,o.note].join(' ')).toLocaleLowerCase('uk-UA');
    el.innerHTML=
      '<div class="partner-bank"><span class="mini-logo-wrap"><span class="mini-logo mini-logo-fallback">ВР</span></span><span>Банк Власний Рахунок</span></div>'+
      '<div class="partner-top"><div class="partner-name">'+esc(o.name)+'</div><div class="partner-rate">'+esc(o.rateText)+'</div></div>'+
      '<div class="tag">'+esc(o.category)+'</div>'+
      '<div class="offer-note">'+esc(o.note)+'</div>';
    return el;
  }

  function ensurePartnerFilter(section,bank,categories){
    const pops=[...section.querySelectorAll('.filter-pop')];
    const bankPop=pops[0], catPop=pops[1];
    const search=document.getElementById('partnerSearch');
    if(bankPop&&!bankPop.querySelector('[data-bank-value="'+CSS.escape(bank)+'"]')){
      const label=document.createElement('label');label.className='check-row';
      const input=document.createElement('input');input.type='checkbox';input.setAttribute('data-bank-value',bank);
      const span=document.createElement('span');span.textContent=bank;
      label.append(input,span);bankPop.appendChild(label);
      input.addEventListener('change',()=>search?.dispatchEvent(new Event('input',{bubbles:true})));
    }
    if(catPop){
      const existing=new Set([...catPop.querySelectorAll('[data-category-value]')].map(x=>x.getAttribute('data-category-value')));
      [...new Set(categories)].forEach(cat=>{
        if(existing.has(cat))return;
        const label=document.createElement('label');label.className='check-row';
        const input=document.createElement('input');input.type='checkbox';input.setAttribute('data-category-value',cat);
        const span=document.createElement('span');span.textContent=cat;
        label.append(input,span);catPop.appendChild(label);
        input.addEventListener('change',()=>search?.dispatchEvent(new Event('input',{bubbles:true})));
      });
    }
  }

  function injectBvrPartners(){
    const section=document.getElementById('partners');
    const grid=section?.querySelector('.partner-grid');
    if(!section||!grid)return false;
    ensurePartnerFilter(section,'Банк Власний Рахунок',BVR_PARTNERS.map(x=>x.category));
    grid.querySelectorAll('[data-sf-bvr-current="1"]').forEach(x=>x.remove());
    const frag=document.createDocumentFragment();
    BVR_PARTNERS.forEach(o=>{
      const duplicate=[...grid.querySelectorAll('.partner-card')].some(c=>
        norm(c.dataset.bank||c.querySelector('.partner-bank > span:last-child')?.textContent)==='Банк Власний Рахунок' &&
        norm(c.dataset.partner||c.querySelector('.partner-name')?.textContent)===o.name
      );
      if(!duplicate)frag.appendChild(makeBvrCard(o));
    });
    grid.appendChild(frag);
    section.dataset.sfBvrOffers=String(BVR_PARTNERS.length);
    document.getElementById('partnerSearch')?.dispatchEvent(new Event('input',{bubbles:true}));
    return true;
  }

  let bvrQueued=false;
  function ensureBvrPartners(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    const cards=[...grid.querySelectorAll('.partner-card')].filter(x=>
      norm(x.dataset.bank||x.querySelector('.partner-bank > span:last-child')?.textContent)==='Банк Власний Рахунок'
    );
    const names=new Set(cards.map(x=>norm(x.dataset.partner||x.querySelector('.partner-name')?.textContent)));
    if(cards.length!==BVR_PARTNERS.length||BVR_PARTNERS.some(x=>!names.has(x.name)))injectBvrPartners();
  }
  function bindBvrObserver(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid||grid.dataset.sfBvrObserver==='1')return;
    grid.dataset.sfBvrObserver='1';
    new MutationObserver(()=>{
      if(bvrQueued)return;
      bvrQueued=true;
      setTimeout(()=>{bvrQueued=false;ensureBvrPartners();},90);
    }).observe(grid,{childList:true});
  }

  const originalApply=window.saveflowApplyMatrixOverrides;
  if(originalApply&&!originalApply.__sfExtraWrapped){
    const wrapped=function(...args){
      const out=originalApply.apply(this,args);
      queueMicrotask(applyExtraOverrides);
      return out;
    };
    wrapped.__sfExtraWrapped=true;
    window.saveflowApplyMatrixOverrides=wrapped;
  }

  ensureColumns();
  bindExtraEditor();
  injectBvrPartners();
  bindBvrObserver();
  window.addEventListener('saveflow-auth-change',()=>setTimeout(()=>{ensureColumns();applyExtraOverrides();injectBvrPartners();bindBvrObserver();},100));
  new MutationObserver(()=>{
    if(ensuring)return;
    ensureColumns();
  }).observe(document.querySelector('#categories .matrix-card table')||document.body,{childList:true,subtree:true});
  window.saveflowApplyExtraBankOverrides=applyExtraOverrides;
  window.saveflowEnsureExtraBanks=()=>{ensureColumns();applyExtraOverrides();injectBvrPartners();bindBvrObserver();};
})();