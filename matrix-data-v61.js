(()=>{
  const FIXES=[
    {bank:'ТАСКОМБАНК',category:'Комунальні послуги',html:'до 0,5% <span class="slash">/</span> до 3%'}
  ];
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  function numberFrom(el){
    const text=norm(el?.textContent||'');
    const nums=[...text.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)].map(m=>Number(m[1].replace(',','.'))).filter(Number.isFinite);
    return nums.length?Math.max(...nums):null;
  }
  function recalcBest(row){
    const cells=[...row.querySelectorAll('td')].slice(1);
    const entries=[];
    for(const td of cells){
      const cash=td.querySelector('.cash');
      if(!cash)continue;
      cash.classList.remove('best');
      const n=numberFrom(cash.querySelector('.cash-value')||cash);
      if(n!=null)entries.push([cash,n]);
    }
    if(!entries.length)return;
    const max=Math.max(...entries.map(x=>x[1]));
    entries.filter(x=>x[1]===max).forEach(x=>x[0].classList.add('best'));
  }
  function apply(){
    const table=document.querySelector('#matrixTable');
    if(!table)return;
    const heads=[...table.querySelectorAll('thead th')];
    const columns=new Map();
    heads.forEach((th,i)=>{
      const bank=norm(th.querySelector('.bank-name')?.textContent||th.querySelector('strong')?.textContent||th.textContent);
      columns.set(bank,i);
    });
    for(const fix of FIXES){
      const idx=columns.get(fix.bank);
      if(idx==null)continue;
      const row=[...table.querySelectorAll('tbody tr')].find(tr=>{
        const first=tr.querySelector('td:first-child');
        return norm(first?.querySelector('strong')?.textContent||first?.textContent)===fix.category;
      });
      if(!row)continue;
      const td=row.children[idx];
      const value=td?.querySelector('.cash-value');
      if(!value)continue;
      if(value.innerHTML!==fix.html)value.innerHTML=fix.html;
      recalcBest(row);
    }
  }
  apply();
  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;apply()});
  }).observe(document.body,{childList:true,subtree:true});
})();