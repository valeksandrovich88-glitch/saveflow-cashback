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
    #scannerReviewToggle{display:none!important}
    body.site-editing #scannerReviewToggle{display:inline-flex!important}
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
    .sf-evidence{font-size:9px;color:#66746a;background:#f1f5f1;padding:7px 8px;border-radius:9px;line-height:1.45}.sf-partner-audit{display:grid;gap:7px;padding:9px;border-radius:11px;background:#f2f6f2;border:1px solid #d8e3da}.sf-partner-audit-summary{display:flex;gap:12px;flex-wrap:wrap;font-size:9px;color:#53665a}.sf-partner-audit-summary b{font-size:11px;color:#223c2b}.sf-partner-audit-cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.sf-partner-audit-col{padding:8px;border-radius:9px;background:white;border:1px solid #dce5de}.sf-partner-audit-col.added{border-color:#bad8c0;background:#f2faf3}.sf-partner-audit-col.missing{border-color:#ead1b5;background:#fff9f1}.sf-partner-audit-col.changed{border-color:#c9cfea;background:#f4f5fc}.sf-partner-audit-title{font:800 9px/1.2 system-ui;margin-bottom:6px}.sf-partner-audit-row{display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-top:1px solid rgba(80,100,85,.08);font-size:9px}.sf-partner-audit-row:first-of-type{border-top:0}.sf-partner-audit-row span:last-child{font-weight:800;white-space:nowrap}.sf-affected{display:grid;gap:5px}.sf-affected-title{font:800 9px/1.2 system-ui;color:#4f6255}.sf-affected-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px 8px;border-radius:9px;background:#fff8e9;border:1px solid #eadcc1;font-size:9px}.sf-affected-row b{font-size:9px}.sf-affected-value{font-weight:800;color:#7b5521;white-space:nowrap}.sf-affected-verdict{grid-column:1/-1;font-size:8px;line-height:1.35;color:#69766d}.sf-affected-row.match{background:#eaf6ed;border-color:#c5dec9}.sf-affected-row.match .sf-affected-verdict{color:#2d6941}.sf-affected-row.pool{background:#fff8e9}.sf-affected-row.pool .sf-affected-verdict{color:#7b5b2c}.sf-affected-row.conflict{background:#fae7e7;border-color:#e7c1c1}.sf-affected-row.conflict .sf-affected-verdict{color:#8b3636}.sf-affected-row.unknown{background:#f1f4f1;border-color:#d9e0da}.sf-affected-more{font-size:8px;color:#748079;padding-left:2px}.sf-category-pool{display:flex;gap:5px;flex-wrap:wrap;padding:8px;border-radius:10px;background:#edf4ef}.sf-category-pool-title{width:100%;font:800 9px/1.2 system-ui;color:#4d6254;margin-bottom:1px}.sf-category-pill{display:inline-flex;padding:4px 7px;border-radius:999px;background:#dfece2;color:#31523c;font:750 8px/1 system-ui}
    .sf-candidate-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
    .sf-source-link{color:#245f40;text-decoration:none;font-weight:750}.sf-source-link:hover{text-decoration:underline}
    .sf-note{margin-top:8px;font-size:9px;color:#6b796f;line-height:1.45}
    .sf-runline{padding:0 18px 12px;color:#607065;font-size:9px}
    @media(max-width:760px){
      .sf-scan-review-backdrop{padding:8px}.sf-scan-review{max-height:95vh;border-radius:14px}.sf-scan-head{padding:14px;flex-direction:column}.sf-scan-actions{justify-content:flex-start}
      .sf-scan-summary{grid-template-columns:repeat(2,minmax(0,1fr));padding:10px 14px}.sf-scan-overview{grid-template-columns:1fr;padding:0 14px 10px}.sf-scan-tabs{padding:0 14px 10px}.sf-scan-body{padding:0 14px 14px}
      .sf-structured-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sf-partner-audit-cols{grid-template-columns:1fr}.sf-item{grid-template-columns:1fr auto}.sf-item .dates{grid-column:1/-1}
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
    const legacy=document.getElementById('scannerToggle');
    if(legacy){
      toggle=legacy.cloneNode(true);
      toggle.id='scannerReviewToggle';
      toggle.type='button';
      toggle.className=legacy.className||'matrix-btn';
      toggle.textContent='Сканер';
      toggle.title='Центр перевірки сканера';
      legacy.replaceWith(toggle);
    }else{
      toggle=document.createElement('button');
      toggle.id='scannerReviewToggle';
      toggle.type='button';
      toggle.className='matrix-btn';
      toggle.textContent='Сканер';
      toggle.title='Центр перевірки сканера';
      const actions=document.querySelector('#siteAdminBar .site-admin-actions')||document.querySelector('#siteAdminBar');
      actions?.prepend(toggle);
    }
  }
  document.querySelectorAll('#siteAdminBar button').forEach(btn=>{
    if(btn!==toggle && String(btn.textContent||'').trim()==='Сканер') btn.remove();
  });

  const humanType=(c)=>{
    if(c.candidate_type==='official_source_expired') return 'Офіційна пропозиція завершилася';
    if(c.candidate_type==='official_source_unreadable') return 'Офіційне джерело недоступне сканеру';
    if(c.candidate_type==='reference_without_official_source') return 'Немає офіційного джерела для перевірки';
    if(c.candidate_type==='official_monthly_source_stale') return 'Місячна сторінка не оновлена';
    if(c.candidate_type==='official_monthly_source_inconsistent') return 'Місячна сторінка містить суперечливі періоди';
    if(c.candidate_type==='partner_roster_changed') return 'Змінився список партнерів';
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
  const catNorm=(s)=>String(s||'').toLowerCase().replace(/[’'\`]/g,'').replace(/[^a-zа-яіїєґ0-9]+/giu,' ').trim();
  const catAliases=(s)=>{
    const n=catNorm(s);
    if(/аптек|здоров/.test(n)) return ['аптек','медицин'];
    if(/книг|канц/.test(n)) return ['книг'];
    if(/кіно|театр/.test(n)) return ['кіно'];
    if(/азс/.test(n)) return ['азс','авто'];
    if(/кафе|ресторан/.test(n)) return ['кафе','ресторан'];
    if(/краса/.test(n)) return ['краса','космет','бюті','салон'];
    if(/одяг|взут/.test(n)) return ['одяг','взут'];
    if(/розваг/.test(n)) return ['розваг'];
    if(/спорт|фітнес/.test(n)) return ['спорт','фітнес'];
    if(/транспорт/.test(n)) return ['транспорт'];
    if(/дитяч/.test(n)) return ['дитяч'];
    if(/дім|ремонт/.test(n)) return ['дім','ремонт'];
    if(/таксі/.test(n)) return ['таксі'];
    if(/тварин/.test(n)) return ['тварин','зоомаг','ветерин'];
    if(/квіт/.test(n)) return ['квіт'];
    return n.split(' ').filter(x=>x.length>=4).slice(0,3);
  };
  const numberFromValue=(s)=>{
    const m=String(s||'').replace(',','.').match(/(\d+(?:\.\d+)?)\s*%/);
    return m?Number(m[1]):null;
  };
  const percentValues=(s)=>[...String(s||'').replace(/,/g,'.').matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map(m=>Number(m[1]));
  const samePercents=(a,b)=>{
    const x=percentValues(a),y=percentValues(b);
    if(!x.length||!y.length||x.length!==y.length)return false;
    return x.every((v,i)=>Math.abs(v-y[i])<0.0001);
  };
  function assessAffected(cell,items,pool){
    const aliases=catAliases(cell.category||'');
    const textOf=(item)=>catNorm([item.category,item.name,...(Array.isArray(item.evidence)?item.evidence:[])].filter(Boolean).join(' '));
    const item=(items||[]).find(it=>aliases.some(a=>a&&textOf(it).includes(catNorm(a))));
    const poolHit=(pool||[]).find(name=>{
      const pn=catNorm(name);
      return aliases.some(a=>a&&(pn.includes(catNorm(a))||catNorm(a).includes(pn)));
    });
    const current=numberFromValue(cell.current_value);
    const official=item?.rate_percent!=null?Number(item.rate_percent):null;
    const officialValue=item?.current_value||item?.rate_text||'';
    if(item&&officialValue&&cell.current_value&&percentValues(officialValue).length&&percentValues(cell.current_value).length){
      if(samePercents(officialValue,cell.current_value))return {cls:'match',label:`✓ Офіційно підтверджено: ${officialValue}`};
      return {cls:'conflict',label:`! Офіційне джерело показує ${officialValue}, у матриці зараз ${cell.current_value}`};
    }
    if(item&&official!=null&&current!=null){
      if(Math.abs(official-current)<0.0001)return {cls:'match',label:`✓ Офіційно підтверджено: ${official}%`};
      return {cls:'conflict',label:`! Офіційне джерело показує ${official}%, у матриці зараз ${current}%`};
    }
    if(poolHit)return {cls:'pool',label:'~ Категорія є в офіційних правилах, але поточний % треба звірити окремо'};
    if(item)return {cls:'pool',label:'~ Категорія знайдена в офіційному джерелі, але ставка не зіставлена однозначно'};
    return {cls:'unknown',label:'? Поточна ставка ще не підтверджена цим офіційним джерелом'};
  }

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
    const shownRate=item.current_value||item.rate_text||(item.rate_percent!=null?String(item.rate_percent)+'%':'—');
    return `<div class="sf-item"><b>${esc(item.name||item.category||item.partner||item.kind||'Позиція')}</b><span class="rate">${esc(shownRate)}</span><span class="dates">${esc(date)}</span></div>`;
  }

  function candidateHtml(c){
    const src=state.sources[c.source_id]||{};
    const p=c.structured_payload||{};
    const review=p.review_policy||{};
    const expiry=p.expiry_review||{};
    const monthly=p.monthly_source_review||{};
    const coverageGap=p.coverage_gap||{};
    const health=p.source_health||{};
    const partnerAudit=p.partner_audit||{};
    const partnerAdded=Array.isArray(partnerAudit.added_partners)?partnerAudit.added_partners:[];
    const partnerMissing=Array.isArray(partnerAudit.missing_partners)?partnerAudit.missing_partners:[];
    const partnerChanged=Array.isArray(partnerAudit.changed_rates)?partnerAudit.changed_rates:[];
    const partnerRosterComplete=partnerAudit.roster_complete!==false;
    const partnerRosterNote=partnerAudit.roster_note||"";
    const categoryPool=Array.isArray(p.category_pool)?p.category_pool:[];
    const items=Array.isArray(p.items)?p.items:[];
    const shown=items.slice(0,8);
    const limits=p.limits||{};
    const affected=Array.isArray(c.affected_cells)?c.affected_cells:[];
    const affectedShown=affected.slice(0,8);
    const allAffectedAssessed=affected.map(x=>({cell:x,verdict:assessAffected(x,items,categoryPool)}));
    const affectedAssessed=allAffectedAssessed.slice(0,8);
    const exactMatchCount=allAffectedAssessed.filter(x=>x.verdict.cls==='match').length;
    const reference=c.source_role==='reference'||review.reference_only;
    const classes=['sf-candidate',c.priority==='high'?'high':'',c.priority==='low'?'low':''].filter(Boolean).join(' ');
    const effectiveSourceUrl=p.resolved_source_url||src.url||'';
    const sourceLink=effectiveSourceUrl?`<a class="sf-source-link" href="${esc(effectiveSourceUrl)}" target="_blank" rel="noopener">Відкрити джерело ↗</a>`:'';
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
            ${c.candidate_type==='official_monthly_source_stale'?'<span class="sf-chip expired">stale month</span>':''}
            ${c.candidate_type==='official_monthly_source_inconsistent'?'<span class="sf-chip unavailable">month conflict</span>':''}
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
          ${c.candidate_type==='reference_without_official_source'?`<div class="sf-evidence"><b>Проблема покриття:</b> у матриці є ${esc(coverageGap.affected_count??affected.length)} комірок з довідкових джерел, але для цього банку не підключено первинне офіційне джерело. Ці значення не повинні вважатися підтвердженими банком.</div>`:''}
          ${(c.candidate_type==='official_monthly_source_stale'||c.candidate_type==='official_monthly_source_inconsistent')?`<div class="sf-evidence"><b>Поточний період:</b> ${esc(monthly.current_period||'—')} · <b>на сторінці:</b> ${esc((monthly.detected_periods||[]).join(', ')||'—')}<br>${(monthly.evidence||[]).map(esc).join('<br>')}<br>Такі дані не застосовуються автоматично, доки офіційна сторінка не буде узгоджена з поточним місяцем.</div>`:''}
          ${c.candidate_type==='partner_roster_changed'?`<div class="sf-partner-audit">
            <div class="sf-partner-audit-summary">
              <span>Офіційно: <b>${esc(partnerAudit.official_count??'—')}</b></span>
              <span>У SaveFlow: <b>${esc(partnerAudit.indexed_count??'—')}</b></span>
              <span>Збіглося: <b>${esc(partnerAudit.matched_count??'—')}</b></span>
              <span>Покриття: <b>${partnerRosterComplete?'повне':'часткове'}</b></span>
            </div>
            <div class="sf-partner-audit-cols">
              <div class="sf-partner-audit-col added"><div class="sf-partner-audit-title">Нові партнери · +${partnerAdded.length}</div>${partnerAdded.length?partnerAdded.map(x=>`<div class="sf-partner-audit-row"><span>${esc(x)}</span><span>новий</span></div>`).join(''):'<div class="sf-evidence">Нових партнерів немає.</div>'}</div>
              <div class="sf-partner-audit-col missing"><div class="sf-partner-audit-title">Ймовірно вибули · −${partnerMissing.length}</div>${partnerMissing.length?partnerMissing.map(x=>`<div class="sf-partner-audit-row"><span>${esc(x.name||x)}</span><span>${esc(x.current_value||'—')}</span></div>`).join(''):'<div class="sf-evidence">Нічого не вибуло.</div>'}</div>
              <div class="sf-partner-audit-col changed"><div class="sf-partner-audit-title">Змінилась ставка · Δ${partnerChanged.length}</div>${partnerChanged.length?partnerChanged.map(x=>`<div class="sf-partner-audit-row"><span>${esc(x.name||x)}</span><span>${esc(x.old_value||'—')} → ${esc(x.new_value||'—')}</span></div>`).join(''):'<div class="sf-evidence">Змін ставок немає.</div>'}</div>
            </div>
            <div class="sf-evidence">${partnerRosterComplete?'Сканер нічого не видаляє автоматично. Для нових партнерів без відкритої ставки картку не публікуємо, доки не підтвердимо %.':'Це частковий офіційний roster: сканер може додавати або звіряти підтверджених партнерів, але не трактує відсутніх як таких, що вибули.'}${partnerRosterNote?'<br>'+esc(partnerRosterNote):''}</div>
          </div>`:''}
          ${affectedShown.length?`<div class="sf-affected"><div class="sf-affected-title">Reference-комірки, які треба звірити з офіційним джерелом</div>${affectedAssessed.map(({cell:x,verdict})=>`<div class="sf-affected-row ${esc(verdict.cls)}"><b>${esc(x.category||x.cell_key||'Комірка')}</b><span class="sf-affected-value">${esc(x.current_value||'—')}</span><div class="sf-affected-verdict">${esc(verdict.label)}</div></div>`).join('')}${affected.length>affectedShown.length?`<div class="sf-affected-more">Ще ${affected.length-affectedShown.length} комірок не показано у короткому перегляді.</div>`:''}</div>`:''}
          ${categoryPool.length?`<div class="sf-category-pool"><div class="sf-category-pool-title">Офіційний пул категорій · ставки можуть змінюватися щомісяця</div>${categoryPool.map(x=>`<span class="sf-category-pill">${esc(x)}</span>`).join('')}</div>`:''}
          ${c.candidate_type!=='partner_roster_changed'&&shown.length?`<div class="sf-items">${shown.map(itemHtml).join('')}${items.length>shown.length?`<div class="sf-evidence">Ще ${items.length-shown.length} позицій приховано у короткому перегляді.</div>`:''}</div>`:''}
          ${c.excerpt?`<details><summary style="font-size:9px;cursor:pointer;color:#52665a">Фрагмент джерела</summary><div class="sf-evidence" style="margin-top:6px;white-space:pre-wrap">${esc(String(c.excerpt).slice(0,1800))}</div></details>`:''}
        </div>
        <div class="sf-note">${esc(autoNote)}</div>
        <div class="sf-candidate-actions">
          ${sourceLink}
          ${c.status==='pending'&&c.candidate_type==='reference_to_official_review'&&exactMatchCount?`<button class="sf-scan-btn primary" data-confirm-official>${exactMatchCount===1?'Підтвердити 1 збіг офіційно':`Підтвердити ${exactMatchCount} збігів офіційно`}</button>`:''}
          ${c.status==='pending'?'<button class="sf-scan-btn" data-review="reviewed">Позначити переглянутим</button><button class="sf-scan-btn danger" data-review="rejected">Відхилити</button>':''}
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

  async function confirmOfficialMatches(id){
    if(!isAdmin())return;
    const c=client(), uid=session()?.user?.id;
    if(!c||!uid)return;
    const candidate=state.candidates.find(x=>String(x.id)===String(id));
    if(!candidate||candidate.status!=='pending'||candidate.candidate_type!=='reference_to_official_review')return;
    const src=state.sources[candidate.source_id]||{};
    if(!src.url)return;
    const p=candidate.structured_payload||{};
    const items=Array.isArray(p.items)?p.items:[];
    const pool=Array.isArray(p.category_pool)?p.category_pool:[];
    const affected=Array.isArray(candidate.affected_cells)?candidate.affected_cells:[];
    const assessed=affected.map(cell=>({cell,verdict:assessAffected(cell,items,pool)}));
    const matches=assessed.filter(x=>x.verdict.cls==='match').map(x=>x.cell);
    if(!matches.length){alert('Немає точних збігів, які можна безпечно підтвердити.');return;}
    const card=document.querySelector(`[data-candidate-id="${CSS.escape(String(id))}"]`);
    card?.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{
      const today=new Date().toISOString().slice(0,10);
      for(const cell of matches){
        const {data,error}=await c.from('scanner_matrix_index')
          .update({source_tier:'official',source_url:src.url,checked_on:today,updated_at:new Date().toISOString()})
          .eq('cell_key',cell.cell_key)
          .eq('source_tier','reference')
          .eq('current_value',cell.current_value)
          .select('cell_key');
        if(error)throw error;
        if(!data?.length)throw new Error(`Комірка "${cell.cell_key}" змінилася після скану. Онови дані й перевір ще раз.`);
      }
      const matchKeys=new Set(matches.map(x=>x.cell_key));
      const unresolved=affected.filter(x=>!matchKeys.has(x.cell_key));
      const note=`Офіційно підтверджено без зміни значень: ${matches.length} комірок. Джерело: ${src.url}`;
      const patch=unresolved.length
        ? {affected_cells:unresolved,review_note:note,updated_at:new Date().toISOString()}
        : {affected_cells:[],status:'reviewed',reviewed_by:uid,reviewed_at:new Date().toISOString(),review_note:note,updated_at:new Date().toISOString()};
      const {error:ce}=await c.from('scanner_candidates').update(patch).eq('id',id);
      if(ce)throw ce;
      await load();
    }catch(e){
      console.warn('SaveFlow confirm official evidence',e);
      alert('Не вдалося підтвердити офіційне джерело: '+(e?.message||e));
      card?.querySelectorAll('button').forEach(b=>b.disabled=false);
    }
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
    if(!isAdminMode())return;
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
    const confirmBtn=e.target.closest('[data-confirm-official]');
    if(confirmBtn){
      const card=confirmBtn.closest('[data-candidate-id]');
      if(card)confirmOfficialMatches(card.dataset.candidateId);
    }
    const btn=e.target.closest('[data-review]');
    if(btn){
      const card=btn.closest('[data-candidate-id]');
      if(card)review(card.dataset.candidateId,btn.dataset.review);
    }
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.open)close()});

  function isAdminMode(){
    return isAdmin() && document.body.classList.contains('site-editing');
  }
  function syncVisibility(){
    if(toggle)toggle.style.display=isAdminMode()?'inline-flex':'none';
    if(!isAdminMode()&&state.open)close();
    document.querySelectorAll('#siteAdminBar button').forEach(btn=>{
      if(btn!==toggle && String(btn.textContent||'').trim()==='Сканер') btn.remove();
    });
  }
  window.addEventListener('saveflow-auth-change',()=>setTimeout(syncVisibility,0));
  new MutationObserver(syncVisibility).observe(document.documentElement,{attributes:true,attributeFilter:['data-saveflow-role']});
  new MutationObserver(syncVisibility).observe(document.body,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
  setTimeout(syncVisibility,700);
})();