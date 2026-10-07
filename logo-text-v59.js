(()=>{
  const BANKS={
    'GlobusPlus':['#0b6b45','#fff','G'],'Акордбанк':['#1f5aa6','#fff','A'],'RadaBank':['#fff','#315a37','R'],'Unex Bank':['#f4f4f4','#555','UB'],'izibank':['#222','#ffe500','izi'],'Ідея Банк':['#006db6','#fff','i'],'БІЗБАНК':['#f4e600','#111','Б'],'Банк Альянс':['#20a46c','#fff','A'],'Кристалбанк':['#004f78','#fff','К'],'МТБ БАНК':['#143b72','#fff','МТБ'],'Піреус Банк':['#00639a','#fff','ПБ'],'Ощадбанк':['#63b449','#fff','О'],'ТАСКОМБАНК':['#223d77','#fff','T'],'UKRSIBBANK':['#16a6d9','#fff','U'],'Український капітал':['#68153d','#fff','УК'],'OTP Bank':['#208b46','#fff','OTP'],'А-Банк':['#00b85a','#111','à'],'Банк Південний':['#1a6a9b','#fff','ПД'],'Райффайзен Банк':['#ffe500','#111','R'],'KredoBank':['#e3281e','#fff','K'],'VST bank':['#111','#fff','VST'],'ПриватБанк':['#63b347','#fff','П'],'Sense Bank':['#ff5b79','#fff','S'],'monobank':['#111','#fff','M'],'Полікомбанк':['#cc2433','#fff','ПЛ'],'ПУМБ':['#e51d2a','#fff','П'],'Банк Кредит Дніпро':['#ef8b19','#fff','КД'],'Credit Agricole':['#198d55','#fff','CA'],'O.Bank':['#17a7dc','#fff','O']
  };
  const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  function svg(name){
    if(name==='O.Bank') return '<svg viewBox="0 0 28 28"><rect width="28" height="28" rx="8" fill="#f5fbfd" stroke="#b8dce8"/><circle cx="10" cy="10" r="3.1" fill="#17a7dc"/><circle cx="18" cy="10" r="3.1" fill="#17a7dc"/><circle cx="10" cy="18" r="3.1" fill="#17a7dc"/><circle cx="18" cy="18" r="3.1" fill="#17a7dc"/></svg>';
    if(name==='Банк Альянс') return '<svg viewBox="0 0 28 28"><rect width="28" height="28" rx="8" fill="#f4fbf7" stroke="#b7d8c4"/><path d="M7 17l7-7 7 7" fill="none" stroke="#20a46c" stroke-width="2.3" stroke-linecap="round"/><path d="M9 20l5-5 5 5" fill="none" stroke="#20a46c" stroke-width="2" stroke-linecap="round"/></svg>';
    if(name==='ПУМБ') return '<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#e51d2a"/><text x="14" y="14.7" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="6.5" font-weight="800" fill="#fff">ПУМБ</text></svg>';
    const [bg,fg,mark]=BANKS[name]; const fs=mark.length>=3?7:mark.length===2?8.5:11.5;
    return '<svg viewBox="0 0 28 28"><rect x=".5" y=".5" width="27" height="27" rx="8" fill="'+esc(bg)+'" stroke="rgba(255,255,255,.28)"/><text x="14" y="14.7" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="'+fs+'" font-weight="800" fill="'+esc(fg)+'">'+esc(mark)+'</text></svg>';
  }
  function logoMarkup(name){
    const src=window.SAVEFLOW_BANK_LOGOS?.[name];
    if(src) return '<img src="'+src+'" alt="" loading="lazy">';
    return svg(name);
  }
  const st=document.createElement('style');
  st.id='sf-logo-text-v59-style';
  st.textContent='.sf-bank-name-with-logo{display:inline-flex!important;align-items:center!important;gap:8px!important;vertical-align:middle}.sf-bank-name-with-logo>.sf-inline-logo{display:inline-grid!important;place-items:center!important;width:44px!important;height:32px!important;flex:0 0 44px!important}.sf-bank-name-with-logo>.sf-inline-logo svg,.sf-bank-name-with-logo>.sf-inline-logo img{width:100%!important;height:100%!important;display:block!important;object-fit:contain!important}.sf-bank-name-with-logo>.sf-inline-logo img{border-radius:6px}.bank-head .sf-bank-name-with-logo>.sf-inline-logo{width:56px!important;height:38px!important;flex-basis:56px!important}.bank-head .sf-bank-name-with-logo>.sf-inline-logo svg,.bank-head .sf-bank-name-with-logo>.sf-inline-logo img{width:100%!important;height:100%!important}.promo-bank .mini-logo-wrap,.partner-bank .mini-logo-wrap,.bank-head .bank-logo-wrap{display:none!important}';
  document.head.appendChild(st);
  function patch(){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    const hits=[];
    while(walker.nextNode()){
      const n=walker.currentNode; const name=(n.nodeValue||'').trim();
      if(BANKS[name]) hits.push([n,name]);
    }
    hits.forEach(([node,name])=>{
      const p=node.parentElement;if(!p||p.closest('script,style,svg'))return;
      const card=p.closest('.promo-card,.bonus-card,.partner-card,.bank-head');if(!card)return;
      if(p.classList.contains('sf-bank-name-with-logo'))return;
      const wrap=document.createElement('span');wrap.className='sf-bank-name-with-logo';
      const icon=document.createElement('span');icon.className='sf-inline-logo';icon.innerHTML=logoMarkup(name);const im=icon.querySelector('img');if(im)im.addEventListener('error',()=>{icon.innerHTML=svg(name)},{once:true});
      node.parentNode.insertBefore(wrap,node);wrap.append(icon,node);
    });
  }
  patch();
  let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;patch()})}).observe(document.body,{subtree:true,childList:true,characterData:true});
})();