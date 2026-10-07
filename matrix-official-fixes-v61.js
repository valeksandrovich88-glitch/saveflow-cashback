(()=>{
  const PATCHES=[
    {bank:'RadaBank',category:'Розваги',value:'3%'},
    {bank:'ТАСКОМБАНК',category:'Продукти',value:'1% / 2%',tip:'Картка/продукт: «Велика п’ятірка» · ставка діє в супермаркетах · порядок у клітинці — власні / кредитні кошти.'},
    {bank:'ТАСКОМБАНК',category:'АЗС',value:'1% / 2%',tip:'Картка/продукт: «Велика п’ятірка» · порядок у клітинці — власні / кредитні кошти.'},
    {bank:'ТАСКОМБАНК',category:'Усі покупки',value:'1%',tip:'Картка/продукт: «Велика п’ятірка» · 1% на будь-які покупки як власними, так і кредитними коштами.'},
    {bank:'ТАСКОМБАНК',category:'Одяг та взуття',value:'1% / 5%',tip:'Картка/продукт: #PudraCard · порядок у клітинці — власні / кредитні кошти.'},
    {bank:'ТАСКОМБАНК',category:'Краса',value:'1% / 3%',tip:'Картка/продукт: #PudraCard · косметика, парфумерія та б’юті-сфера · порядок у клітинці — власні / кредитні кошти.'},
    {bank:'ТАСКОМБАНК',category:"Аптеки / здоров'я",value:'1% / 3%',tip:'Картка/продукт: #PudraCard · ставка підтверджена саме для аптек · порядок у клітинці — власні / кредитні кошти.'}
  ];
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

  function currentRole(){
    return document.documentElement.dataset.saveflowRole||'public';
  }
  function bankColumns(table){
    const map=new Map();
    [...table.querySelectorAll('thead th')].forEach((th,i)=>{
      const name=norm(th.querySelector('.bank-name')?.textContent||th.textContent||'');
      if(name) map.set(name,i);
    });
    return map;
  }
  function recalcBest(row){
    const values=[];
    [...row.children].slice(1).forEach(td=>{
      const cash=td.querySelector('.cash');
      if(!cash)return;
      cash.classList.remove('best');
      const text=norm(cash.querySelector('.cash-value')?.textContent||cash.textContent||'');
      const nums=[...text.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)]
        .map(m=>Number(m[1].replace(',','.')))
        .filter(Number.isFinite);
      if(nums.length) values.push([cash,Math.max(...nums)]);
    });
    if(!values.length)return;
    const max=Math.max(...values.map(x=>x[1]));
    values.filter(x=>x[1]===max).forEach(x=>x[0].classList.add('best'));
  }
  function ensureCash(td){
    let cash=td?.querySelector('.cash');
    if(cash)return cash;
    if(!td)return null;
    td.replaceChildren();
    cash=document.createElement('div');
    cash.className='cash';
    const value=document.createElement('span');
    value.className='cash-value';
    cash.appendChild(value);
    td.appendChild(cash);
    return cash;
  }
  function renderValue(el,value){
    const parts=String(value).split(/\s*\/\s*/);
    if(parts.length===2){
      el.replaceChildren(document.createTextNode(parts[0]+' '));
      const slash=document.createElement('span');
      slash.className='slash';
      slash.textContent='/';
      el.appendChild(slash);
      el.appendChild(document.createTextNode(' '+parts[1]));
    }else{
      el.textContent=value;
    }
  }
  function mergeTip(cash,tip){
    if(!tip)return false;
    cash.classList.add('has-scope');
    let badge=cash.querySelector('.scope-badge');
    const existing=norm(badge?.dataset.tip||badge?.getAttribute('aria-label')||'');
    const merged=existing && !existing.includes(tip) ? existing+' · '+tip : (existing||tip);
    if(!badge){
      badge=document.createElement('span');
      badge.className='scope-badge';
      badge.tabIndex=0;
      badge.textContent='?';
      cash.appendChild(badge);
    }
    if((badge.dataset.tip||'')!==merged || badge.getAttribute('aria-label')!==merged){
      badge.dataset.tip=merged;
      badge.setAttribute('aria-label',merged);
      badge.dataset.sfOfficialFix='1';
      return true;
    }
    return false;
  }
  function setCell(td,patch){
    const cash=ensureCash(td);
    if(!cash)return false;
    let el=cash.querySelector('.cash-value');
    if(!el){
      el=document.createElement('span');
      el.className='cash-value';
      cash.prepend(el);
    }
    let changed=false;
    if(norm(el.textContent)!==patch.value){
      renderValue(el,patch.value);
      changed=true;
    }
    if(mergeTip(cash,patch.tip))changed=true;
    return changed;
  }
  function run(){
    if(currentRole()==='user')return;
    const table=document.querySelector('#matrixTable, .matrix-card table');
    if(!table)return;
    const cols=bankColumns(table);
    let touched=false;
    for(const tr of table.querySelectorAll('tbody tr')){
      const category=norm(tr.querySelector('td:first-child strong')?.textContent||tr.querySelector('td:first-child')?.textContent||'');
      if(!category)continue;
      let rowChanged=false;
      for(const p of PATCHES){
        if(p.category!==category)continue;
        const idx=cols.get(p.bank);
        if(idx==null)continue;
        rowChanged=setCell(tr.children[idx],p)||rowChanged;
      }
      if(rowChanged){recalcBest(tr);touched=true;}
    }
    if(touched) document.dispatchEvent(new CustomEvent('saveflow-global-matrix-patched'));
  }

  run();
  new MutationObserver(()=>queueMicrotask(run)).observe(document.documentElement,{
    attributes:true,
    attributeFilter:['data-saveflow-role']
  });
  new MutationObserver(()=>queueMicrotask(run)).observe(document.body,{
    subtree:true,
    childList:true,
    characterData:true
  });
})();