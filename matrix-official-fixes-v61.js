(()=>{
  const PATCHES=[
    {bank:'RadaBank',category:'Розваги',value:'3%'}
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
  function setCell(td,value){
    if(!td)return false;
    const cash=td.querySelector('.cash');
    if(!cash)return false;
    const el=cash.querySelector('.cash-value');
    if(!el)return false;
    const cur=norm(el.textContent);
    if(cur===value)return false;
    el.textContent=value;
    return true;
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
        rowChanged=setCell(tr.children[idx],p.value)||rowChanged;
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