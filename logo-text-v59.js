(()=>{
  const BANKS={
    'GlobusPlus':['#0b6b45','#fff','G'],'Акордбанк':['#1f5aa6','#fff','A'],'RadaBank':['#fff','#315a37','R'],'Unex Bank':['#f4f4f4','#555','UB'],'izibank':['#222','#ffe500','izi'],'Ідея Банк':['#006db6','#fff','i'],'БІЗБАНК':['#f4e600','#111','Б'],'Банк Альянс':['#20a46c','#fff','A'],'Кристалбанк':['#004f78','#fff','К'],'МТБ БАНК':['#143b72','#fff','МТБ'],'Піреус Банк':['#00639a','#fff','ПБ'],'Ощадбанк':['#63b449','#fff','О'],'ТАСКОМБАНК':['#223d77','#fff','T'],'UKRSIBBANK':['#16a6d9','#fff','U'],'Український капітал':['#68153d','#fff','УК'],'OTP Bank':['#208b46','#fff','OTP'],'А-Банк':['#00b85a','#111','à'],'Банк Південний':['#1a6a9b','#fff','ПД'],'Райффайзен Банк':['#ffe500','#111','R'],'KredoBank':['#e3281e','#fff','K'],'VST bank':['#111','#fff','VST'],'ПриватБанк':['#63b347','#fff','П'],'Sense Bank':['#ff5b79','#fff','S'],'monobank':['#111','#fff','M'],'Полікомбанк':['#cc2433','#fff','ПЛ'],'ПУМБ':['#e51d2a','#fff','П'],'Банк Кредит Дніпро':['#ef8b19','#fff','КД'],'Credit Agricole':['#198d55','#fff','CA'],'O.Bank':['#17a7dc','#fff','O']
  };
  const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  function svg(name){
    if(name==='izibank') return '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M16 32C7.04054 32 4.62883 31.5462 2.54134 29.4587C0.440812 27.3582 0 24.9595 0 16C0 7.04054 0.453809 4.64182 2.54134 2.54134C4.62883 0.453809 7.04054 0 16 0C24.9595 0 27.3712 0.453809 29.4587 2.54134C31.5591 4.64182 32 7.04054 32 16C32 24.9595 31.5591 27.3582 29.4587 29.4587C27.3712 31.5462 24.9595 32 16 32Z" fill="#FF4D00"/><path fill-rule="evenodd" clip-rule="evenodd" d="M24.0739 8.44747C24.073 7.86266 24.429 7.33501 24.9756 7.11065C25.5223 6.88629 26.152 7.00945 26.5708 7.42266C26.9897 7.83586 27.1153 8.45769 26.8889 8.99802C26.6626 9.53835 26.1289 9.89071 25.537 9.8907C24.7297 9.8907 24.075 9.24488 24.0739 8.44747ZM13.3884 19.8234C13.3883 19.4696 13.6315 19.161 13.9788 19.0745C14.085 19.043 18.5677 17.711 19.0264 17.5641C20.3982 17.1194 21.0884 16.0328 21.0884 14.8539C21.0884 13.2743 19.9926 11.9947 17.9817 11.9947H11.1587V14.1365H17.7417C18.3278 14.1365 18.606 14.4784 18.606 14.9084C18.618 15.2429 18.3955 15.5417 18.0688 15.63C18.0454 15.6376 17.8068 15.7092 17.4462 15.8176C16.2006 16.1918 13.5103 17.0001 13.1697 17.1236C11.5749 17.6963 10.906 18.6927 10.906 19.8716C10.906 21.4491 11.9487 22.7308 14.0127 22.7308H20.8357V20.5869H14.2739C13.7388 20.5869 13.3884 20.2429 13.3884 19.8234ZM26.777 11.9947H24.2968V22.7392H26.777V11.9947ZM5 8.44749C4.99916 7.86248 5.35534 7.3347 5.90227 7.11047C6.44919 6.88624 7.07901 7.00977 7.49773 7.42342C7.91644 7.83706 8.04146 8.45923 7.81444 8.9995C7.58742 9.53977 7.05312 9.89158 6.46096 9.89072C5.65409 9.89069 5 9.24455 5 8.44749ZM7.6929 11.9947H5.21261V22.7392H7.6929V11.9947Z" fill="white"/></svg>';
    if(name==='O.Bank') return '<svg viewBox="0 0 28 28"><rect width="28" height="28" rx="8" fill="#f5fbfd" stroke="#b8dce8"/><circle cx="10" cy="10" r="3.1" fill="#17a7dc"/><circle cx="18" cy="10" r="3.1" fill="#17a7dc"/><circle cx="10" cy="18" r="3.1" fill="#17a7dc"/><circle cx="18" cy="18" r="3.1" fill="#17a7dc"/></svg>';
    if(name==='Банк Альянс') return '<svg viewBox="0 0 28 28"><rect width="28" height="28" rx="8" fill="#f4fbf7" stroke="#b7d8c4"/><path d="M7 17l7-7 7 7" fill="none" stroke="#20a46c" stroke-width="2.3" stroke-linecap="round"/><path d="M9 20l5-5 5 5" fill="none" stroke="#20a46c" stroke-width="2" stroke-linecap="round"/></svg>';
    if(name==='ПУМБ') return '<svg viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#e51d2a"/><text x="14" y="14.7" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="6.5" font-weight="800" fill="#fff">ПУМБ</text></svg>';
    const [bg,fg,mark]=BANKS[name]; const fs=mark.length>=3?7:mark.length===2?8.5:11.5;
    return '<svg viewBox="0 0 28 28"><rect x=".5" y=".5" width="27" height="27" rx="8" fill="'+esc(bg)+'" stroke="rgba(255,255,255,.28)"/><text x="14" y="14.7" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="'+fs+'" font-weight="800" fill="'+esc(fg)+'">'+esc(mark)+'</text></svg>';
  }
  function logoMarkup(name){
    if(name==='izibank') return svg(name);
    const src=window.SAVEFLOW_BANK_LOGOS?.[name];
    if(src) return '<img src="'+src+'" alt="" loading="lazy">';
    return svg(name);
  }
  const st=document.createElement('style');
  st.id='sf-logo-text-v59-style';
  st.textContent='.sf-bank-name-with-logo{display:inline-flex!important;align-items:center!important;gap:8px!important;vertical-align:middle}.sf-bank-name-with-logo>.sf-inline-logo{display:inline-grid!important;place-items:center!important;width:44px!important;height:32px!important;flex:0 0 44px!important}.sf-bank-name-with-logo>.sf-inline-logo svg,.sf-bank-name-with-logo>.sf-inline-logo img{width:100%!important;height:100%!important;display:block!important;object-fit:contain!important}.sf-bank-name-with-logo>.sf-inline-logo.sf-inline-logo-izi svg{width:26px!important;height:26px!important}.sf-bank-name-with-logo>.sf-inline-logo img{border-radius:6px}.bank-head .sf-bank-name-with-logo>.sf-inline-logo{width:56px!important;height:38px!important;flex-basis:56px!important}.bank-head .sf-bank-name-with-logo>.sf-inline-logo svg,.bank-head .sf-bank-name-with-logo>.sf-inline-logo img{width:100%!important;height:100%!important}.bank-head .sf-bank-name-with-logo>.sf-inline-logo.sf-inline-logo-izi svg{width:30px!important;height:30px!important}.promo-bank .mini-logo-wrap,.partner-bank .mini-logo-wrap,.bank-head .bank-logo-wrap{display:none!important}';
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
      const icon=document.createElement('span');icon.className='sf-inline-logo'+(name==='izibank'?' sf-inline-logo-izi':'');icon.innerHTML=logoMarkup(name);const im=icon.querySelector('img');if(im)im.addEventListener('error',()=>{icon.innerHTML=svg(name)},{once:true});
      node.parentNode.insertBefore(wrap,node);wrap.append(icon,node);if(name==='O.Bank')node.nodeValue='Ідея Банк · O.Bank';
    });
  }
  patch();
  let q=false;new MutationObserver(()=>{if(q)return;q=true;requestAnimationFrame(()=>{q=false;patch()})}).observe(document.body,{subtree:true,childList:true,characterData:true});
})();