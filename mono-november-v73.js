(()=>{
  const CATEGORIES=[
    {name:'Штучний інтелект',anchor:'Ігри та додатки'},
    {name:'Валютообмін',anchor:'Усі покупки'}
  ];
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

  function categoryOf(tr){
    return norm(tr?.querySelector('td:first-child strong')?.textContent||tr?.querySelector('td:first-child')?.textContent||'');
  }

  function ensureCategory(def){
    const table=document.querySelector('#matrixTable, #categories .matrix-card table');
    const body=table?.querySelector('tbody');
    if(!table||!body)return false;

    const existing=[...body.querySelectorAll('tr')].find(tr=>categoryOf(tr)===def.name);
    if(existing)return true;

    const rows=[...body.querySelectorAll('tr')];
    const template=rows.find(tr=>categoryOf(tr)===def.anchor)||rows[rows.length-1];
    if(!template)return false;

    const row=template.cloneNode(true);
    row.removeAttribute('data-sf-admin-override');

    const first=row.querySelector('td:first-child');
    if(first){
      const strong=first.querySelector('strong');
      if(strong)strong.textContent=def.name;
      else first.textContent=def.name;
    }

    [...row.children].slice(1).forEach(td=>{
      td.classList.remove('user-edited','user-personal-edited','best');
      delete td.dataset.sfAdminOverride;
      td.removeAttribute('title');
      td.innerHTML='<span class="dash">—</span>';
    });

    const anchor=rows.find(tr=>categoryOf(tr)===def.anchor);
    if(anchor)body.insertBefore(row,anchor);
    else body.appendChild(row);
    return true;
  }

  function ensureRows(){
    const ok=CATEGORIES.map(ensureCategory).every(Boolean);
    if(ok){
      requestAnimationFrame(()=>{
        window.saveflowApplyMatrixOverrides?.();
        window.saveflowApplyExtraBankOverrides?.();
        window.saveflowApplyUserBanks?.();
        window.saveflowStableReapply?.();
      });
    }
    return ok;
  }

  function boot(){
    if(!ensureRows())setTimeout(boot,200);
  }
  boot();

  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    setTimeout(()=>{queued=false;ensureRows();},100);
  }).observe(document.querySelector('#categories')||document.body,{childList:true,subtree:true});

  window.saveflowEnsureAiCategory=ensureRows;
})();