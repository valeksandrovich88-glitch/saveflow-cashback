(()=>{
  const ORDER_KEY='saveflow.userBankOrder.v1';
  const BANKS_KEY='saveflow.userBanks.v1';
  let applying=false;
  let globalOrder=[];
  let dragName='';

  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  function headers(){
    return [...document.querySelectorAll('#matrixTable thead th')].slice(1)
      .map(th=>norm(th.querySelector('.bank-name')?.textContent||th.textContent)).filter(Boolean);
  }
  function loadOrder(){
    try{
      const x=JSON.parse(localStorage.getItem(ORDER_KEY)||'[]');
      return Array.isArray(x)?x.map(norm).filter(Boolean):[];
    }catch(_){return [];}
  }
  function normalizedOrder(order,names){
    const valid=new Set(names), out=[], seen=new Set();
    (order||[]).forEach(name=>{name=norm(name);if(valid.has(name)&&!seen.has(name)){seen.add(name);out.push(name);}});
    names.forEach(name=>{if(!seen.has(name)){seen.add(name);out.push(name);}});
    return out;
  }
  function captureGlobalOrder(){
    const names=headers();
    if(!names.length)return;
    if(!globalOrder.length){globalOrder=[...names];return;}
    const seen=new Set(globalOrder);
    names.forEach(name=>{if(!seen.has(name)){seen.add(name);globalOrder.push(name);}});
    globalOrder=globalOrder.filter(name=>seen.has(name));
  }
  function role(){return document.documentElement.dataset.saveflowRole||'public';}

  function reorderMatrix(order){
    const table=document.getElementById('matrixTable');
    const row=table?.querySelector('thead tr');
    if(!table||!row||applying)return;
    const ths=[...row.children].slice(1);
    const names=ths.map(th=>norm(th.querySelector('.bank-name')?.textContent||th.textContent));
    const desired=normalizedOrder(order,names);
    if(desired.join('\n')===names.join('\n'))return;

    const thByName=new Map(ths.map((th,i)=>[names[i],th]));
    const bodyRows=[...table.querySelectorAll('tbody tr')];
    const cellMaps=bodyRows.map(tr=>{
      const cells=[...tr.children].slice(1);
      return new Map(cells.map((td,i)=>[names[i],td]));
    });

    applying=true;
    try{
      desired.forEach(name=>{const th=thByName.get(name);if(th)row.appendChild(th);});
      bodyRows.forEach((tr,ri)=>{
        desired.forEach(name=>{const td=cellMaps[ri].get(name);if(td)tr.appendChild(td);});
      });
    }finally{applying=false;}
  }

  function applyOrder(){
    captureGlobalOrder();
    const names=headers();
    if(!names.length)return;
    const desired=role()==='user'
      ? normalizedOrder(loadOrder(),names)
      : normalizedOrder(globalOrder,names);
    reorderMatrix(desired);
    setTimeout(()=>{
      window.saveflowApplyUserBanks?.();
      window.saveflowApplyMatrixOverrides?.();
      window.saveflowApplyExtraBankOverrides?.();
    },0);
  }

  async function saveCloud(order){
    const cloud=window.saveflowCloud;
    const client=cloud?.client, uid=cloud?.session?.user?.id;
    if(!client||!uid)return;
    try{
      const {data:prefs,error}=await client.from('user_preferences')
        .select('banks,settings').eq('user_id',uid).maybeSingle();
      if(error)throw error;
      let localBanks=[];
      try{const x=JSON.parse(localStorage.getItem(BANKS_KEY)||'[]');if(Array.isArray(x))localBanks=x;}catch(_){}
      const settings={...(prefs?.settings&&typeof prefs.settings==='object'?prefs.settings:{}),bank_order:order};
      const banks=Array.isArray(prefs?.banks)?prefs.banks:localBanks;
      const {error:saveError}=await client.from('user_preferences').upsert({
        user_id:uid,banks,settings,updated_at:new Date().toISOString()
      },{onConflict:'user_id'});
      if(saveError)throw saveError;
    }catch(e){console.warn('SaveFlow bank order cloud save failed',e);}
  }

  async function pullCloud(){
    const cloud=window.saveflowCloud;
    const client=cloud?.client, uid=cloud?.session?.user?.id;
    if(!client||!uid)return;
    try{
      const {data,error}=await client.from('user_preferences')
        .select('settings').eq('user_id',uid).maybeSingle();
      if(error)throw error;
      const order=data?.settings?.bank_order;
      if(Array.isArray(order)){
        localStorage.setItem(ORDER_KEY,JSON.stringify(order));
        applyOrder();
        enhanceGrid();
      }
    }catch(e){console.warn('SaveFlow bank order cloud pull failed',e);}
  }

  function gridOrder(){
    const grid=document.getElementById('userBanksGrid');
    if(!grid)return [];
    return [...grid.querySelectorAll('.user-bank-check')].map(label=>
      norm(label.querySelector('input[type="checkbox"]')?.value||label.querySelector('.sf-bank-order-name')?.textContent||'')
    ).filter(Boolean);
  }

  function moveLabel(label,dir){
    const grid=label?.parentElement;
    if(!grid)return;
    if(dir<0){
      const prev=label.previousElementSibling;
      if(prev)grid.insertBefore(label,prev);
    }else{
      const next=label.nextElementSibling;
      if(next)grid.insertBefore(next,label);
    }
  }

  function enhanceGrid(){
    const grid=document.getElementById('userBanksGrid');
    if(!grid||applying)return;
    const labels=[...grid.querySelectorAll('.user-bank-check')];
    if(!labels.length)return;

    const byName=new Map(labels.map(label=>[norm(label.querySelector('input[type="checkbox"]')?.value),label]));
    const current=labels.map(label=>norm(label.querySelector('input[type="checkbox"]')?.value));
    const desired=normalizedOrder(loadOrder(),current);
    desired.forEach(name=>{const label=byName.get(name);if(label)grid.appendChild(label);});

    [...grid.querySelectorAll('.user-bank-check')].forEach(label=>{
      const input=label.querySelector('input[type="checkbox"]');
      const name=norm(input?.value);
      let nameSpan=[...label.children].find(x=>x.tagName==='SPAN'&&!x.classList.contains('sf-bank-order-controls'));
      if(nameSpan)nameSpan.classList.add('sf-bank-order-name');
      label.draggable=true;
      label.dataset.sfBankOrderName=name;

      if(!label.querySelector('.sf-bank-order-controls')){
        const controls=document.createElement('span');
        controls.className='sf-bank-order-controls';
        controls.innerHTML='<button type="button" class="sf-bank-move" data-dir="-1" aria-label="Посунути банк вліво">↑</button><button type="button" class="sf-bank-move" data-dir="1" aria-label="Посунути банк вправо">↓</button><span class="sf-bank-drag" aria-hidden="true">≡</span>';
        label.appendChild(controls);
        controls.querySelectorAll('.sf-bank-move').forEach(btn=>btn.addEventListener('click',e=>{
          e.preventDefault();e.stopPropagation();
          moveLabel(label,Number(btn.dataset.dir||0));
        }));
      }

      if(label.dataset.sfDragBound!=='1'){
        label.dataset.sfDragBound='1';
        label.addEventListener('dragstart',e=>{
          dragName=name;
          label.classList.add('sf-bank-dragging');
          try{e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',name);}catch(_){}
        });
        label.addEventListener('dragend',()=>{dragName='';label.classList.remove('sf-bank-dragging');});
        label.addEventListener('dragover',e=>{e.preventDefault();});
        label.addEventListener('drop',e=>{
          e.preventDefault();
          const from=dragName||e.dataTransfer?.getData('text/plain')||'';
          if(!from||from===name)return;
          const source=[...grid.querySelectorAll('.user-bank-check')].find(x=>x.dataset.sfBankOrderName===from);
          if(!source)return;
          const rect=label.getBoundingClientRect();
          const after=e.clientY>rect.top+rect.height/2;
          grid.insertBefore(source,after?label.nextSibling:label);
        });
      }
    });
  }

  function saveFromModal(){
    const order=gridOrder();
    if(!order.length)return;
    localStorage.setItem(ORDER_KEY,JSON.stringify(order));
    saveCloud(order);
    applyOrder();
    window.saveflowLogChange?.({scope:'user',section:'Профіль',action:'Змінено порядок банків',target:order.join(' → ')});
  }

  const st=document.createElement('style');
  st.id='sf-user-bank-order-v70';
  st.textContent=`
    #userBanksGrid .user-bank-check{display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;cursor:grab}
    #userBanksGrid .user-bank-check:active{cursor:grabbing}
    #userBanksGrid .sf-bank-order-name{min-width:0}
    #userBanksGrid .sf-bank-order-controls{display:flex;align-items:center;gap:3px;margin-left:auto}
    #userBanksGrid .sf-bank-move{width:25px;height:25px;border:1px solid rgba(38,55,70,.14);background:#fff;border-radius:7px;padding:0;line-height:1;cursor:pointer;color:#405047;font-size:11px}
    #userBanksGrid .sf-bank-move:hover{background:#eef4ef}
    #userBanksGrid .sf-bank-drag{width:22px;text-align:center;color:#809087;font-size:16px;font-weight:800;line-height:1}
    #userBanksGrid .sf-bank-dragging{opacity:.45}
    .sf-user-bank-order-hint{margin:8px 0 12px;font-size:10px;color:#607067;line-height:1.45}
    @media(max-width:760px){#userBanksGrid .sf-bank-drag{display:none}}
  `;
  document.head.appendChild(st);

  const modal=document.getElementById('userBanksModal');
  const grid=document.getElementById('userBanksGrid');
  const copy=modal?.querySelector('.user-banks-copy');
  if(copy)copy.textContent='Обери свої банки та задай їх порядок у матриці. Перетягуй рядки за ≡ або використовуй ↑ / ↓. Зміни бачиш тільки ти.';
  if(copy&&!modal.querySelector('.sf-user-bank-order-hint')){
    const hint=document.createElement('div');
    hint.className='sf-user-bank-order-hint';
    hint.textContent='Порядок синхронізується з твоїм акаунтом і не змінює глобальну матрицю SaveFlow.';
    copy.insertAdjacentElement('afterend',hint);
  }

  if(grid)new MutationObserver(()=>setTimeout(enhanceGrid,0)).observe(grid,{childList:true});
  document.getElementById('userBanksOpen')?.addEventListener('click',()=>setTimeout(enhanceGrid,0));
  document.getElementById('userBanksSave')?.addEventListener('click',()=>setTimeout(saveFromModal,0));

  new MutationObserver(()=>setTimeout(applyOrder,0)).observe(document.documentElement,{attributes:true,attributeFilter:['data-saveflow-role']});
  const table=document.getElementById('matrixTable');
  if(table)new MutationObserver(()=>{if(!applying)setTimeout(applyOrder,0);}).observe(table,{childList:true,subtree:true});

  window.addEventListener('saveflow-auth-change',()=>setTimeout(()=>{pullCloud();applyOrder();},120));
  window.saveflowApplyUserBankOrder=applyOrder;
  window.saveflowPullUserBankOrder=pullCloud;

  setTimeout(()=>{captureGlobalOrder();applyOrder();enhanceGrid();if(window.saveflowCloud?.session?.user)pullCloud();},80);
})();