(()=>{
  const RULES={
    'А-Банк':new Set(['Квіти','Кіно та театри','Книги та канцтовари','Краса','Тварини']),
    'àбанк':new Set(['Квіти','Кіно та театри','Книги та канцтовари','Краса','Тварини']),
    'izibank':new Set(['АЗС',"Аптеки / здоров'я",'Дитячі товари','Дім та ремонт','Кафе та ресторани','Одяг та взуття','Продукти','Спорт та фітнес','Таксі','Усі покупки'])
  };
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

  const st=document.createElement('style');
  st.id='sf-official-dynamic-matrix-v60';
  st.textContent=`
    .cash.sf-official-dynamic{background:rgba(235,243,236,.66)!important;color:#425549!important}
    .cash.sf-official-dynamic .cash-value{font-size:10px!important;font-weight:800!important;line-height:1.15!important;white-space:nowrap!important}
    .cash.sf-official-dynamic::after{content:'динамічно';display:block;margin-top:4px;font-size:7px;font-weight:750;letter-spacing:.02em;color:#718077;text-transform:uppercase}
  `;
  document.head.appendChild(st);

  function bankNameFromHead(th){
    return norm(th?.querySelector('.bank-name')?.textContent||th?.textContent||'');
  }
  function categoryFromRow(tr){
    const first=tr?.querySelector('td:first-child');
    return norm(first?.querySelector('strong')?.textContent||first?.textContent||'');
  }
  function patchCell(td){
    if(!td)return false;
    let cash=td.querySelector('.cash');
    if(!cash){
      cash=document.createElement('div');
      cash.className='cash';
      td.innerHTML='';
      td.appendChild(cash);
    }
    cash.classList.remove('best');
    cash.classList.add('sf-official-dynamic');
    let value=cash.querySelector('.cash-value');
    if(!value){
      value=document.createElement('span');
      value.className='cash-value';
      cash.replaceChildren(value);
    }
    value.textContent='у застосунку';
    cash.title='Категорія підтверджена офіційним джерелом. Поточна ставка є динамічною та відображається у застосунку банку.';
    td.dataset.sfOfficialDynamic='1';
    return true;
  }
  function recalcBest(row){
    const cells=[...row.querySelectorAll('td')].slice(1);
    const numeric=[];
    cells.forEach(td=>{
      const cash=td.querySelector('.cash');
      if(!cash)return;
      cash.classList.remove('best');
      if(td.dataset.sfOfficialDynamic==='1')return;
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
      if(RULES[name])bankCols.set(i,name);
    });
    if(!bankCols.size)return;
    [...table.querySelectorAll('tbody tr')].forEach(tr=>{
      const cat=categoryFromRow(tr);
      if(!cat)return;
      const cells=[...tr.children];
      let changed=false;
      for(const [idx,bank] of bankCols){
        if(RULES[bank]?.has(cat)) changed=patchCell(cells[idx])||changed;
      }
      if(changed)recalcBest(tr);
    });
  }
  run();
  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;run()});
  }).observe(document.body,{subtree:true,childList:true,characterData:true});
})();