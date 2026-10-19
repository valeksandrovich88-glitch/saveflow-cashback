(()=>{
  const KEYS={
    matrix:'saveflow.matrixOverrides.v1',
    partner:'saveflow.partnerCards.v1',
    promo:'saveflow.promoCards.v1',
    bonus:'saveflow.bonusCards.v1',
    bonusLinks:'saveflow.bonusReferralLinks.v1'
  };
  const nativeSet=Storage.prototype.setItem;
  const nativeRemove=Storage.prototype.removeItem;
  let applyingCloud=false;
  let pullInFlight=false;
  let adminHydrated=false;
  const queuedKinds=new Set();
  const timers=new Map();

  function cloud(){return window.saveflowCloud;}
  function client(){return cloud()?.client||null;}
  function isAdmin(){return cloud()?.profile?.role==='admin' && !!cloud()?.session?.user;}
  function userId(){return cloud()?.session?.user?.id||null;}
  function parse(key,fallback){try{const x=JSON.parse(localStorage.getItem(key)||'');return x??fallback;}catch(_){return fallback;}}
  function localDateKey(d=new Date()){
    return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  }
  function promoEnd(payload){
    const end=String(payload?.end||'').trim();
    return /^20\d{2}-\d{2}-\d{2}$/.test(end)?end:null;
  }
  function isPromoExpired(payload){
    const end=promoEnd(payload);
    return !!end && end<localDateKey();
  }
  function showExpiredPromos(){
    return isAdmin() && !!document.body?.classList.contains('site-editing');
  }
  function blankCards(){return {custom:{},overrides:{},hidden:[],expired:{}};}
  function cardStore(key){
    const x=parse(key,null);
    return {
      custom:x?.custom&&typeof x.custom==='object'?x.custom:{},
      overrides:x?.overrides&&typeof x.overrides==='object'?x.overrides:{},
      hidden:Array.isArray(x?.hidden)?x.hidden:[],
      expired:x?.expired&&typeof x.expired==='object'?x.expired:{}
    };
  }
  function nativeWrite(key,value){applyingCloud=true;try{nativeSet.call(localStorage,key,JSON.stringify(value));}finally{applyingCloud=false;}}
  function nativeDelete(key){applyingCloud=true;try{nativeRemove.call(localStorage,key);}finally{applyingCloud=false;}}

  function schedule(kind){
    if(applyingCloud||!isAdmin())return;
    if(!adminHydrated){
      queuedKinds.add(kind);
      pullGlobal().catch(console.warn);
      return;
    }
    clearTimeout(timers.get(kind));
    timers.set(kind,setTimeout(()=>{
      timers.delete(kind);
      if(kind==='matrix') syncMatrix().catch(console.warn);
      else syncBlock(kind).catch(console.warn);
    },250));
  }

  Storage.prototype.setItem=function(key,value){
    nativeSet.call(this,key,value);
    if(this!==localStorage||applyingCloud)return;
    if(key===KEYS.matrix)schedule('matrix');
    if(key===KEYS.partner)schedule('partner');
    if(key===KEYS.promo)schedule('promo');
    if(key===KEYS.bonus||key===KEYS.bonusLinks)schedule('bonus');
  };
  Storage.prototype.removeItem=function(key){
    nativeRemove.call(this,key);
    if(this!==localStorage||applyingCloud)return;
    if(key===KEYS.matrix)schedule('matrix');
    if(key===KEYS.partner)schedule('partner');
    if(key===KEYS.promo)schedule('promo');
    if(key===KEYS.bonus||key===KEYS.bonusLinks)schedule('bonus');
  };

  function stable(v){try{return JSON.stringify(v??null)}catch(_){return String(v)}}

  let lastSafetyBackupAt=0;
  let safetyBackupPromise=null;
  async function ensureSafetyBackup(reason){
    if(!isAdmin())return null;
    const now=Date.now();
    if(now-lastSafetyBackupAt<60000)return null;
    if(safetyBackupPromise)return safetyBackupPromise;
    const c=client();if(!c)return null;
    safetyBackupPromise=(async()=>{
      const label='Автобекап перед admin edit · '+String(reason||'global')+' · '+new Date().toLocaleString('uk-UA');
      const {data,error}=await c.rpc('admin_create_global_backup',{p_label:label});
      if(error)throw error;
      lastSafetyBackupAt=Date.now();
      return data;
    })();
    try{return await safetyBackupPromise}finally{safetyBackupPromise=null}
  }

  function blockSuspiciousWipe(kind,removedCount,totalCount,localMissing){
    const fullWipe=totalCount>0&&removedCount===totalCount;
    const largeWipe=removedCount>=10;
    const suspicious=(localMissing&&removedCount>0)||(fullWipe&&totalCount>=3)||largeWipe;
    if(!suspicious)return;
    const msg='SaveFlow safety: масове видалення '+String(kind||'даних')+' заблоковано. Хмарні дані не змінено; локальний стан буде відновлено з cloud.';
    try{alert(msg)}catch(_){}
    setTimeout(()=>window.saveflowGlobalCloud?.pull?.(),0);
    throw new Error(msg);
  }

  async function syncMatrix(){
    const c=client(), uid=userId(); if(!c||!uid||!isAdmin())return;
    const localMissing=localStorage.getItem(KEYS.matrix)==null;
    const ovs=parse(KEYS.matrix,{});
    const {data:existing,error:readErr}=await c.from('global_matrix_overrides').select('cell_key,payload');
    if(readErr)throw readErr;
    const existingCount=(existing||[]).length;
    const current=new Map((existing||[]).map(r=>[r.cell_key,r.payload||{}]));
    const now=new Date().toISOString();
    const rows=[];
    for(const [cell_key,payload] of Object.entries(ovs||{})){
      if(!current.has(cell_key)||stable(current.get(cell_key))!==stable(payload)){
        rows.push({cell_key,payload,updated_by:uid,updated_at:now});
      }
      current.delete(cell_key);
    }
    const removed=[...current.keys()];
    blockSuspiciousWipe('матриці',removed.length,existingCount,localMissing);
    if(rows.length||removed.length)await ensureSafetyBackup('матриця');
    if(rows.length){
      const {error}=await c.from('global_matrix_overrides').upsert(rows,{onConflict:'cell_key'});
      if(error)throw error;
    }
    if(removed.length){
      const {error}=await c.from('global_matrix_overrides').delete().in('cell_key',removed);
      if(error)throw error;
    }
  }

  function blockRows(block){
    const key=KEYS[block];
    const s=cardStore(key);
    const uid=userId();
    const now=new Date().toISOString();
    const rows=[];
    Object.entries(s.custom).forEach(([base_id,payload])=>rows.push({block,base_id,payload:{...payload,__kind:'custom'},hidden:false,updated_by:uid,updated_at:now}));
    Object.entries(s.overrides).forEach(([base_id,payload])=>rows.push({block,base_id,payload:{...payload,__kind:'override'},hidden:false,source_url:payload?.source||null,updated_by:uid,updated_at:now}));
    s.hidden.forEach(base_id=>rows.push({block,base_id,payload:{__kind:'hidden'},hidden:true,updated_by:uid,updated_at:now}));
    if(block==='promo'){
      const used=new Set([...Object.keys(s.custom),...Object.keys(s.overrides),...s.hidden]);
      Object.entries(s.expired||{}).forEach(([base_id,entry])=>{
        if(used.has(base_id))return;
        const kind=entry?.kind==='override'?'override':'custom';
        const payload=entry?.payload&&typeof entry.payload==='object'?entry.payload:{};
        rows.push({
          block,base_id,payload:{...payload,__kind:kind},hidden:false,
          source_url:payload?.source||null,updated_by:uid,updated_at:now
        });
      });
    }
    if(block==='bonus'){
      const refs=parse(KEYS.bonusLinks,{});
      Object.entries(refs||{}).forEach(([id,ref])=>rows.push({block,base_id:`__ref__:${id}`,payload:{__kind:'referral',...(ref||{})},hidden:false,updated_by:uid,updated_at:now}));
    }
    return rows;
  }

  async function syncBlock(block){
    const c=client(); if(!c||!isAdmin())return;
    const localMissing=localStorage.getItem(KEYS[block])==null;
    const desired=blockRows(block);
    const {data:existing,error:readErr}=await c.from('global_content_items').select('block,base_id,payload,hidden,source_url').eq('block',block);
    if(readErr)throw readErr;
    const existingCount=(existing||[]).length;
    const current=new Map((existing||[]).map(r=>[r.base_id,r]));
    const rows=[];
    for(const row of desired){
      const prev=current.get(row.base_id);
      const changed=!prev
        || stable(prev.payload)!==stable(row.payload)
        || Boolean(prev.hidden)!==Boolean(row.hidden)
        || (prev.source_url||null)!==(row.source_url||null);
      if(changed)rows.push(row);
      current.delete(row.base_id);
    }
    const removed=[...current.keys()];
    blockSuspiciousWipe(block,removed.length,existingCount,localMissing);
    if(rows.length||removed.length)await ensureSafetyBackup(block);
    if(rows.length){
      const {error}=await c.from('global_content_items').upsert(rows,{onConflict:'block,base_id'});
      if(error)throw error;
    }
    if(removed.length){
      const {error}=await c.from('global_content_items').delete().eq('block',block).in('base_id',removed);
      if(error)throw error;
    }
  }

  function localHasGlobal(){
    const m=parse(KEYS.matrix,{});
    if(m&&Object.keys(m).length)return true;
    for(const k of [KEYS.partner,KEYS.promo,KEYS.bonus]){
      const s=cardStore(k);if(Object.keys(s.custom).length||Object.keys(s.overrides).length||s.hidden.length||Object.keys(s.expired||{}).length)return true;
    }
    const refs=parse(KEYS.bonusLinks,{});return !!Object.keys(refs||{}).length;
  }

  async function bootstrapLocalToCloud(){
    await syncMatrix();
    await syncBlock('partner');
    await syncBlock('promo');
    await syncBlock('bonus');
  }

  function reconstruct(rows,block){
    const s=blankCards();
    const refs={};
    (rows||[]).filter(r=>r.block===block).forEach(r=>{
      const p=r.payload||{};
      const kind=p.__kind||(r.hidden?'hidden':'override');
      if(kind==='referral'){
        const id=String(r.base_id||'').replace(/^__ref__:/,'');
        if(id)refs[id]={url:p.url||'',label:p.label||'Отримати бонус',updatedAt:p.updatedAt||r.updated_at};
      }else if(kind==='hidden'||r.hidden){
        if(r.base_id&&!String(r.base_id).startsWith('__ref__:'))s.hidden.push(r.base_id);
      }else if(block==='promo'&&!showExpiredPromos()&&isPromoExpired(p)){
        const q={...p};delete q.__kind;
        s.expired[r.base_id]={kind:kind==='custom'?'custom':'override',payload:q};
      }else if(kind==='custom'){
        const q={...p};delete q.__kind;s.custom[r.base_id]=q;
      }else{
        const q={...p};delete q.__kind;s.overrides[r.base_id]=q;
      }
    });
    return {store:s,refs};
  }

  async function pullGlobal(){
    if(pullInFlight)return;
    const c=client();if(!c)return;
    pullInFlight=true;
    try{
      const [{data:m,error:me},{data:items,error:ce}]=await Promise.all([
        c.from('global_matrix_overrides').select('cell_key,payload,updated_at'),
        c.from('global_content_items').select('block,base_id,payload,hidden,source_url,updated_at')
      ]);
      if(me)throw me;if(ce)throw ce;
      const hasCloud=(m?.length||0)+(items?.length||0)>0;
      if(!hasCloud){
        adminHydrated=false;
        if(isAdmin())console.warn('SaveFlow safety: cloud global state is empty; local bootstrap is disabled. Restore from a server backup or approved import instead.');
        return;
      }

      const matrix={};(m||[]).forEach(r=>matrix[r.cell_key]=r.payload||{});
      nativeWrite(KEYS.matrix,matrix);
      for(const block of ['partner','promo','bonus']){
        const rebuilt=reconstruct(items||[],block);
        nativeWrite(KEYS[block],rebuilt.store);
        if(block==='bonus')nativeWrite(KEYS.bonusLinks,rebuilt.refs);
      }
      window.saveflowApplyMatrixOverrides?.();
      window.saveflowMatrixApplyOverrides?.();
      window.saveflowRenderPartners?.();
      window.saveflowRenderPromos?.();
      window.saveflowRenderBonuses?.();
      adminHydrated=isAdmin();
      if(adminHydrated&&queuedKinds.size){
        const pending=[...queuedKinds];queuedKinds.clear();
        pending.forEach(kind=>schedule(kind));
      }
    }catch(e){console.warn('SaveFlow global cloud sync',e);}
    finally{pullInFlight=false;}
  }

  window.saveflowGlobalCloud={
    pull:pullGlobal,syncMatrix,syncBlock,bootstrap:bootstrapLocalToCloud,
    promoRollover:{
      isExpired:isPromoExpired,
      today:()=>localDateKey(),
      expiredCount:()=>Object.keys(cardStore(KEYS.promo).expired||{}).length
    }
  };

  async function flushPendingAdminSync(){
    if(!isAdmin()||!timers.size)return;
    const kinds=[...timers.keys()];
    kinds.forEach(kind=>{clearTimeout(timers.get(kind));timers.delete(kind);});
    for(const kind of kinds){
      if(kind==='matrix')await syncMatrix();
      else await syncBlock(kind);
    }
  }

  let lastExpiredVisibility=showExpiredPromos();
  const editModeObserver=new MutationObserver(()=>{
    const next=showExpiredPromos();
    if(next===lastExpiredVisibility)return;
    const wasEditing=lastExpiredVisibility;
    lastExpiredVisibility=next;
    (async()=>{
      try{
        // Leaving Admin mode must never pull stale cloud state over an edit that
        // is still waiting in the debounce queue.
        if(wasEditing&&!next)await flushPendingAdminSync();
      }catch(e){
        console.warn('SaveFlow admin-exit sync flush',e);
      }
      await pullGlobal();
      window.saveflowApplyMatrixOverrides?.();
      window.saveflowMatrixApplyOverrides?.();
    })().catch(console.warn);
  });
  if(document.body) editModeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});

  let rolloverTimer=null;
  function scheduleMidnightRollover(){
    clearTimeout(rolloverTimer);
    const now=new Date();
    const next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,2,0);
    rolloverTimer=setTimeout(()=>{
      pullGlobal().catch?.(console.warn);
      scheduleMidnightRollover();
    },Math.max(1000,next.getTime()-now.getTime()));
  }

  let initialPullTimer=null;
  function ensureGlobalHydrated(attempt=0){
    clearTimeout(initialPullTimer);
    const c=client();
    if(c){
      Promise.resolve(pullGlobal()).catch(console.warn);
      return;
    }
    if(attempt>=60){
      console.warn('SaveFlow global cloud: Supabase client was not ready after retries.');
      return;
    }
    initialPullTimer=setTimeout(()=>ensureGlobalHydrated(attempt+1),250);
  }

  window.addEventListener('saveflow-auth-change',()=>{
    adminHydrated=false;
    queuedKinds.clear();
    ensureGlobalHydrated(0);
  });
  ensureGlobalHydrated(0);
  scheduleMidnightRollover();


  function tidyCloudLabels(){
    const edits=[
      ['matrixEditStatus',[/локальних змін:/g,'змін:'],[/Правки можна внести прямо в таблицю/g,'Глобальні правки зберігаються у хмарі']],
      ['partnerEditStatus',[/Локальних змін партнерів:/g,'Змін партнерів:'],[/твої локальні правки/g,'хмарні правки']],
      ['promoEditStatus',[/Локальних змін спецпропозицій:/g,'Змін спецпропозицій:'],[/твої локальні правки/g,'хмарні правки']],
      ['bonusEditStatus',[/локальних змін:/g,'змін:'],[/Збережено локальних змін:/g,'Збережено змін:']]
    ];
    edits.forEach(([id,...rules])=>{
      const el=document.getElementById(id);if(!el)return;
      let t=el.textContent||'';rules.forEach(([a,b])=>t=t.replace(a,b));if(t!==el.textContent)el.textContent=t;
    });
    const contentCtx=document.getElementById('contentEditorContext');
    if(contentCtx) contentCtx.textContent=(contentCtx.textContent||'').replace('зміна буде локальною','буде створено глобальну правку');
    const bonusCtx=document.getElementById('bonusEditorContext');
    if(bonusCtx) bonusCtx.textContent=(bonusCtx.textContent||'').replace('буде створено локальну правку','буде створено глобальну правку');
  }
  const cloudLabelIds=['matrixEditStatus','partnerEditStatus','promoEditStatus','bonusEditStatus','contentEditorContext','bonusEditorContext'];
  cloudLabelIds.forEach(id=>{const el=document.getElementById(id);if(el)new MutationObserver(tidyCloudLabels).observe(el,{childList:true,subtree:true,characterData:true});});
  tidyCloudLabels();
})();
