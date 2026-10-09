(()=>{
  const PATCHES=[
    {bank:'RadaBank',category:'Розваги',value:'3%'},
    {bank:'ТАСКОМБАНК',category:'Продукти',value:'1% / 2%',tip:'Картка/продукт: «Велика п’ятірка» · ставка діє в супермаркетах · порядок у клітинці — власні / кредитні кошти.'},
    {bank:'ТАСКОМБАНК',category:'АЗС',value:'1% / 2%',tip:'Картка/продукт: «Велика п’ятірка» · порядок у клітинці — власні / кредитні кошти.'},
    {bank:'ТАСКОМБАНК',category:'Усі покупки',value:'1%',tip:'Картка/продукт: «Велика п’ятірка» · 1% на будь-які покупки як власними, так і кредитними коштами.'},
    {bank:'ТАСКОМБАНК',category:'Одяг та взуття',value:'1% / 5%',tip:'Картка/продукт: #PudraCard · порядок у клітинці — власні / кредитні кошти.'},
    {bank:'ТАСКОМБАНК',category:'Краса',value:'1% / 3%',tip:'Картка/продукт: #PudraCard · косметика, парфумерія та б’юті-сфера · порядок у клітинці — власні / кредитні кошти.'},
    {bank:'ТАСКОМБАНК',category:"Аптеки / здоров'я",value:'1% / 3%',tip:'Картка/продукт: #PudraCard · ставка підтверджена саме для аптек · порядок у клітинці — власні / кредитні кошти.'},
    {bank:'VST bank',category:'АЗС',value:'1,5%',tip:'1,5% на категорію «Авто та АЗС» діє протягом року з моменту купівлі поліса ОСЦПВ у VST bank.'}
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

/* SaveFlow current Credit Dnipro partners */
(()=>{
  const OFFERS=[{"name":"Ашан","category":"Продукти","rate":5,"rateText":"5%","note":"На всі товари · партнерська пропозиція Банку Кредит Дніпро"},{"name":"Polis.ua","category":"Страхування","rate":10,"rateText":"10%","note":"На будь-які страховки"},{"name":"МЦ Інго","category":"Медицина","rate":10,"rateText":"10%","note":"За онлайн та офлайн покупки"},{"name":"hotline.finance","category":"Страхування","rate":10,"rateText":"10%","note":"За онлайн покупки"}];
  const BANK='Банк Кредит Дніпро';
  const SOURCE='https://creditdnepr.com.ua/pryvatnym-osobam/platizni-kartki/cashback';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=s=>String(s||'').toLocaleLowerCase('uk-UA').trim();
  let scheduled=false;

  function makeCard(o){
    const el=document.createElement('article');
    el.className='partner-card';
    el.dataset.bank=BANK;
    el.dataset.category=o.category;
    el.dataset.partner=o.name;
    el.dataset.rate=String(o.rate);
    el.dataset.sfCreditDniproCurrent='1';
    el.dataset.sfSource=SOURCE;
    el.dataset.search=norm([BANK,o.name,o.category,o.note,'партнерський кешбек Кредит Дніпро'].join(' '));
    el.title='Поточна офіційна партнерська пропозиція Банку Кредит Дніпро';
    el.innerHTML=
      '<div class="partner-bank"><span class="mini-logo-wrap"><span class="mini-logo mini-logo-fallback">БКД</span></span><span>'+BANK+'</span></div>'+
      '<div class="partner-top"><div class="partner-name">'+esc(o.name)+'</div><div class="partner-rate">'+esc(o.rateText)+'</div></div>'+
      '<div class="tag">'+esc(o.category)+'</div>'+
      '<div class="offer-note">'+esc(o.note)+'</div>';
    return el;
  }

  function isCreditDnipro(card){
    const b=norm(card?.dataset?.bank||card?.querySelector?.('.partner-bank span:last-child')?.textContent||'');
    return /кредит\s*дніпро|credit\s*dnepr|банк\s*кд/.test(b);
  }

  function ensureFilters(section){
    const bankPop=section.querySelector('#bankFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(bankPop&&!section.querySelector('[data-bank-value="'+BANK+'"]')){
      const label=document.createElement('label');
      label.className='check-row';
      label.innerHTML='<span class="tiny-logo-wrap"><span class="tiny-logo tiny-logo-fallback">БКД</span></span><input type="checkbox" data-bank-value="'+BANK+'"><span>'+BANK+'</span>';
      bankPop.appendChild(label);
    }
    const catPop=section.querySelector('#categoryFilterLabel')?.closest('details')?.querySelector('.filter-pop');
    if(catPop){
      const existing=new Set([...catPop.querySelectorAll('[data-category-value]')].map(x=>x.getAttribute('data-category-value')));
      [...new Set(OFFERS.map(x=>x.category))].forEach(cat=>{
        if(existing.has(cat))return;
        const label=document.createElement('label');
        label.className='check-row';
        label.innerHTML='<input type="checkbox" data-category-value="'+esc(cat)+'"><span>'+esc(cat)+'</span>';
        catPop.appendChild(label);
      });
    }
  }

  function inject(){
    const section=document.getElementById('partners');
    const grid=section?.querySelector('.partner-grid');
    if(!section||!grid)return false;
    ensureFilters(section);
    [...grid.querySelectorAll('.partner-card')].filter(isCreditDnipro).forEach(x=>x.remove());
    const frag=document.createDocumentFragment();
    OFFERS.forEach(o=>frag.appendChild(makeCard(o)));
    grid.appendChild(frag);
    section.dataset.sfCreditDniproOffers=String(OFFERS.length);
    section.dataset.sfCreditDniproLoaded='1';
    setTimeout(()=>window.saveflowApplySensePartners?.(),0);
    return true;
  }

  function ensure(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    const cards=[...grid.querySelectorAll('.partner-card')].filter(isCreditDnipro);
    if(cards.filter(x=>x.dataset.sfCreditDniproCurrent==='1').length!==OFFERS.length||cards.some(x=>x.dataset.sfCreditDniproCurrent!=='1'))inject();
  }

  function bindObserver(){
    const grid=document.querySelector('#partners .partner-grid');
    if(!grid)return;
    new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      setTimeout(()=>{scheduled=false;ensure();},80);
    }).observe(grid,{childList:true});
  }

  function boot(){
    if(!inject())return setTimeout(boot,250);
    bindObserver();
    window.saveflowApplyCreditDniproPartners=inject;
    window.addEventListener('saveflow-auth-change',()=>setTimeout(()=>{inject();bindObserver();},120));
  }
  boot();
})();
