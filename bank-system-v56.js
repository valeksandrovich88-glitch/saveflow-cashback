(()=> {
  const BANKS = [
    {name:'GlobusPlus', aliases:['globusplus','globus plus'], mark:'G', bg:'#0b6b45', fg:'#ffffff'},
    {name:'Акордбанк', aliases:['акордбанк','accordbank','accord bank'], mark:'А', bg:'#1f5aa6', fg:'#ffffff'},
    {name:'RadaBank', aliases:['radabank','радабанк'], mark:'R', bg:'#ffffff', fg:'#254b2f', border:'#b8cabb'},
    {name:'Unex Bank', aliases:['unex bank','unex'], mark:'UB', bg:'#f3f3f3', fg:'#4d4d4d'},
    {name:'БІЗБАНК', aliases:['бізбанк','bisbank','bis24'], mark:'Б', bg:'#f4e600', fg:'#101010'},
    {name:'Банк Альянс', aliases:['банк альянс','bank alliance','альянс'], mark:'А', bg:'#18a06b', fg:'#ffffff'},
    {name:'Кристалбанк', aliases:['кристалбанк','crystalbank'], mark:'К', bg:'#004d7a', fg:'#ffffff'},
    {name:'МТБ БАНК', aliases:['мтб банк','mtb bank','mtb'], mark:'МТБ', bg:'#143b72', fg:'#ffffff'},
    {name:'Піреус Банк', aliases:['піреус банк','піреус','piraeus'], mark:'ПБ', bg:'#005c93', fg:'#ffffff'},
    {name:'Ощадбанк', aliases:['ощадбанк','ощад','oschadbank','oschad'], mark:'О', bg:'#68b956', fg:'#ffffff'},
    {name:'ТАСКОМБАНК', aliases:['таскомбанк','tascombank'], mark:'Т', bg:'#203a78', fg:'#ffffff'},
    {name:'UKRSIBBANK', aliases:['ukrsibbank','укрсиббанк'], mark:'U', bg:'#11a7dd', fg:'#ffffff'},
    {name:'Український капітал', aliases:['український капітал','ukrcapital'], mark:'УК', bg:'#6c1742', fg:'#ffffff'},
    {name:'OTP Bank', aliases:['otp bank','otp'], mark:'OTP', bg:'#1d8a45', fg:'#ffffff'},
    {name:'А-Банк', aliases:['а-банк','абанк','a-bank','a bank'], mark:'A', bg:'#00b85a', fg:'#101010'},
    {name:'Банк Південний', aliases:['банк південний','південний'], mark:'ПД', bg:'#1a6a9b', fg:'#ffffff'},
    {name:'Райффайзен Банк', aliases:['райффайзен','raiffeisen'], mark:'R', bg:'#ffec00', fg:'#111111'},
    {name:'KredoBank', aliases:['kredobank','кредобанк'], mark:'K', bg:'#e2251b', fg:'#ffffff'},
    {name:'VST bank', aliases:['vst bank','vstbank'], mark:'VST', bg:'#111111', fg:'#ffffff'},
    {name:'ПриватБанк', aliases:['приватбанк','privatbank'], mark:'П', bg:'#62b341', fg:'#ffffff'},
    {name:'Sense Bank', aliases:['sense bank','sense','cashu',"cash'u"], mark:'S', bg:'#ff5d7a', fg:'#ffffff'},
    {name:'monobank', aliases:['monobank','монобанк'], mark:'M', bg:'#111111', fg:'#ffffff'},
    {name:'Полікомбанк', aliases:['полікомбанк','policombank'], mark:'ПЛ', bg:'#cf202f', fg:'#ffffff'},
    {name:'ПУМБ', aliases:['пумб','pumb'], mark:'П', bg:'#e31e24', fg:'#ffffff'},
    {name:'Банк Кредит Дніпро', aliases:['банк кредит дніпро','кредит дніпро','credit dnepr','creditdnepr'], mark:'КД', bg:'#f28c00', fg:'#ffffff'},
    {name:'O.Bank', aliases:['o.bank','obank','о.bank','о.банк'], mark:'O', bg:'#17a7dc', fg:'#ffffff'}
  ];

  const norm = s => String(s||'').toLowerCase().replace(/\s+/g,' ').trim();

  function byText(text){
    const t=norm(text);
    return BANKS.find(b=>b.aliases.some(a=>t.includes(a)));
  }
  function byLegacy(code,text){
    const c=norm(code).replace(/[^a-zа-яіїєґ0-9.]/gi,'');
    if(/bis24|бізбанк/i.test(text)||c==='б') return BANKS.find(b=>b.name==='БІЗБАНК');
    if(c==='ба') return BANKS.find(b=>b.name==='Банк Альянс');
    if(c==='ub') return BANKS.find(b=>b.name==='Unex Bank');
    if(c==='id' || /o\.bank|obank|о\.банк/i.test(text)) return BANKS.find(b=>b.name==='O.Bank');
    if((c==='à'||c==='а'||c==='a') && /запроси друга|подвійний кешбек|нових клієнтів/i.test(text)) return BANKS.find(b=>b.name==='А-Банк');
    if(c==='r') return BANKS.find(b=>b.name==='RadaBank');
    if(c==='o'||c==='о') return BANKS.find(b=>b.name==='Ощадбанк');
    if(c==='п' && /пумб|запрошених друзів/i.test(text)) return BANKS.find(b=>b.name==='ПУМБ');
    return null;
  }

  function resolveCard(card){
    const data=[card.dataset.bank,card.dataset.bankName,card.getAttribute('data-bank'),card.getAttribute('data-bank-name')].filter(Boolean).join(' ');
    const text=(data+' '+card.textContent).trim();
    return byText(text)||byLegacy(card.firstElementChild?.textContent||'',text);
  }

  function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

  function logoSvg(bank,size=28){
    const border=bank.border||'rgba(255,255,255,.28)';
    const fs=bank.mark.length>=3?8:bank.mark.length===2?9:11;
    return `<svg class="sf-bank-logo-svg" width="${size}" height="${size}" viewBox="0 0 28 28" aria-hidden="true">
      <rect x="0.5" y="0.5" width="27" height="27" rx="8" fill="${esc(bank.bg)}" stroke="${esc(border)}"/>
      <text x="14" y="14.8" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-size="${fs}" font-weight="800" fill="${esc(bank.fg)}">${esc(bank.mark)}</text>
    </svg>`;
  }

  const st=document.createElement('style');
  st.id='saveflow-bank-system-v56';
  st.textContent=`
    .sf-bankline{display:flex;align-items:center;gap:8px;margin:0 0 10px;min-height:28px}
    .sf-bankline .sf-bank-name{font-size:9px;font-weight:800;color:#183c29;line-height:1.15}
    .sf-bank-logo-svg{flex:0 0 28px;display:block;filter:drop-shadow(0 2px 5px rgba(3,20,10,.08))}
    .sf-hide-legacy-bankrow{display:none!important}
    .promo-card>.sf-bankline:first-child,.bonus-card>.sf-bankline:first-child{margin-top:0}
    .sf-matrix-bank-logo{display:block;margin:0 auto 4px;width:24px;height:24px}
  `;
  document.head.appendChild(st);

  function findTitle(card){
    return card.querySelector('h2,h3,h4,.promo-title,.bonus-title,.card-title');
  }

  function hideLegacyBeforeTitle(card,title){
    if(!title) return;
    let n=title.previousElementSibling;
    if(!n) return;
    const txt=norm(n.textContent);
    if(txt.length<=24 || n.querySelector('img,svg')) n.classList.add('sf-hide-legacy-bankrow');
  }

  function polishCard(card){
    if(card.dataset.sfBrandV56==='1') return;
    const bank=resolveCard(card);
    if(!bank) return;
    const title=findTitle(card);
    hideLegacyBeforeTitle(card,title);
    const row=document.createElement('div');
    row.className='sf-bankline';
    row.innerHTML=logoSvg(bank,28)+`<span class="sf-bank-name">${esc(bank.name)}</span>`;
    if(title) title.insertAdjacentElement('beforebegin',row); else card.prepend(row);
    card.dataset.sfBrandV56='1';
  }

  function polishCards(){
    document.querySelectorAll('.promo-card,.bonus-card').forEach(polishCard);
  }

  function polishMatrix(){
    document.querySelectorAll('thead th').forEach(th=>{
      if(th.dataset.sfBrandV56==='1') return;
      const bank=byText(th.textContent||'');
      if(!bank) return;
      const existing=th.querySelector('img,svg,.bank-logo,.logo');
      if(existing) return;
      const holder=document.createElement('span');
      holder.className='sf-matrix-bank-logo';
      holder.innerHTML=logoSvg(bank,24);
      th.prepend(holder);
      th.dataset.sfBrandV56='1';
    });
  }

  polishCards();
  polishMatrix();
  const mo=new MutationObserver(()=>{polishCards();polishMatrix();});
  mo.observe(document.body,{subtree:true,childList:true});
})();