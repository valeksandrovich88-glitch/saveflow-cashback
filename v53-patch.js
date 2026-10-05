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
    #userModeToggle,#changeHistoryToggle{display:none!important}
    #userModePanel{display:none!important}
    #siteEditToggle .admin-lock-status{display:none!important}
    #siteAdminBar{justify-content:flex-end;margin:-12px 0 22px;padding:9px 10px;background:transparent;border-color:transparent}
    #siteAdminBar.editing{background:#eaf2ec;border-color:#cbd9cf}
    #siteAdminBar .site-admin-actions{width:100%;justify-content:flex-end}
    @media(max-width:760px){#siteAdminBar{align-items:center;flex-direction:row}#siteAdminBar .site-admin-actions{justify-content:flex-end}}
  `;
  document.head.appendChild(st);

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
