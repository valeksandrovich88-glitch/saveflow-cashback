(()=>{
  document.title='SaveFlow Cashback V53';

  // Remove leaked developer text and the old subtitle under the brand.
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const trash=[];
  while(walker.nextNode()){
    const n=walker.currentNode;
    if((n.nodeValue||'').includes('V25 data additions:')) trash.push(n);
  }
  trash.forEach(n=>n.remove());
  document.querySelectorAll('.brand-sub').forEach(el=>el.remove());

  // Keep the base V52 scanner UI exactly as it is. Clean only public/admin chrome.
  const st=document.createElement('style');
  st.textContent=`
    #siteAdminBar .site-admin-copy{display:none!important}
    #userModeToggle,#changeHistoryToggle,#sourceAuditToggle,#siteBackupExport{display:none!important}
    #userModePanel,#sourceAuditPanel{display:none!important}
    label[for="siteBackupImport"],label.file-btn:has(#siteBackupImport){display:none!important}
    #siteEditToggle{display:none!important}
    body.saveflow-admin-account #siteEditToggle{display:inline-flex!important}
    #siteEditToggle .admin-lock-status{display:none!important}

    /* Legacy local backup controls are kept in code but removed from the UI. */
    #matrixEditToggle,#matrixExportBtn,#matrixResetAll,#bonusExportBtn,#bonusImportLabel{display:none!important}
    label[for="matrixImportInput"],label.file-btn:has(#matrixImportInput){display:none!important}

    #siteAdminBar{justify-content:flex-end;margin:-12px 0 22px;padding:9px 10px;background:transparent;border-color:transparent}
    #siteAdminBar.editing{background:#eaf2ec;border-color:#cbd9cf}
    #siteAdminBar .site-admin-actions{width:100%;justify-content:flex-end}

    /* Personal matrix editing: one quiet pencil instead of a separate User mode. */
    #personalMatrixToggle{display:none;position:relative;width:32px;height:32px;padding:0;place-items:center;border-radius:10px;font-size:15px;line-height:1}
    body.saveflow-signed-in #personalMatrixToggle{display:inline-grid}
    #personalMatrixToggle::after{content:attr(data-tip);position:absolute;right:0;top:38px;width:235px;padding:8px 9px;border-radius:9px;background:#202521;color:#fff;font-size:9px;font-weight:650;line-height:1.4;letter-spacing:0;text-align:left;box-shadow:0 8px 24px rgba(0,0,0,.18);opacity:0;pointer-events:none;transform:translateY(-3px);transition:.14s ease;z-index:35}
    #personalMatrixToggle:hover::after,#personalMatrixToggle:focus-visible::after{opacity:1;transform:translateY(0)}
    body.sf-personal-matrix-edit #personalMatrixToggle,
    body.sf-native-admin-matrix-edit #personalMatrixToggle{background:#263746;color:#fff;border-color:#263746}
    body.site-user-mode .matrix-toolbar-copy{display:none!important}
    #personalMatrixControls{display:none;align-items:center;gap:7px;flex-wrap:wrap}
    body.site-user-mode.sf-personal-matrix-edit #personalMatrixControls,
    body.site-editing.sf-native-admin-matrix-edit #personalMatrixControls{display:flex}
    body.site-editing.sf-native-admin-matrix-edit #personalBanksBtn{display:none!important}
    .personal-matrix-hint{font-size:9px;color:var(--muted);margin-right:2px}
    #personalMatrixDone{background:#263746;color:#fff;border-color:#263746}
    #personalMatrixDone:hover{background:#344b5e}

    @media(max-width:760px){
      #siteAdminBar{align-items:center;flex-direction:row}
      #siteAdminBar .site-admin-actions{justify-content:flex-end}
      .personal-matrix-hint{display:none}
      #personalMatrixToggle::after{right:-12px;width:205px}
    }
  `;
  document.head.appendChild(st);

  // Make sure source-audit mode never remains visually active when the toolbar control is hidden.
  document.body.classList.remove('admin-source-mode');
  document.getElementById('sourceAuditPanel')?.classList.remove('show');

  // Simplify the bonuses description.
  const bonuses=document.getElementById('bonuses');
  const bonusesKicker=bonuses?.querySelector('.section-kicker');
  if(bonusesKicker){
    bonusesKicker.textContent='Окремий блок для бонусів за запрошення друзів, стартових welcome-бонусів та інших програм.';
  }

  // Account UX: email + password only. Cloud sync stays automatic.
  document.getElementById('authCopy')?.remove();
  document.getElementById('authNameField')?.remove();
  document.getElementById('authSyncNow')?.remove();

  // Remove old "Мій режим" wording from the bank picker.
  const banksCopy=document.querySelector('#userBanksModal .user-banks-copy');
  if(banksCopy){
    banksCopy.textContent='Обери банки, якими користуєшся. Матриця сховає зайві колонки. Якщо нічого не вибрано — показуються всі банки.';
  }

  // Create the new personal matrix controls inside the existing matrix toolbar.
  const matrixActions=document.querySelector('#matrixToolbar .matrix-toolbar-actions');
  let personalToggle=document.getElementById('personalMatrixToggle');
  if(matrixActions && !personalToggle){
    personalToggle=document.createElement('button');
    personalToggle.id='personalMatrixToggle';
    personalToggle.className='matrix-btn';
    personalToggle.type='button';
    personalToggle.textContent='✎';
    personalToggle.setAttribute('aria-label','Налаштувати мою матрицю');
    personalToggle.setAttribute('data-tip','Налаштувати мої банки та персональні ставки');

    const controls=document.createElement('div');
    controls.id='personalMatrixControls';
    controls.innerHTML='<span class="personal-matrix-hint">Персональні зміни бачиш тільки ти</span><button class="matrix-btn" id="personalBanksBtn" type="button">Мої банки</button><button class="matrix-btn" id="personalMatrixDone" type="button">Готово</button>';
    matrixActions.prepend(controls);
    matrixActions.prepend(personalToggle);
  }

  const hiddenUserToggle=document.getElementById('userModeToggle');
  const hiddenBanksOpen=document.getElementById('userBanksOpen');
  const personalBanksBtn=document.getElementById('personalBanksBtn');
  const personalDone=document.getElementById('personalMatrixDone');

  function signedIn(){return !!window.saveflowAuthState?.session?.user;}
  function currentRole(){return document.documentElement.dataset.saveflowRole||'public';}

  // V52 cloud hydration still calls the legacy name after replacing
  // saveflow.userMatrixOverrides.v1. Keep it as a live alias to the current
  // renderer so cloud-hydrated personal data immediately repaints global → personal.
  window.saveflowMatrixApplyOverrides=function(...args){
    return window.saveflowApplyMatrixOverrides?.(...args);
  };

  const PERSONAL_OVERRIDE_KEY='saveflow.userMatrixOverrides.v1';
  const sfNativeSetItem=Storage.prototype.setItem;
  if(!Storage.prototype.__sfPersonalMatrixRenderHook){
    const hookedSetItem=function(key,value){
      const out=sfNativeSetItem.call(this,key,value);
      if(this===localStorage&&key===PERSONAL_OVERRIDE_KEY){
        queueMicrotask(()=>window.saveflowApplyMatrixOverrides?.());
      }
      return out;
    };
    hookedSetItem.__sfPersonalMatrixRenderHook=true;
    Storage.prototype.setItem=hookedSetItem;
    Storage.prototype.__sfPersonalMatrixRenderHook=true;
  }
  function profileRole(){return window.saveflowAuthState?.profile?.role||window.saveflowCloud?.profile?.role||currentRole();}
  function isAdminEditing(){return profileRole()==='admin'&&document.body.classList.contains('site-editing');}
  let adminMatrixEditActive=false;
  let personalMatrixEditActive=false;
  let forcingPersonalView=false;

  function ensurePersonalView(){
    if(!signedIn()||isAdminEditing()||currentRole()==='user'||forcingPersonalView)return;
    forcingPersonalView=true;
    setTimeout(()=>{
      try{
        if(signedIn()&&!isAdminEditing()&&currentRole()!=='user') hiddenUserToggle?.click();
      }finally{
        forcingPersonalView=false;
        setTimeout(syncPersonalUi,0);
      }
    },0);
  }

  function setAdminMatrixEditing(on){
    const next=!!on&&isAdminEditing();
    adminMatrixEditActive=next;
    if(document.body.classList.contains('sf-native-admin-matrix-edit')!==next){
      document.body.classList.toggle('sf-native-admin-matrix-edit',next);
    }
    window.saveflowMatrixSetEditing?.(next);
    syncPersonalUi();
    return next;
  }

  function setPersonalMatrixEditing(on){
    if(!signedIn()||isAdminEditing())return false;
    personalMatrixEditActive=!!on;
    if(document.body.classList.contains('sf-personal-matrix-edit')!==personalMatrixEditActive){
      document.body.classList.toggle('sf-personal-matrix-edit',personalMatrixEditActive);
    }
    ensurePersonalView();
    if(currentRole()==='user') window.saveflowMatrixSetEditing?.(personalMatrixEditActive);
    syncPersonalUi();
    return personalMatrixEditActive;
  }

  personalToggle?.addEventListener('click',()=>{
    if(isAdminEditing()){
      setAdminMatrixEditing(!adminMatrixEditActive);
      return;
    }
    if(!signedIn()){
      document.getElementById('accountToggle')?.click();
      return;
    }
    setPersonalMatrixEditing(!personalMatrixEditActive);
  });
  personalBanksBtn?.addEventListener('click',()=>{
    if(!signedIn()||isAdminEditing())return;
    if(!personalMatrixEditActive)setPersonalMatrixEditing(true);
    ensurePersonalView();
    setTimeout(()=>hiddenBanksOpen?.click(),0);
  });
  personalDone?.addEventListener('click',()=>{
    if(isAdminEditing()) setAdminMatrixEditing(false);
    else setPersonalMatrixEditing(false);
  });

  // Do not allow an accidental blank override. Use the explicit "Очистити клітинку" action instead.
  document.addEventListener('click',e=>{
    if(!e.target.closest('#matrixSaveEdit'))return;
    const input=document.getElementById('matrixValueInput');
    if(!input||input.value.trim())return;
    e.preventDefault();
    e.stopImmediatePropagation();
    input.setCustomValidity('Введи значення кешбеку або натисни «Очистити клітинку».');
    input.reportValidity();
    input.focus();
    const clear=()=>input.setCustomValidity('');
    input.addEventListener('input',clear,{once:true});
    setTimeout(clear,3500);
  },true);

  function syncPersonalUi(){
    const signed=signedIn();
    document.body.classList.toggle('saveflow-signed-in',signed);
    document.body.classList.toggle('saveflow-admin-account',signed&&profileRole()==='admin');

    const globalEditing=isAdminEditing();
    if(globalEditing){
      personalMatrixEditActive=false;
      if(document.body.classList.contains('sf-personal-matrix-edit')){
        document.body.classList.remove('sf-personal-matrix-edit');
      }
      if(!adminMatrixEditActive) window.saveflowMatrixSetEditing?.(false);
    }else{
      if(adminMatrixEditActive){
        adminMatrixEditActive=false;
        if(document.body.classList.contains('sf-native-admin-matrix-edit')){
          document.body.classList.remove('sf-native-admin-matrix-edit');
        }
      }
      if(signed){
        ensurePersonalView();
        if(currentRole()==='user') window.saveflowMatrixSetEditing?.(personalMatrixEditActive);
      }else{
        personalMatrixEditActive=false;
        if(document.body.classList.contains('sf-personal-matrix-edit')){
          document.body.classList.remove('sf-personal-matrix-edit');
        }
      }
    }

    const active=globalEditing?adminMatrixEditActive:personalMatrixEditActive;
    personalToggle?.setAttribute('aria-pressed',active?'true':'false');
    personalToggle?.setAttribute('aria-label',globalEditing?'Редагувати матрицю для всіх':'Редагувати мою матрицю');
    personalToggle?.setAttribute('data-tip',globalEditing
      ?(adminMatrixEditActive?'Глобальне редагування активне — клікни потрібну клітинку':'Редагувати матрицю для всіх')
      :(personalMatrixEditActive?'Персональне редагування активне — клікни потрібну клітинку':'Редагувати мою матрицю'));
    const hint=document.querySelector('#personalMatrixControls .personal-matrix-hint');
    if(hint)hint.textContent=globalEditing?'Глобальні зміни бачать усі':'Персональні зміни бачиш тільки ти';
  }

  const SF_ADMIN_OVERRIDES='saveflow.matrixOverrides.v1';
  const SF_USER_OVERRIDES='saveflow.userMatrixOverrides.v1';
  let manualLayerQueued=false;
  let manualLayerApplying=false;

  function sfReadObject(key){
    try{
      const x=JSON.parse(localStorage.getItem(key)||'{}');
      return x&&typeof x==='object'&&!Array.isArray(x)?x:{};
    }catch(_){return {};}
  }
  function sfEsc(s){
    return String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function sfStampMatrixBanks(){
    const table=document.querySelector('#categories .matrix-card table');
    if(!table)return;
    const heads=[...table.querySelectorAll('thead th')];
    const names=heads.map((th,i)=>{
      if(i===0)return '';
      const n=String(th.dataset.sfBankOrderName||th.querySelector('.bank-name')?.textContent||th.textContent||'').replace(/\s+/g,' ').trim();
      if(n){
        th.dataset.sfBankOrderName=n;
        th.dataset.sfBankName=n;
      }
      return n;
    });
    table.querySelectorAll('tbody tr').forEach(tr=>{
      [...tr.children].forEach((td,i)=>{
        if(i===0)return;
        if(!td.dataset.sfBankName&&names[i])td.dataset.sfBankName=names[i];
      });
    });
  }
  function sfRenderManualOverride(ov){
    if(!ov||ov.empty||!String(ov.value||'').trim())return '<span class="dash">—</span>';
    if(ov.end&&new Date(ov.end+'T23:59:59')<new Date())return '<span class="dash">—</span>';
    const classes=['cash'];
    if(ov.best)classes.push('best');
    if(ov.note)classes.push('has-scope');
    const attrs=[
      ov.end?' data-end="'+sfEsc(ov.end)+'"':'',
      ov.source?' data-source="'+sfEsc(ov.source)+'"':'',
      ov.sourceTier?' data-source-tier="'+sfEsc(ov.sourceTier)+'"':'',
      ov.checked?' data-checked="'+sfEsc(ov.checked)+'"':''
    ].join('');
    const tip=ov.note?'<span class="scope-badge" tabindex="0" aria-label="'+sfEsc(ov.note)+'" data-tip="'+sfEsc(ov.note)+'">?</span>':'';
    return '<div class="'+classes.join(' ')+'"'+attrs+'><span class="cash-value">'+sfEsc(ov.value)+'</span>'+tip+'</div>';
  }
  function sfApplyAuthoritativeManualLayer(){
    if(manualLayerApplying)return;
    manualLayerApplying=true;
    try{
      sfStampMatrixBanks();
      const admin=sfReadObject(SF_ADMIN_OVERRIDES);
      const personal=currentRole()==='user'?sfReadObject(SF_USER_OVERRIDES):{};
      document.querySelectorAll('#categories .matrix-card table tbody tr').forEach(tr=>{
        const category=String(tr.querySelector('.category strong')?.textContent||tr.children[0]?.textContent||'').replace(/\s+/g,' ').trim();
        [...tr.children].slice(1).forEach(td=>{
          const bank=String(td.dataset.sfBankName||td.dataset.sfExtraBank||'').replace(/\s+/g,' ').trim();
          if(!bank)return;
          const key=category+'|||'+bank;
          const hasPersonal=Object.prototype.hasOwnProperty.call(personal,key);
          const hasAdmin=Object.prototype.hasOwnProperty.call(admin,key);
          const ov=hasPersonal?personal[key]:(hasAdmin?admin[key]:null);
          if(!ov)return;
          const html=sfRenderManualOverride(ov);
          if(td.innerHTML!==html)td.innerHTML=html;
          td.classList.toggle('user-edited',!!ov);
          td.classList.toggle('user-personal-edited',hasPersonal);
          td.dataset.sfManualLayer=hasPersonal?'personal':'global';
        });
      });
    }finally{
      manualLayerApplying=false;
    }
  }
  function sfQueueManualLayer(){
    if(manualLayerQueued)return;
    manualLayerQueued=true;
    requestAnimationFrame(()=>{
      manualLayerQueued=false;
      sfApplyAuthoritativeManualLayer();
    });
  }
  window.saveflowApplyAuthoritativeManualLayer=sfApplyAuthoritativeManualLayer;

  const matrixRoot=document.querySelector('#categories .matrix-card table');
  if(matrixRoot){
    const matrixObserver=new MutationObserver(muts=>{
      if(manualLayerApplying)return;
      if(muts.some(m=>m.type==='childList'||m.type==='attributes'))sfQueueManualLayer();
    });
    matrixObserver.observe(matrixRoot,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-saveflow-role']});
  }
  window.addEventListener('storage',e=>{
    if(e.key===SF_ADMIN_OVERRIDES||e.key===SF_USER_OVERRIDES)sfQueueManualLayer();
  });

  const tidyAccount=()=>{
    const state=window.saveflowAuthState;
    const signed=!!state?.session?.user;
    const title=document.getElementById('authTitle');
    const accountBtn=document.getElementById('accountToggle');
    if(signed){
      if(title) title.textContent='Акаунт';
      if(accountBtn) accountBtn.textContent=state.session.user.email||'Акаунт';
    }
    syncPersonalUi();
  };
  window.addEventListener('saveflow-auth-change',tidyAccount);

  // Track role changes made by the existing V52 role controller.
  let lastObservedRole=currentRole();
  let matrixRefreshSeq=0;

  async function refreshPersonalMatrixFromCloud(){
    const cloud=window.saveflowCloud;
    const client=cloud?.client;
    const userId=cloud?.session?.user?.id||window.saveflowAuthState?.session?.user?.id;
    if(!client||!userId)return false;
    const {data,error}=await client
      .from('user_matrix_overrides')
      .select('cell_key,value,note,valid_until,is_best,is_empty,updated_at')
      .eq('user_id',userId);
    if(error)throw error;
    const next={};
    (data||[]).forEach(r=>{
      next[r.cell_key]={
        value:r.value||'',
        note:r.note||'',
        end:r.valid_until||'',
        best:!!r.is_best,
        empty:!!r.is_empty,
        updatedAt:r.updated_at
      };
    });
    localStorage.setItem(PERSONAL_OVERRIDE_KEY,JSON.stringify(next));
    return true;
  }

  function reapplyMatrixLayers({pull=false}={}){
    const seq=++matrixRefreshSeq;
    const apply=()=>{
      if(seq!==matrixRefreshSeq)return;
      window.saveflowApplyMatrixOverrides?.();
      window.saveflowApplyExtraBankOverrides?.();
      window.saveflowApplyAuthoritativeManualLayer?.();
    };
    const settle=()=>[0,80,260,700].forEach(ms=>setTimeout(apply,ms));
    if(!pull){settle();return;}
    (async()=>{
      try{
        await window.saveflowGlobalCloud?.pull?.();
        const refreshed=await refreshPersonalMatrixFromCloud();
        if(!refreshed)await window.saveflowCloud?.pullUserCloud?.();
      }catch(e){
        console.warn('SaveFlow matrix layer refresh',e);
        try{await window.saveflowCloud?.pullUserCloud?.();}catch(_){}
      }finally{
        settle();
      }
    })();
  }
  const roleObserver=new MutationObserver(()=>{
    const previous=lastObservedRole;
    const next=currentRole();
    lastObservedRole=next;
    syncPersonalUi();
    if(previous==='admin'&&next!=='admin'){
      // Admin exit has several async renderers (role, cloud, personal view).
      // Pull once, then keep the manual layers last after the transition settles.
      reapplyMatrixLayers({pull:true});
    }else{
      reapplyMatrixLayers();
    }
  });
  roleObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-saveflow-role']});
  new MutationObserver(()=>{
    syncPersonalUi();
    if(!isAdminEditing())reapplyMatrixLayers();
  }).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('saveflow-auth-change',()=>setTimeout(()=>reapplyMatrixLayers({pull:true}),60));
  tidyAccount();
  reapplyMatrixLayers();
  sfQueueManualLayer();

  // Do not show redundant success confirmations after a successful sign-in.
  const authMsg=document.getElementById('authMessage');
  if(authMsg){
    const cleanSuccess=()=>{
      const text=(authMsg.textContent||'').trim();
      if(text==='Вхід виконано.'||text==='Акаунт створено і вхід виконано.') authMsg.textContent='';
    };
    new MutationObserver(cleanSuccess).observe(authMsg,{childList:true,subtree:true,characterData:true});
    cleanSuccess();
  }
})();
