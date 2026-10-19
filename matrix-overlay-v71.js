(()=>{
  const ADMIN_KEY='saveflow.matrixOverrides.v1';
  const USER_KEY='saveflow.userMatrixOverrides.v1';
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const aliases=new Map([
    ['àбанк','А-Банк'],['А-Банк','А-Банк'],
    ['Rozetka','Картка Rozetka'],['Картка Rozetka','Картка Rozetka']
  ]);
  let queued=false;
  let applying=false;

  function role(){return document.documentElement.dataset.saveflowRole||'public';}
  function read(key){
    try{
      const x=JSON.parse(localStorage.getItem(key)||'{}');
      return x&&typeof x==='object'&&!Array.isArray(x)?x:{};
    }catch(_){return {};}
  }
  function canonBank(s){
    const n=norm(s);
    return aliases.get(n)||n;
  }
  function heads(table){
    return [...table.querySelectorAll('thead th')].map(th=>canonBank(
      th.dataset.sfBankOrderName||
      th.querySelector('.bank-name')?.textContent||
      th.textContent
    ));
  }
  function category(tr){
    return norm(tr.querySelector('.category strong')?.textContent||
      tr.children[0]?.querySelector('strong')?.textContent||
      tr.children[0]?.textContent||'');
  }
  function liveOverride(ov){
    if(!ov||typeof ov!=='object')return null;
    if(ov.end){
      const d=new Date(String(ov.end)+'T23:59:59');
      if(Number.isFinite(d.getTime())&&d<new Date())return null;
    }
    return ov;
  }
  function effective(admin,personal,key){
    if(role()==='user'&&Object.prototype.hasOwnProperty.call(personal,key)){
      return {ov:liveOverride(personal[key]),layer:'personal',present:true};
    }
    if(Object.prototype.hasOwnProperty.call(admin,key)){
      return {ov:liveOverride(admin[key]),layer:'global',present:true};
    }
    return {ov:null,layer:'',present:false};
  }
  function valueText(ov){
    if(!ov||ov.empty||!norm(ov.value))return '—';
    return norm(ov.value);
  }
  function render(td,ov,layer){
    const text=valueText(ov);
    const note=norm(ov?.note||'');
    const end=norm(ov?.end||'');
    const best=!!ov?.best;
    const valueEl=td.querySelector('.cash-value');
    const current=valueEl?norm(valueEl.textContent):norm(td.textContent);
    const currentNote=norm(td.querySelector('.scope-badge')?.dataset.tip||td.querySelector('.scope-badge')?.getAttribute('aria-label')||'');
    const currentLayer=td.dataset.sfMatrixOverlay||'';
    const emptyOk=text==='—'
      ? (current==='—')
      : (current===text);
    if(emptyOk&&currentNote===note&&currentLayer===layer){
      td.classList.toggle('user-personal-edited',layer==='personal');
      return false;
    }

    td.replaceChildren();
    if(text==='—'){
      const dash=document.createElement('span');
      dash.className='dash';
      dash.textContent='—';
      td.appendChild(dash);
    }else{
      const cash=document.createElement('div');
      cash.className='cash'+(best?' best':'')+(note?' has-scope':'');
      if(end)cash.dataset.end=end;
      if(ov?.source)cash.dataset.source=String(ov.source);
      if(ov?.sourceTier)cash.dataset.sourceTier=String(ov.sourceTier);
      if(ov?.checked)cash.dataset.checked=String(ov.checked);

      const value=document.createElement('span');
      value.className='cash-value';
      const parts=text.split(/\s*\/\s*/);
      if(parts.length===2){
        value.append(document.createTextNode(parts[0]+' '));
        const slash=document.createElement('span');
        slash.className='slash';
        slash.textContent='/';
        value.append(slash,document.createTextNode(' '+parts[1]));
      }else value.textContent=text;
      cash.appendChild(value);

      if(note){
        const badge=document.createElement('span');
        badge.className='scope-badge';
        badge.tabIndex=0;
        badge.textContent='?';
        badge.dataset.tip=note;
        badge.setAttribute('aria-label',note);
        cash.appendChild(badge);
      }
      td.appendChild(cash);
    }
    td.dataset.sfMatrixOverlay=layer;
    td.classList.toggle('user-edited',true);
    td.classList.toggle('user-personal-edited',layer==='personal');
    return true;
  }

  function apply(){
    if(applying)return;
    const table=document.querySelector('#categories .matrix-card table,#matrixTable');
    if(!table)return;
    applying=true;
    try{
      const admin=read(ADMIN_KEY);
      const personal=read(USER_KEY);
      const hs=heads(table);
      const rows=[...table.querySelectorAll('tbody tr')];

      for(const tr of rows){
        const cat=category(tr);
        if(!cat)continue;
        for(let i=1;i<tr.children.length&&i<hs.length;i++){
          const bank=hs[i];
          if(!bank)continue;
          const key=cat+'|||'+bank;
          const e=effective(admin,personal,key);
          if(!e.present)continue;
          render(tr.children[i],e.ov,e.layer);
        }
      }
    }finally{
      applying=false;
    }
  }

  function schedule(){
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;apply();});
  }

  function bind(){
    const table=document.querySelector('#categories .matrix-card table,#matrixTable');
    if(!table)return false;
    if(table.dataset.sfOverlayBound!=='1'){
      table.dataset.sfOverlayBound='1';
      new MutationObserver(muts=>{
        if(applying)return;
        if(muts.some(m=>m.type==='childList'||m.type==='characterData'))schedule();
      }).observe(table,{subtree:true,childList:true,characterData:true});
    }
    apply();
    return true;
  }

  const oldApply=window.saveflowApplyMatrixOverrides;
  if(typeof oldApply==='function'&&!oldApply.__sfOverlayWrapped){
    const wrapped=function(...args){
      const out=oldApply.apply(this,args);
      schedule();
      return out;
    };
    wrapped.__sfOverlayWrapped=true;
    window.saveflowApplyMatrixOverrides=wrapped;
    window.saveflowMatrixApplyOverrides=wrapped;
  }

  window.saveflowEnforceMatrixOverrides=apply;
  window.addEventListener('saveflow-auth-change',()=>setTimeout(()=>{bind();schedule();},0));
  window.addEventListener('storage',e=>{
    if(e.key===ADMIN_KEY||e.key===USER_KEY)schedule();
  });
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-saveflow-role']});
  new MutationObserver(()=>{
    if(!bind())setTimeout(bind,100);
  }).observe(document.body,{subtree:true,childList:true});

  if(!bind())setTimeout(bind,100);
})();