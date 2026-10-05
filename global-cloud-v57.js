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
  const timers=new Map();

  function cloud(){return window.saveflowCloud;}
  function client(){return cloud()?.client||null;}
  function isAdmin(){return cloud()?.profile?.role==='admin' && !!cloud()?.session?.user;}
  function userId(){return cloud()?.session?.user?.id||null;}
  function parse(key,fallback){try{const x=JSON.parse(localStorage.getItem(key)||'');return x??fallback;}catch(_){return fallback;}}
  function blankCards(){return {custom:{},overrides:{},hidden:[]};}
  function cardStore(key){const x=parse(key,null);return {custom:x?.custom&&typeof x.custom==='object'?x.custom:{},overrides:x?.overrides&&typeof x.overrides==='object'?x.overrides:{},hidden:Array.isArray(x?.hidden)?x.hidden:[]};}
  function nativeWrite(key,value){applyingCloud=true;try{nativeSet.call(localStorage,key,JSON.stringify(value));}finally{applyingCloud=false;}}
  function nativeDelete(key){applyingCloud=true;try{nativeRemove.call(localStorage,key);}finally{applyingCloud=false;}}

  function schedule(kind){
    if(applyingCloud||!isAdmin())return;
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

  async function syncMatrix(){
    const c=client(), uid=userId(); if(!c||!uid||!isAdmin())return;
    const ovs=parse(KEYS.matrix,{});
    const {error:delErr}=await c.from('global_matrix_overrides').delete().neq('cell_key','__never__');
    if(delErr)throw delErr;
    const rows=Object.entries(ovs||{}).map(([cell_key,payload])=>({cell_key,payload,updated_by:uid,updated_at:new Date().toISOString()}));
    if(rows.length){const {error}=await c.from('global_matrix_overrides').upsert(rows,{onConflict:'cell_key'});if(error)throw error;}
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
    if(block==='bonus'){
      const refs=parse(KEYS.bonusLinks,{});
      Object.entries(refs||{}).forEach(([id,ref])=>rows.push({block,base_id:`__ref__:${id}`,payload:{__kind:'referral',...(ref||{})},hidden:false,updated_by:uid,updated_at:now}));
    }
    return rows;
  }

  async function syncBlock(block){
    const c=client(); if(!c||!isAdmin())return;
    const {error:delErr}=await c.from('global_content_items').delete().eq('block',block);
    if(delErr)throw delErr;
    const rows=blockRows(block);
    if(rows.length){const {error}=await c.from('global_content_items').upsert(rows,{onConflict:'block,base_id'});if(error)throw error;}
  }

  function localHasGlobal(){
    const m=parse(KEYS.matrix,{});
    if(m&&Object.keys(m).length)return true;
    for(const k of [KEYS.partner,KEYS.promo,KEYS.bonus]){
      const s=cardStore(k);if(Object.keys(s.custom).length||Object.keys(s.overrides).length||s.hidden.length)return true;
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
      }else if(kind==='custom'){
        const q={...p};delete q.__kind;s.custom[r.base_id]=q;
      }else if(kind==='hidden'||r.hidden){
        if(r.base_id&&!String(r.base_id).startsWith('__ref__:'))s.hidden.push(r.base_id);
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
      if(!hasCloud&&isAdmin()&&localHasGlobal()){
        await bootstrapLocalToCloud();
        return;
      }
      if(!hasCloud)return;

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
    }catch(e){console.warn('SaveFlow global cloud sync',e);}
    finally{pullInFlight=false;}
  }

  window.saveflowGlobalCloud={pull:pullGlobal,syncMatrix,syncBlock,bootstrap:bootstrapLocalToCloud};

  window.addEventListener('saveflow-auth-change',()=>setTimeout(pullGlobal,0));
  setTimeout(pullGlobal,600);


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
