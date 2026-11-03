(()=>{
  const ADMIN_KEY='saveflow.matrixOverrides.v1';
  const USER_KEY='saveflow.userMatrixOverrides.v1';
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>{
    const d=new Date();
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  };
  const parse=(key)=>{
    try{
      const x=JSON.parse(localStorage.getItem(key)||'{}');
      return x&&typeof x==='object'&&!Array.isArray(x)?x:{};
    }catch(_){return{}}
  };
  const role=()=>document.documentElement.dataset.saveflowRole||'public';

  function renderOverride(ov){
    if(!ov||ov.empty)return '<span class="dash">—</span>';
    const value=String(ov.value||'').trim();
    if(!value)return '<span class="dash">—</span>';
    const end=String(ov.end||'').trim();
    if(/^20\d{2}-\d{2}-\d{2}$/.test(end)&&end<today())return null;

    const cls=['cash'];
    if(ov.best)cls.push('best');
    if(String(ov.note||'').trim())cls.push('has-scope');

    const attrs=[
      ov.source?' data-source="'+esc(ov.source)+'"':'',
      ov.sourceTier?' data-source-tier="'+esc(ov.sourceTier)+'"':'',
      ov.checked?' data-checked="'+esc(ov.checked)+'"':'',
      end?' data-end="'+esc(end)+'"':''
    ].join('');

    const note=String(ov.note||'').trim();
    const tip=note?'<span class="scope-badge" tabindex="0" aria-label="'+esc(note)+'" data-tip="'+esc(note)+'">?</span>':'';
    return '<div class="'+cls.join(' ')+'"'+attrs+'><span class="cash-value">'+esc(value)+'</span>'+tip+'</div>';
  }

  let matrixBusy=false;
  function applyMatrix(){
    if(matrixBusy)return;
    const table=document.querySelector('#matrixTable, #categories .matrix-card table');
    if(!table)return;
    matrixBusy=true;
    try{
      const global=parse(ADMIN_KEY);
      const personal=role()==='user'?parse(USER_KEY):{};
      const heads=[...table.querySelectorAll('thead th')].map(th=>norm(th.querySelector('.bank-name')?.textContent||th.textContent||''));

      table.querySelectorAll('tbody tr').forEach(tr=>{
        const category=norm(tr.querySelector('td:first-child strong')?.textContent||tr.querySelector('td:first-child')?.textContent||'');
        if(!category)return;
        [...tr.children].forEach((td,idx)=>{
          if(idx===0)return;
          const bank=heads[idx];
          if(!bank)return;
          const key=category+'|||'+bank;
          const ov=Object.prototype.hasOwnProperty.call(personal,key)?personal[key]:global[key];
          if(!ov)return;
          const html=renderOverride(ov);
          if(html===null)return;
          if(td.innerHTML!==html)td.innerHTML=html;
          td.dataset.sfStableOverride='1';
        });
      });
    }finally{
      matrixBusy=false;
    }
  }

  const partnerFns=[
    'saveflowApplyPumbPartners',
    'saveflowApplyMonoPartners',
    'saveflowApplySensePartners',
    'saveflowApplyVstPartners',
    'saveflowApplyAbankPartners',
    'saveflowApplyCreditDniproPartners',
    'saveflowApplyGlobusPartners',
    'saveflowApplyAlliancePartners',
    'saveflowEnsureExtraBanks'
  ];
  let partnerBusy=false;
  function restorePartners(){
    if(partnerBusy)return;
    partnerBusy=true;
    try{
      partnerFns.forEach(name=>{
        try{window[name]?.()}catch(e){console.warn('SaveFlow partner restore',name,e)}
      });
      window.saveflowRefreshBankFilters?.();
    }finally{
      partnerBusy=false;
    }
  }

  function scheduleAll(){
    [0,80,260,700].forEach(ms=>setTimeout(()=>{
      window.saveflowEnsureAiCategory?.();
      applyMatrix();
      restorePartners();
    },ms));
  }

  const originalRenderPartners=window.saveflowRenderPartners;
  if(originalRenderPartners&&!originalRenderPartners.__sfStableWrapped){
    const wrapped=function(...args){
      const out=originalRenderPartners.apply(this,args);
      [0,100,350].forEach(ms=>setTimeout(restorePartners,ms));
      return out;
    };
    wrapped.__sfStableWrapped=true;
    window.saveflowRenderPartners=wrapped;
  }

  const originalApplyMatrix=window.saveflowApplyMatrixOverrides;
  if(originalApplyMatrix&&!originalApplyMatrix.__sfStableWrapped){
    const wrapped=function(...args){
      const out=originalApplyMatrix.apply(this,args);
      queueMicrotask(applyMatrix);
      return out;
    };
    wrapped.__sfStableWrapped=true;
    window.saveflowApplyMatrixOverrides=wrapped;
  }

  let queued=false;
  new MutationObserver(()=>{
    if(queued||matrixBusy||partnerBusy)return;
    queued=true;
    setTimeout(()=>{
      queued=false;
      applyMatrix();
    },70);
  }).observe(document.querySelector('#categories')||document.body,{childList:true,subtree:true});

  window.addEventListener('saveflow-auth-change',scheduleAll);
  window.addEventListener('storage',e=>{
    if(e.key===ADMIN_KEY||e.key===USER_KEY)scheduleAll();
  });

  window.saveflowStableReapply=()=>{applyMatrix();restorePartners();};
  scheduleAll();
})();