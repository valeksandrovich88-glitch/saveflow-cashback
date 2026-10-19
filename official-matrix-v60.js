(()=>{
  const RULES={
    'А-Банк':new Set(['АЗС',"Аптеки / здоров'я",'Ігри та додатки','Кафе та ресторани','Квіти','Кіно та театри','Книги та канцтовари','Краса','Одяг та взуття','Продукти','Розваги','Спорт та фітнес','Таксі','Тварини']),
    'àбанк':new Set(['АЗС',"Аптеки / здоров'я",'Ігри та додатки','Кафе та ресторани','Квіти','Кіно та театри','Книги та канцтовари','Краса','Одяг та взуття','Продукти','Розваги','Спорт та фітнес','Таксі','Тварини']),
    'izibank':new Set(['АЗС',"Аптеки / здоров'я",'Дім та ремонт','Кафе та ресторани','Одяг та взуття','Продукти','Спорт та фітнес','Таксі','Усі покупки'])
  };
  const UNVERIFIED={
    'izibank':new Set(['Дитячі товари']),
    'ТАСКОМБАНК':new Set(['Краса','Одяг та взуття','Усі покупки']),
    'VST bank':new Set(["Аптеки / здоров'я",'Кафе та ресторани','Кіно та театри','Краса','Одяг та взуття','Таксі']),
    'Банк Кредит Дніпро':new Set(['АЗС',"Аптеки / здоров'я",'Дитячі товари','Дім та ремонт','Кафе та ресторани','Книги та канцтовари','Краса','Одяг та взуття','Розваги','Спорт та фітнес','Транспорт']),
    'GlobusPlus':new Set(["Аптеки / здоров'я",'Ігри та додатки','Кафе та ресторани','Краса','Продукти','Спорт та фітнес','Транспорт']),
    'monobank':new Set(['Кафе та ресторани','Квіти','Кіно та театри','Маркетплейси','Продукти','Розваги','Таксі'])
  };
  const OVERRIDE_KEY='saveflow.matrixOverrides.v1';
  const USER_OVERRIDE_KEY='saveflow.userMatrixOverrides.v1';
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

  function bankNameFromHead(th){
    return norm(th?.querySelector('.bank-name')?.textContent||th?.textContent||'');
  }
  function categoryFromRow(tr){
    const first=tr?.querySelector('td:first-child');
    return norm(first?.querySelector('strong')?.textContent||first?.textContent||'');
  }
  function readOverrides(key){
    try{
      const data=JSON.parse(localStorage.getItem(key)||'{}');
      return data&&typeof data==='object'?data:{};
    }catch(_){return {};}
  }
  function hasManualOverride(bank,category){
    const key=`${category}|||${bank}`;
    const admin=readOverrides(OVERRIDE_KEY)[key];
    if(admin&&typeof admin==='object')return true;
    if((document.documentElement.dataset.saveflowRole||'public')==='user'){
      const personal=readOverrides(USER_OVERRIDE_KEY)[key];
      if(personal&&typeof personal==='object')return true;
    }
    return false;
  }
  function clearPlaceholderState(td){
    if(!td)return;
    const cash=td.querySelector('.cash');
    cash?.classList.remove('sf-official-dynamic','sf-official-unverified');
    if(cash && /^(у застосунку|—)$/i.test(norm(cash.querySelector('.cash-value')?.textContent||cash.textContent||''))){
      cash.title='';
    }
    td.dataset.sfOfficialDynamic='';
    td.dataset.sfOfficialUnverified='';
  }
  function neutralCell(td,status,bank){
    if(!td)return false;
    const isAbank=bank==='àбанк'||bank==='А-Банк';
    const needsBadge=status==='dynamic'&&isAbank;
    const alreadyPlain=norm(td.textContent)==='—' && !td.querySelector('.cash');

    if(needsBadge){
      let cash=td.querySelector('.cash.sf-official-dynamic');
      let badge=cash?.querySelector('.scope-badge');
      const valid=cash&&norm(cash.querySelector('.cash-value')?.textContent)==='—'&&badge;
      if(!valid){
        td.replaceChildren();
        cash=document.createElement('div');
        cash.className='cash has-scope sf-official-dynamic';
        const value=document.createElement('span');
        value.className='cash-value';
        value.textContent='—';
        badge=document.createElement('span');
        badge.className='scope-badge';
        badge.tabIndex=0;
        badge.textContent='?';
        cash.append(value,badge);
        td.appendChild(cash);
      }
      const tip='Категорія передбачена офіційними правилами àбанку; точний відсоток залежить від актуальної пропозиції.';
      badge.dataset.tip=tip;
      badge.setAttribute('aria-label',tip);
    }else if(!alreadyPlain){
      td.replaceChildren(document.createTextNode('—'));
    }
    td.removeAttribute('title');
    td.dataset.sfOfficialDynamic=status==='dynamic'?'1':'';
    td.dataset.sfOfficialUnverified=status==='unverified'?'1':'';
    td.dataset.sfOfficialBank=bank||'';
    return needsBadge?!alreadyPlain:!alreadyPlain;
  }
  function recalcBest(row){
    const cells=[...row.querySelectorAll('td')].slice(1);
    const numeric=[];
    cells.forEach(td=>{
      const cash=td.querySelector('.cash');
      if(!cash)return;
      cash.classList.remove('best');
      if(td.dataset.sfOfficialDynamic==='1'||td.dataset.sfOfficialUnverified==='1')return;
      const text=norm(cash.querySelector('.cash-value')?.textContent||cash.textContent||'');
      const nums=[...text.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)].map(m=>Number(m[1].replace(',','.'))).filter(Number.isFinite);
      if(nums.length)numeric.push([cash,Math.max(...nums)]);
    });
    if(!numeric.length)return;
    const max=Math.max(...numeric.map(x=>x[1]));
    numeric.filter(x=>x[1]===max).forEach(x=>x[0].classList.add('best'));
  }
  function run(){
    const table=document.querySelector('#matrixTable, .matrix-card table, table');
    if(!table)return;
    const heads=[...table.querySelectorAll('thead th')];
    const bankCols=new Map();
    heads.forEach((th,i)=>{
      const name=bankNameFromHead(th);
      if(RULES[name]||UNVERIFIED[name])bankCols.set(i,name);
    });
    if(!bankCols.size)return;

    [...table.querySelectorAll('tbody tr')].forEach(tr=>{
      const cat=categoryFromRow(tr);
      if(!cat)return;
      const cells=[...tr.children];
      let touched=false;
      for(const [idx,bank] of bankCols){
        const td=cells[idx];
        const status=RULES[bank]?.has(cat)?'dynamic':(UNVERIFIED[bank]?.has(cat)?'unverified':'');
        if(!status)continue;

        // A value explicitly entered through Admin mode always wins.
        if(hasManualOverride(bank,cat)){
          clearPlaceholderState(td);
          touched=true;
          continue;
        }

        // Public matrix stays clean: uncertainty/dynamic status is explained by
        // the matrix legend/badges instead of text cards inside individual cells.
        touched=neutralCell(td,status,bank)||touched;
      }
      if(touched)recalcBest(tr);
    });
  }

  run();
  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;run()});
  }).observe(document.body,{subtree:true,childList:true,characterData:true});
  window.addEventListener('storage',e=>{
    if(e.key===OVERRIDE_KEY||e.key===USER_OVERRIDE_KEY)queueMicrotask(run);
  });
  window.addEventListener('saveflow-auth-change',()=>queueMicrotask(run));
})();
