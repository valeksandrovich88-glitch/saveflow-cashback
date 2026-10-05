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
    #siteEditToggle .admin-lock-status{display:none!important}

    /* Legacy local backup controls are kept in code but removed from the UI. */
    #matrixExportBtn,#matrixResetAll,#bonusExportBtn,#bonusImportLabel{display:none!important}
    label[for="matrixImportInput"],label.file-btn:has(#matrixImportInput){display:none!important}

    #siteAdminBar{justify-content:flex-end;margin:-12px 0 22px;padding:9px 10px;background:transparent;border-color:transparent}
    #siteAdminBar.editing{background:#eaf2ec;border-color:#cbd9cf}
    #siteAdminBar .site-admin-actions{width:100%;justify-content:flex-end}

    /* Personal matrix editing: one quiet pencil instead of a separate User mode. */
    #personalMatrixToggle{display:none;position:relative;width:32px;height:32px;padding:0;place-items:center;border-radius:10px;font-size:15px;line-height:1}
    body.saveflow-signed-in:not(.site-editing) #personalMatrixToggle{display:inline-grid}
    #personalMatrixToggle::after{content:attr(data-tip);position:absolute;right:0;top:38px;width:235px;padding:8px 9px;border-radius:9px;background:#202521;color:#fff;font-size:9px;font-weight:650;line-height:1.4;letter-spacing:0;text-align:left;box-shadow:0 8px 24px rgba(0,0,0,.18);opacity:0;pointer-events:none;transform:translateY(-3px);transition:.14s ease;z-index:35}
    #personalMatrixToggle:hover::after,#personalMatrixToggle:focus-visible::after{opacity:1;transform:translateY(0)}
    body.site-user-mode #personalMatrixToggle{background:#263746;color:#fff;border-color:#263746}
    body.site-user-mode .matrix-toolbar-copy{display:none!important}
    #personalMatrixControls{display:none;align-items:center;gap:7px;flex-wrap:wrap}
    body.site-user-mode #personalMatrixControls{display:flex}
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
  function enterPersonalMode(){
    if(!signedIn()){
      document.getElementById('accountToggle')?.click();
      return false;
    }
    if(currentRole()==='admin') return false;
    if(currentRole()!=='user') hiddenUserToggle?.click();
    return true;
  }
  personalToggle?.addEventListener('click',()=>{
    if(currentRole()==='user') hiddenUserToggle?.click();
    else enterPersonalMode();
  });
  personalBanksBtn?.addEventListener('click',()=>{
    if(enterPersonalMode()) setTimeout(()=>hiddenBanksOpen?.click(),0);
  });
  personalDone?.addEventListener('click',()=>{
    if(currentRole()==='user') hiddenUserToggle?.click();
  });

  function syncPersonalUi(){
    const signed=signedIn();
    document.body.classList.toggle('saveflow-signed-in',signed);
    if(!signed && currentRole()==='user') hiddenUserToggle?.click();
    personalToggle?.setAttribute('aria-pressed',currentRole()==='user'?'true':'false');
  }

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
  new MutationObserver(syncPersonalUi).observe(document.documentElement,{attributes:true,attributeFilter:['data-saveflow-role']});
  tidyAccount();

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
