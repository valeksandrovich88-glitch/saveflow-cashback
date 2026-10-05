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
    @media(max-width:760px){#siteAdminBar{align-items:center;flex-direction:row}#siteAdminBar .site-admin-actions{justify-content:flex-end}}
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

  const tidyAccount=()=>{
    const state=window.saveflowAuthState;
    const signed=!!state?.session?.user;
    const title=document.getElementById('authTitle');
    const accountBtn=document.getElementById('accountToggle');
    if(signed){
      if(title) title.textContent='Акаунт';
      if(accountBtn) accountBtn.textContent=state.session.user.email||'Акаунт';
    }
  };
  window.addEventListener('saveflow-auth-change',tidyAccount);
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
