(()=>{
  const BANKS=[
    {key:'globusplus',name:'GlobusPlus',domain:'globusplus.ua',aliases:['globusplus','globus plus','g']},
    {key:'accord',name:'Акордбанк',domain:'accordbank.com.ua',aliases:['акордбанк','accordbank','accord bank','а']},
    {key:'rada',name:'RadaBank',domain:'radabank.com.ua',aliases:['radabank','радабанк','r']},
    {key:'unex',name:'Unex Bank',domain:'unexbank.ua',aliases:['unex bank','unex','ub']},
    {key:'izi',name:'izibank',domain:'izibank.com.ua',aliases:['izibank','izi','i']},
    {key:'idea',name:'Ідея Банк',domain:'ideabank.ua',aliases:['ідея банк','idea bank','ideabank','ib','id']},
    {key:'bis',name:'БІЗБАНК',domain:'bisbank.com.ua',aliases:['бізбанк','bisbank','bis24','б']},
    {key:'alliance',name:'Банк Альянс',domain:'bankalliance.ua',aliases:['банк альянс','alliance','bank alliance','a']},
    {key:'crystal',name:'Кристалбанк',domain:'crystalbank.com.ua',aliases:['кристалбанк','crystalbank','к']},
    {key:'mtb',name:'МТБ БАНК',domain:'mtb.ua',aliases:['мтб банк','mtb bank','мб']},
    {key:'piraeus',name:'Піреус Банк',domain:'piraeusbank.ua',aliases:['піреус банк','piraeus bank','піреус','пб']},
    {key:'oschad',name:'Ощадбанк',domain:'oschadbank.ua',aliases:['ощадбанк','ощад','oschadbank','oschad','о','o']},
    {key:'tas',name:'ТАСКОМБАНК',domain:'tascombank.ua',aliases:['таскомбанк','tascombank','т']},
    {key:'ukrsib',name:'UKRSIBBANK',domain:'ukrsibbank.com',aliases:['ukrsibbank','укрсиббанк','u']},
    {key:'ukrcapital',name:'Український капітал',domain:'ukrcapital.com.ua',aliases:['український капітал','ukrcapital','ук']},
    {key:'otp',name:'OTP Bank',domain:'otpbank.com.ua',aliases:['otp bank','otp','ob']},
    {key:'abank',name:'А-Банк',domain:'a-bank.com.ua',aliases:['а-банк','a-bank','àбанк','абанк','à','a','а']},
    {key:'pivdennyi',name:'Банк Південний',domain:'bank.com.ua',aliases:['банк південний','південний','пд']},
    {key:'raif',name:'Райффайзен Банк',domain:'raiffeisen.ua',aliases:['райффайзен банк','райффайзен','raiffeisen','р']},
    {key:'kredo',name:'KredoBank',domain:'kredobank.com.ua',aliases:['kredobank','кредобанк','k']},
    {key:'vst',name:'VST bank',domain:'vstbank.ua',aliases:['vst bank','vst']},
    {key:'privat',name:'ПриватБанк',domain:'privatbank.ua',aliases:['приватбанк','privatbank','п']},
    {key:'sense',name:'Sense Bank',domain:'sensebank.com.ua',aliases:['sense bank','sense','sb']},
    {key:'mono',name:'monobank',domain:'monobank.ua',aliases:['monobank','монобанк','m']},
    {key:'policom',name:'Полікомбанк',domain:'policombank.com',aliases:['полікомбанк','policombank','пл']},
    {key:'pumb',name:'ПУМБ',domain:'pumb.ua',aliases:['пумб','pumb','п']},
    {key:'creditdnepr',name:'Банк Кредит Дніпро',domain:'creditdnepr.com.ua',aliases:['банк кредит дніпро','кредит дніпро','credit dnepr','банк кд','бкд','бк','ба']},
    {key:'creditagricole',name:'Credit Agricole',domain:'credit-agricole.ua',aliases:['credit agricole','ca']},
    {key:'obank',name:'O.Bank',domain:'obank.com.ua',aliases:['o.bank','obank','о.bank','o bank']}
  ];
  const byKey=Object.fromEntries(BANKS.map(b=>[b.key,b]));
  const norm=s=>String(s||'').toLowerCase().replace(/[’'`]/g,'').replace(/\s+/g,' ').trim();
  const icon=b=>`https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent('https://'+b.domain)}`;

  function resolve(raw,ctx=''){
    const r=norm(raw), c=norm(ctx);
    if(/o\.bank|obank|запроси друзів — o\.bank/.test(c)) return byKey.obank;
    if(/бізбанк|bis24|bisbank/.test(c)) return byKey.bis;
    if(/пумб|pumb/.test(c)) return byKey.pumb;
    if(/ощадбанк|ощад/.test(c)) return byKey.oschad;
    if(/банк кредит дніпро|кредит дніпро|банк кд/.test(c)) return byKey.creditdnepr;
    if(/а-банк|àбанк|a-bank|запроси друга/.test(c)&&(/100 ₴|подвійний кешбек|осцпв|àбанк|a-bank/.test(c))) return byKey.abank;
    if(/райффайзен|raiffeisen/.test(c)) return byKey.raif;
    if(/credit agricole/.test(c)) return byKey.creditagricole;
    if(/idea bank|ідея банк/.test(c)) return byKey.idea;
    if(/sense bank|cash.?u/.test(c)) return byKey.sense;
    if(/privatbank|приватбанк/.test(c)) return byKey.privat;
    if(/monobank|монобанк/.test(c)) return byKey.mono;
    if(/radabank|радабанк/.test(c)) return byKey.rada;
    if(/globusplus|globus plus/.test(c)) return byKey.globusplus;
    if(/unex/.test(c)) return byKey.unex;
    if(/kredobank|кредобанк/.test(c)) return byKey.kredo;
    if(/ukrsibbank|укрсиббанк/.test(c)) return byKey.ukrsib;
    if(/otp bank|otp/.test(c)) return byKey.otp;
    if(/банк південний|південний/.test(c)) return byKey.pivdennyi;
    if(/izibank|izistart|iziстарт/.test(c)) return byKey.izi;
    if(/alliance|банк альянс/.test(c)) return byKey.alliance;
    for(const b of BANKS){
      if(b.aliases.some(a=>{const n=norm(a);return r===n || (n.length>=3 && r.includes(n));})) return b;
    }
    return null;
  }

  const st=document.createElement('style');
  st.id='saveflow-brand-registry-v56';
  st.textContent=`
    .promo-bank,.partner-bank{display:flex!important;align-items:center!important;gap:7px!important}
    .promo-bank>span:last-child,.partner-bank>span:last-child{display:inline!important;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#375240!important;font-weight:800!important}
    .mini-logo-wrap,.bank-logo-wrap{display:grid!important;place-items:center!important;background:transparent!important;border:0!important;padding:0!important;overflow:visible!important}
    .mini-logo-wrap{width:24px!important;height:24px!important;flex:0 0 24px!important}.bank-logo-wrap{width:28px!important;height:28px!important;margin:0 auto 4px!important}
    .mini-logo-wrap>svg{width:24px!important;height:24px!important;display:block!important}.bank-logo-wrap>svg{width:28px!important;height:28px!important;display:block!important}
    .mini-logo,.bank-logo,.mini-logo-fallback,.bank-logo-fallback{display:none!important}
  `;
  document.head.appendChild(st);

  function setLogo(wrap,b,sizeClass){
    if(!wrap||!b)return;
    let img=wrap.querySelector('img');
    let fb=wrap.querySelector('.mini-logo-fallback,.bank-logo-fallback');
    if(!img){img=document.createElement('img');img.alt='';img.className=sizeClass;wrap.prepend(img)}
    img.removeAttribute('data-logo-src');
    img.src=icon(b);
    img.style.display='block';
    img.referrerPolicy='no-referrer';
    if(fb) fb.style.display='none';
    img.onerror=()=>{img.style.display='none';if(fb){fb.style.display='grid';fb.textContent=b.name.slice(0,2).toUpperCase()}};
  }

  function polishMatrix(){
    document.querySelectorAll('.bank-head').forEach(head=>{
      const nameEl=head.querySelector('.bank-name');
      const b=resolve(nameEl?.textContent||'',head.textContent||'');
      if(!b)return;
      if(nameEl) nameEl.textContent=b.name;
      setLogo(head.querySelector('.bank-logo-wrap'),b);
    });
  }

  function polishCard(card){
    const row=card.querySelector('.promo-bank,.partner-bank');
    if(!row)return;
    const nameEl=row.querySelector(':scope > span:last-child');
    const raw=nameEl?.textContent||card.dataset.bank||'';
    let b=null;
    const id=card.dataset.bonusId||card.dataset.editId||'';
    if(id==='moved-097f148d45') b=byKey.obank;
    if(id==='moved-0f85582f09') b=byKey.creditdnepr;
    b=b||resolve(raw,[card.dataset.bank,card.dataset.partner,card.textContent].filter(Boolean).join(' '));
    if(!b)return;
    if(nameEl) nameEl.textContent=b.name;
    if(card.dataset.bank) card.dataset.bank=b.name;
    setLogo(row.querySelector('.mini-logo-wrap'),b);
  }

  function run(){
    polishMatrix();
    document.querySelectorAll('.partner-card,.promo-card,.bonus-card').forEach(polishCard);
  }
  run();
  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;run()});
  }).observe(document.body,{subtree:true,childList:true});
})();
