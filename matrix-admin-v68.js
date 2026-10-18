(()=>{
  const KEY='saveflow.matrixOverrides.v1';
  const cloud=()=>window.saveflowCloud;
  const auth=()=>window.saveflowAuthState||window.saveflowCloud||{};
  const client=()=>cloud()?.client||auth()?.client||null;
  const session=()=>auth()?.session||cloud()?.session||null;
  const profile=()=>auth()?.profile||cloud()?.profile||null;
  const isAdmin=()=>profile()?.role==='admin'&&!!session()?.user;
  const isEditing=()=>document.body?.classList.contains('site-editing');
  const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const today=()=>{
    const d=new Date();
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  };
  const readOverrides=()=>{
    try{
      const x=JSON.parse(localStorage.getItem(KEY)||'{}');
      return x&&typeof x==='object'&&!Array.isArray(x)?x:{};
    }catch(_){return{}}
  };
  const matrixTable=()=>document.querySelector('#matrixTable, .matrix-card table');

  const st=document.createElement('style');
  st.id='sf-admin-matrix-editor-v68';
  st.textContent=`
    body.sf-admin-matrix-mode #matrixTable tbody td:not(:first-child),
    body.sf-admin-matrix-mode .matrix-card table tbody td:not(:first-child){
      cursor:pointer;position:relative;outline:1px dashed rgba(36,77,56,.22);outline-offset:-2px;
      transition:background .12s ease,outline-color .12s ease
    }
    body.sf-admin-matrix-mode #matrixTable tbody td:not(:first-child):hover,
    body.sf-admin-matrix-mode .matrix-card table tbody td:not(:first-child):hover{
      background:#eef7f1!important;outline-color:#46745b
    }
    body.site-editing td[data-sf-admin-override="1"]{position:relative}
    body.site-editing td[data-sf-admin-override="1"]::after{
      content:'ADMIN';position:absolute;right:4px;top:3px;font-size:6px;font-weight:900;letter-spacing:.06em;
      color:#315e45;background:#e0f0e5;border:1px solid #b8d3c1;border-radius:5px;padding:1px 3px;pointer-events:none
    }

    .sf-admin-matrix-backdrop{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:22px;
      background:rgba(20,29,24,.43);z-index:1900}
    .sf-admin-matrix-backdrop.show{display:flex}
    .sf-admin-matrix-modal{width:min(520px,96vw);background:#fff;border:1px solid #cbd9cf;border-radius:18px;
      box-shadow:0 24px 70px rgba(18,35,24,.25);padding:18px}
    .sf-admin-matrix-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}
    .sf-admin-matrix-head h2{margin:0;font-size:19px;color:#1f2d24}
    .sf-admin-matrix-head p{margin:5px 0 0;font-size:11px;color:#718078;line-height:1.45}
    .sf-admin-matrix-field{display:grid;gap:5px;margin:11px 0}
    .sf-admin-matrix-field label{font-size:10px;font-weight:800;color:#435148}
    .sf-admin-matrix-field input,.sf-admin-matrix-field textarea{
      width:100%;box-sizing:border-box;border:1px solid #cbd8d0;border-radius:10px;padding:10px 11px;
      font:inherit;font-size:13px;background:#fff;color:#1f2c24;outline:none
    }
    .sf-admin-matrix-field input:focus,.sf-admin-matrix-field textarea:focus{border-color:#5f8c70;box-shadow:0 0 0 3px rgba(68,122,87,.10)}
    .sf-admin-matrix-field textarea{min-height:78px;resize:vertical}
    .sf-admin-matrix-current{font-size:10px;color:#65736b;background:#f4f7f5;border-radius:9px;padding:8px 9px}
    .sf-admin-matrix-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin-top:14px}
    .sf-admin-matrix-btn{border:1px solid #becfc4;background:#fff;color:#223229;border-radius:10px;padding:8px 11px;
      font:inherit;font-size:11px;font-weight:800;cursor:pointer}
    .sf-admin-matrix-btn.primary{background:#244d38;color:#fff;border-color:#244d38}
    .sf-admin-matrix-btn.danger{color:#8a3030;border-color:#dfbcbc}
    .sf-admin-matrix-btn:disabled{opacity:.55;cursor:wait}
    .sf-admin-matrix-status{font-size:10px;color:#647169;margin-top:9px;min-height:15px}
    @media(max-width:700px){.sf-admin-matrix-modal{padding:14px}.sf-admin-matrix-actions{justify-content:stretch}.sf-admin-matrix-btn{flex:1}}
  `;
  document.head.appendChild(st);

  const backdrop=document.createElement('div');
  backdrop.className='sf-admin-matrix-backdrop';
  backdrop.innerHTML=`
    <section class="sf-admin-matrix-modal" role="dialog" aria-modal="true" aria-label="Глобальне редагування матриці">
      <div class="sf-admin-matrix-head">
        <div><h2>Матриця для всіх</h2><p data-admin-matrix-context>Обрана клітинка</p></div>
        <button type="button" class="sf-admin-matrix-btn" data-admin-matrix-close>Закрити</button>
      </div>
      <div class="sf-admin-matrix-current" data-admin-matrix-current></div>
      <div class="sf-admin-matrix-field">
        <label for="adminMatrixValue">Значення, яке бачитимуть усі</label>
        <input id="adminMatrixValue" type="text" autocomplete="off" placeholder="Напр. 5%, до 10%, 1% / 3% або —">
      </div>
      <div class="sf-admin-matrix-field">
        <label for="adminMatrixNote">Пояснення / умови (необов’язково)</label>
        <textarea id="adminMatrixNote" placeholder="Напр. тільки власними коштами, ліміт 500 грн/міс."></textarea>
      </div>
      <div class="sf-admin-matrix-status" data-admin-matrix-status></div>
      <div class="sf-admin-matrix-actions">
        <button type="button" class="sf-admin-matrix-btn danger" data-admin-matrix-reset>Прибрати мою глобальну правку</button>
        <button type="button" class="sf-admin-matrix-btn" data-admin-matrix-cancel>Скасувати</button>
        <button type="button" class="sf-admin-matrix-btn primary" data-admin-matrix-save>Зберегти для всіх</button>
      </div>
    </section>`;
  document.body.appendChild(backdrop);

  let selected=null;

  function ensureToolbar(){}
  function bankMap(table){
    return [...table.querySelectorAll('thead th')].map(th=>norm(th.querySelector('.bank-name')?.textContent||th.textContent||''));
  }
  function cellInfo(td){
    const table=td?.closest('table');
    const tr=td?.closest('tr');
    if(!table||!tr)return null;
    const idx=[...tr.children].indexOf(td);
    if(idx<=0)return null;
    const bank=bankMap(table)[idx];
    const category=norm(tr.querySelector('td:first-child strong')?.textContent||tr.querySelector('td:first-child')?.textContent||'');
    if(!bank||!category)return null;
    const key=category+'|||'+bank;
    const value=norm(td.querySelector('.cash-value')?.textContent||td.querySelector('.cash')?.textContent||td.textContent||'');
    return {td,table,tr,idx,bank,category,key,value};
  }

  function markOverrides(){
    const table=matrixTable();if(!table)return;
    const data=readOverrides();
    const banks=bankMap(table);
    table.querySelectorAll('tbody tr').forEach(tr=>{
      const category=norm(tr.querySelector('td:first-child strong')?.textContent||tr.querySelector('td:first-child')?.textContent||'');
      [...tr.children].forEach((td,idx)=>{
        if(idx===0)return;
        const key=category+'|||'+banks[idx];
        if(data[key])td.dataset.sfAdminOverride='1';
        else delete td.dataset.sfAdminOverride;
      });
    });
  }

  function openEditor(info){
    if(!info||!isAdmin()||!isEditing())return;
    selected=info;
    const overrides=readOverrides();
    const own=overrides[info.key]||null;
    backdrop.querySelector('[data-admin-matrix-context]').textContent=info.category+' · '+info.bank;
    backdrop.querySelector('[data-admin-matrix-current]').innerHTML=
      'Зараз на екрані: <b>'+esc(info.value||'—')+'</b>'+
      (own?' · <b>є глобальна ADMIN-правка</b>':' · використовується базове/офіційне значення');
    backdrop.querySelector('#adminMatrixValue').value=own?.value??info.value??'';
    backdrop.querySelector('#adminMatrixNote').value=own?.note??'';
    backdrop.querySelector('[data-admin-matrix-reset]').style.display=own?'inline-flex':'none';
    backdrop.querySelector('[data-admin-matrix-status]').textContent='Збереження змінить значення для всіх користувачів.';
    backdrop.classList.add('show');
    setTimeout(()=>backdrop.querySelector('#adminMatrixValue')?.focus(),30);
  }

  function closeEditor(){
    if(backdrop.classList.contains('show'))backdrop.classList.remove('show');
    selected=null;
  }

  function setBusy(busy,msg=''){
    backdrop.querySelectorAll('button,input,textarea').forEach(el=>el.disabled=busy);
    const s=backdrop.querySelector('[data-admin-matrix-status]');
    if(s&&msg)s.textContent=msg;
  }

  async function saveSelected(){
    if(!selected||!isAdmin())return;
    const c=client();const uid=session()?.user?.id;if(!c||!uid)return;
    const value=norm(backdrop.querySelector('#adminMatrixValue').value);
    const note=norm(backdrop.querySelector('#adminMatrixNote').value);
    if(!value){
      backdrop.querySelector('[data-admin-matrix-status]').textContent='Вкажи значення. Для порожнього кешбеку використовуй —.';
      return;
    }
    setBusy(true,'Створюю backup і зберігаю глобальну правку…');
    try{
      const {error:backupError}=await c.rpc('admin_create_global_backup',{
        p_label:'Перед зміною матриці · '+selected.category+' · '+selected.bank
      });
      if(backupError)throw backupError;

      const payload={
        value,
        note,
        source:'',
        checked:today(),
        sourceTier:'manual',
        end:'',
        empty:false,
        best:false,
        updatedAt:new Date().toISOString()
      };
      const {error}=await c.from('global_matrix_overrides').upsert({
        cell_key:selected.key,
        payload,
        updated_by:uid,
        updated_at:new Date().toISOString()
      },{onConflict:'cell_key'});
      if(error)throw error;

      const all=readOverrides();all[selected.key]=payload;
      localStorage.setItem(KEY,JSON.stringify(all));
      await window.saveflowGlobalCloud?.pull?.();
      window.saveflowApplyMatrixOverrides?.();
      window.saveflowMatrixApplyOverrides?.();
      markOverrides();
      setBusy(false,'Збережено. Це значення тепер глобальне і його бачать усі.');
      setTimeout(closeEditor,650);
    }catch(e){
      console.warn(e);
      setBusy(false,'Не вдалося зберегти: '+(e?.message||e));
    }
  }

  async function resetSelected(){
    if(!selected||!isAdmin())return;
    if(!confirm('Прибрати саме твою глобальну ADMIN-правку для цієї клітинки? Після цього знову використовуватиметься базове/офіційне значення.'))return;
    const c=client();if(!c)return;
    setBusy(true,'Створюю backup і прибираю глобальну правку…');
    try{
      const {error:backupError}=await c.rpc('admin_create_global_backup',{
        p_label:'Перед скиданням матриці · '+selected.category+' · '+selected.bank
      });
      if(backupError)throw backupError;
      const {error}=await c.from('global_matrix_overrides').delete().eq('cell_key',selected.key);
      if(error)throw error;
      const all=readOverrides();delete all[selected.key];
      localStorage.setItem(KEY,JSON.stringify(all));
      setBusy(false,'Глобальну правку прибрано. Перезавантажую базове значення…');
      setTimeout(()=>location.reload(),450);
    }catch(e){
      console.warn(e);
      setBusy(false,'Не вдалося прибрати правку: '+(e?.message||e));
    }
  }

  function enterMode(){
    if(!isAdmin()||!isEditing())return;
    document.body.classList.add('sf-admin-matrix-mode');
    markOverrides();
    document.getElementById('matrixTable')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function leaveMode(){
    if(document.body.classList.contains('sf-admin-matrix-mode')){
      document.body.classList.remove('sf-admin-matrix-mode');
    }
    if(backdrop.classList.contains('show'))closeEditor();
  }
  function syncUi(){
    const allowed=isAdmin()&&isEditing();
    if(!allowed && (
      document.body.classList.contains('sf-admin-matrix-mode') ||
      backdrop.classList.contains('show')
    ))leaveMode();
    markOverrides();
    const pencil=document.getElementById('personalMatrixToggle');
    if(pencil&&allowed){
      const active=document.body.classList.contains('sf-admin-matrix-mode');
      pencil.setAttribute('aria-pressed',active?'true':'false');
      pencil.setAttribute('data-tip',active?'Глобальне редагування активне — клікни клітинку':'Глобальні зміни матриці — побачать усі користувачі');
    }
  }

  window.saveflowAdminMatrixEditor={
    toggle(){
      if(!isAdmin()||!isEditing())return false;
      if(document.body.classList.contains('sf-admin-matrix-mode'))leaveMode();
      else enterMode();
      syncUi();
      return true;
    },
    enter(){if(isAdmin()&&isEditing()){enterMode();syncUi();return true}return false},
    leave(){leaveMode();syncUi();return true},
    active(){return document.body.classList.contains('sf-admin-matrix-mode')}
  };

  document.addEventListener('click',e=>{
    if(e.target.closest('[data-admin-matrix-close],[data-admin-matrix-cancel]')||e.target===backdrop){closeEditor();return}
    if(e.target.closest('[data-admin-matrix-save]')){saveSelected();return}
    if(e.target.closest('[data-admin-matrix-reset]')){resetSelected();return}
    if(document.body.classList.contains('sf-admin-matrix-mode')){
      const td=e.target.closest('#matrixTable tbody td:not(:first-child), .matrix-card table tbody td:not(:first-child)');
      if(td){openEditor(cellInfo(td));return}
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(backdrop.classList.contains('show'))closeEditor();
      else if(document.body.classList.contains('sf-admin-matrix-mode'))leaveMode();
    }
  });

  window.addEventListener('saveflow-auth-change',()=>setTimeout(syncUi,0));
  new MutationObserver(syncUi).observe(document.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(syncUi).observe(document.documentElement,{attributes:true,attributeFilter:['data-saveflow-role']});
  new MutationObserver(()=>markOverrides()).observe(document.body,{subtree:true,childList:true});

  ensureToolbar();syncUi();
})();