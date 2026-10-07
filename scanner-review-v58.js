(()=>{
  const ID='saveflowScannerReviewV58';
  if(document.getElementById(ID)) return;

  const state={open:false,tab:'pending',busy:false,candidates:[],sources:{},runs:[],snapshots:[],latestSnapshots:{}};
  const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate=(s)=>{
    if(!s)return '—';
    try{return new Intl.DateTimeFormat('uk-UA',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s));}
    catch(_){return String(s)}
  };
  const fmtShort=(s)=>{
    if(!s)return '—';
    const m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m?`${m[3]}.${m[2]}.${m[1]}`:String(s);
  };
  const cloud=()=>window.saveflowCloud||null;
  const client=()=>cloud()?.client||null;
  const session=()=>cloud()?.session||window.saveflowAuthState?.session||null;
  const isAdmin=()=>cloud()?.profile?.role==='admin' && !!session()?.user;

  const st=document.createElement('style');
  st.id=ID;
  st.textContent=`
    #scannerReviewToggle{display:none}
    html[data-saveflow-role="admin"] #scannerReviewToggle{display:inline-flex}
    .sf-scan-review-backdrop{position:fixed;inset:0;background:rgba(5,16,10,.48);backdrop-filter:blur(5px);z-index:9997;display:none;align-items:center;justify-content:center;padding:22px}
    .sf-scan-review-backdrop.show{display:flex}
    .sf-scan-review{width:min(1100px,96vw);max-height:91vh;overflow:hidden;background:rgba(247,251,247,.98);border:1px solid rgba(168,193,174,.8);border-radius:18px;box-shadow:0 28px 80px rgba(0,0,0,.28);display:flex;flex-direction:column;color:#14251a}
    .sf-scan-head{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;padding:18px 18px 13px;border-bottom:1px solid rgba(188,211,193,.75)}
    .sf-scan-head h2{font-size:18px;margin:0 0 4px}.sf-scan-head p{font-size:11px;color:#607065;margin:0;line-height:1.45}
    .sf-scan-actions{display:flex;gap:7px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
    .sf-scan-btn{border:1px solid #bed0c2;background:#f8fbf8;color:#233d2c;border-radius:10px;padding:8px 10px;font:700 11px/1 system-ui;cursor:pointer}
    .sf-scan-btn:hover{background:#edf5ef}.sf-scan-btn.primary{background:#235d3e;color:#fff;border-color:#235d3e}.sf-scan-btn.danger{color:#8e2f2f}
    .sf-scan-btn:disabled{opacity:.52;cursor:wait}
    .sf-scan-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:12px 18px}
    .sf-scan-stat{padding:10px 11px;border:1px solid #d5e2d8;border-radius:12px;background:#eef6f0}.sf-scan-stat b{display:block;font-size:16px}.sf-scan-stat span{font-size:9px;color:#6c7b70}.sf-scan-overview{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:9px;padding:0 18px 12px}.sf-overview-card{border:1px solid #d3e0d6;border-radius:13px;background:#f2f7f3;padding:11px}.sf-overview-title{font:800 11px/1.2 system-ui;margin-bottom:8px}.sf-health-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.sf-health-box{padding:8px;border-radius:9px;background:#e8f1ea}.sf-health-box b{display:block;font-size:13px}.sf-health-box span{font-size:8px;color:#68786d}.sf-health-note{margin-top:7px;font-size:8px;line-height:1.4;color:#68776c}.sf-rollover-list{display:grid;gap:5px}.sf-rollover-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px 8px;border-radius:9px;background:#eaf2ec;font-size:9px}.sf-rollover-item b{font-size:9px}.sf-rollover-item span{white-space:nowrap;color:#5f7065}.sf-rollover-item.expired{background:#f8e5e5}.sf-rollover-item.soon{background:#fff0d8}.sf-rollover-empty{font-size:9px;color:#718077;padding:6px 1px}
    .sf-scan-tabs{display:flex;gap:6px;padding:0 18px 10px}.sf-scan-tab{border:0;border-radius:9px;padding:7px 10px;background:#e7efe9;color:#4c6253;font:750 10px system-ui;cursor:pointer}
    .sf-scan-tab.active{background:#294f39;color:white}
    .sf-scan-body{overflow:auto;padding:0 18px 18px;display:grid;gap:10px}
    .sf-scan-empty{padding:22px;border:1px dashed #bfcfc3;border-radius:13px;text-align:center;color:#6d7a70;font-size:11px}
    .sf-candidate{border:1px solid #cfddd2;border-radius:14px;background:#f7faf7;padding:13px;box-shadow:0 5px 15px rgba(21,52,31,.05)}
    .sf-candidate.high{border-color:#e2c4a6;background:#fffaf4}.sf-candidate.low{opacity:.88}
    .sf-candidate-top{display:flex;gap:10px;justify-content:space-between;align-items:flex-start}
    .sf-candidate-title{font:800 13px/1.25 system-ui;margin-bottom:4px}.sf-candidate-meta{font:600 9px/1.4 system-ui;color:#718077}
    .sf-chip-row{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.sf-chip{display:inline-flex;padding:4px 7px;border-radius:999px;background:#e7f0e9;color:#365542;font:750 9px/1 system-ui}
    .sf-chip.high{background:#f8e7d6;color:#824919}.sf-chip.expired{background:#f9dddd;color:#8d3030}.sf-chip.reference{background:#e6eaf4;color:#465577}.sf-chip.unavailable{background:#fff0d8;color:#8b5318}
    .sf-structured{margin-top:10px;display:grid;gap:7px}.sf-structured-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
    .sf-field{border-radius:10px;background:#eef4ef;padding:7px 8px;min-width:0}.sf-field span{display:block;font-size:8px;color:#738078;margin-bottom:3px}.sf-field b{display:block;font-size:10px;overflow:hidden;text-overflow:ellipsis}
    .sf-items{display:grid;gap:5px}.sf-item{display:grid;grid-template-columns:minmax(150px,1fr) auto auto;gap:8px;align-items:center;padding:7px 8px;background:#edf4ee;border-radius:9px;font-size:9px}
    .sf-item b{font-size:10px}.sf-item .rate{font-weight:850;color:#235c3d}.sf-item .dates{color:#67766c;white-space:nowrap}
    .sf-evidence{font-size:9px;color:#66746a;background:#f1f5f1;padding:7px 8px;border-radius:9px;line-height:1.45}
    .sf-candidate-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
    .sf-source-link{color:#245f40;text-decoration:none;font-weight:750}.sf-source-link:hover{text-decoration:underline}
    .sf-note{margin-top:8px;font-size:9px;color:#6b796f;line-height:1.45}
    .sf-runline{padding:0 18px 12px;color:#607065;font-size:9px}
    @media(max-width:760px){
      .sf-scan-review-backdrop{padding:8px}.sf-scan-review{max-height:95vh;border-radius:14px}.sf-scan-head{padding:14px;flex-direction:column}.sf-scan-actions{justify-content:flex-start}
      .sf-scan-summary{grid-template-columns:repeat(2,minmax(0,1fr));padding:10px 14px}.sf-scan-overview{grid-template-columns:1fr;padding:0 14px 10px}.sf-scan-tabs{padding:0 14px 10px}.sf-scan-body{padding:0 14px 14px}
      .sf-structured-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sf-item{grid-template-columns:1fr auto}.sf-item .dates{grid-column:1/-1}
    }
  `;
  document.head.appendChild(st);

  const backdrop=document.createElement('div');
  backdrop.className='sf-scan-review-backdrop';
  backdrop.innerHTML=`
    <section class="sf-scan-review" role="dialog" aria-modal="true" aria-label="Центр перевірки сканера">
      <div class="sf-scan-head">
        <div><h2>Центр перевірки сканера</h2><p>Сканер лише знаходить зміни й готує структуровані дані. Нічого не публікується автоматично.</p></div>
        <div class="sf-scan-actions">
          <button class="sf-scan-btn" data-scan-action="refresh">Оновити</button>
          <button class="sf-scan-btn primary" data-scan-action="run">Запустити зараз</button>
          <button class="sf-scan-btn" data-scan-action="close">Закрити</button>
        </div>
      </div>
      <div class="sf-scan-summary" id="sfScanSummary"></div>
      <div class="sf-scan-overview"><div class="sf-overview-card" id="sfScanHealth"></div><div class="sf-overview-card" id="sfScanRollover"></div></div>
      <div class="sf-scan-tabs">
        <button class="sf-scan-tab active" data-scan-tab="pending">На перевірці</button>
        <button class="sf-scan-tab" data-scan-tab="all">Останні</button>
      </div>
      <div class="sf-runline" id="sfScanRunline"></div>
      <div class="sf-scan-body" id="sfScanBody"></div>
    </section>`;
  document.body.appendChild(backdrop);

  let toggle=document.getElementById('scannerReviewToggle');
  if(!toggle){
    toggle=document.createElement('button');
    toggle.id='scannerReviewToggle';
    toggle.type='button';
    toggle.className='matrix-btn';
    toggle.textContent='Сканер';
    toggle.title='Центр перевірки сканера';
    const actions=document.querySelector('#siteAdminBar .site-admin-actions')||document.querySelector('#siteAdminBar');
    actions?.prepend(toggle);
  }

  const humanType=(c)=>{
    if(c.candidate_type==='official_source_expired') return 'Офіційна пропозиція завершилася';
    if(c.candidate_type==='official_source_unreadable') return 'Офіційне джерело недоступне сканеру';
    if(c.candidate_type==='dynamic_or_personalized_source_changed') return 'Зміни у персоналізованому джерелі';
    if(c.candidate_type==='reference_to_official_review') return 'Є офіційне джерело для перевірки';
    if(c.candidate_type==='reference_change_signal') return 'Сигнал з довідкового джерела';
    return 'Зміни в офіційному джерелі';
  };
  const statusLabel=(s)=>({pending:'На перевірці',reviewed:'Переглянуто',rejected:'Відхилено'}[s]||s||'—');
  const healthReason=(reason)=>({
    antibot_incapsula:'Incapsula / Imperva блокує серверний доступ до офіційного сайту',
    antibot_challenge:'Anti-bot challenge блокує серверний доступ до офіційного сайту',
    access_denied:'Офіційний сайт повернув Access Denied',
    binary_or_pdf_text:'Джерело повертає PDF або бінарний документ, який цей парсер не читає як сторінку',
    empty_or_too_short_excerpt:'Офіційна сторінка повернула замало доступного тексту',
    unsupported_content:'Формат джерела поки не підтримується'
  }[reason]||reason||'Джерело не вдалося коректно прочитати');

  function renderSummary(){
    const run=state.runs[0]||{};
    const pending=state.candidates.filter(x=>x.status==='pending');
    const high=pending.filter(x=>x.priority==='high').length;
    const expired=pending.filter(x=>x.candidate_type==='official_source_expired').length;
    document.getElementById('sfScanSummary').innerHTML=`
      <div class="sf-scan-stat"><b>${pending.length}</b><span>чекають перевірки</span></div>
      <div class="sf-scan-stat"><b>${high}</b><span>високий пріоритет</span></div>
      <div class="sf-scan-stat"><b>${expired}</b><span>завершені пропозиції</span></div>
      <div class="sf-scan-stat"><b>${run.failed_sources??0}</b><span>помилки останнього скану</span></div>`;
    const rl=document.getElementById('sfScanRunline');
    if(rl) rl.textContent=run.started_at?`Останній скан: ${fmtDate(run.started_at)} · ${run.status||'—'} · джерел ${run.total_sources??'—'} · змін ${run.changed_sources??0}`:'Сканів ще немає.';
  }

  function renderOverview(){
    const sources=Object.values(state.sources).filter(x=>x.enabled!==false&&x.source_role==='primary');
    const issues=sources.filter(src=>{
      if(src.last_error)return true;
      const p=state.latestSnapshots[src.id]?.structured_payload||{};
      if(!p.unsupported)return false;
      const reason=String(p.reason||'');
      if(/^(antibot_|access_denied)/.test(reason))return true;
      return !(src.publish_policy==='manual_only'||src.data_mode==='dynamic'||src.data_mode==='personalized');
    });
    const issueIds=new Set(issues.map(x=>x.id));
    const manual=sources.filter(x=>!issueIds.has(x.id)&&(x.publish_policy==='manual_only'||x.data_mode==='dynamic'||x.data_mode==='personalized'));
    const healthy=Math.max(0,sources.length-manual.length-issues.length);
    const healthEl=document.getElementById('sfScanHealth');
    if(healthEl){
      const issueNames=issues.slice(0,4).map(src=>{
        const p=state.latestSnapshots[src.id]?.structured_payload||{};
        return `${src.bank||src.publisher||src.id}: ${healthReason(p.reason)}`;
      });
      healthEl.innerHTML=`
        <div class="sf-overview-title">Стан офіційних джерел</div>
        <div class="sf-health-grid">
          <div class="sf-health-box"><b>${sources.length}</b><span>офіційних джерел</span></div>
          <div class="sf-health-box"><b>${healthy}</b><span>читаються автоматично</span></div>
          <div class="sf-health-box"><b>${manual.length}</b><span>ручні / персональні</span></div>
          <div class="sf-health-box"><b>${issues.length}</b><span>потребують уваги</span></div>
        </div>
        ${issueNames.length?`<div class="sf-health-note">${issueNames.map(esc).join('<br>')}</div>`:'<div class="sf-health-note">Критичних проблем у джерелах, які мають читатися автоматично, немає.</div>'}`;
    }

    const now=new Date(); now.setHours(0,0,0,0);
    const entries=[];
    for(const src of sources){
      if(src.publish_policy==='manual_only'||src.data_mode==='dynamic'||src.data_mode==='personalized')continue;
      const p=state.latestSnapshots[src.id]?.structured_payload||{};
      const seen=new Set();
      const add=(name,date)=>{
        if(!date)return;
        const d=new Date(String(date)+'T00:00:00');
        if(Number.isNaN(d.getTime()))return;
        const key=`${date}|${name}`; if(seen.has(key))return; seen.add(key);
        entries.push({source_id:src.id,bank:src.bank||src.publisher||src.id,name:name||src.purpose||'Пропозиція',date:String(date),ts:d.getTime()});
      };
      add(src.purpose||'Джерело',p.valid_to);
      (Array.isArray(p.items)?p.items:[]).forEach(item=>add(item.name||item.category||item.partner||src.purpose,item.valid_to));
    }
    entries.sort((a,b)=>a.ts-b.ts);
    const roll=document.getElementById('sfScanRollover');
    if(roll){
      const shown=entries.filter((x,i,arr)=>arr.findIndex(y=>y.bank===x.bank&&y.name===x.name&&y.date===x.date)===i).slice(0,6);
      const rows=shown.map(x=>{
        const days=Math.ceil((x.ts-now.getTime())/86400000);
        const cls=days<0?'expired':days<=14?'soon':'';
        const suffix=days<0?`прострочено ${Math.abs(days)} дн.`:days===0?'закінчується сьогодні':`через ${days} дн.`;
        return `<div class="sf-rollover-item ${cls}"><div><b>${esc(x.bank)}</b><div>${esc(x.name)}</div></div><span>${esc(fmtShort(x.date))}<br>${esc(suffix)}</span></div>`;
      }).join('');
      roll.innerHTML=`<div class="sf-overview-title">Rollover / найближчі строки</div>${rows?`<div class="sf-rollover-list">${rows}</div>`:'<div class="sf-rollover-empty">У прочитаних офіційних джерелах немає визначених строків завершення.</div>'}`;
    }
  }

  function itemHtml(item){
    const date=(item.valid_from||item.valid_to)?`${fmtShort(item.valid_from)} → ${fmtShort(item.valid_to)}`:'';
    return `<div class="sf-item"><b>${esc(item.name||item.category||item.partner||item.kind||'Позиція')}</b><span class="rate">${item.rate_percent!=null?esc(item.rate_percent)+'%':'—'}</span><span class="dates">${esc(date)}</span></div>`;
  }

  function candidateHtml(c){
    const src=state.sources[c.source_id]||{};
    const p=c.structured_payload||{};
    const review=p.review_policy||{};
    const expiry=p.expiry_review||{};
    const health=p.source_health||{};
    const items=Array.isArray(p.items)?p.items:[];
    const shown=items.slice(0,8);
    const limits=p.limits||{};
    const affected=Array.isArray(c.affected_cells)?c.affected_cells:[];
    const reference=c.source_role==='reference'||review.reference_only;
    const classes=['sf-candidate',c.priority==='high'?'high':'',c.priority==='low'?'low':''].filter(Boolean).join(' ');
    const sourceLink=src.url?`<a class="sf-source-link" href="${esc(src.url)}" target="_blank" rel="noopener">Відкрити джерело ↗</a>`:'';
    const autoNote=reference
      ? 'Це лише сигнал із довідкового джерела. Дані з нього не публікуються — спочатку потрібне офіційне підтвердження.'
      : (review.manual_only?'Джерело динамічне або персоналізоване — тільки ручна перевірка.':'Офіційне джерело. Результат все одно потребує ручної перевірки перед зміною сайту.');
    return `
      <article class="${classes}" data-candidate-id="${esc(c.id)}">
        <div class="sf-candidate-top">
          <div>
            <div class="sf-candidate-title">${esc(c.bank||src.bank||src.publisher||'Довідкове джерело')} · ${esc(humanType(c))}</div>
            <div class="sf-candidate-meta">${esc(c.source_id||'')} · ${fmtDate(c.created_at)} · ${esc(statusLabel(c.status))}</div>
          </div>
          <div class="sf-chip-row">
            <span class="sf-chip ${c.priority==='high'?'high':''}">${esc(c.priority||'normal')}</span>
            ${c.candidate_type==='official_source_expired'?'<span class="sf-chip expired">expired</span>':''}
            ${c.candidate_type==='official_source_unreadable'?'<span class="sf-chip unavailable">source unavailable</span>':''}
            ${reference?'<span class="sf-chip reference">reference only</span>':''}
          </div>
        </div>
        <div class="sf-structured">
          <div class="sf-structured-grid">
            <div class="sf-field"><span>Період</span><b>${esc(fmtShort(p.valid_from))} → ${esc(fmtShort(p.valid_to))}</b></div>
            <div class="sf-field"><span>Ліміт</span><b>${limits.max_cashback_uah!=null?esc(limits.max_cashback_uah)+' грн':'—'}</b></div>
            <div class="sf-field"><span>Розібрано позицій</span><b>${items.length}</b></div>
            <div class="sf-field"><span>Комірок матриці</span><b>${affected.length}</b></div>
          </div>
          ${expiry.expired_on?`<div class="sf-evidence">Строк дії завершився <b>${esc(fmtShort(expiry.expired_on))}</b>. Сканер лише створив задачу на перевірку; автоматичного видалення немає.</div>`:''}
          ${c.candidate_type==='official_source_unreadable'?`<div class="sf-evidence"><b>Чому не читається:</b> ${esc(healthReason(health.reason||p.reason))}${health.response_bytes!=null?` · відповідь ${esc(health.response_bytes)} байт`:''}${health.transport?` · ${esc(health.transport)}`:''}. Дані з такого джерела не застосовуються автоматично.</div>`:''}
          ${shown.length?`<div class="sf-items">${shown.map(itemHtml).join('')}${items.length>shown.length?`<div class="sf-evidence">Ще ${items.length-shown.length} позицій приховано у короткому перегляді.</div>`:''}</div>`:''}
          ${c.excerpt?`<details><summary style="font-size:9px;cursor:pointer;color:#52665a">Фрагмент джерела</summary><div class="sf-evidence" style="margin-top:6px;white-space:pre-wrap">${esc(String(c.excerpt).slice(0,1800))}</div></details>`:''}
        </div>
        <div class="sf-note">${esc(autoNote)}</div>
        <div class="sf-candidate-actions">
          ${sourceLink}
          ${c.status==='pending'?'<button class="sf-scan-btn primary" data-review="reviewed">Позначити переглянутим</button><button class="sf-scan-btn danger" data-review="rejected">Відхилити</button>':''}
        </div>
      </article>`;
  }

  function render(){
    renderSummary();
    renderOverview();
    document.querySelectorAll('.sf-scan-tab').forEach(b=>b.classList.toggle('active',b.dataset.scanTab===state.tab));
    const body=document.getElementById('sfScanBody');
    if(!body)return;
    const list=(state.tab==='pending'?state.candidates.filter(x=>x.status==='pending'):state.candidates)
      .slice().sort((a,b)=>{
        const pa=a.priority==='high'?0:a.priority==='normal'?1:2;
        const pb=b.priority==='high'?0:b.priority==='normal'?1:2;
        return pa-pb||new Date(b.created_at)-new Date(a.created_at);
      });
    body.innerHTML=list.length?list.map(candidateHtml).join(''):'<div class="sf-scan-empty">Немає кандидатів у цьому списку.</div>';
  }

  async function load(){
    if(!isAdmin())return;
    const c=client(); if(!c)return;
    state.busy=true;
    try{
      const [{data:cands,error:ce},{data:sources,error:se},{data:runs,error:re},{data:snaps,error:sne}]=await Promise.all([
        c.from('scanner_candidates').select('*').order('created_at',{ascending:false}).limit(100),
        c.from('scanner_sources').select('id,bank,publisher,url,purpose,source_role,data_mode,publish_policy,enabled,last_checked_at,last_http_status,last_error'),
        c.from('scanner_runs').select('id,trigger_kind,started_at,finished_at,status,total_sources,changed_sources,failed_sources,candidates_created').order('started_at',{ascending:false}).limit(10),
        c.from('scanner_snapshots').select('source_id,fetched_at,http_status,title,text_excerpt,parser_version,structured_payload').order('fetched_at',{ascending:false}).limit(250)
      ]);
      if(ce)throw ce;if(se)throw se;if(re)throw re;if(sne)throw sne;
      state.candidates=cands||[];
      state.sources=Object.fromEntries((sources||[]).map(x=>[x.id,x]));
      state.runs=runs||[];
      state.snapshots=snaps||[];
      state.latestSnapshots={};
      for(const snap of state.snapshots){if(!state.latestSnapshots[snap.source_id])state.latestSnapshots[snap.source_id]=snap;}
      render();
    }catch(e){
      console.warn('SaveFlow scanner review load',e);
      document.getElementById('sfScanBody').innerHTML=`<div class="sf-scan-empty">Не вдалося завантажити дані сканера: ${esc(e?.message||e)}</div>`;
    }finally{state.busy=false}
  }

  async function review(id,status){
    if(!isAdmin()||!['reviewed','rejected'].includes(status))return;
    const c=client(), uid=session()?.user?.id; if(!c||!uid)return;
    const el=document.querySelector(`[data-candidate-id="${CSS.escape(id)}"]`);
    el?.querySelectorAll('button').forEach(b=>b.disabled=true);
    const {error}=await c.from('scanner_candidates').update({
      status,reviewed_by:uid,reviewed_at:new Date().toISOString(),
      review_note:status==='reviewed'?'Переглянуто в центрі перевірки SaveFlow.':'Відхилено в центрі перевірки SaveFlow.',
      updated_at:new Date().toISOString()
    }).eq('id',id);
    if(error){console.warn(error);alert('Не вдалося зберегти рішення: '+error.message)}
    await load();
  }

  async function runNow(){
    if(!isAdmin()||state.busy)return;
    const c=client();if(!c)return;
    state.busy=true;
    document.querySelectorAll('[data-scan-action="run"]').forEach(b=>b.disabled=true);
    try{
      const {data,error}=await c.functions.invoke('scan-sources',{body:{}});
      if(error)throw error;
      await new Promise(r=>setTimeout(r,500));
      await load();
      return data;
    }catch(e){
      console.warn('SaveFlow manual scan',e);
      alert('Не вдалося запустити сканер: '+(e?.message||e));
    }finally{
      state.busy=false;
      document.querySelectorAll('[data-scan-action="run"]').forEach(b=>b.disabled=false);
    }
  }

  function open(){
    if(!isAdmin())return;
    state.open=true;backdrop.classList.add('show');load();
  }
  function close(){state.open=false;backdrop.classList.remove('show')}

  toggle?.addEventListener('click',open);
  backdrop.addEventListener('click',(e)=>{
    if(e.target===backdrop)return close();
    const action=e.target.closest('[data-scan-action]')?.dataset.scanAction;
    if(action==='close')close();
    if(action==='refresh')load();
    if(action==='run')runNow();
    const tab=e.target.closest('[data-scan-tab]')?.dataset.scanTab;
    if(tab){state.tab=tab;render()}
    const btn=e.target.closest('[data-review]');
    if(btn){
      const card=btn.closest('[data-candidate-id]');
      if(card)review(card.dataset.candidateId,btn.dataset.review);
    }
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.open)close()});

  function syncVisibility(){
    if(toggle)toggle.style.display=isAdmin()?'inline-flex':'none';
    if(!isAdmin()&&state.open)close();
  }
  window.addEventListener('saveflow-auth-change',()=>setTimeout(syncVisibility,0));
  new MutationObserver(syncVisibility).observe(document.documentElement,{attributes:true,attributeFilter:['data-saveflow-role']});
  setTimeout(syncVisibility,700);
})();