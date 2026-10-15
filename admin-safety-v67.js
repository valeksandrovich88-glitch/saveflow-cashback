(()=>{
  const cloud=()=>window.saveflowCloud;
  const client=()=>cloud()?.client||null;
  const isAdmin=()=>cloud()?.profile?.role==='admin'&&!!cloud()?.session?.user;
  const isEditing=()=>document.body?.classList.contains('site-editing');
  const esc=(s)=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmt=(s)=>{try{return new Date(s).toLocaleString('uk-UA')}catch(_){return String(s||'—')}};
  const compact=(v,max=220)=>{
    if(v==null)return '—';
    let s;try{s=typeof v==='string'?v:JSON.stringify(v)}catch(_){s=String(v)}
    return s.length>max?s.slice(0,max-1)+'…':s;
  };
  const pretty=(v)=>{try{return JSON.stringify(v,null,2)}catch(_){return String(v??'—')}};

  const st=document.createElement('style');
  st.textContent=`
    #safeChangeHistoryToggle,#safeBackupToggle{display:none}
    body.site-editing #safeChangeHistoryToggle,
    body.site-editing #safeBackupToggle{display:inline-flex}
    .sf-admin-safe-backdrop{position:fixed;inset:0;background:rgba(20,29,24,.42);display:none;align-items:center;justify-content:center;padding:22px;z-index:1800}
    .sf-admin-safe-backdrop.show{display:flex}
    .sf-admin-safe-modal{width:min(920px,96vw);max-height:88vh;overflow:auto;background:#fff;border:1px solid #cad8cf;border-radius:18px;box-shadow:0 24px 70px rgba(18,35,24,.24);padding:18px}
    .sf-admin-safe-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
    .sf-admin-safe-head h2{margin:0;font-size:20px;color:#1f2d24}
    .sf-admin-safe-head p{margin:5px 0 0;color:#69766e;font-size:12px;line-height:1.45}
    .sf-admin-safe-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
    .sf-admin-safe-btn{border:1px solid #bdcec3;background:#fff;color:#213229;border-radius:10px;padding:8px 11px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
    .sf-admin-safe-btn.primary{background:#244d38;color:#fff;border-color:#244d38}
    .sf-admin-safe-btn.danger{color:#8b2b2b;border-color:#e0bcbc}
    .sf-admin-safe-btn:disabled{opacity:.55;cursor:wait}
    .sf-admin-safe-status{font-size:12px;color:#647169;padding:9px 10px;background:#f4f7f5;border-radius:10px;margin:10px 0}
    .sf-admin-safe-list{display:grid;gap:8px;margin-top:10px}
    .sf-admin-safe-row{border:1px solid #dde6e0;border-radius:12px;padding:10px 11px;background:#fbfcfb}
    .sf-admin-safe-row-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
    .sf-admin-safe-row b{font-size:12px;color:#26362c}
    .sf-admin-safe-meta{font-size:10px;color:#79867e;margin-top:3px}
    .sf-admin-safe-row-actions{display:flex;gap:6px;flex-wrap:wrap}
    .sf-admin-safe-json{margin-top:8px;background:#f4f6f4;border-radius:9px;padding:9px;font:10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;word-break:break-word;max-height:240px;overflow:auto}
    .sf-admin-safe-empty{padding:18px;text-align:center;color:#78847d;font-size:12px}
    .sf-history-change{margin-top:7px;font-size:11px;color:#526159}
    @media(max-width:700px){
      .sf-admin-safe-modal{padding:14px}
      .sf-admin-safe-row-top,.sf-admin-safe-head{flex-direction:column}
    }
  `;
  document.head.appendChild(st);

  function ensureAdminButtons(){
    const actions=document.querySelector('#siteAdminBar .site-admin-actions')||document.getElementById('siteAdminBar');
    if(!actions)return;

    if(!document.getElementById('safeChangeHistoryToggle')){
      const b=document.createElement('button');
      b.id='safeChangeHistoryToggle';b.type='button';b.className='matrix-btn';
      b.textContent='Історія змін';b.title='Глобальна історія змін SaveFlow';
      actions.prepend(b);
    }
    if(!document.getElementById('safeBackupToggle')){
      const b=document.createElement('button');
      b.id='safeBackupToggle';b.type='button';b.className='matrix-btn';
      b.textContent='Експорт/Імпорт';b.title='Безпечний cloud backup та restore';
      actions.prepend(b);
    }
  }

  const dataBackdrop=document.createElement('div');
  dataBackdrop.className='sf-admin-safe-backdrop';
  dataBackdrop.innerHTML=`
    <section class="sf-admin-safe-modal" role="dialog" aria-modal="true" aria-label="Експорт та імпорт SaveFlow">
      <div class="sf-admin-safe-head">
        <div><h2>Експорт / Імпорт</h2><p>Тільки глобальні admin-дані. Перед кожним імпортом або restore сервер автоматично створює backup поточного стану.</p></div>
        <button class="sf-admin-safe-btn" data-safe-close>Закрити</button>
      </div>
      <div class="sf-admin-safe-actions">
        <button class="sf-admin-safe-btn primary" data-safe-export>Експортувати JSON</button>
        <button class="sf-admin-safe-btn" data-safe-backup>Створити backup</button>
        <button class="sf-admin-safe-btn" data-safe-import>Імпортувати JSON</button>
        <input type="file" accept="application/json,.json" data-safe-file hidden>
      </div>
      <div class="sf-admin-safe-status" data-safe-status>Готово.</div>
      <div><b style="font-size:12px">Останні server backups</b></div>
      <div class="sf-admin-safe-list" data-safe-backups></div>
    </section>`;
  document.body.appendChild(dataBackdrop);

  const histBackdrop=document.createElement('div');
  histBackdrop.className='sf-admin-safe-backdrop';
  histBackdrop.innerHTML=`
    <section class="sf-admin-safe-modal" role="dialog" aria-modal="true" aria-label="Історія змін SaveFlow">
      <div class="sf-admin-safe-head">
        <div><h2>Історія змін</h2><p>Останні глобальні admin/system зміни. Before/after зберігаються в журналі Supabase.</p></div>
        <div class="sf-admin-safe-row-actions"><button class="sf-admin-safe-btn" data-history-refresh>Оновити</button><button class="sf-admin-safe-btn" data-history-close>Закрити</button></div>
      </div>
      <div class="sf-admin-safe-status" data-history-status>Готово.</div>
      <div class="sf-admin-safe-list" data-history-list></div>
    </section>`;
  document.body.appendChild(histBackdrop);

  function setStatus(msg,busy=false){
    const el=dataBackdrop.querySelector('[data-safe-status]');
    if(el)el.textContent=msg;
    dataBackdrop.querySelectorAll('button').forEach(b=>b.disabled=busy);
  }
  function setHistoryStatus(msg,busy=false){
    const el=histBackdrop.querySelector('[data-history-status]');
    if(el)el.textContent=msg;
    histBackdrop.querySelectorAll('button').forEach(b=>b.disabled=busy);
  }

  async function loadBackups(){
    const c=client();if(!c||!isAdmin())return;
    const box=dataBackdrop.querySelector('[data-safe-backups]');
    if(!box)return;
    const {data,error}=await c.from('global_state_backups')
      .select('id,label,snapshot,created_at')
      .order('created_at',{ascending:false}).limit(12);
    if(error){box.innerHTML='<div class="sf-admin-safe-empty">'+esc(error.message)+'</div>';return}
    if(!data?.length){box.innerHTML='<div class="sf-admin-safe-empty">Backup-ів ще немає.</div>';return}
    box.innerHTML=data.map(row=>{
      const s=row.snapshot||{};
      const mc=Array.isArray(s.matrix_overrides)?s.matrix_overrides.length:0;
      const cc=Array.isArray(s.content_items)?s.content_items.length:0;
      return `<div class="sf-admin-safe-row" data-backup-id="${esc(row.id)}">
        <div class="sf-admin-safe-row-top">
          <div><b>${esc(row.label||'Backup')}</b><div class="sf-admin-safe-meta">${esc(fmt(row.created_at))} · matrix ${mc} · content ${cc}</div></div>
          <div class="sf-admin-safe-row-actions">
            <button class="sf-admin-safe-btn" data-backup-download>JSON</button>
            <button class="sf-admin-safe-btn primary" data-backup-restore>Відновити</button>
            <button class="sf-admin-safe-btn danger" data-backup-delete>Видалити</button>
          </div>
        </div>
      </div>`;
    }).join('');
    box._rows=data;
  }

  function downloadJson(data,name){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }

  async function exportNow(){
    const c=client();if(!c||!isAdmin())return;
    setStatus('Формую cloud export…',true);
    const {data,error}=await c.rpc('admin_export_global_state');
    if(error){setStatus('Помилка export: '+error.message);return}
    const date=new Date().toISOString().replace(/[:.]/g,'-');
    downloadJson(data,`saveflow-global-${date}.json`);
    setStatus(`Експортовано: ${data?.matrix_overrides?.length||0} matrix + ${data?.content_items?.length||0} content rows.`);
  }

  async function createBackup(){
    const c=client();if(!c||!isAdmin())return;
    setStatus('Створюю server backup…',true);
    const label='Ручний backup · '+new Date().toLocaleString('uk-UA');
    const {data,error}=await c.rpc('admin_create_global_backup',{p_label:label});
    if(error){setStatus('Помилка backup: '+error.message);return}
    setStatus('Backup створено: '+data);
    await loadBackups();
  }

  async function importFile(file){
    const c=client();if(!c||!isAdmin()||!file)return;
    let snapshot;
    try{snapshot=JSON.parse(await file.text())}catch(_){setStatus('Файл не є коректним JSON.');return}
    if(snapshot?.format!=='saveflow-global-v1'||Number(snapshot?.version)!==1||!Array.isArray(snapshot?.matrix_overrides)||!Array.isArray(snapshot?.content_items)){
      setStatus('Це не підтримуваний SaveFlow global backup v1.');return;
    }
    const mc=snapshot.matrix_overrides.length,cc=snapshot.content_items.length;
    const ok=confirm(`Замінити глобальний стан SaveFlow даними з файлу?\n\nMatrix overrides: ${mc}\nContent items: ${cc}\n\nПеред зміною сервер автоматично збереже поточний стан у backup.`);
    if(!ok){setStatus('Імпорт скасовано.');return}
    setStatus('Перевіряю і застосовую імпорт атомарно…',true);
    const label='Автобекап перед імпортом · '+new Date().toLocaleString('uk-UA');
    const {data,error}=await c.rpc('admin_replace_global_state',{p_snapshot:snapshot,p_backup_label:label});
    if(error){setStatus('Імпорт відхилено без змін: '+error.message);return}
    await window.saveflowGlobalCloud?.pull?.();
    setStatus(`Імпорт завершено: matrix ${data?.matrix_rows??mc}, content ${data?.content_rows??cc}. Попередній стан: backup ${data?.backup_id||'створено'}.`);
    await loadBackups();
  }

  async function restoreBackup(id){
    const c=client();if(!c||!isAdmin()||!id)return;
    if(!confirm('Відновити цей backup? Поточний стан автоматично буде збережено в новий backup перед restore.'))return;
    setStatus('Відновлюю backup атомарно…',true);
    const {data,error}=await c.rpc('admin_restore_global_backup',{p_backup_id:id});
    if(error){setStatus('Restore не виконано: '+error.message);return}
    await window.saveflowGlobalCloud?.pull?.();
    setStatus(`Backup відновлено. matrix ${data?.matrix_rows??0}, content ${data?.content_rows??0}.`);
    await loadBackups();
  }

  async function deleteBackup(id){
    const c=client();if(!c||!isAdmin()||!id)return;
    if(!confirm('Видалити лише цей backup? Live-дані не зміняться.'))return;
    const {error}=await c.from('global_state_backups').delete().eq('id',id);
    if(error){setStatus('Не вдалося видалити backup: '+error.message);return}
    setStatus('Backup видалено. Live-дані не змінено.');
    await loadBackups();
  }

  async function loadHistory(){
    const c=client();if(!c||!isAdmin())return;
    const box=histBackdrop.querySelector('[data-history-list]');
    if(!box)return;
    setHistoryStatus('Завантажую журнал…',true);
    const {data,error}=await c.from('change_log').select('id,actor_id,scope,entity_type,entity_key,action,before_data,after_data,created_at')
      .order('created_at',{ascending:false}).limit(100);
    if(error){setHistoryStatus('Не вдалося завантажити журнал: '+error.message);box.innerHTML='';return}
    setHistoryStatus(`Показано останні ${data?.length||0} записів.`);
    if(!data?.length){box.innerHTML='<div class="sf-admin-safe-empty">Історія поки порожня.</div>';return}
    box.innerHTML=data.map(row=>{
      const title=`${row.scope||'—'} · ${row.entity_type||'—'} · ${row.action||'—'}`;
      return `<div class="sf-admin-safe-row">
        <div class="sf-admin-safe-row-top">
          <div><b>${esc(title)}</b><div class="sf-admin-safe-meta">${esc(fmt(row.created_at))} · ${esc(row.entity_key||'—')}</div></div>
        </div>
        <div class="sf-history-change">before: ${esc(compact(row.before_data))}<br>after: ${esc(compact(row.after_data))}</div>
        ${row.before_data!=null||row.after_data!=null?`<details><summary class="sf-admin-safe-meta">Повний before / after</summary><pre class="sf-admin-safe-json">BEFORE\n${esc(pretty(row.before_data))}\n\nAFTER\n${esc(pretty(row.after_data))}</pre></details>`:''}
      </div>`;
    }).join('');
  }

  function openData(){
    if(!isAdmin()||!isEditing())return;
    dataBackdrop.classList.add('show');setStatus('Готово.');loadBackups();
  }
  function openHistory(){
    if(!isAdmin()||!isEditing())return;
    histBackdrop.classList.add('show');loadHistory();
  }
  function syncButtons(){
    ensureAdminButtons();
    const show=isAdmin()&&isEditing();
    const h=document.getElementById('safeChangeHistoryToggle');
    const b=document.getElementById('safeBackupToggle');
    if(h)h.style.display=show?'inline-flex':'none';
    if(b)b.style.display=show?'inline-flex':'none';
    if(!show){dataBackdrop.classList.remove('show');histBackdrop.classList.remove('show')}
  }

  document.addEventListener('click',e=>{
    if(e.target.closest('#safeBackupToggle'))openData();
    if(e.target.closest('#safeChangeHistoryToggle'))openHistory();
    if(e.target.closest('[data-safe-close]')||e.target===dataBackdrop)dataBackdrop.classList.remove('show');
    if(e.target.closest('[data-history-close]')||e.target===histBackdrop)histBackdrop.classList.remove('show');
    if(e.target.closest('[data-safe-export]'))exportNow();
    if(e.target.closest('[data-safe-backup]'))createBackup();
    if(e.target.closest('[data-safe-import]'))dataBackdrop.querySelector('[data-safe-file]')?.click();
    if(e.target.closest('[data-history-refresh]'))loadHistory();

    const row=e.target.closest('[data-backup-id]');
    const id=row?.dataset.backupId;
    if(id&&e.target.closest('[data-backup-restore]'))restoreBackup(id);
    if(id&&e.target.closest('[data-backup-delete]'))deleteBackup(id);
    if(id&&e.target.closest('[data-backup-download]')){
      const rows=dataBackdrop.querySelector('[data-safe-backups]')?._rows||[];
      const found=rows.find(x=>String(x.id)===String(id));
      if(found?.snapshot)downloadJson(found.snapshot,`saveflow-backup-${id}.json`);
    }
  });
  dataBackdrop.querySelector('[data-safe-file]')?.addEventListener('change',e=>{
    const file=e.target.files?.[0];e.target.value='';if(file)importFile(file);
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){dataBackdrop.classList.remove('show');histBackdrop.classList.remove('show')}});

  window.addEventListener('saveflow-auth-change',()=>setTimeout(syncButtons,0));
  new MutationObserver(syncButtons).observe(document.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(syncButtons).observe(document.documentElement,{attributes:true,attributeFilter:['data-saveflow-role']});
  ensureAdminButtons();syncButtons();
})();
