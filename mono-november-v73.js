(()=>{
  const CATEGORY='Штучний інтелект';
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();

  function categoryOf(tr){
    return norm(tr?.querySelector('td:first-child strong')?.textContent||tr?.querySelector('td:first-child')?.textContent||'');
  }

  function ensureRow(){
    const table=document.querySelector('#matrixTable, #categories .matrix-card table');
    const body=table?.querySelector('tbody');
    if(!table||!body)return false;

    let row=[...body.querySelectorAll('tr')].find(tr=>categoryOf(tr)===CATEGORY);
    if(row){
      window.saveflowApplyMatrixOverrides?.();
      window.saveflowApplyExtraBankOverrides?.();
      return true;
    }

    const rows=[...body.querySelectorAll('tr')];
    const template=rows.find(tr=>categoryOf(tr)==='Ігри та додатки')||rows[rows.length-1];
    if(!template)return false;

    row=template.cloneNode(true);
    row.removeAttribute('data-sf-admin-override');

    const first=row.querySelector('td:first-child');
    if(first){
      const strong=first.querySelector('strong');
      if(strong)strong.textContent=CATEGORY;
      else first.textContent=CATEGORY;
    }

    [...row.children].slice(1).forEach(td=>{
      td.classList.remove('user-edited','user-personal-edited','best');
      delete td.dataset.sfAdminOverride;
      td.removeAttribute('title');
      td.innerHTML='<span class="dash">—</span>';
    });

    const anchor=rows.find(tr=>categoryOf(tr)==='Ігри та додатки');
    if(anchor)body.insertBefore(row,anchor);
    else body.appendChild(row);

    requestAnimationFrame(()=>{
      window.saveflowApplyMatrixOverrides?.();
      window.saveflowApplyExtraBankOverrides?.();
      window.saveflowApplyUserBanks?.();
    });
    return true;
  }

  function boot(){
    if(!ensureRow())setTimeout(boot,200);
  }
  boot();

  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    setTimeout(()=>{queued=false;ensureRow();},100);
  }).observe(document.querySelector('#categories')||document.body,{childList:true,subtree:true});

  window.saveflowEnsureAiCategory=ensureRow;
})();